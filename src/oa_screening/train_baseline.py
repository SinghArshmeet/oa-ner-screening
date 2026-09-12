from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.pipeline import Pipeline


METADATA = {"path", "subject_id", "target", "severity"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a subject-aware OA gait baseline.")
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    args = parser.parse_args()
    data = pd.read_csv(args.features)
    data = data[data["pose_detection_rate"] >= 0.25].copy()
    feature_names = [column for column in data.columns if column not in METADATA]
    x, y, groups = data[feature_names], data["target"], data["subject_id"]
    if y.nunique() < 2 or len(data) < 8:
        raise SystemExit("Need at least two classes and eight usable videos to train.")

    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("classifier", RandomForestClassifier(n_estimators=400, min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1)),
    ])
    folds = min(5, groups.nunique())
    predicted = cross_val_predict(pipeline, x, y, groups=groups, cv=GroupKFold(n_splits=folds))
    report = classification_report(y, predicted, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y, predicted, labels=sorted(y.unique())).tolist()
    pipeline.fit(x, y)

    args.model.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "feature_names": feature_names, "labels": sorted(y.unique()), "prototype_notice": "Research dataset classifier only; not clinical decision support."}, args.model)
    args.model.with_suffix(".report.json").write_text(json.dumps({"video_count": len(data), "subject_count": groups.nunique(), "labels": sorted(y.unique()), "classification_report": report, "confusion_matrix": {"labels": sorted(y.unique()), "values": matrix}}, indent=2), encoding="utf-8")
    print(f"Saved model: {args.model}")
    print(f"Saved report: {args.model.with_suffix('.report.json')}")


if __name__ == "__main__":
    main()
