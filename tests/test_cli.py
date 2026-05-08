from __future__ import annotations

import json
import sys
from pathlib import Path

import cli


def _patch_argv(monkeypatch, *args):
    monkeypatch.setattr(sys, "argv", ["cli.py", *args])


def test_cli_text_input(monkeypatch, capsys):
    def fake_process_pii(text, use_openai_privacy_filter=True):
        return {
            "original_text": text,
            "masked_text": "masked",
            "detected_pii": ["NAME"],
            "risk_level": "LOW",
            "detections": [],
            "filter_engine": "regex_fallback",
        }

    monkeypatch.setattr(cli, "process_pii", fake_process_pii)
    _patch_argv(monkeypatch, "--text", "hello")

    assert cli.main() == 0
    out = capsys.readouterr().out
    assert '"masked_text": "masked"' in out


def test_cli_file_input(monkeypatch, tmp_path, capsys):
    sample = tmp_path / "sample.txt"
    sample.write_text("file text", encoding="utf-8")

    monkeypatch.setattr(
        cli,
        "process_pii",
        lambda text, use_openai_privacy_filter=True: {
            "original_text": text,
            "masked_text": "masked-file",
            "detected_pii": [],
            "risk_level": "NONE",
            "detections": [],
            "filter_engine": "regex_fallback",
        },
    )
    _patch_argv(monkeypatch, "--file", str(sample))

    assert cli.main() == 0
    out = capsys.readouterr().out
    assert "masked-file" in out


def test_cli_format_text(monkeypatch, capsys):
    monkeypatch.setattr(
        cli,
        "process_pii",
        lambda text, use_openai_privacy_filter=True: {
            "original_text": text,
            "masked_text": "masked-text",
            "detected_pii": [],
            "risk_level": "NONE",
            "detections": [],
            "filter_engine": "regex_fallback",
        },
    )
    _patch_argv(monkeypatch, "--text", "hello", "--format", "text")

    assert cli.main() == 0
    assert capsys.readouterr().out.strip() == "masked-text"


def test_cli_no_privacy_filter(monkeypatch):
    captured = {}

    def fake_process_pii(text, use_openai_privacy_filter=True):
        captured["use_openai_privacy_filter"] = use_openai_privacy_filter
        return {
            "original_text": text,
            "masked_text": text,
            "detected_pii": [],
            "risk_level": "NONE",
            "detections": [],
            "filter_engine": "regex_fallback",
        }

    monkeypatch.setattr(cli, "process_pii", fake_process_pii)
    _patch_argv(monkeypatch, "--text", "hello", "--no-privacy-filter")

    assert cli.main() == 0
    assert captured["use_openai_privacy_filter"] is False


def test_cli_save_txt(monkeypatch):
    captured = {}

    def fake_process_pii(text, use_openai_privacy_filter=True):
        return {
            "original_text": text,
            "masked_text": "masked",
            "detected_pii": [],
            "risk_level": "NONE",
            "detections": [],
            "filter_engine": "regex_fallback",
        }

    def fake_save(result, output_format):
        captured["output_format"] = output_format
        return {"format": output_format, "saved_file": f"outputs/filtered/test.{output_format}"}

    monkeypatch.setattr(cli, "process_pii", fake_process_pii)
    monkeypatch.setattr(cli, "save_filtered_output", fake_save)
    _patch_argv(monkeypatch, "--text", "hello", "--save", "--output-format", "txt")

    assert cli.main() == 0
    assert captured["output_format"] == "txt"


def test_cli_save_json(monkeypatch):
    captured = {}

    monkeypatch.setattr(
        cli,
        "process_pii",
        lambda text, use_openai_privacy_filter=True: {
            "original_text": text,
            "masked_text": "masked",
            "detected_pii": [],
            "risk_level": "NONE",
            "detections": [],
            "filter_engine": "regex_fallback",
        },
    )

    def fake_save(result, output_format):
        captured["output_format"] = output_format
        return {"format": output_format, "saved_file": f"outputs/filtered/test.{output_format}"}

    monkeypatch.setattr(cli, "save_filtered_output", fake_save)
    _patch_argv(monkeypatch, "--text", "hello", "--save", "--output-format", "json")

    assert cli.main() == 0
    assert captured["output_format"] == "json"

