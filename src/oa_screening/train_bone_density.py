"""Train Bone Density and Joint Degeneration ML Baseline on the new Knee Dataset
using techniques from PMC10137589 (Histogram Equalization, Central ROI extraction, Multi-feature PCA + Random Forest).
"""
import os
import sys
from pathlib import Path
import cv2
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
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
    """Extract joint space texture, histogram equalization statistics, and density moments
    as described in PMC10137589 methodology."""
    img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return np.zeros(24, dtype=np.float32)
    
    # 1. Resize to standardized 224x224
    img = cv2.resize(img, (224, 224))
    
    # 2. Histogram Equalization (Contrast enhancement for bone trabeculae and sclerosis)
    eq_img = cv2.equalizeHist(img)
    
    # 3. Central Articular Joint ROI (Middle 50% vertical and horizontal)
    h, w = eq_img.shape
    roi = eq_img[int(h * 0.25):int(h * 0.75), int(w * 0.20):int(w * 0.80)]
    
    # 4. Statistical moments of density
    mean_val = float(np.mean(roi))
    std_val = float(np.std(roi))
    median_val = float(np.median(roi))
    p25, p75 = float(np.percentile(roi, 25)), float(np.percentile(roi, 75))
    iqr_val = p75 - p25
    
    # 5. Sobel gradient edge analysis (subchondral bone edge sharpness & osteophytes)
    sobelx = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
    edge_mag = np.sqrt(sobelx**2 + sobely**2)
    edge_mean = float(np.mean(edge_mag))
    edge_std = float(np.std(edge_mag))
    
    # 6. Global image moments
    global_mean = float(np.mean(eq_img))
    global_std = float(np.std(eq_img))
    
    # 7. Histogram bin distribution (14 bins)
    hist, _ = np.histogram(roi, bins=14, range=(0, 256), density=True)
    
    feats = np.array([
        mean_val, std_val, median_val, p25, p75, iqr_val,
        edge_mean, edge_std, global_mean, global_std,
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
        
    print("Training Random Forest & Gradient Boosting Classifier on radiograph features...")
    clf = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    
    val_preds = clf.predict(X_val)
    val_acc = accuracy_score(y_val, val_preds)
    print(f"Validation Accuracy: {val_acc * 100:.2f}%")
    
    test_preds = clf.predict(X_test)
    test_acc = accuracy_score(y_test, test_preds)
    print(f"Test Accuracy: {test_acc * 100:.2f}%\n")
    print("Classification Report (Test):")
    print(classification_report(y_test, test_preds, target_names=["Normal", "Osteopenia", "Osteoporosis"]))
    
    bundle = {
        "model": clf,
        "classes": ["Normal", "Osteopenia", "Osteoporosis"],
        "class_map": CLASS_MAP,
        "inv_class_map": INV_CLASS_MAP,
        "test_accuracy": float(test_acc),
        "validation_accuracy": float(val_acc)
    }
    
    joblib.dump(bundle, MODEL_OUT)
    print(f"Saved trained model bundle to: {MODEL_OUT}")

if __name__ == "__main__":
    main()
