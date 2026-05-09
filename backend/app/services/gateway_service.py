from __future__ import annotations

import json
from datetime import datetime, timezone

from .pii import calculate_risk_level, detect_pii, mask_text


def process_text(text: str, external_client) -> dict:
    findings = detect_pii(text)
    masked = mask_text(text, findings)
    risk_level = calculate_risk_level(findings)
    external_result = external_client.call(masked)
    detections = [
        {
            "type": item.pii_type,
            "value": item.value,
            "start": item.start,
            "end": item.end,
            "source": item.source,
        }
        for item in findings
    ]

    return {
        "success": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "original_text": text,
        "masked_text": masked,
        "detections": detections,
        "detected_pii": sorted({item["type"] for item in detections}),
        "risk_level": risk_level,
        "masked": bool(findings),
        "filter_engine": "REGEX",
        "external_api_response": _format_external_response(external_result.get("response")),
        "external_api": external_result,
    }


def _format_external_response(response: object) -> str:
    if isinstance(response, (dict, list)):
        return json.dumps(response, ensure_ascii=False)
    return str(response)
