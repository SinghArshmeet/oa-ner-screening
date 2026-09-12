from __future__ import annotations

import argparse
import logging
from pathlib import Path

import pandas as pd

from .dataset import iter_oa_records
from .features import PoseFeatureExtractor


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract MediaPipe gait features from KOA-PD-NM videos.")
    parser.add_argument("--input", type=Path, required=True, help="Folder containing KOA-PD-NM.")
    parser.add_argument("--output", type=Path, required=True, help="Feature CSV to create.")
    parser.add_argument("--sample-fps", type=float, default=5.0)
    parser.add_argument("--max-videos", type=int, default=None, help="Use for a quick pipeline test.")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    records = list(iter_oa_records(args.input))
    if args.max_videos:
        records = records[: args.max_videos]
    if not records:
        raise SystemExit("No supported KOA or NM video files found.")

    extractor = PoseFeatureExtractor(sample_fps=args.sample_fps)
    rows = []
    for index, record in enumerate(records, start=1):
        logging.info("[%d/%d] %s", index, len(records), record.path.name)
        try:
            features = extractor.extract(str(record.path))
            # KOA IDs restart within EL/MD/SV folders (for example, EL_001 and
            # MD_001 are different participants), so severity is part of the
            # participant key used for leakage-safe evaluation.
            subject_key = f"{record.dataset_class}_{record.severity}_{record.subject_id}"
            rows.append({"path": str(record.path), "subject_id": subject_key, "target": record.target, "severity": record.severity, **features})
        except Exception:
            logging.exception("Skipping unreadable video: %s", record.path)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(args.output, index=False)
    logging.info("Wrote %d feature rows to %s", len(rows), args.output)


if __name__ == "__main__":
    main()
