# Enhancement roadmap

This project is intentionally built in stages. The current baseline is a local OA gait screening prototype.

### Core Roadmap Status:
- [x] **1. Standardize the camera capture protocol** (Standardized 8s walk protocol, sagittal HUD reticle, distance/framing guidance).
- [x] **2. Add a binary screening mode alongside the four-class severity model** (Dual-tier frontline triage: *Screen Negative / Low Risk* vs *Screen Positive / Suspected OA*).
- [x] **3. Improve movement feature engineering with gait timing and symmetry metrics** (Knee angle asymmetry, ROM difference, dominant frequency cadence proxy).
- [x] **4. Connect uploaded webcam/video inference to the app** (Direct video file upload & live webcam capture to FastAPI MediaPipe inference pipeline).
- [x] **5. Add the X-ray module as a separate path using the KL-grade dataset** (Independent deep learning/radiograph classification on knee radiographs into KL Grades 0-4).
- [x] **6. Integrate explainability for the X-ray branch** (Grad-CAM attention heatmaps highlighting articular joint space and osteophyte boundaries).

Key principle: movement, questionnaire, and X-ray results should remain visible and separate until a clinically validated fusion strategy is ready.

