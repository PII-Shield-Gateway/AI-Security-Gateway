from __future__ import annotations

from datetime import datetime, timezone

from .pii import calculate_risk_level, detect_pii, mask_text


def process_text(text: str, external_client) -> dict:
    findings = detect_pii(text)
    masked = mask_text(text, findings)
    risk_level = calculate_risk_level(findings)
    external_result = external_client.call(masked)

    return {
        "success": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "original_text": text,
        "masked_text": masked,
        "detected_pii": [
            {
                "type": item.pii_type,
                "value": item.value,
                "start": item.start,
                "end": item.end,
                "source": item.source,
            }
            for item in findings
        ],
        "risk_level": risk_level,
        "masked": bool(findings),
        "external_api": external_result,
    }
