from __future__ import annotations

import re
from typing import Any

try:
    from services.privacy_filter_service import run_openai_privacy_filter
except Exception:  # pragma: no cover - optional dependency for later stages
    run_openai_privacy_filter = None


TOKEN_MAP = {
    "NAME": "[NAME]",
    "PHONE": "[PHONE]",
    "EMAIL": "[EMAIL]",
    "ADDRESS": "[ADDRESS]",
    "RRN": "[RRN]",
    "CARD": "[CARD]",
    "SECRET": "[SECRET]",
    "ACCOUNT": "[ACCOUNT]",
    "URL": "[URL]",
    "DATE": "[DATE]",
    "PII": "[PII]",
}

TYPE_PRIORITY = {
    "RRN": 6,
    "CARD": 6,
    "SECRET": 6,
    "PHONE": 5,
    "EMAIL": 5,
    "NAME": 4,
    "ADDRESS": 4,
    "ACCOUNT": 4,
    "URL": 3,
    "DATE": 3,
    "PII": 1,
}

SOURCE_PRIORITY = {
    "openai_privacy_filter": 2,
    "regex": 1,
}

KOREAN_NAME_DICTIONARY = [
    "김민수",
    "이서연",
    "박지훈",
    "최유진",
    "정현우",
    "강민지",
    "윤서준",
    "장하은",
    "임도윤",
    "한지민",
    "김하은",
    "이하은",
]

ADDRESS_KEYWORDS = [
    "서울특별시",
    "서울시",
    "서울",
    "부산광역시",
    "부산시",
    "부산",
    "대구광역시",
    "대구시",
    "대구",
    "인천광역시",
    "인천시",
    "인천",
    "광주광역시",
    "광주시",
    "광주",
    "대전광역시",
    "대전시",
    "대전",
    "울산광역시",
    "울산시",
    "울산",
    "세종특별자치시",
    "세종시",
    "세종",
    "경기도",
    "강원도",
    "충청북도",
    "충청남도",
    "전라북도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주특별자치도",
    "제주도",
    "강남구",
    "서초구",
    "송파구",
    "마포구",
    "종로구",
    "역삼동",
    "서초동",
    "잠실동",
]

DATE_PATTERNS = [
    re.compile(r"(?<!\d)(?:19|20)\d{2}[.\-/년]\s?\d{1,2}[.\-/월]\s?\d{1,2}(?:일)?(?!\d)"),
    re.compile(r"(?<!\d)\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}(?!\d)"),
    re.compile(r"(?<!\d)\d{8}(?!\d)"),
]

URL_PATTERN = re.compile(
    r"(?<![A-Za-z0-9])(?:https?://|www\.)[^\s<>()\"']+[^\s<>().,!?;:]", re.IGNORECASE
)

# Email/phone patterns avoid \b so Korean particles after the value do not block detection.
EMAIL_PATTERN = re.compile(
    r"(?<![A-Za-z0-9._%+-])"
    r"[A-Za-z0-9._%+-]+"
    r"@"
    r"[A-Za-z0-9.-]+"
    r"\.[A-Za-z]{2,}"
    r"(?![A-Za-z0-9._%+-])"
)

PHONE_PATTERN = re.compile(r"(?<!\d)(?:01[016789])[ -]?\d{3,4}[ -]?\d{4}(?!\d)")
RRN_PATTERN = re.compile(r"(?<!\d)\d{6}[- ]?\d{7}(?!\d)")
CARD_PATTERN = re.compile(r"(?<!\d)(?:\d{4}[ -]?){3}\d{4}(?!\d)")

ACCOUNT_PATTERN = re.compile(
    r"(?i)(?:계좌번호|계좌|account(?: number)?|acct|account_number)\s*[:=：]?\s*([0-9]{2,4}(?:[ -]?[0-9]{2,4}){1,4})"
)

