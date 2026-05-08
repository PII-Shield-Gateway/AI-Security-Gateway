from __future__ import annotations

import services.pii_detector as pii_detector


def test_process_pii_with_no_pii():
    result = pii_detector.process_pii("hello world", use_openai_privacy_filter=False)

    assert result["original_text"] == "hello world"
    assert result["masked_text"] == "hello world"
    assert result["detected_pii"] == []
    assert result["risk_level"] == "NONE"
    assert result["detections"] == []
    assert result["filter_engine"] == "regex_fallback"


def test_detect_email():
    result = pii_detector.process_pii("이메일은 test@gmail.com입니다", use_openai_privacy_filter=False)

    assert result["masked_text"] == "이메일은 [EMAIL]입니다"
    assert result["detected_pii"] == ["EMAIL"]
    assert result["risk_level"] == "MEDIUM"


def test_detect_phone():
    result = pii_detector.process_pii("번호 : 010-1234-5678이고 연락주세요", use_openai_privacy_filter=False)

    assert result["masked_text"] == "번호 : [PHONE]이고 연락주세요"
    assert result["detected_pii"] == ["PHONE"]
    assert result["risk_level"] == "MEDIUM"


def test_detect_name_and_phone():
    text = "이름 : 이하은\n번호 : 010-3313-0478"
    result = pii_detector.process_pii(text, use_openai_privacy_filter=False)

    assert result["masked_text"] == "이름 : [NAME]\n번호 : [PHONE]"
    assert result["detected_pii"] == ["NAME", "PHONE"]
    assert result["risk_level"] == "HIGH"


def test_detect_rrn_and_card_are_critical():
    rrn_result = pii_detector.process_pii("주민등록번호 : 990101-1234567", use_openai_privacy_filter=False)
    card_result = pii_detector.process_pii("카드번호 : 1234-5678-9012-3456", use_openai_privacy_filter=False)

    assert rrn_result["masked_text"] == "주민등록번호 : [RRN]"
    assert rrn_result["risk_level"] == "CRITICAL"
    assert "RRN" in rrn_result["detected_pii"]

    assert card_result["masked_text"] == "카드번호 : [CARD]"
    assert card_result["risk_level"] == "CRITICAL"
    assert "CARD" in card_result["detected_pii"]


def test_detect_address():
    result = pii_detector.process_pii("주소: 서울시 강남구 역삼동", use_openai_privacy_filter=False)

    assert result["masked_text"] == "주소: [ADDRESS]"
    assert result["detected_pii"] == ["ADDRESS"]
    assert result["risk_level"] == "LOW"


def test_detect_secret():
    result = pii_detector.process_pii("비밀번호 : 0478", use_openai_privacy_filter=False)

    assert result["masked_text"] == "비밀번호 : [SECRET]"
    assert result["detected_pii"] == ["SECRET"]
    assert result["risk_level"] == "CRITICAL"


def test_detect_secret_assignment_values_only():
    text = (
        'const apiKey = "sk-test-1234567890abcdef";\n'
        'const password = "admin1234";\n'
        'const userEmail = "developer@company.com";\n'
        'const phone = "010-3313-0478";'
    )
    result = pii_detector.process_pii(text, use_openai_privacy_filter=False)

    assert result["masked_text"] == (
        'const apiKey = "[SECRET]";\n'
        'const password = "[SECRET]";\n'
        'const userEmail = "[EMAIL]";\n'
        'const phone = "[PHONE]";'
    )
    assert "SECRET" in result["detected_pii"]
    assert "EMAIL" in result["detected_pii"]
    assert "PHONE" in result["detected_pii"]


def test_hybrid_merges_opf_and_regex(monkeypatch):
    def fake_opf(text):
        return {
            "detected_spans": [
                {"type": "ACCOUNT", "value": "010-3313-0478", "start": 14, "end": 27, "score": 1.0},
                {"type": "ACCOUNT", "value": "0478", "start": 35, "end": 39, "score": 1.0},
            ]
        }

    monkeypatch.setattr(pii_detector, "run_openai_privacy_filter", fake_opf)

    result = pii_detector.process_pii(
        "이름 : 이하은\n번호 : 010-3313-0478\n비밀번호 : 0478",
        use_openai_privacy_filter=True,
    )

    assert result["filter_engine"] == "openai_privacy_filter+regex_hybrid"
    assert result["masked_text"] == "이름 : [NAME]\n번호 : [PHONE]\n비밀번호 : [SECRET]"
    assert result["detected_pii"] == ["NAME", "PHONE", "SECRET"]


def test_sample_document_masks_expected_types():
    text = (
        "이름 : 이하은\n"
        "나이 : 만 22세\n"
        "번호 : 010-3313-0478\n"
        "비밀번호 : 0478"
    )
    result = pii_detector.process_pii(text, use_openai_privacy_filter=False)

    assert result["masked_text"] == (
        "이름 : [NAME]\n"
        "나이 : 만 22세\n"
        "번호 : [PHONE]\n"
        "비밀번호 : [SECRET]"
    )
    assert result["detected_pii"] == ["NAME", "PHONE", "SECRET"]
    assert result["risk_level"] == "CRITICAL"

