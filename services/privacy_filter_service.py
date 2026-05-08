from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass
from typing import Any


TYPE_ALIASES = {
    "PRIVATE_EMAIL": "EMAIL",
    "PRIVATE_PHONE": "PHONE",
    "PRIVATE_PERSON": "NAME",
    "PRIVATE_ADDRESS": "ADDRESS",
    "PRIVATE_URL": "URL",
    "PRIVATE_DATE": "DATE",
    "ACCOUNT_NUMBER": "ACCOUNT",
    "PRIVATE_ACCOUNT": "ACCOUNT",
    "PRIVATE_CARD": "CARD",
    "PRIVATE_SECRET": "SECRET",
}

LABEL_ALIASES = {
    "private_email": "EMAIL",
    "private_phone": "PHONE",
    "private_person": "NAME",
    "private_address": "ADDRESS",
    "private_url": "URL",
    "private_date": "DATE",
    "account_number": "ACCOUNT",
    "secret": "SECRET",
}


@dataclass
class PrivacyFilterError(RuntimeError):
    message: str
    raw_output: str | None = None

    def __post_init__(self):
        super().__init__(self.message)


def is_privacy_filter_available() -> bool:
    return shutil.which("opf") is not None or shutil.which("opf.exe") is not None


def _opf_path() -> str:
    opf = shutil.which("opf")
    if opf:
        return opf
    opf_exe = shutil.which("opf.exe")
    if opf_exe:
        return opf_exe
    raise PrivacyFilterError("OpenAI Privacy Filter CLI is not installed.")


def normalize_privacy_filter_span(span: dict) -> dict:
    if not isinstance(span, dict):
        return {}

    span_type = (
        span.get("type")
        or span.get("label")
        or span.get("entity")
        or span.get("name")
        or span.get("tag")
        or span.get("category")
        or "PII"
    )
    if isinstance(span_type, str):
        span_type = LABEL_ALIASES.get(span_type, TYPE_ALIASES.get(span_type.upper(), span_type.upper()))
    else:
        span_type = "PII"

    start = span.get("start")
    end = span.get("end")
    if start is None and isinstance(span.get("offset"), int):
        start = span["offset"]
    if end is None and isinstance(span.get("length"), int) and start is not None:
        end = start + span["length"]

    if start is None or end is None:
        return {}

    value = (
        span.get("value")
        or span.get("text")
        or span.get("span")
        or span.get("content")
        or ""
    )
    score = span.get("score", 1.0)
    source = span.get("source", "openai_privacy_filter")

    return {
        "type": str(span_type).upper(),
        "value": str(value),
        "start": int(start),
        "end": int(end),
        "score": float(score) if score is not None else 1.0,
        "source": source,
    }


def _extract_spans(payload: Any) -> list[dict]:
    if not isinstance(payload, dict):
        return []

    keys_to_try = [
        "detected_spans",
        "detections",
        "spans",
        "entities",
        "results",
        "items",
        "predictions",
        "redactions",
        "matches",
    ]

    spans = []
    for key in keys_to_try:
        candidate = payload.get(key)
        if candidate:
            spans = candidate
            break

    if not isinstance(spans, list):
        return []

    normalized = []
    for span in spans:
        if isinstance(span, dict):
            normalized_span = normalize_privacy_filter_span(span)
            if normalized_span:
                normalized.append(normalized_span)
        elif isinstance(span, (list, tuple)) and len(span) >= 3:
            start, end, label = span[:3]
            value = span[3] if len(span) > 3 else ""
            normalized.append(
                {
                    "type": str(LABEL_ALIASES.get(str(label), TYPE_ALIASES.get(str(label).upper(), str(label).upper()))).upper(),
                    "value": str(value),
                    "start": int(start),
                    "end": int(end),
                    "score": 1.0,
                    "source": "openai_privacy_filter",
                }
            )
    return normalized


def run_openai_privacy_filter(text: str, device: str = "cpu") -> dict:
    if not is_privacy_filter_available():
        raise PrivacyFilterError("OpenAI Privacy Filter CLI is not installed.")

    opf_path = _opf_path()
    command = [
        opf_path,
        "redact",
        "--device",
        device,
        "--format",
        "json",
        "--output-mode",
        "typed",
        "--no-print-color-coded-text",
        text,
    ]

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=300,
    )

    raw_output = (completed.stdout or "") + (completed.stderr or "")
    if completed.returncode != 0:
        raise PrivacyFilterError(
            f"OpenAI Privacy Filter failed with exit code {completed.returncode}.",
            raw_output=raw_output,
        )

    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise PrivacyFilterError(
            "OpenAI Privacy Filter returned invalid JSON.",
            raw_output=raw_output,
        ) from exc

    spans = _extract_spans(payload)

    return {
        "original_text": text,
        "masked_text": payload.get("masked_text")
        or payload.get("redacted_text")
        or payload.get("output_text")
        or payload.get("text")
        or "",
        "detected_spans": spans,
        "raw_output": raw_output,
        "opf_payload": payload,
    }
