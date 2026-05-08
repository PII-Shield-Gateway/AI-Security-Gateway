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
    parser.add_argument("--format", choices=["json", "text"], default="json")
    parser.add_argument("--no-privacy-filter", action="store_true")
    parser.add_argument("--save", action="store_true")
    parser.add_argument("--output-format", choices=["txt", "json"], default="txt")
    return parser


def load_input_text(args: argparse.Namespace) -> str:
    if args.text is not None:
        return args.text
    file_path = Path(args.file)
    return file_path.read_text(encoding="utf-8")


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
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2))

        return 0
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

