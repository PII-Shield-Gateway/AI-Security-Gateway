from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..services.external_api import ExternalApiError
from ..services.gateway_service import process_text
from ..services.logging_service import log_gateway_event

gateway_blueprint = Blueprint("gateway", __name__, url_prefix="/gateway")


def _get_external_client():
    return current_app.extensions["external_api_client"]


@gateway_blueprint.post("/text")
def gateway_text():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"success": False, "error": "요청 본문은 JSON 이어야 합니다."}), 400

    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"success": False, "error": "`text` 필드는 비어있지 않은 문자열이어야 합니다."}), 400

    try:
        result = process_text(text=text, external_client=_get_external_client())
    except ExternalApiError as error:
        return jsonify({"success": False, "error": str(error)}), 502

    log_gateway_event(current_app, result)
    return jsonify(result), 200


@gateway_blueprint.post("/upload-txt")
def gateway_upload_txt():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "`file` 업로드 파라미터가 필요합니다."}), 400

    uploaded_file = request.files["file"]
    if not uploaded_file.filename:
        return jsonify({"success": False, "error": "파일명이 비어 있습니다."}), 400

    if not uploaded_file.filename.lower().endswith(".txt"):
        return jsonify({"success": False, "error": "TXT 파일만 업로드할 수 있습니다."}), 400

    raw = uploaded_file.read()
    text = None
    for encoding in current_app.config["TXT_DECODE_CANDIDATES"]:
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if text is None:
        return jsonify({"success": False, "error": "지원하지 않는 TXT 인코딩입니다."}), 400

    if not text.strip():
        return jsonify({"success": False, "error": "TXT 파일 내용이 비어 있습니다."}), 400

    try:
        result = process_text(text=text, external_client=_get_external_client())
    except ExternalApiError as error:
        return jsonify({"success": False, "error": str(error)}), 502

    result["source"] = {
        "type": "txt",
        "filename": uploaded_file.filename,
    }
    log_gateway_event(current_app, result)

    return jsonify(result), 200
