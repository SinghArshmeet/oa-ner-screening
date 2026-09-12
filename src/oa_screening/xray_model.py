from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


KL_GRADE_LABELS = {
    0: "KL 0: none",
    1: "KL 1: doubtful",
    2: "KL 2: minimal",
    3: "KL 3: moderate",
    4: "KL 4: severe",
}


KL_GRADE_TO_RISK = {
    0: "low",
    1: "low",
    2: "moderate",
    3: "high",
    4: "high",
}


@dataclass(frozen=True)
class XRayPrediction:
    kl_grade: int
    risk_level: str
    label: str
    confidence: float | None = None
    gradcam_path: str | None = None
    recommendation: str = "Clinical evaluation recommended."


class XRayModelSpec:
    """Placeholder specification for the later X-ray module.

    The real model should be trained separately on the X-ray split with a fixed
    validation set and then loaded here for inference.
    """

    def __init__(
        self,
        model_name: str = "resnet18",
        checkpoint_path: str | Path | None = None,
        image_size: tuple[int, int] = (224, 224),
        num_classes: int = 5,
    ) -> None:
        self.model_name = model_name
        self.checkpoint_path = Path(checkpoint_path) if checkpoint_path else None
        self.image_size = image_size
        self.num_classes = num_classes

    def predict(self, image_path: str | Path) -> XRayPrediction:
        """Return a placeholder result until a trained checkpoint is available."""
        image = Path(image_path)
        if not image.exists():
            raise FileNotFoundError(f"X-ray image was not found: {image}")

        raise NotImplementedError(
            "The X-ray module is planned for later. Train a KL-grade model on the fixed dataset split "
            "before enabling inference in the app."
        )
