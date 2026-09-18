import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, accuracy_score
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import types
import narwhals.stable.v2 as v2
v2.dependencies = types.SimpleNamespace(is_into_dataframe=lambda x: False, is_into_series=lambda x: False)
from sklearn.utils import validation
validation._nw_into_df_or_series = lambda x: False
import joblib

PROJECT_ROOT = Path(r"c:\Users\Arshmeet\OneDrive\Desktop\Projects\OA_NER Screening")
DATASET_PATH = PROJECT_ROOT / "Dataset" / "pone.0325678.s001.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_OUT = ARTIFACTS_DIR / "clinical_biomechanical_oa_model.joblib"
REPORT_OUT = ARTIFACTS_DIR / "clinical_biomechanical_oa_model.report.json"

print(f"Loading dataset from: {DATASET_PATH}")
raw_df = pd.read_csv(DATASET_PATH, low_memory=False)
print(f"Raw shape: {raw_df.shape}")

# Define key features aligned with our clinical screening protocol:
# Anthropometrics: V00AGE, P02SEX, P01BMI, V00BPSYS, V00BPDIAS, side
# Symptoms / KOOS: V00WOMKP, V00KOOSKP, V00WOMSTF, V00WOMADL, V00WOMTS
# Biomechanics / Gait: V0020MPACE (velocity), V00400MTIM, V00KFHDEG (flexion), V00KALNMT (alignment), V00kdefcv (deficit), V00fmaxf
# Target: P01KPN12 (Frequent Knee Pain 0=No, 1=Yes) or P01KSX (Knee symptoms)

def clean_numeric(series):
    return pd.to_numeric(series.replace(['A', 'M', 'D', 'T', ' ', '.', ''], np.nan), errors='coerce')

clean_df = pd.DataFrame()
clean_df['subject_id'] = raw_df['ID']
clean_df['side'] = clean_numeric(raw_df['side'])
clean_df['age'] = clean_numeric(raw_df['V00AGE'])
clean_df['sex'] = clean_numeric(raw_df['P02SEX']) # 1=Male, 2=Female
clean_df['bmi'] = clean_numeric(raw_df['P01BMI'])
clean_df['bp_sys'] = clean_numeric(raw_df['V00BPSYS'])
clean_df['bp_dias'] = clean_numeric(raw_df['V00BPDIAS'])

# Symptoms / KOOS / WOMAC
clean_df['koos_pain'] = clean_numeric(raw_df['V00KOOSKP'])
clean_df['womac_pain'] = clean_numeric(raw_df['V00WOMKP'])
clean_df['womac_stiffness'] = clean_numeric(raw_df['V00WOMSTF'])
clean_df['womac_function'] = clean_numeric(raw_df['V00WOMADL'])
clean_df['womac_total'] = clean_numeric(raw_df['V00WOMTS'])

# Biomechanics & Gait Kinematics
clean_df['gait_speed_20m'] = clean_numeric(raw_df['V0020MPACE']) # m/s
clean_df['walk_time_400m'] = clean_numeric(raw_df['V00400MTIM']) # s
clean_df['knee_flexion_deg'] = clean_numeric(raw_df['V00KFHDEG']) # deg
clean_df['knee_alignment_deg'] = clean_numeric(raw_df['V00KALNMT']) # deg
clean_df['knee_deficit_deg'] = clean_numeric(raw_df['V00kdefcv'])
clean_df['knee_force_max'] = clean_numeric(raw_df['V00fmaxf'])

# Targets
target_raw = clean_numeric(raw_df['P01KPN12']) # 0=No, 1=Yes
symptom_raw = clean_numeric(raw_df['P01KSX'])  # 0=None, 1=Mild, 2=Severe

# Filter rows where target is present
valid_mask = target_raw.isin([0, 1])
clean_df = clean_df[valid_mask].copy()
y = target_raw[valid_mask].astype(int)
groups = clean_df['subject_id']

feature_cols = [c for c in clean_df.columns if c != 'subject_id']
X = clean_df[feature_cols]

print(f"Cleaned dataset: {X.shape[0]} knee records across {groups.nunique()} unique patients")
print(f"Target distribution (Frequent Knee OA Pain):")
print(y.value_counts(normalize=True))

from sklearn.model_selection import StratifiedKFold, cross_val_predict

# 5-Fold Stratified Cross-Validation
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=4,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    ))
])

print("\nEvaluating model with 5-Fold Stratified Cross-Validation...")
X_arr = X.values
y_arr = y.values
cv_probas = cross_val_predict(pipeline, X_arr, y_arr, cv=skf, method='predict_proba')[:, 1]
cv_preds = (cv_probas >= 0.5).astype(int)

acc = accuracy_score(y, cv_preds)
auc = roc_auc_score(y, cv_probas)
report = classification_report(y, cv_preds, target_names=['No Frequent Pain', 'Frequent OA Pain'], output_dict=True)
cm = confusion_matrix(y, cv_preds).tolist()

print(f"\n--- Cross-Validation Results ---")
print(f"Accuracy: {acc * 100:.2f}%")
print(f"ROC-AUC:  {auc:.4f}")
print(classification_report(y, cv_preds, target_names=['No Frequent Pain', 'Frequent OA Pain']))

# Train final pipeline on full dataset
pipeline.fit(X_arr, y_arr)

# Extract feature importances
rf = pipeline.named_steps['clf']
importances = sorted(zip(feature_cols, rf.feature_importances_), key=lambda x: x[1], reverse=True)

print("\n--- Top 10 Most Predictive Features ---")
for feat, imp in importances[:10]:
    print(f"  {feat:<22}: {imp*100:.2f}%")

# Save model bundle
bundle = {
    "pipeline": pipeline,
    "feature_names": feature_cols,
    "feature_importances": dict(importances),
    "classes": [0, 1],
    "class_names": ["No Frequent Pain / Low Risk", "Frequent Knee OA Pain / High Risk"],
    "metrics": {
        "accuracy": acc,
        "roc_auc": auc,
        "n_samples": int(len(X)),
        "n_patients": int(groups.nunique())
    },
    "provenance": "Osteoarthritis Initiative (OAI) / PLOS ONE (pone.0325678, 2025)"
}

joblib.dump(bundle, MODEL_OUT)
print(f"\nSaved trained model artifact to: {MODEL_OUT}")

report_data = {
    "dataset": "OAI Knee Osteoarthritis Cohort (PLOS ONE pone.0325678, 2025)",
    "n_samples": len(X),
    "n_patients": int(groups.nunique()),
    "features": feature_cols,
    "top_features": dict(importances[:10]),
    "metrics": {
        "accuracy": acc,
        "roc_auc": auc,
        "classification_report": report,
        "confusion_matrix": cm
    }
}
with open(REPORT_OUT, 'w') as f:
    json.dump(report_data, f, indent=2)
print(f"Saved evaluation report to: {REPORT_OUT}")
