from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from services.file_storage import save_filtered_output
from services.pii_detector import process_pii


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI Security Gateway CLI")
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--text", help="Filter inline text")
    source_group.add_argument("--file", help="Filter a UTF-8 text file")
    parser.add_argument("--format", choices=["json", "text", "pretty"], default="json")
    parser.add_argument("--no-privacy-filter", action="store_true")
    parser.add_argument("--save", action="store_true")
    parser.add_argument("--output-format", choices=["txt", "json"], default="txt")
    return parser


def load_input_text(args: argparse.Namespace) -> str:
    if args.text is not None:
        return args.text
    file_path = Path(args.file)
    return file_path.read_text(encoding="utf-8")


def format_pretty_result(result: dict) -> str:
    original_text = result.get("original_text", "")
    masked_text = result.get("masked_text", "")
    detected_pii = result.get("detected_pii") or []
    detections = result.get("detections") or []
    risk_level = result.get("risk_level", "NONE")
    filter_engine = result.get("filter_engine", "-")
    saved_file = result.get("saved_file")

    lines = [
        "AI Security Gateway 결과",
        "────────────────────────────",
        "",
        "[원본]",
        original_text or "",
        "",
        "[비식별화 결과]",
        masked_text or "",
        "",
        "[요약]",
        f"위험도: {risk_level}",
        f"탐지 유형: {', '.join(detected_pii) if detected_pii else '-'}",
        f"탐지 개수: {len(detections)}",
        f"필터 엔진: {filter_engine}",
        "",
        "[탐지 상세]",
    ]

    if detections:
        for index, detection in enumerate(detections, start=1):
            detection_type = str(detection.get("type", "PII")).upper()
            detection_value = detection.get("value", "")
            detection_source = detection.get("source", "regex")
            lines.append(
                f"{index}. {detection_type} | {detection_value} | {detection_source}"
            )
    else:
        lines.append("탐지된 개인정보가 없습니다.")

    lines.extend(
        [
            "",
            "[파일 저장]",
            (
                f"{str(saved_file.get('format', '')).upper()} · {saved_file.get('saved_file', '')}"
                if isinstance(saved_file, dict) and saved_file.get("saved_file")
                else "저장 안 함"
            ),
        ]
    )

    return "\n".join(lines)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        text = load_input_text(args)
        result = process_pii(text, use_openai_privacy_filter=not args.no_privacy_filter)

        if args.save:
            result["saved_file"] = save_filtered_output(result, args.output_format)
        else:
            result["saved_file"] = None

        if args.format == "text":
            print(result["masked_text"])
        elif args.format == "pretty":
            print(format_pretty_result(result))
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2))

        return 0
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
