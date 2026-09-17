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
    low_prob = float(probabilities.get("low", 0.0))
    screening_positive_prob = float(1.0 - low_prob)
    binary_screening = "screen_negative" if low_prob >= 0.5 else "screen_positive"
    return {
        "dataset_label": predicted_label,
        "category": category,
        "binary_screening": binary_screening,
        "screening_positive_prob": round(screening_positive_prob, 4),
        "screening_tier": "Screen Negative (Low Risk)" if binary_screening == "screen_negative" else "Screen Positive (Suspected OA)",
        "confidence": float(probabilities[predicted_label]),
        "probabilities": {label: float(value) for label, value in probabilities.items()},
        "features": features,
    }

