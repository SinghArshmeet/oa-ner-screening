"""
Deep Learning Training Pipeline for Knee Osteoarthritis Kellgren-Lawrence (KL) Grading.
Uses transfer learning with ResNet-18 on knee radiograph images.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import time

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = PROJECT_ROOT / "Dataset" / "xray"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "artifacts"


def build_model(num_classes: int = 5, pretrained: bool = True) -> nn.Module:
    """Build ResNet-18 model adapted for 5-class KL grading."""
    weights = models.ResNet18_Weights.DEFAULT if pretrained else None
    model = models.resnet18(weights=weights)
    
    # Replace final linear classification head
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model


def get_data_transforms() -> tuple[transforms.Compose, transforms.Compose]:
    """Training and validation/test image transformations."""
    norm = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        norm,
    ])
    
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        norm,
    ])
    return train_transform, eval_transform


def train_epoch(model: nn.Module, loader: DataLoader, criterion: nn.Module, optimizer: torch.optim.Optimizer, device: torch.device, print_every: int = 40) -> tuple[float, float]:
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    total_batches = len(loader)

    for batch_idx, (images, targets) in enumerate(loader, start=1):
        images, targets = images.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        batch_sz = images.size(0)
        running_loss += loss.item() * batch_sz
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == targets.data).item()
        total += batch_sz

        if batch_idx % print_every == 0 or batch_idx == total_batches:
            cur_loss = running_loss / max(total, 1)
            cur_acc = correct / max(total, 1)
            print(f"    Batch [{batch_idx:03d}/{total_batches:03d}] ({batch_idx/total_batches*100:4.1f}%) - Loss: {cur_loss:.4f} | Acc: {cur_acc*100:5.2f}%", flush=True)

    epoch_loss = running_loss / max(total, 1)
    epoch_acc = correct / max(total, 1)
    return epoch_loss, epoch_acc



class OrdinalKLLoss(nn.Module):
    """Ordinal soft-target loss modeling progressive Kellgren-Lawrence degeneration."""
    def __init__(self, num_classes: int = 5, sigma: float = 0.65, class_weights: torch.Tensor | None = None) -> None:
        super().__init__()
        self.num_classes = num_classes
        self.sigma = sigma
        self.class_weights = class_weights

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        classes = torch.arange(self.num_classes, device=logits.device, dtype=torch.float)
        diff = classes.unsqueeze(0) - targets.unsqueeze(1).float()
        target_dist = torch.exp(- (diff ** 2) / (2.0 * (self.sigma ** 2)))
        target_dist = target_dist / target_dist.sum(dim=1, keepdim=True)
        
        log_probs = torch.nn.functional.log_softmax(logits, dim=1)
        loss_per_sample = - (target_dist * log_probs).sum(dim=1)
        if self.class_weights is not None:
            weights = self.class_weights[targets]
            loss_per_sample = loss_per_sample * weights
        return loss_per_sample.mean()


def eval_epoch(model: nn.Module, loader: DataLoader, criterion: nn.Module, device: torch.device) -> tuple[float, float, float, float, list[int], list[int]]:
    model.eval()
    running_loss = 0.0
    correct = 0
    correct_off1 = 0
    correct_binary = 0
    total = 0
    all_preds: list[int] = []
    all_targets: list[int] = []

    with torch.no_grad():
        for images, targets in loader:
            images, targets = images.to(device), targets.to(device)
            outputs = model(images)
            loss = criterion(outputs, targets)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == targets.data).item()
            correct_off1 += torch.sum(torch.abs(preds - targets.data) <= 1).item()
            correct_binary += torch.sum((preds >= 2) == (targets.data >= 2)).item()
            total += images.size(0)

            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(targets.cpu().tolist())

    epoch_loss = running_loss / max(total, 1)
    epoch_acc = correct / max(total, 1)
    epoch_off1 = correct_off1 / max(total, 1)
    epoch_binary = correct_binary / max(total, 1)
    return epoch_loss, epoch_acc, epoch_off1, epoch_binary, all_preds, all_targets


def main() -> None:
    parser = argparse.ArgumentParser(description="Train ResNet-18 on Knee X-Ray dataset for KL grading.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR, help="Path to Dataset/xray directory")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Path to save artifacts")
    parser.add_argument("--epochs", type=int, default=4, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=2e-4, help="Initial learning rate")
    parser.add_argument("--sigma", type=float, default=0.52, help="Gaussian soft-target spread for OrdinalKLLoss")
    parser.add_argument("--freeze-backbone", action="store_true", default=True, help="Freeze early conv layers and fine-tune layer3, layer4 + fc")
    parser.add_argument("--max-samples-per-class", type=int, default=0, help="Optional cap on training samples per class (0 for all)")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")

    train_dir = args.data_dir / "train"
    val_dir = args.data_dir / "val"
    test_dir = args.data_dir / "test"

    if not train_dir.exists() or not val_dir.exists():
        raise FileNotFoundError(f"Training or validation directories not found in {args.data_dir}")

    train_transform, eval_transform = get_data_transforms()
    train_dataset = datasets.ImageFolder(str(train_dir), transform=train_transform)
    val_dataset = datasets.ImageFolder(str(val_dir), transform=eval_transform)
    test_dataset = datasets.ImageFolder(str(test_dir), transform=eval_transform) if test_dir.exists() else None

    # Optional subset sampling per class for rapid fine-tuning if requested
    if args.max_samples_per_class > 0:
        indices = []
        counts = {c: 0 for c in range(len(train_dataset.classes))}
        for idx, (_, target) in enumerate(train_dataset.samples):
            if counts[target] < args.max_samples_per_class:
                indices.append(idx)
                counts[target] += 1
        train_dataset = torch.utils.data.Subset(train_dataset, indices)
        print(f"Subset active: limited to max {args.max_samples_per_class} per class. Total: {len(train_dataset)}")

    print(f"Loaded datasets: Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset) if test_dataset else 0}")
    print(f"Classes: {val_dataset.classes}")

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Balanced square-root class weighting
    class_counts = [0] * len(val_dataset.classes)
    raw_samples = train_dataset.dataset.samples if isinstance(train_dataset, torch.utils.data.Subset) else train_dataset.samples
    subset_indices = set(train_dataset.indices) if isinstance(train_dataset, torch.utils.data.Subset) else None
    for idx, (_, label) in enumerate(raw_samples):
        if subset_indices is None or idx in subset_indices:
            class_counts[label] += 1
    total_samples = sum(class_counts)
    class_weights = torch.tensor([(total_samples / max(c, 1)) ** 0.5 for c in class_counts], dtype=torch.float).to(device)
    class_weights = class_weights / class_weights.sum() * len(class_counts)
    print(f"Class counts: {class_counts}")
    print(f"Computed square-root class weights: {[round(w, 3) for w in class_weights.tolist()]}")

    model = build_model(num_classes=len(val_dataset.classes), pretrained=True).to(device)

    if args.freeze_backbone:
        print("Fine-tuning strategy: Freezing conv1 and layers 1-2. Training layer3, layer4, and fc classification head.")
        for name, param in model.named_parameters():
            if not name.startswith(("layer3", "layer4", "fc")):
                param.requires_grad = False

    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Trainable parameters: {trainable_params:,} / {total_params:,} ({trainable_params/total_params*100:.1f}%)")

    criterion = OrdinalKLLoss(num_classes=len(val_dataset.classes), sigma=args.sigma, class_weights=class_weights)
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_acc = 0.0
    checkpoint_path = args.output_dir / "xray_checkpoint.pth"
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print("\nStarting Deep Learning Training with Ordinal Loss...")
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, val_off1, val_bin, _, _ = eval_epoch(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0

        print(f"Epoch {epoch:02d}/{args.epochs:02d} [{elapsed:.1f}s] - Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}% | Val Loss: {val_loss:.4f}, Exact Acc: {val_acc*100:.2f}%, ±1 Acc: {val_off1*100:.2f}%, Binary OA: {val_bin*100:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_acc": val_acc,
                "val_off1_acc": val_off1,
                "val_binary_acc": val_bin,
                "val_loss": val_loss,
                "classes": val_dataset.classes,
                "architecture": "resnet18",
                "label_map": {
                    "0": "KL 0: Normal / None",
                    "1": "KL 1: Doubtful OA",
                    "2": "KL 2: Minimal / Mild OA",
                    "3": "KL 3: Moderate OA",
                    "4": "KL 4: Severe OA"
                }
            }, checkpoint_path)
            print(f"  ★ New best model checkpoint saved to {checkpoint_path} (Val Exact: {val_acc*100:.2f}%, ±1: {val_off1*100:.2f}%)")

    total_time = time.time() - start_time
    print(f"\nTraining completed in {total_time/60:.2f} minutes. Best Val Acc: {best_val_acc*100:.2f}%")

    # Evaluate on test split if available
    if test_dataset:
        print("\nEvaluating on unseen Test Split (1,656 images)...")
        test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
        test_loss, test_acc, test_off1, test_bin, preds, targets = eval_epoch(model, test_loader, criterion, device)
        print(f"  -> Exact 5-Class Match: {test_acc*100:.2f}%")
        print(f"  -> Within ±1 KL Grade (Radiologist Tolerance): {test_off1*100:.2f}%")
        print(f"  -> Binary OA Detection (KL >= 2): {test_bin*100:.2f}%")

        # Save comprehensive metrics report
        report_path = args.output_dir / "xray_model_report.json"
        report_path.write_text(json.dumps({
            "model_architecture": "resnet18",
            "epochs_trained": args.epochs,
            "best_val_accuracy": round(best_val_acc, 4),
            "test_exact_accuracy": round(test_acc, 4),
            "test_within_1_grade_accuracy": round(test_off1, 4),
            "test_binary_oa_accuracy": round(test_bin, 4),
            "classes": val_dataset.classes,
            "training_samples": len(train_dataset),
            "validation_samples": len(val_dataset),
            "test_samples": len(test_dataset)
        }, indent=2), encoding="utf-8")
        print(f"Report saved to {report_path}")


if __name__ == "__main__":
    main()
