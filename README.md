# OA NER Screening

This repository contains the local, CPU-first movement-analysis baseline for an
AI-assisted osteoarthritis (OA) screening project. It is a research prototype:
it classifies the labels in the supplied gait dataset and must not be used for
diagnosis or clinical decision-making.

## Step 1: movement baseline

The pipeline:

1. reads each `.MOV` gait recording;
2. uses MediaPipe Pose to locate hips, knees and ankles;
3. derives knee range of motion, variability, left/right asymmetry, cadence
   proxy, motion consistency and pose-quality features;
4. trains a Random Forest against dataset labels, splitting by subject ID to
   prevent the two recordings of one participant being in both train and test.

### Labels used

`NM` is the healthy reference class (`low`). `KOA_EL`, `KOA_MD` and `KOA_SV`
map to `early`, `moderate` and `severe`. Parkinson's (`PD`) recordings are
deliberately excluded from this OA baseline.

### Run locally

Install Python 3.10 or 3.11, then in this folder run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -e .
py -m oa_screening.extract_dataset --input Dataset\gait\KOA-PD-NM --output artifacts\gait_features.csv
py -m oa_screening.train_baseline --features artifacts\gait_features.csv --model artifacts\movement_baseline.joblib
```

The first extraction can take time because every video is processed locally.
Use `--max-videos 12` for a quick pipeline check. The report and confusion
matrix are saved next to the model.

The uploaded Kaggle notebook describes a separate five-grade X-ray model. It
belongs to the later X-ray module and is not mixed with movement-model labels.

The Movement tab accepts a gait video and runs the saved baseline locally. The
Results tab keeps the movement and questionnaire indications visible separately,
then applies an explainable late-fusion rule when both are available.

## Step 2: questionnaire prototype

The questionnaire is deliberately a transparent rule-based prototype. There is
no labelled questionnaire dataset in this project, so training a Random Forest
or logistic-regression questionnaire model now would produce artificial
results. Once clinician-labelled records are available, this module can be
replaced with a validated model.

To run the local interface:

```powershell
uv pip install --python .\.venv\Scripts\python.exe -e ".[app]"
.\.venv\Scripts\python.exe -m streamlit run app.py
```
