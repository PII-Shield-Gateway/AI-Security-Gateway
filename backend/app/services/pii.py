from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class DetectedPII:
    pii_type: str
    value: str
    start: int
    end: int
    source: str


TOKEN_MAP = {
    "NAME": "[NAME]",
    "PHONE": "[PHONE]",
    "EMAIL": "[EMAIL]",
    "ADDRESS": "[ADDRESS]",
    "RRN": "[RRN]",
    "CARD": "[CARD]",
}


PATTERNS: dict[str, str] = {
    "PHONE": r"\b(?:01[0-9]|0[2-6][0-5])[-.\s]?\d{3,4}[-.\s]?\d{4}\b",
    "EMAIL": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
    "RRN": r"\b\d{6}-?[1-4]\d{6}\b",
    "CARD": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
    "ADDRESS": r"(?:[가-힣]+(?:시|도)\s+[가-힣]+(?:시|군|구)\s+[가-힣0-9\s-]+)",
}
NAME_PATTERN = r"\b[가-힣]{2,4}(?:님|씨)?\b"


def detect_pii(text: str) -> list[DetectedPII]:
    findings: list[DetectedPII] = []

    for pii_type, pattern in PATTERNS.items():
        for match in re.finditer(pattern, text):
            findings.append(
                DetectedPII(
                    pii_type=pii_type,
                    value=match.group(0),
                    start=match.start(),
                    end=match.end(),
                    source="regex",
                )
            )

    for match in re.finditer(NAME_PATTERN, text):
        value = match.group(0)
        if value in {"안내", "문의", "정보", "요청", "결과", "테스트"}:
            continue
        findings.append(
            DetectedPII(
                pii_type="NAME",
                value=value,
                start=match.start(),
                end=match.end(),
                source="ner-mock",
            )
        )

    return _drop_overlaps(findings)


def mask_text(text: str, findings: Iterable[DetectedPII]) -> str:
    ordered = sorted(findings, key=lambda item: item.start, reverse=True)
    masked = text
    for item in ordered:
        token = TOKEN_MAP[item.pii_type]
        masked = masked[: item.start] + token + masked[item.end :]
    return masked


def calculate_risk_level(findings: Iterable[DetectedPII]) -> str:
    types = {item.pii_type for item in findings}
    if not types:
        return "NONE"

    if "RRN" in types or "CARD" in types:
        return "HIGH"

    if len(types) >= 3:
        return "HIGH"

    if types == {"NAME"}:
        return "LOW"

    if types in ({"EMAIL"}, {"PHONE"}):
        return "MEDIUM"

    if types in ({"NAME", "PHONE"}, {"NAME", "EMAIL"}, {"PHONE", "EMAIL"}):
        return "HIGH"

    if "ADDRESS" in types and len(types) >= 2:
        return "HIGH"

    return "MEDIUM"


def _drop_overlaps(findings: Iterable[DetectedPII]) -> list[DetectedPII]:
    result: list[DetectedPII] = []
    occupied: list[tuple[int, int]] = []

    # 길이가 긴 탐지 결과를 우선 적용해 중첩 토큰화를 방지한다.
    for item in sorted(findings, key=lambda x: (x.end - x.start), reverse=True):
        if any(not (item.end <= s or item.start >= e) for s, e in occupied):
            continue
        result.append(item)
        occupied.append((item.start, item.end))

    return sorted(result, key=lambda x: x.start)
