from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4


def get_project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def ensure_output_dir() -> Path:
    output_dir = get_project_root() / "outputs" / "filtered"
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def make_file_suffix() -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    unique_part = uuid4().hex[:8]
    return f"{timestamp}_{unique_part}"


def to_relative_path(path: Path) -> str:
    return path.resolve().relative_to(get_project_root()).as_posix()


def save_masked_text(masked_text: str, filename_prefix: str = "masked") -> str:
    output_dir = ensure_output_dir()
    filename = f"{filename_prefix}_{make_file_suffix()}.txt"
    file_path = output_dir / filename
    file_path.write_text(masked_text or "", encoding="utf-8")
    return to_relative_path(file_path)


def save_result_json(result: dict, filename_prefix: str = "result") -> str:
    output_dir = ensure_output_dir()
    filename = f"{filename_prefix}_{make_file_suffix()}.json"
    file_path = output_dir / filename
    file_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return to_relative_path(file_path)


def save_filtered_output(result: dict, output_format: str = "txt") -> dict[str, str]:
    normalized_format = str(output_format or "txt").strip().lower()

    if normalized_format == "txt":
        saved_file = save_masked_text(result.get("masked_text", ""))
        return {"format": "txt", "saved_file": saved_file}

    if normalized_format == "json":
        saved_file = save_result_json(result)
        return {"format": "json", "saved_file": saved_file}

    raise ValueError("output_format must be 'txt' or 'json'")

