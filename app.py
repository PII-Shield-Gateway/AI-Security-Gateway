from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request

from services.pii_detector import process_pii
from services.file_storage import save_filtered_output


PROJECT_ROOT = Path(__file__).resolve().parent
LOG_DIR = PROJECT_ROOT / "outputs" / "logs"
LOG_FILE = LOG_DIR / "gateway.log"


app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False


def parse_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "no", "n", "off"}:
        return False
    return default


def normalize_output_format(value):
    output_format = str(value or "txt").strip().lower()
    if output_format not in {"txt", "json"}:
        raise ValueError("output_format must be 'txt' or 'json'")
    return output_format


def call_external_api(masked_text: str) -> str:
    _ = masked_text
    return "외부 AI API에는 비식별화된 자료만 전송되었습니다."


def save_log(result: dict, external_api_response: str) -> bool:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "filter_engine": result.get("filter_engine"),
        "risk_level": result.get("risk_level"),
        "detected_pii": result.get("detected_pii", []),
        "gateway_status": "MASKED",
        "external_api_response": external_api_response,
    }
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return True


def process_gateway_text(text: str, save=False, output_format="txt"):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("자료를 입력하세요.")

    pii_result = process_pii(text, use_openai_privacy_filter=True)
    external_api_response = call_external_api(pii_result["masked_text"])
    log_saved = save_log(pii_result, external_api_response)
    saved_file = save_filtered_output(pii_result, output_format) if save else None

    return {
        "original_text": pii_result["original_text"],
        "masked_text": pii_result["masked_text"],
        "detected_pii": pii_result["detected_pii"],
        "risk_level": pii_result["risk_level"],
        "detections": pii_result["detections"],
        "filter_engine": pii_result["filter_engine"],
        "external_api_response": external_api_response,
        "log_saved": log_saved,
        "saved_file": saved_file,
    }


def extract_request_options(source):
    save = parse_bool(source.get("save", False))
    output_format = normalize_output_format(source.get("output_format", "txt"))
    return save, output_format


@app.get("/")
def index():
    return jsonify(
        {
            "message": "AI Security Gateway API",
            "status": "running",
        }
    )


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/gateway/text")
def gateway_text():
    payload = request.get_json(silent=True) or {}
    try:
        text = payload.get("text", "")
        save, output_format = extract_request_options(payload)
        response = process_gateway_text(text, save=save, output_format=output_format)
        return jsonify(response), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        return (
            jsonify(
                {
                    "error": "보안 검사 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요.",
                }
            ),
            500,
        )


@app.post("/gateway/file")
def gateway_file():
    try:
        uploaded_file = request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            return jsonify({"error": "파일을 업로드하세요."}), 400

        if not uploaded_file.filename.lower().endswith(".txt"):
            return jsonify({"error": "TXT 파일만 업로드할 수 있습니다."}), 400

        form_data = request.form.to_dict(flat=True)
        save, output_format = extract_request_options(form_data)

        text = uploaded_file.read().decode("utf-8", errors="replace")
        response = process_gateway_text(text, save=save, output_format=output_format)
        return jsonify(response), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        return (
            jsonify(
                {
                    "error": "보안 검사 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요.",
                }
            ),
            500,
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
