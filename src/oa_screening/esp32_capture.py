from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ESP32CameraConfig:
    """Configuration for an ESP32-CAM capture device used in a local screening setup."""

    wifi_ssid: str = "OA_SCREENING"
    wifi_password: str = "oa-screening"
    camera_resolution: tuple[int, int] = (640, 480)
    jpeg_quality: int = 85
    frame_rate_fps: int = 15
    trigger_mode: str = "manual"
    capture_duration_seconds: int = 8
    stream_url: str = "http://esp32cam.local/capture"
    upload_endpoint: str = "http://localhost:8000/upload"
    side_view_required: bool = True
    lighting_hint: str = "use even lighting and avoid shadowed walking paths"
    local_only: bool = True

    def validate(self) -> None:
        if self.camera_resolution[0] <= 0 or self.camera_resolution[1] <= 0:
            raise ValueError("camera_resolution must contain positive dimensions.")
        if not 1 <= self.jpeg_quality <= 100:
            raise ValueError("jpeg_quality must be between 1 and 100.")
        if self.frame_rate_fps <= 0:
            raise ValueError("frame_rate_fps must be greater than zero.")
        if self.capture_duration_seconds <= 0:
            raise ValueError("capture_duration_seconds must be greater than zero.")

    def as_dict(self) -> dict[str, Any]:
        return {
            "wifi_ssid": self.wifi_ssid,
            "wifi_password": self.wifi_password,
            "camera_resolution": list(self.camera_resolution),
            "jpeg_quality": self.jpeg_quality,
            "frame_rate_fps": self.frame_rate_fps,
            "trigger_mode": self.trigger_mode,
            "capture_duration_seconds": self.capture_duration_seconds,
            "stream_url": self.stream_url,
            "upload_endpoint": self.upload_endpoint,
            "side_view_required": self.side_view_required,
            "lighting_hint": self.lighting_hint,
            "local_only": self.local_only,
        }


DEFAULT_ESP32_CONFIG = ESP32CameraConfig()


@dataclass
class ESP32CaptureSession:
    """Placeholder wrapper for hardware capture sessions.

    This is a lightweight abstraction so later code can support uploading frames or
    short clips captured by an ESP32-CAM module without changing the current app
    architecture.
    """

    config: ESP32CameraConfig = field(default_factory=lambda: DEFAULT_ESP32_CONFIG)

    def __post_init__(self) -> None:
        self.config.validate()

    def start_capture(self) -> dict[str, Any]:
        return {
            "status": "configured",
            "trigger_mode": self.config.trigger_mode,
            "capture_duration_seconds": self.config.capture_duration_seconds,
            "side_view_required": self.config.side_view_required,
            "stream_url": self.config.stream_url,
        }

    def receive_frame(self, frame_payload: bytes) -> bytes:
        if not isinstance(frame_payload, (bytes, bytearray)):
            raise TypeError("frame_payload must be bytes-like.")
        return bytes(frame_payload)
