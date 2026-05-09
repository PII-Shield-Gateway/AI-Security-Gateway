from __future__ import annotations

import json
import logging
from logging.handlers import RotatingFileHandler


def init_gateway_logger(app) -> None:
    log_dir = app.config["LOG_DIR"]
    log_file = app.config["LOG_FILE"]
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("gateway.audit")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = RotatingFileHandler(log_file, maxBytes=2_000_000, backupCount=3, encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)

    logger.propagate = False
    app.extensions["gateway_logger"] = logger


def log_gateway_event(app, result: dict) -> None:
    logger = app.extensions["gateway_logger"]
    detections = result.get("detections", [])
    detected_types = []
    for item in detections:
        if isinstance(item, dict) and "type" in item:
            detected_types.append(item["type"])

    if not detected_types:
        for item in result.get("detected_pii", []):
            if isinstance(item, dict) and "type" in item:
                detected_types.append(item["type"])
            elif isinstance(item, str):
                detected_types.append(item)

    event = {
        "timestamp": result.get("timestamp"),
        "detected_pii": detected_types,
        "risk_level": result.get("risk_level"),
        "masked": result.get("masked"),
    }
    logger.info(json.dumps(event, ensure_ascii=False))
