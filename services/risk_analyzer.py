from __future__ import annotations


HIGH_RISK_TYPES = {"RRN", "CARD", "SECRET"}
MEDIUM_TYPES = {"EMAIL", "PHONE"}
LOW_TYPES = {"NAME", "ADDRESS"}


def calculate_risk(detected_types: list[str]) -> str:
    if not detected_types:
        return "NONE"

    detected_set = {item.upper() for item in detected_types if item}

    if not detected_set:
        return "NONE"

    if HIGH_RISK_TYPES & detected_set:
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

    if detected_set & MEDIUM_TYPES:
        return "MEDIUM"

    if detected_set & LOW_TYPES:
        return "LOW"

    return "LOW"

