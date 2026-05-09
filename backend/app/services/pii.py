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
    "PHONE": r"(?<!\d)(?:01[0-9]|0[2-6][0-5])[-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)",
    "EMAIL": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
    "RRN": r"\b\d{6}-?[1-4]\d{6}\b",
    "CARD": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
    "ADDRESS": (
        r"(?:[가-힣]+(?:시|도)\s+[가-힣]+(?:시|군|구)\s+[가-힣0-9\s-]+?)"
        r"(?=\s*(?:[,.!?]|$|입니다|이고|이며))"
    ),
}
NAME_CONTEXT_PATTERN = (
    r"(?:이름|성함|담당자|작성자|신청자|고객명)\s*(?:은|는|이|가|:)?\s*"
    r"([가-힣]{2,4})(?=\s|[,.!?]|$|입니다|이고|이며)"
)
NAME_HONORIFIC_PATTERN = r"(?<![가-힣])[가-힣]{2,4}\s*(?:님|씨)(?![가-힣])"


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

    findings.extend(_detect_name_pii(text))

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


def _detect_name_pii(text: str) -> list[DetectedPII]:
    findings: list[DetectedPII] = []

    for match in re.finditer(NAME_CONTEXT_PATTERN, text):
        findings.append(
            DetectedPII(
                pii_type="NAME",
                value=match.group(1),
                start=match.start(1),
                end=match.end(1),
                source="regex-name-context",
            )
        )

    for match in re.finditer(NAME_HONORIFIC_PATTERN, text):
        value = re.sub(r"\s*(?:님|씨)$", "", match.group(0))
        value_start = match.start(0)
        value_end = value_start + len(value)
        findings.append(
            DetectedPII(
                pii_type="NAME",
                value=value,
                start=value_start,
                end=value_end,
                source="regex-name-honorific",
            )
        )

    return findings
