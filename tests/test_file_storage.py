from __future__ import annotations

import json

import pytest

import services.file_storage as file_storage


def test_save_filtered_output_txt(monkeypatch, tmp_path):
    monkeypatch.setattr(file_storage, "get_project_root", lambda: tmp_path)

    result = {"masked_text": "masked text", "detected_pii": ["NAME"]}
    saved = file_storage.save_filtered_output(result, "txt")

    assert saved["format"] == "txt"
    saved_path = tmp_path / saved["saved_file"]
    assert saved_path.exists()
    assert saved_path.read_text(encoding="utf-8") == "masked text"


def test_save_filtered_output_json(monkeypatch, tmp_path):
    monkeypatch.setattr(file_storage, "get_project_root", lambda: tmp_path)

    result = {"masked_text": "masked text", "detected_pii": ["NAME"], "risk_level": "LOW"}
    saved = file_storage.save_filtered_output(result, "json")

    assert saved["format"] == "json"
    saved_path = tmp_path / saved["saved_file"]
    assert saved_path.exists()

    data = json.loads(saved_path.read_text(encoding="utf-8"))
    assert data["masked_text"] == "masked text"
    assert data["detected_pii"] == ["NAME"]


def test_save_filtered_output_invalid_format(monkeypatch, tmp_path):
    monkeypatch.setattr(file_storage, "get_project_root", lambda: tmp_path)

    with pytest.raises(ValueError):
        file_storage.save_filtered_output({"masked_text": "masked"}, "xml")

