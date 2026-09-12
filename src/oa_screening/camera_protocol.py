from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class CaptureProtocol:
    """Standardized camera setup for the movement screening MVP.

    The goal is to keep the capture conditions close to the original gait dataset so
    MediaPipe pose estimation is more stable and the model remains meaningful.
    """

    camera_distance_m: float = 2.5
    camera_height_m: float = 1.0
    camera_angle_deg: float = 90.0
    walking_distance_m: float = 4.0
    frame_rate_fps: int = 30
    resolution: tuple[int, int] = (1280, 720)
    lighting: str = "even, well-lit, minimal shadow"
    side_view_required: bool = True
    test_sequence: tuple[str, ...] = field(
        default_factory=lambda: (
            "stand still 5 to 10 seconds",
            "walk 4 to 10 meters in a straight line",
            "sit-to-stand 5 repetitions",
        )
    )

    def as_dict(self) -> dict[str, Any]:
        return {
            "camera_distance_m": self.camera_distance_m,
            "camera_height_m": self.camera_height_m,
            "camera_angle_deg": self.camera_angle_deg,
            "walking_distance_m": self.walking_distance_m,
            "frame_rate_fps": self.frame_rate_fps,
            "resolution": list(self.resolution),
            "lighting": self.lighting,
            "side_view_required": self.side_view_required,
            "test_sequence": list(self.test_sequence),
        }

    def validate(self) -> None:
        """Raise a ValueError if the protocol configuration is unsafe or inconsistent."""
        if self.camera_distance_m <= 0:
            raise ValueError("camera_distance_m must be greater than zero.")
        if self.camera_height_m <= 0:
            raise ValueError("camera_height_m must be greater than zero.")
        if not 0 < self.camera_angle_deg <= 180:
            raise ValueError("camera_angle_deg should be between 0 and 180 degrees.")
        if self.walking_distance_m <= 0:
            raise ValueError("walking_distance_m must be greater than zero.")
        if self.frame_rate_fps <= 0:
            raise ValueError("frame_rate_fps must be greater than zero.")
        if self.resolution[0] <= 0 or self.resolution[1] <= 0:
            raise ValueError("resolution dimensions must be positive.")


DEFAULT_CAPTURE_PROTOCOL = CaptureProtocol()


def build_capture_protocol() -> CaptureProtocol:
    """Return the current default protocol for a local, research-only screen."""
    DEFAULT_CAPTURE_PROTOCOL.validate()
    return DEFAULT_CAPTURE_PROTOCOL