SECRET_LABEL_PATTERNS = [
    re.compile(r"(?i)(?:password|pass|pw)\s*[:=：]?\s*([^\s,;\"'`]{2,})"),
    re.compile(r"(?:비밀번호|비번|패스워드)\s*[:=：]?\s*([^\s,;\"'`]{2,})"),
    re.compile(r"(?i)api[_-]?key\s*[:=：]?\s*([^\s,;\"'`]{4,})"),
    re.compile(r"(?i)secret\s*[:=：]?\s*([^\s,;\"'`]{2,})"),
    re.compile(r"(?i)token\s*[:=：]?\s*([^\s,;\"'`]{4,})"),
    re.compile(r"sk-[A-Za-z0-9_-]{8,}"),
]

PHONE_LABEL_PATTERN = re.compile(
    r"(?:전화번호|휴대폰|핸드폰|연락처|번호)\s*[:=：]?\s*((?:01[016789])[ -]?\d{3,4}[ -]?\d{4})"
)

LABEL_KEYWORDS = {
    "PHONE": ("전화번호", "휴대폰", "핸드폰", "연락처", "번호"),
    "SECRET": ("비밀번호", "비번", "패스워드", "password", "pw"),
    "ACCOUNT": ("계좌", "계좌번호", "account", "acct", "account_number"),
}


def make_detection(type, value, start, end, score=1.0, source="regex"):
    return {
        "type": type,
        "value": value,
        "start": start,
        "end": end,
        "score": score,
        "source": source,
    }


def _iter_pattern_matches(
    pattern: re.Pattern[str],
    text: str,
    pii_type: str,
    source: str = "regex",
    score: float = 1.0,
):
    detections = []
    for match in pattern.finditer(text):
        if match.groups():
            value = match.group(1)
            start = match.start(1)
            end = match.end(1)
        else:
            value = match.group(0)
            start = match.start()
            end = match.end()
        detections.append(make_detection(pii_type, value, start, end, score=score, source=source))
    return detections


def detect_email(text: str):
    return _iter_pattern_matches(EMAIL_PATTERN, text, "EMAIL")


def detect_phone(text: str):
    detections = _iter_pattern_matches(PHONE_PATTERN, text, "PHONE")
    detections.extend(_iter_pattern_matches(PHONE_LABEL_PATTERN, text, "PHONE"))
    return detections


def detect_rrn(text: str):
    return _iter_pattern_matches(RRN_PATTERN, text, "RRN")


def detect_card(text: str):
    return _iter_pattern_matches(CARD_PATTERN, text, "CARD")


def detect_name(text: str):
    detections = []
    for name in KOREAN_NAME_DICTIONARY:
        pattern = re.compile(rf"(?<![가-힣A-Za-z0-9]){re.escape(name)}(?![가-힣A-Za-z0-9])")
        detections.extend(_iter_pattern_matches(pattern, text, "NAME"))
    return detections


def detect_address(text: str):
    detections = []
    keywords = sorted(set(ADDRESS_KEYWORDS), key=len, reverse=True)
    offset = 0

    for line in text.splitlines(True):
        line_text = line.rstrip("\r\n")
        line_start = None
        for keyword in keywords:
            idx = line_text.find(keyword)
            if idx == -1:
                continue
            if line_start is None or idx < line_start:
                line_start = idx
        if line_start is None:
            offset += len(line)
            continue

        start = offset + line_start
        end = offset + len(line_text)
        if start < end:
            detections.append(make_detection("ADDRESS", text[start:end], start, end, score=0.9))
        offset += len(line)

    return detections


def detect_secret(text: str):
    detections = []
    for pattern in SECRET_LABEL_PATTERNS:
        detections.extend(_iter_pattern_matches(pattern, text, "SECRET"))
    detections.extend(_iter_pattern_matches(ACCOUNT_PATTERN, text, "ACCOUNT"))
    return detections


def detect_url(text: str):
    return _iter_pattern_matches(URL_PATTERN, text, "URL", score=0.85)


