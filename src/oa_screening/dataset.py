from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


VIDEO_SUFFIXES = {".mov", ".mp4", ".avi", ".mkv"}


@dataclass(frozen=True)
class VideoRecord:
    path: Path
    subject_id: str
    dataset_class: str
    severity: str
    target: str


def parse_video_path(path: Path) -> VideoRecord | None:
    """Parse supplied KOA-PD-NM filenames without relying on folder names."""
    match = re.fullmatch(
        r"(?P<subject>\d+)_(?P<class>KOA|NM|PD)_(?P<sequence>\d+)(?:_(?P<severity>EL|MD|SV|ML))?",
        path.stem,
        flags=re.IGNORECASE,
    )
    if not match:
        return None

    dataset_class = match["class"].upper()
    severity = (match["severity"] or "").upper()
    if dataset_class == "PD":
        return None
    if dataset_class == "NM":
        return VideoRecord(path, match["subject"], dataset_class, "NM", "low")

    target_by_severity = {"EL": "early", "MD": "moderate", "SV": "severe"}
    if severity not in target_by_severity:
        return None
    return VideoRecord(path, match["subject"], dataset_class, severity, target_by_severity[severity])


def iter_oa_records(input_dir: Path) -> Iterator[VideoRecord]:
    for path in sorted(input_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in VIDEO_SUFFIXES:
            record = parse_video_path(path)
            if record is not None:
                yield record
