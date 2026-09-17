# OA-NER Screening (Osteoarthritis Risk Screening System)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-success?style=for-the-badge&logo=vercel)](https://oa-ner-scanning-project.vercel.app)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev)

Clinical frontline osteoarthritis (OA) screening platform developed for rural primary health centres (PHCs) in the North Eastern Region (NER). Combines sagittal computer vision gait analysis, standardized clinical questionnaire (KOOS-NER), dual-tier binary triage, and knee radiograph Grad-CAM explainability.

> 🌐 **Live Web Application**: **[https://oa-ner-scanning-project.vercel.app](https://oa-ner-scanning-project.vercel.app)**

---

## System Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS (`frontend/`)
  - Optical webcam live feed with sagittal HUD reticle & 8-second standardized walking test
  - File upload workflow (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`) and bundled clinical sample clips
  - Dual-tier triage (*Screen Negative / Low Risk* vs *Screen Positive / Suspected OA*) + 4-tier severity matrix
  - KOOS-NER clinical survey with regional tea plantation loading factors
  - Module 03: Radiographic Staging with Grad-CAM articular joint space attention heatmaps
  - Multimodal diagnostic summary report, clinical referral dossier, and role-based screener switcher
- **Backend**: FastAPI + SQLite (`backend/`)
  - Movement baseline inference using MediaPipe BlazePose + scikit-learn Random Forest
  - Kellgren-Lawrence (KL Grade 0–4) radiograph prediction with Grad-CAM heatmap generation
  - Unified 40-point questionnaire scoring engine
  - Persistent SQLite screening database (`screenings`, `patients`, `sessions`, `devices`)
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

