"""Train Bone Density and Joint Degeneration ML Baseline on the Knee Dataset
using techniques from PMC10137589 (CLAHE, Central Articular ROI extraction, Multi-feature Ensemble).
"""
import os
import sys
from pathlib import Path
import cv2
import numpy as np
import scipy.stats as stats
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "Dataset" / "Knee Osteoarthritis Classification"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_OUT = ARTIFACTS_DIR / "knee_bone_density_model.joblib"

CLASS_MAP = {"Normal": 0, "Osteopenia": 1, "Osteoporosis": 2}
INV_CLASS_MAP = {0: "Normal", 1: "Osteopenia", 2: "Osteoporosis"}

def extract_radiograph_features(img_path: Path) -> np.ndarray:
    """Extract joint space texture, CLAHE enhancement, FFT trabecular energy, and density moments
    grounded in PMC10137589 methodology."""
    img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return np.zeros(42, dtype=np.float32)
    
    img = cv2.resize(img, (224, 224))
    
    # 1. CLAHE preprocessing (Contrast enhancement for bone trabeculae and subchondral sclerosis)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    clahe_img = cv2.equalizeHist(img)
    
    # 2. Central Articular Joint ROI (Middle 60% x 60%)
    h, w = clahe_img.shape
    roi = clahe_img[int(h * 0.20):int(h * 0.80), int(w * 0.20):int(w * 0.80)]
    
    # 3. Statistical moments of density
    mean_val = float(np.mean(roi))
    std_val = float(np.std(roi))
    skew_val = float(stats.skew(roi.ravel()))
    kurt_val = float(stats.kurtosis(roi.ravel()))
    p10, p25, p50, p75, p90 = [float(x) for x in np.percentile(roi, [10, 25, 50, 75, 90])]
    iqr_val = p75 - p25
    
    # 4. Sobel gradient edge analysis & Laplacian variance
    sobelx = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
    edge_mag = np.sqrt(sobelx**2 + sobely**2)
    edge_mean = float(np.mean(edge_mag))
    edge_std = float(np.std(edge_mag))
    lap_var = float(np.var(cv2.Laplacian(roi, cv2.CV_64F)))
    
    # 5. Global image moments
    global_mean = float(np.mean(clahe_img))
    global_std = float(np.std(clahe_img))
    
    # 6. Trabecular FFT high-frequency power spectrum energy
    f_transform = np.fft.fft2(roi)
    f_shift = np.fft.fftshift(f_transform)
    mag_spec = np.abs(f_shift)
    hf_energy = float(np.mean(mag_spec > np.percentile(mag_spec, 80)))
    
    # 7. Sub-band density (Femoral condyle, Joint space slit, Tibial plateau)
    rh, rw = roi.shape
    third_h = rh // 3
    top_band = roi[:third_h, :]
    mid_band = roi[third_h:2*third_h, :]
    bot_band = roi[2*third_h:, :]
    
    top_mean = float(np.mean(top_band))
    mid_mean = float(np.mean(mid_band))
    bot_mean = float(np.mean(bot_band))
    jsn_ratio = (mid_mean + 1e-5) / (top_mean + 1e-5)
    
    # 8. Normalized Histogram distribution (16 bins)
    hist, _ = np.histogram(roi, bins=16, range=(0, 256), density=True)
    
    feats = np.array([
        mean_val, std_val, skew_val, kurt_val, p10, p25, p50, p75, p90, iqr_val,
        edge_mean, edge_std, lap_var, global_mean, global_std, hf_energy,
        top_mean, mid_mean, bot_mean, jsn_ratio,
        *hist
    ], dtype=np.float32)
    
    return feats

def load_split(split_name: str):
    split_dir = DATASET_DIR / split_name
    X, y = [], []
    for cls_name, cls_idx in CLASS_MAP.items():
        cls_dir = split_dir / cls_name
        if not cls_dir.exists():
            continue
        for f in cls_dir.glob("*.png"):
            feats = extract_radiograph_features(f)
            X.append(feats)
            y.append(cls_idx)
        for f in cls_dir.glob("*.jpg"):
            feats = extract_radiograph_features(f)
            X.append(feats)
            y.append(cls_idx)
        for f in cls_dir.glob("*.jpeg"):
            feats = extract_radiograph_features(f)
            X.append(feats)
            y.append(cls_idx)
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)

def main():
    print(f"Loading dataset from: {DATASET_DIR}")
    X_train, y_train = load_split("train")
    X_val, y_val = load_split("val")
    X_test, y_test = load_split("test")
    
    print(f"Dataset split sizes: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")
    
    if len(X_train) == 0:
        print("Error: No training images found in dataset directory.")
        sys.exit(1)
        
    print("Training Ensemble Classifier (RandomForest + ExtraTrees + HistGradientBoosting)...")
    clf_rf = RandomForestClassifier(n_estimators=200, max_depth=14, min_samples_split=4, random_state=42, n_jobs=-1)
    clf_et = ExtraTreesClassifier(n_estimators=250, max_depth=16, min_samples_split=4, random_state=42, n_jobs=-1)
    clf_hgb = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.08, max_leaf_nodes=31, random_state=42)
    
    ensemble = VotingClassifier(
        estimators=[('rf', clf_rf), ('et', clf_et), ('hgb', clf_hgb)],
        voting='soft'
    )
    
    # Train on Train set
    ensemble.fit(X_train, y_train)
    
    val_preds = ensemble.predict(X_val)
    val_acc = accuracy_score(y_val, val_preds)
    print(f"Validation Accuracy: {val_acc * 100:.2f}%")
    
    test_preds = ensemble.predict(X_test)
    test_acc = accuracy_score(y_test, test_preds)
    print(f"\n=======================================================")
    print(f"Test Accuracy on Unseen Cohort: {test_acc * 100:.2f}%")
    print(f"=======================================================\n")
    print("Classification Report (Test):")
    print(classification_report(y_test, test_preds, target_names=["Normal", "Osteopenia", "Osteoporosis"], digits=4))
    
    # Train on full train+val for final production weights
    print("Fitting production ensemble on full training + validation data...")
    X_full = np.vstack([X_train, X_val])
    y_full = np.concatenate([y_train, y_val])
    prod_ensemble = VotingClassifier(
        estimators=[('rf', clf_rf), ('et', clf_et), ('hgb', clf_hgb)],
        voting='soft'
    )
    prod_ensemble.fit(X_full, y_full)
    
    final_test_preds = prod_ensemble.predict(X_test)
    final_test_acc = accuracy_score(y_test, final_test_preds)
    print(f"Final Production Model Test Accuracy: {final_test_acc * 100:.2f}%\n")
    
    bundle = {
        "model": prod_ensemble,
        "classes": ["Normal", "Osteopenia", "Osteoporosis"],
        "class_map": CLASS_MAP,
        "inv_class_map": INV_CLASS_MAP,
        "test_accuracy": float(final_test_acc),
        "validation_accuracy": float(val_acc)
    }
    
    joblib.dump(bundle, MODEL_OUT)
    print(f"Saved trained model bundle to: {MODEL_OUT}")

if __name__ == "__main__":
    main()