def detect_date(text: str):
    detections = []
    for pattern in DATE_PATTERNS:
        detections.extend(_iter_pattern_matches(pattern, text, "DATE", score=0.8))
    return detections


def detect_generic_pii(text: str):
    detections = []
    label_patterns = [
        re.compile(r"(?:개인정보|민감정보)\s*[:=：]?\s*([^\n]+)"),
        re.compile(r"(?:식별정보)\s*[:=：]?\s*([^\n]+)"),
    ]
    for pattern in label_patterns:
        detections.extend(_iter_pattern_matches(pattern, text, "PII", score=0.4))
    return detections


def detect_regex_pii(text: str):
    detections = []
    for detector in (
        detect_email,
        detect_phone,
        detect_rrn,
        detect_card,
        detect_name,
        detect_address,
        detect_secret,
        detect_url,
        detect_date,
        detect_generic_pii,
    ):
        detections.extend(detector(text))
    return detections


def _detection_priority(detection):
    type_priority = TYPE_PRIORITY.get(detection["type"], 1)
    source_priority = SOURCE_PRIORITY.get(detection.get("source", "regex"), 0)
    span_length = detection["end"] - detection["start"]
    score = detection.get("score", 0)
    return (type_priority, source_priority, span_length, score)


def remove_overlaps(detections):
    if not detections:
        return []

    sorted_detections = sorted(
        detections,
        key=lambda item: (
            item["start"],
            item["end"],
            -_detection_priority(item)[0],
            -_detection_priority(item)[1],
            -_detection_priority(item)[2],
            -_detection_priority(item)[3],
        ),
    )

    grouped = []
    current_group = [sorted_detections[0]]
    current_end = sorted_detections[0]["end"]

    for detection in sorted_detections[1:]:
        if detection["start"] < current_end:
            current_group.append(detection)
            current_end = max(current_end, detection["end"])
        else:
            grouped.append(current_group)
            current_group = [detection]
            current_end = detection["end"]
    grouped.append(current_group)

    resolved = []
    for group in grouped:
        best = max(
            group,
            key=lambda item: (
                _detection_priority(item)[0],
                _detection_priority(item)[1],
                _detection_priority(item)[2],
                _detection_priority(item)[3],
                -item["start"],
            ),
        )
        resolved.append(best)

    return sorted(resolved, key=lambda item: (item["start"], item["end"]))


def mask_text(text: str, detections):
    if not text or not detections:
        return text

    masked = text
    for detection in sorted(detections, key=lambda item: item["start"], reverse=True):
        token = TOKEN_MAP.get(detection["type"], TOKEN_MAP["PII"])
        masked = masked[: detection["start"]] + token + masked[detection["end"] :]
    return masked


def _unique_types_in_order(detections):
    seen = set()
    ordered = []
    for detection in detections:
        detection_type = detection["type"]
        if detection_type not in seen:
            seen.add(detection_type)
            ordered.append(detection_type)
    return ordered


def _calculate_risk_level(detected_types):
    if not detected_types:
        return "NONE"

    detected_set = set(detected_types)

    if {"RRN", "CARD", "SECRET"} & detected_set:
        return "CRITICAL"

    if len(detected_set) >= 3:
        return "HIGH"

    if {"NAME", "PHONE"} <= detected_set:
        return "HIGH"

    if {"NAME", "EMAIL"} <= detected_set:
        return "HIGH"

    if {"PHONE", "EMAIL"} <= detected_set:
        return "HIGH"

    if {"NAME", "ADDRESS"} <= detected_set:
        return "HIGH"

    if detected_set <= {"NAME", "ADDRESS"}:
        return "LOW"

    if detected_set & {"PHONE", "EMAIL"}:
        return "MEDIUM"

    if detected_set & {"NAME", "ADDRESS"}:
        return "LOW"

    return "LOW"


