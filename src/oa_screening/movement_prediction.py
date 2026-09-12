from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

from .features import PoseFeatureExtractor


def predict_video(video_path: str | Path, model_path: str | Path) -> dict:
    """Run the saved research baseline on one side-view gait recording."""
    bundle = joblib.load(model_path)
    features = PoseFeatureExtractor().extract(str(video_path))
    if features["pose_detection_rate"] < 0.25:
        raise ValueError("Body landmarks were not detected reliably. Use a well-lit side-view walking video with the full body visible.")
    frame = pd.DataFrame([features])[bundle["feature_names"]]
    probabilities = dict(zip(bundle["pipeline"].classes_, bundle["pipeline"].predict_proba(frame)[0], strict=True))
    predicted_label = bundle["pipeline"].predict(frame)[0]
    category = {"low": "low", "early": "moderate", "moderate": "moderate", "severe": "high"}[predicted_label]
    return {
        "dataset_label": predicted_label,
        "category": category,
        "confidence": float(probabilities[predicted_label]),
        "probabilities": {label: float(value) for label, value in probabilities.items()},
        "features": features,
    }
