from __future__ import annotations

import os
from pathlib import Path


class Config:
    EXTERNAL_API_MODE = os.getenv("EXTERNAL_API_MODE", "http").lower()
    EXTERNAL_API_URL = os.getenv("EXTERNAL_API_URL", "").strip()
    EXTERNAL_API_TIMEOUT = float(os.getenv("EXTERNAL_API_TIMEOUT", "10"))

    LOG_DIR = Path(os.getenv("LOG_DIR", Path(__file__).resolve().parents[1] / "logs"))
    LOG_FILE = LOG_DIR / "gateway.log"

    TXT_DECODE_CANDIDATES = ["utf-8", "utf-8-sig", "cp949", "euc-kr"]
