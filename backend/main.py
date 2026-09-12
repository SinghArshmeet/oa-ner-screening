from __future__ import annotations

import base64
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import secrets
import sys
import tempfile
import time
from urllib.parse import quote
import urllib.request

import httpx
from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Query, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .db import get_connection, init_db
from .schemas import AnalysisRequest, DeviceConfig, PatientCreate, QuestionnairePayload, ScreeningCreate

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
from oa_screening.movement_prediction import predict_video
from oa_screening.risk_engine import combine_screening, recommendation_for

MODEL_PATH = PROJECT_ROOT / "artifacts" / "movement_baseline.joblib"
XRAY_MODEL_PATH = PROJECT_ROOT / "artifacts" / "xray_checkpoint.pth"

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
SESSION_SECRET = os.environ.get("SESSION_SECRET", "oa_ner_session_secret_lts")
SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600

MAX_VIDEO_BYTES = 100 * 1024 * 1024
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}

OAUTH_STATES: dict[str, dict[str, object]] = {}

app = FastAPI(title="OA Risk Screening App", version="0.4.0")

allowed_origins = list(dict.fromkeys([
    FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"]
)
init_db()


def _patient_exists(conn, patient_id: int | None) -> None:
    if patient_id is not None and conn.execute("SELECT 1 FROM patients WHERE id = ?", (patient_id,)).fetchone() is None:
        raise HTTPException(status_code=404, detail="Patient record was not found.")


def _create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn = get_connection()
    conn.execute("DELETE FROM sessions WHERE expires_at <= ?", (int(time.time()),))
    conn.execute("INSERT INTO sessions (session_token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_id, int(time.time()) + SESSION_MAX_AGE_SECONDS))
    conn.commit(); conn.close()
    return token


def _current_user(token: str | None) -> dict[str, object] | None:
    if not token:
        return None
    conn = get_connection()
    row = conn.execute("""SELECT u.id,u.email,u.name,u.picture,u.role,u.role_id,u.role_badge,u.station,u.staff_id
        FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.session_token=? AND s.expires_at>?""", (token, int(time.time()))).fetchone()
    conn.close()
    return dict(row) if row else None


def get_current_user_optional(oa_session: str | None = Cookie(default=None), authorization: str | None = Header(default=None)) -> dict[str, object] | None:
    token = oa_session or (authorization.split(" ", 1)[1] if authorization and authorization.startswith("Bearer ") else None)
    return _current_user(token)


def require_authenticated_user(user: dict[str, object] | None = Depends(get_current_user_optional)) -> dict[str, object]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    return user


def _questionnaire_result(payload: QuestionnairePayload) -> tuple[int, str, list[str]]:
    score = float(payload.pain) * 1.5
    factors: list[str] = []

    # Age factor
    if payload.age >= 65:
        score += 3.0
        factors.append("Age 65 or above")
    elif payload.age >= 55:
        score += 2.0
        factors.append("Age 55–64")
    elif payload.age >= 45:
        score += 1.0
        factors.append("Age 45–54")

    # Pain severity (VAS 0-10)
    if payload.pain >= 7:
        factors.append("Severe knee pain (VAS >= 7)")
    elif payload.pain >= 4:
        factors.append("Moderate knee pain (VAS 4–6)")

    # Morning stiffness duration (0-90 minutes)
    if payload.stiffness >= 30:
        score += 2.0
        factors.append("Morning stiffness 30 minutes or more")
    elif payload.stiffness >= 15:
        score += 1.0
        factors.append("Morning stiffness 15–29 minutes")
    score += min(10.0, float(payload.stiffness) / 5.0)

    # Functional activity difficulties (0-3 each)
    score += 2.0 * float(payload.walking_difficulty + payload.stairs_difficulty + payload.squat_difficulty)
    if payload.squat_difficulty >= 2:
        factors.append("Significant squatting difficulty")
    if payload.walking_difficulty >= 2:
        factors.append("Walking difficulty")
    if payload.stairs_difficulty >= 2:
        factors.append("Stair climbing difficulty")

    # Previous knee trauma
    if payload.previous_knee_injury:
        score += 4.0
        factors.append("Previous knee trauma/injury")

    # Symptom duration
    if payload.symptom_duration_weeks >= 12:
        score += 2.0
        factors.append("Symptoms persistent >= 12 weeks")
    elif payload.symptom_duration_weeks >= 4:
        score += 1.0

    # Occupational tea plantation and terrain loading
    if payload.tea_plucking:
        score += 4.0
        factors.append("High physical tea-plucking workload")
    if payload.heavy_loads:
        score += 3.0
        factors.append("Frequent heavy-load carriage (>15kg)")
    if payload.deep_squatting:
        score += 3.0
        factors.append("Prolonged deep squatting (>4h)")
    if payload.slope_walking:
        score += 2.0
        factors.append("Frequent hilly/slope walking")

    final_score = min(40, round(score))
    category = "high" if final_score >= 25 else "moderate" if final_score >= 14 else "low"
    return final_score, category, factors


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "message": "OA screening backend ready",
        "model_loaded": MODEL_PATH.exists(),
        "xray_model_loaded": XRAY_MODEL_PATH.exists(),
        "google_auth_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    }


@app.get("/auth/status")
def auth_status(user: dict[str, object] | None = Depends(get_current_user_optional)) -> dict[str, object]:
    return {
        "authenticated": user is not None,
        "google_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
        "user": user
    }


@app.get("/auth/google/login")
def google_login(role: str = Query(default="screener", pattern="^(screener|officer|admin)$")):
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        raise HTTPException(status_code=503, detail="Google authentication is not configured.")
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    state = secrets.token_urlsafe(32)
    OAUTH_STATES[state] = {"verifier": verifier, "role": role, "expires_at": time.time() + 600}
    params = (
        f"client_id={quote(GOOGLE_CLIENT_ID)}",
        f"redirect_uri={quote(GOOGLE_REDIRECT_URI)}",
        "response_type=code",
        f"scope={quote('openid email profile')}",
        f"code_challenge={quote(challenge)}",
        "code_challenge_method=S256",
        f"state={quote(state)}",
        "access_type=offline",
        "prompt=select_account"
    )
    return RedirectResponse("https://accounts.google.com/o/oauth2/v2/auth?" + "&".join(params))


@app.get("/auth/google/callback")
async def google_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    if error or not code or not state:
        return RedirectResponse(f"{FRONTEND_ORIGIN}/?auth_error={quote(error or 'missing_oauth_response')}")
    state_data = OAUTH_STATES.pop(state, None)
    if not state_data or float(state_data["expires_at"]) < time.time():
        return RedirectResponse(f"{FRONTEND_ORIGIN}/?auth_error=invalid_or_expired_state")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                    "code_verifier": state_data["verifier"]
                }
            )
            tokens = token_resp.raise_for_status().json()
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
            info = user_resp.raise_for_status().json()
    except (httpx.HTTPError, KeyError):
        return RedirectResponse(f"{FRONTEND_ORIGIN}/?auth_error=google_exchange_failed")
    email, subject = info.get("email"), info.get("sub")
    if not email or not subject or info.get("email_verified") is not True:
        return RedirectResponse(f"{FRONTEND_ORIGIN}/?auth_error=missing_google_identity")
    role_id = str(state_data["role"])
    labels = {
        "screener": ("Clinical Screener", "Station Screener"),
        "officer": ("Medical Officer", "Medical Officer"),
        "admin": ("System Administrator", "System Admin")
    }
    role_info = labels.get(role_id, ("Clinical Screener", "Station Screener"))
    conn = get_connection()
    row = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if row:
        user_id = row["id"]
        conn.execute("UPDATE users SET name=?, picture=?, sub=? WHERE id=?", (info.get("name") or email, info.get("picture"), subject, user_id))
    else:
        cursor = conn.execute(
            "INSERT INTO users (email, name, picture, sub, role, role_id, role_badge, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (email, info.get("name") or email, info.get("picture"), subject, role_info[0], role_id, role_info[1], f"NER-GOOG-{secrets.randbelow(9000)+1000}")
        )
        user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    response = RedirectResponse(f"{FRONTEND_ORIGIN}/?auth_success=1")
    response.set_cookie("oa_session", _create_session(user_id), max_age=SESSION_MAX_AGE_SECONDS, httponly=True, secure=COOKIE_SECURE, samesite="lax", path="/")
    return response


@app.get("/auth/me")
def auth_me(user: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    return {
        "id": user.get("staff_id") or f"NER-USER-{user['id']}",
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "roleId": user["role_id"],
        "roleBadge": user["role_badge"],
        "station": user["station"],
        "picture": user["picture"],
        "isDemo": False
    }


@app.post("/auth/logout")
def logout(response: Response, oa_session: str | None = Cookie(default=None)) -> dict[str, str]:
    if oa_session:
        conn = get_connection()
        conn.execute("DELETE FROM sessions WHERE session_token=?", (oa_session,))
        conn.commit()
        conn.close()
    response.delete_cookie("oa_session", path="/")
    return {"message": "Signed out"}


@app.post("/api/patients")
def create_patient(payload: PatientCreate, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    if not payload.consent:
        raise HTTPException(status_code=422, detail="Recorded consent is required before creating a patient record.")
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO patients (name, age, gender, occupation, region, consent) VALUES (?, ?, ?, ?, ?, ?)",
        (payload.name.strip(), payload.age, payload.gender, payload.occupation, payload.region, int(payload.consent))
    )
    conn.commit()
    patient_id = cursor.lastrowid
    conn.close()
    return {
        "id": patient_id,
        "name": payload.name.strip(),
        "age": payload.age,
        "gender": payload.gender,
        "occupation": payload.occupation,
        "region": payload.region,
        "consent": payload.consent,
        "message": "Patient registered successfully"
    }


@app.get("/api/patients")
def list_patients(_: dict[str, object] = Depends(require_authenticated_user)) -> list[dict[str, object]]:
    conn = get_connection()
    rows = conn.execute("SELECT id, name, age, gender, occupation, region, consent, created_at FROM patients ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/questionnaire")
def save_questionnaire(payload: QuestionnairePayload, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    score, category, factors = _questionnaire_result(payload)
    conn = get_connection()
    _patient_exists(conn, payload.patient_id)
    cursor = conn.execute(
        "INSERT INTO questionnaires (patient_id, raw_score, category, payload_json) VALUES (?, ?, ?, ?)",
        (payload.patient_id, score, category, payload.model_dump_json())
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return {
        "id": record_id,
        "patient_id": payload.patient_id,
        "raw_score": score,
        "category": category,
        "contributing_factors": factors,
        "recommendation": recommendation_for(category),
        "data_source": "backend_rule_engine",
        "is_simulated": False
    }


@app.post("/api/movement/analyze-video")
async def analyze_movement_video(file: UploadFile = File(...), _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    raw_filename = Path(file.filename or "").name
    suffix = Path(raw_filename).suffix.lower()
    if suffix not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload an MP4, MOV, AVI, MKV, or WebM video.")
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Movement model is unavailable.")
    content = await file.read(MAX_VIDEO_BYTES + 1)
    if not content or len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video must be between 1 byte and 100 MB.")
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
        temp.write(content)
        temp_path = Path(temp.name)
    try:
        result = predict_video(temp_path, MODEL_PATH)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        temp_path.unlink(missing_ok=True)
    return {
        "status": "success",
        "filename": raw_filename or "gait_session.mp4",
        "dataset_label": result["dataset_label"],
        "category": result["category"],
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
        "features": result["features"],
        "recommendation": recommendation_for(result["category"]),
        "is_simulated": False,
        "data_source": "backend_model"
    }


@app.post("/api/movement/analyze")
def combine_analysis(payload: AnalysisRequest, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    outcome = combine_screening(payload.movement_category, payload.questionnaire_category)
    return {
        "patient_id": payload.patient_id,
        "movement_category": outcome.movement_category,
        "questionnaire_category": outcome.questionnaire_category,
        "combined_category": outcome.combined_category,
        "recommendation": outcome.recommendation,
        "explanation": outcome.explanation
    }


@app.post("/api/xray/analyze")
async def analyze_xray_image(file: UploadFile = File(...), _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    raw_filename = Path(file.filename or "").name
    suffix = Path(raw_filename).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload a valid PNG, JPG, or JPEG X-ray image.")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    if not content or len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be between 1 byte and 20 MB.")
    if not XRAY_MODEL_PATH.exists():
        raise HTTPException(
            status_code=501,
            detail="X-ray diagnostic model checkpoint is not trained or unavailable. X-ray: Not assessed."
        )
    # If checkpoint existed, run real model inference here
    raise HTTPException(status_code=501, detail="X-ray inference model checkpoint not implemented.")


@app.post("/api/upload")
async def upload_media(file: UploadFile = File(...), _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    raw_filename = Path(file.filename or "").name
    suffix = Path(raw_filename).suffix.lower()
    allowed_all = ALLOWED_VIDEO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS
    if suffix not in allowed_all:
        raise HTTPException(status_code=415, detail="Unsupported file format.")
    content = await file.read(MAX_VIDEO_BYTES + 1)
    if not content or len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="File must be between 1 byte and 100 MB.")
    safe_name = f"upload_{secrets.token_hex(8)}{suffix}"
    return {
        "status": "success",
        "original_filename": raw_filename,
        "safe_filename": safe_name,
        "size_bytes": len(content)
    }


@app.post("/api/screenings")
def save_screening(payload: ScreeningCreate, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    conn = get_connection()
    _patient_exists(conn, payload.patient_id)
    gait_metrics_str = json.dumps(payload.gait_metrics) if payload.gait_metrics else None
    cursor = conn.execute(
        """
        INSERT INTO screenings (
            patient_id, status, questionnaire_score, questionnaire_category,
            movement_category, movement_confidence, gait_metrics_json,
            xray_grade, combined_result, recommendation, data_source,
            simulation_status, movement_result, questionnaire_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.patient_id,
            payload.status,
            payload.questionnaire_score,
            payload.questionnaire_category,
            payload.movement_category,
            payload.movement_confidence,
            gait_metrics_str,
            payload.xray_grade,
            payload.combined_result,
            payload.recommendation,
            payload.data_source,
            payload.simulation_status,
            payload.movement_result,
            payload.questionnaire_result
        )
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return {"id": record_id, "message": "Screening saved successfully"}


@app.get("/api/screenings")
def list_screenings(_: dict[str, object] = Depends(require_authenticated_user)) -> list[dict[str, object]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT s.*, p.name AS patient_name FROM screenings s LEFT JOIN patients p ON p.id=s.patient_id ORDER BY s.id DESC"
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("gait_metrics_json"):
            try:
                d["gait_metrics"] = json.loads(d["gait_metrics_json"])
            except Exception:
                d["gait_metrics"] = None
        result.append(d)
    return result


@app.get("/api/screenings/latest/{patient_id}")
def get_latest_screening(patient_id: int, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM screenings WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="No previous screening found for this patient.")
    d = dict(row)
    if d.get("gait_metrics_json"):
        try:
            d["gait_metrics"] = json.loads(d["gait_metrics_json"])
        except Exception:
            d["gait_metrics"] = None
    return d


@app.post("/api/hardware/connect")
def connect_device(payload: DeviceConfig, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO devices (name, device_type, ip, status, config_json, last_connected) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        (payload.name.strip(), payload.device_type, payload.ip, payload.status, payload.config_json)
    )
    conn.commit()
    device_id = cursor.lastrowid
    conn.close()
    return {"id": device_id, "status": "connected"}


@app.get("/api/hardware/devices")
def list_devices(_: dict[str, object] = Depends(require_authenticated_user)) -> list[dict[str, object]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, name, device_type, ip, status, config_json, last_connected FROM devices ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/hardware/ping")
def ping_hardware(ip: str = Query(...), _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    try:
        address = ipaddress.ip_address(ip)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Use a private IP address without a URL or port.") from error
    if not address.is_private:
        raise HTTPException(status_code=403, detail="Only private-network hardware addresses are allowed.")
    try:
        with urllib.request.urlopen(f"http://{address}", timeout=2.5) as response:
            return {"reachable": True, "status_code": response.status, "target": str(address)}
    except Exception:
        return {"reachable": False, "target": str(address), "error": "Device did not respond."}
