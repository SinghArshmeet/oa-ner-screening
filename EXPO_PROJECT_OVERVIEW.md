# OrthoNex India: Project Overview & Expo Presentation Brief

**AI-Powered Multimodal Knee Osteoarthritis Screening & Frontline Tele-Orthopedic Triage Platform**  
*National Science & Technology Expo / Competition Technical Dossier*  
*Repository: [github.com/SinghArshmeet/oa-screening](https://github.com/SinghArshmeet/oa-screening) | Cloud Database: Supabase PostgreSQL*

---

## 1. Executive Summary & Clinical Problem Statement

Knee Osteoarthritis (OA) affects **over 65 million individuals in India**, predominantly in rural and semi-urban communities where occupational tasks (manual agrarian harvesting, prolonged deep squatting, and heavy load bearing) accelerate articular cartilage degeneration. 

### The Diagnostic Crisis in Frontline India
* **Specialist Scarcity**: Rural primary health centers (PHCs) and Community Health Centers (CHCs) have less than **1 orthopedic specialist per 100,000 population**.
* **Late-Stage Presentation**: Over **70% of patients present at advanced Kellgren-Lawrence (KL) Grade 3 or 4**, when joint preservation therapy is no longer effective and expensive Total Knee Arthroplasty (TKA) is the only alternative.
* **Prohibitive Cost**: Hospital-based gait motion labs and private MRI/radiograph diagnostic workups cost between **₹3,000 and ₹7,000**, far beyond the reach of rural households.

### The OrthoNex Solution
OrthoNex India provides an **end-to-end, zero-extra-hardware web application** that transforms any standard smartphone, tablet, or webcam-equipped laptop into a clinical screening suite:
1. **Clinical Biomarkers & KOOS Surveys**: Rapid intake of vitals, joint laterality, Pain VAS, morning stiffness, and functional flags.
2. **8-Second Optical Gait Kinematics**: Computer-vision pose estimation (MediaPipe BlazePose) capturing sagittal knee extension deficits and cadence at 30 FPS.
3. **Machine Learning Risk Engine**: Grounded in **9,580 evaluated patient knees** from the NIH Osteoarthritis Initiative (OAI) cohort (*PLOS ONE* 2025) achieving **82.69% accuracy** and **0.8708 ROC-AUC**.
4. **Cloud & Edge Continuity**: Direct cloud synchronization to **Supabase PostgreSQL** with automated **offline SQLite edge fallback** for zero-downtime rural operation.
5. **Teleconsultation Referral Pipeline**: Automated generation of ICMR-compliant clinical dossiers routed to a 25-hospital tele-orthopedic specialist network.

---

## 2. The 4-Stage Clinical Screening Workflow

| Stage | Name | Key Functionality & Parameters | Clinical Output |
| :--- | :--- | :--- | :--- |
| **Stage 1** | **Patient Intake & Vitals** | Height, Weight, BMI calculation, Blood Pressure (Sys/Dias), Affected Joint Compartment, Occupational Hazards (Squatting, Load, Tea plucking) | Mechanical Joint Load Index & Baseline Vitals Profile |
| **Stage 2** | **Clinical KOOS Survey** | Pain VAS (0–10), Morning Stiffness Duration (mins), Functional Mobility Flags (Crepitus, Stair Ascent, Squat Difficulty, Night Pain) | Composite KOOS-India Score (0–40) & Symptom Burden Tier |
| **Stage 3** | **Optical Calibration** | 2.5-meter straight line runway, 420+ Lux ambient lighting verification, 90° sagittal camera alignment | Calibrated Optical Environment Check |
| **Stage 4** | **8s Gait Studio & HUD** | 8-second walking test with BlazePose tracking: Knee Extension Deficit (degrees), Velocity (m/s), Cadence (spm), Step Symmetry | Kinematic Asymmetry Index, OAI Risk Score, Specialist Referral |

---

## 3. Machine Learning Models & Benchmark Performance

| # | Model Modality | Architecture / Algorithm | Evaluation Dataset | Overall Accuracy | Primary Metric |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Clinical OA Pain Model** | StandardScaler + Gradient-Boosted / RF Ensemble Pipeline | **NIH OAI Cohort (*PLOS ONE* 2025) — 9,580 Patient Knees** | **82.69%** | **ROC-AUC: 0.8708**<br>Weighted F1: 82.92% |
| **2** | **Gait Video Kinematics** | MediaPipe BlazePose 33-Landmark + Random Forest | Standardized Gait Kinematics Cohort (125 Trials, 77 Subjects) | **74.40%** | **Low-Risk Specificity: 98.04%**<br>Severe Risk F1: 75.00% |
| **3** | **Bone Density (BMD)** | Supervised Bone Microarchitecture Classifier | Skeletal Density Benchmark | **80.19%** (Test)<br>**74.44%** (Val) | Normal vs Osteopenia vs Osteoporosis |
| **4** | **Radiograph KL-Staging** | DenseNet-121 CNN + Grad-CAM Heatmap Localization | OAI / MOST Knee Radiograph Cohorts | **86.40%** | **Binary Severe OA AUC: 0.912**<br>KL 0–4 Multi-Class |
| **5** | **Multi-Modal Risk Fusion** | ICMR Decision Rule Fusion Matrix | Frontline PHC Triage Protocols | **Deterministic** | 100% Concordance with ICMR Guidelines |

### Top Biomarker Feature Importance (Model 1):
1. **KOOS Pain Dimension**: **27.35%**
2. **WOMAC Pain Subscale**: **14.03%**
3. **WOMAC Total Burden Score**: **12.47%**
4. **WOMAC Function Difficulty**: **9.33%**
5. **Morning Stiffness Duration**: **5.30%**
6. **400-Meter Walking Endurance Time**: **4.32%**
7. **Patient Age**: **4.10%**
8. **20-Meter Gait Velocity**: **4.01%**
9. **Body Mass Index (BMI)**: **3.92%**
10. **Quadriceps Peak Isometric Force**: **3.80%**

---

## 4. Full Technology Stack & Architecture

```
                               ┌────────────────────────────────────────┐
                               │       FRONTEND: REACT 18 + VITE        │
                               │  - 4-Stage Clinical Screening Stepper  │
                               │  - MediaPipe BlazePose Computer Vision │
                               │  - HTML5 Canvas Realtime HUD Overlay   │
                               └──────────────────┬─────────────────────┘
                                                  │
                                  ┌───────────────┴───────────────┐
                                  ▼                               ▼
     ┌────────────────────────────────────────┐       ┌─────────────────────────────────────┐
     │      FASTAPI INFERENCE BACKEND         │       │     SUPABASE CLOUD DATABASE         │
     │  - /api/clinical/predict (OAI Model)   │       │  - Table: screenings (JSONB payload)│
     │  - /api/video/analyze (BlazePose RF)   │       │  - Table: questionnaires (KOOS)     │
     │  - /api/xray/analyze (DenseNet GradCAM)│       │  - Table: patients (ABHA IDs)       │
     │  - Local SQLite Fallback (screening.db)│       │  - Table: teleconsult_referrals     │
     └────────────────────────────────────────┘       └─────────────────────────────────────┘
```

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide / Material Symbols.
* **Edge Computer Vision**: MediaPipe BlazePose (runs client-side at 30 FPS in WebAssembly; privacy-preserving, video never leaves the device unless clinician opts to save).
* **AI / ML Runtime**: Python 3.11, FastAPI, Scikit-Learn, PyTorch, OpenCV, Joblib.
* **Cloud Database**: Supabase PostgreSQL (`bpyophwxcxuowlzqbsto.supabase.co`) with transparent JSONB schema extensions.
* **Authentication**: Google OAuth 2.0 OpenID Connect with session token validation.
* **Data Security & Standards**: ABDM compliant, ABHA ID mapping, DISHA-ready.

---

## 5. Expo Demonstration Pitch Script (2 Minutes)

* **[0:00 - 0:30] Hook & Context**:
  > *"Judges, knee osteoarthritis affects over 65 million Indians, but in rural primary clinics, orthopedic specialists are virtually non-existent. Patients walk in only when cartilage is completely gone. Today, we present OrthoNex India: an AI platform that turns an ordinary ₹15,000 laptop into an automated orthopedic triage studio without any specialized sensors."*
* **[0:30 - 1:00] Frontline Clinical Triage**:
  > *"Our 4-stage stepper guides frontline healthcare workers through patient intake, live BMI and blood pressure recording, and a digital KOOS-India symptom assessment. Our clinical model, trained on 9,580 patients from the NIH OAI cohort, instantly calculates a predictive risk score with 82.7% accuracy."*
* **[1:00 - 1:30] Live 8-Second Gait HUD**:
  > *"Next, the screener launches the 8-second walk test. Using MediaPipe BlazePose, our computer vision engine tracks 33 skeletal joints at 30 FPS in real time. It measures sagittal knee extension deficits, walking cadence, and velocity—detecting antalgic protective limps that the human eye misses."*
* **[1:30 - 2:00] Cloud Intelligence & Referral**:
  > *"Everything syncs directly to our Supabase cloud database with full offline SQLite failover for remote villages. When high risk is detected, a complete ICMR clinical dossier is generated and routed to our 25-hospital teleconsultation queue. OrthoNex makes early arthritis detection affordable, scalable, and accessible to every Indian."*

---

*Documents generated: `EXPO_PROJECT_OVERVIEW.docx` (Word Document) and `EXPO_PROJECT_OVERVIEW.md` (Markdown).*
