# Hardware integration plan for ESP32-CAM

This project is currently software-first, but it can be extended to a low-cost embedded camera workflow using an ESP32-CAM module. The goal is to keep the same screening logic while shifting the actual video capture to hardware.

## Recommended hardware

### Core device
- ESP32-CAM module
- OV2640 camera
- 3.3V regulator or stable power supply
- external antenna or good antenna placement if Wi-Fi range matters

### Optional support components
- USB-to-TTL serial adapter for flashing and debugging
- microSD card for local video buffering
- push-button or GPIO trigger for manual capture
- LED ring/flash for better lighting
- battery pack or DC power source for portable deployment

## Capture workflow

1. ESP32-CAM captures a short side-view gait clip or still frames.
2. The device sends the video or frames to the laptop/desktop running the Python screening app.
3. The Python app runs the MediaPipe pose extraction pipeline and risk scoring.
4. The results stay local and are never sent to a cloud service by default.

## Recommended operating mode for this project

### Option A: Local capture + laptop processing (best for MVP)
- ESP32-CAM streams or uploads clipped video frames to the local PC over Wi-Fi.
- The PC runs the OA risk pipeline.
- This keeps the model and inference logic centralized and easier to debug.

### Option B: Standalone ESP32-CAM upload mode
- ESP32-CAM captures frames and sends them over HTTP to a local server.
- The server can be a Python Flask or FastAPI service that the desktop app calls.
- This supports a more distributed hardware deployment later.

## Capture protocol for the hardware module

The project should use a similar standardized setup to the software pipeline:

- side view only
- fixed camera distance
- fixed height
- clean lighting
- straight walking path
- 4 to 10 m walking distance
- avoid cluttered backgrounds
- record a short, repeatable movement sequence

This matters more than adding sensors. The video quality and viewpoint consistency strongly affect pose-estimation accuracy.

## Data flow design

```text
ESP32-CAM -> Wi-Fi -> local PC -> MediaPipe -> feature extraction -> OA risk model
```

```text
Laptop/PC
  ├─ movement model
  ├─ questionnaire model
  ├─ result fusion
  └─ local UI or dashboard
```

## Why this matches the project

This keeps the project aligned with the current architecture:
- movement analysis remains the main research engine
- the app remains local/offline when possible
- hardware adds capture convenience, not core modeling complexity
- the same risk categories remain: Low / Moderate / High

## Suggested future milestones

1. Use ESP32-CAM only for capture and frame transfer.
2. Add a simple local HTTP endpoint to receive frames.
3. Validate the pose pipeline on ESP32-captured footage.
4. Add a manual capture button and preview mode.
5. Add a portable battery-powered enclosure for field testing.

## Important note

This hardware path is a capture platform, not a replacement for the clinical validation process. The AI model still needs subject-level testing and clinician-labeled data before it can be considered useful for real-world screening.
