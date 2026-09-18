# OrthoNex India (OA-NER Screening Platform)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-success?style=for-the-badge&logo=vercel)](https://oa-ner-scanning-project.vercel.app)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev)
[![ABDM Ready](https://img.shields.io/badge/ABDM-ABHA%20Integrated-indigo?style=for-the-badge)](https://abdm.gov.in)

National clinical frontline musculoskeletal and Knee Osteoarthritis (OA) tele-screening platform aligned with the **Ayushman Bharat Digital Mission (ABDM)** and **ICMR National Screening Protocols**. Combines sagittal computer vision gait analysis, localized clinical questionnaire (KOOS-India), dual-tier triage, knee radiograph Grad-CAM explainability, dynamic user-data diagnosability, and direct tertiary referral across India (including Delhi NCR and Noida networks).

> 🌐 **Live Web Application**: **[https://oa-ner-scanning-project.vercel.app](https://oa-ner-scanning-project.vercel.app)**

---

## Key Capabilities & System Architecture

- **Pan-India Accessibility & ABDM Integration**:
  - Full support for **all 28 States & 8 Union Territories** with dedicated district selection.
  - **ABHA Health ID (Ayushman Bharat Health Account)** integration with auto-generator and checksum formatting (`91-XXXX-XXXX-XXXX`).
  - **7 Regional Indian Languages**: English, हिन्दी (Hindi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), and অসমীয়া (Assamese).
  - **Delhi & Noida Cohorts**: Real-world cohorts spanning Safdarjung Enclave, Karol Bagh, Noida Sec 62, Sec 18, and Greater Noida Kasna.
  - **Comprehensive 25-Hospital Teleconsultation Network**: Direct tele-triage referral directory covering top apex institutes (AIIMS New Delhi, PGIMER, CMC Vellore, KEM Mumbai, GMCH, NIMS) and premier Delhi/Noida centers (Safdarjung, RML, Sir Ganga Ram, Max Saket, Apollo, Fortis Noida, Jaypee, Kailash, Yatharth, Sharda, GIMS, District Hospital Sec 39).
- **Dynamic Multimodal Diagnosability & Clinical Calibration**:
  - Real-time diagnostic calculation strictly driven by the active patient's live telemetry (Pain VAS, morning stiffness minutes, BlazePose sagittal knee extension deficit, walking velocity, cadence, and KL radiographic grade).
  - Interactive **Live Diagnostic Parameter Calibration Sandbox** allowing clinicians to test risk sensitivity with real-time radial risk meter and radar chart recalculation.
- **Frontend**: React 18 + Vite + Tailwind CSS (`frontend/`)
  - **4-Stage Frontline Clinical Stepper & Triage Workflow**:
    - *Stage 1*: Patient Intake, Vitals, BMI & Mechanical Compressive Joint Stress
    - *Stage 2*: Rapid Clinical Scoring & KOOS-India Index (VAS Pain 0-10, Morning Stiffness 0-90m, Functional Checks)
    - *Stage 3*: Optical Camera Calibration & Space Check (90° lateral perspective, 2.5m runway, 420 lux lighting)
    - *Stage 4*: Standardized 8s Gait Recording Studio & Handover Launchpad
  - Optical webcam live feed with sagittal HUD reticle & 8-second standardized walking test
  - Persistent Pre-Gait Clinical Intake Banner in Gait Suite with instant edit return
  - Video upload pipeline (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`) and bundled clinical sample clips
  - Dual-tier triage (*Screen Negative / Low Risk* vs *Screen Positive / Suspected OA*) + 4-tier severity matrix
  - KOOS-India clinical survey with agrarian, manual loading, and urban sedentary risk weighting
  - Module 03: Radiographic Staging with Grad-CAM articular joint space attention heatmaps
  - Multimodal diagnostic summary report, clinical referral dossier, and role-based screener switcher
- **Backend & Machine Learning**: FastAPI + SQLite (`backend/`, `src/oa_screening/`)
  - **Clinical & Biomechanical Knee Osteoarthritis Model** (`artifacts/clinical_biomechanical_oa_model.joblib`):
    - Grounded in the NIH Osteoarthritis Initiative (OAI) longitudinal cohort, *PLOS ONE* (pone.0325678, 2025).
    - Evaluated across **9,580 patient knee cases** with **82.69% Accuracy** and **0.8708 ROC-AUC**.
    - Integrates KOOS/WOMAC pain, stiffness, gait speed (velocity), knee flexion angle, and extension deficit.
  - Movement baseline inference using MediaPipe BlazePose (33 3D skeletal landmarks) + Random Forest
  - Kellgren-Lawrence (KL Grade 0–4) radiograph prediction with Grad-CAM heatmap generation
  - Unified 40-point questionnaire scoring engine with occupational load factoring
  - Persistent SQLite screening database (`screenings`, `patients` with `state`/`district`/`abha_id`, `sessions`, `devices`)
  - Google OAuth Authorization Code flow with PKCE

---

## Prerequisites (Any Computer)

1. **Python**: Python 3.10 or 3.11 (with `pip` and `venv`)
2. **Node.js**: Node.js v18+ or v20+ (with `npm`)
3. **Git**: To clone the repository

---

## Quick Start: Running on a New Computer

### 1. Clone the Repository

```bash
git clone https://github.com/SinghArshmeet/oa-ner-screening.git
cd oa-ner-screening
```

---

### 2. Backend Setup & Startup

Open a terminal in the project root:

#### Windows (PowerShell):

```powershell
# 1. Create and activate a Python virtual environment
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install backend dependencies
pip install -r backend/requirements.txt
pip install -e .

# 3. Launch backend API server (runs at http://127.0.0.1:8000)
.\start_backend.ps1
```

*Or launch directly with uvicorn:*
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

#### macOS / Linux (Bash):

```bash
# 1. Create and activate a Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt
pip install -e .

# 3. Launch backend API server
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

- **Health check**: Visit `http://127.0.0.1:8000/health` (should return `{"status": "ok", "model_loaded": true}`)
- **Swagger Docs**: Visit `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup & Startup

Open a **second terminal** in the project root:

```bash
# 1. Navigate into the frontend folder
cd frontend

# 2. Install npm dependencies
npm install

# 3. Start development server
npm run dev
```

- **App URL**: Open your browser at **`http://localhost:5173`**

---

## How to Test the Application

1. **Login**:
   - The app starts on the clinical login portal.
   - Click **"Offline Clinical Screener (Simulation Mode)"** or select any of the pre-configured role accounts (Screener, Medical Officer, Admin).
2. **Gait Analysis**:
   - Navigate to the **Gait** tab.
   - Click **"Sample Walk Clip"** to test with the bundled clinical reference video, or connect your webcam, or upload any `.mp4`/`.mov` walking video.
   - Click **"Start 8s Standardized Walking Test"** (or **"Analyze Uploaded Video"**).
   - Biomechanical features are extracted and classified by the Random Forest model.
3. **Questionnaire**:
   - Navigate to the **Questionnaire** tab.
   - Fill out the VAS pain, morning stiffness, and regional workload exposures.
   - Click **"Calculate Score & Sync"**.
4. **Diagnostic Report**:
   - Navigate to the **Report** tab.
   - View multimodal risk fusion combining gait kinematics and clinical symptom index.
   - Click **"Print Clinical Dossier"** or **"Dispatch Referral"**.

---

## Optional: Google OAuth Configuration

To enable real Google Sign-In, provide these environment variables before starting the backend:

```powershell
$env:GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "your-client-secret"
$env:GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"
$env:FRONTEND_ORIGIN = "http://localhost:5173"
$env:SESSION_SECRET = "your-custom-session-secret"
```

If not configured, the login screen gracefully indicates *"Google authentication is not configured"* and allows seamless login via clinical role accounts.

---

## Repository Contents

```
oa-ner-screening/
├── backend/                  # FastAPI service (Auth, DB, & Inference Routing)
│   ├── main.py               # API endpoints & session handling
│   ├── db.py                 # SQLite database & migrations
│   ├── schemas.py            # Pydantic clinical models
│   └── requirements.txt      # Backend Python dependencies
├── frontend/                 # React 18 + Vite Frontend (Vercel-Deployed)
│   ├── src/                  # Biomechanics HUD, Questionnaire, & Reports
│   ├── public/               # Sample clinical walk video & brand assets
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite build configuration
├── docs/                     # Clinical Protocols, Architecture, & Roadmap
│   ├── Context.md            # Clinical background & problem statement
│   ├── ENHANCEMENTS.md       # Multi-stage engineering roadmap
│   ├── HARDWARE_INTEGRATION.md # Field edge camera specs
│   └── OA_NER_Screening_Project_Overview.md # Detailed system design
├── artifacts/                # Pre-trained models & evaluation reports
│   ├── movement_baseline.joblib        # Pre-trained Random Forest model
│   └── movement_baseline.report.json   # Model evaluation metrics
├── src/oa_screening/         # Core CV, MediaPipe pose extraction, & X-Ray Grad-CAM
├── start_backend.ps1         # Automated backend launcher script
└── README.md                 # Project guide & quick start
```