def _load_openai_privacy_filter(text: str):
    if not run_openai_privacy_filter:
        return None, None

    try:
        result = run_openai_privacy_filter(text)
        if isinstance(result, dict):
            return result, None
        return {"detections": []}, None
    except Exception as exc:
        return None, exc


def _normalize_opf_detections(opf_result):
    if not isinstance(opf_result, dict):
        return []

    spans = opf_result.get("detected_spans")
    if spans is None:
        spans = opf_result.get("detections")
    if spans is None:
        spans = opf_result.get("spans")
    if spans is None:
        spans = opf_result.get("entities")
    if spans is None:
        spans = opf_result.get("results")
    if spans is None:
        spans = opf_result.get("items")
    if spans is None:
        spans = opf_result.get("predictions")
    if spans is None:
        spans = opf_result.get("redactions")
    if spans is None:
        spans = opf_result.get("matches")

    normalized = []
    if not spans:
        return normalized

    for span in spans:
        if isinstance(span, dict):
            span_type = (
                span.get("type")
                or span.get("label")
                or span.get("entity")
                or span.get("name")
                or span.get("tag")
                or "PII"
            )
            span_value = span.get("value") or span.get("text") or span.get("span") or ""
            start = span.get("start")
            end = span.get("end")
            if start is None and isinstance(span.get("offset"), int):
                start = span["offset"]
            if end is None and isinstance(span.get("length"), int) and start is not None:
                end = start + span["length"]
            if start is None or end is None:
                continue
            normalized.append(
                make_detection(
                    str(span_type).upper(),
                    str(span_value),
                    int(start),
                    int(end),
                    score=float(span.get("score", 1.0)),
                    source="openai_privacy_filter",
                )
            )
        elif isinstance(span, (list, tuple)) and len(span) >= 3:
            start, end, span_type = span[:3]
            value = span[3] if len(span) > 3 else ""
            normalized.append(
                make_detection(
                    str(span_type).upper(),
                    str(value),
                    int(start),
                    int(end),
                    source="openai_privacy_filter",
                )
            )
    return normalized


def refine_detection_type_by_context(text: str, detection: dict) -> dict:
    refined = dict(detection)
    if refined.get("type") != "ACCOUNT":
        return refined

    start = int(refined.get("start", 0))
    prefix = text[max(0, start - 24) : start]
    lowered_prefix = prefix.lower()

    secret_keywords = ("비밀번호", "비번", "패스워드", "password", "pw")
    phone_keywords = ("전화", "전화번호", "연락처", "휴대폰", "핸드폰", "번호")

    if any(keyword in lowered_prefix for keyword in secret_keywords):
        refined["type"] = "SECRET"
        return refined

    if any(keyword in prefix for keyword in phone_keywords):
        refined["type"] = "PHONE"
        return refined

    return refined


def process_pii(text: str, use_openai_privacy_filter=True):
    original_text = text or ""
    regex_detections = detect_regex_pii(original_text)
    opf_detections = []
    filter_engine = "regex_fallback"

    if use_openai_privacy_filter:
        opf_result, opf_error = _load_openai_privacy_filter(original_text)
        if opf_result is not None:
            opf_detections = _normalize_opf_detections(opf_result)
            filter_engine = "openai_privacy_filter+regex_hybrid"
        elif opf_error is not None:
            filter_engine = "regex_fallback"

    refined_detections = [
        refine_detection_type_by_context(original_text, detection)
        for detection in (opf_detections + regex_detections)
    ]
    combined_detections = remove_overlaps(refined_detections)
    masked_text = mask_text(original_text, combined_detections)
    detected_pii = _unique_types_in_order(combined_detections)
    risk_level = _calculate_risk_level(detected_pii)

    return {
        "original_text": original_text,
        "masked_text": masked_text,
        "detected_pii": detected_pii,
        "risk_level": risk_level,
        "detections": combined_detections,
        "filter_engine": filter_engine,
    }
