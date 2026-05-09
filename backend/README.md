# AI Security Gateway Backend

Flask 기반 게이트웨이 서버입니다.  
`/gateway/text` 또는 `/gateway/upload-txt`로 입력을 받아 PII 탐지/마스킹 후 외부 API로 전달하고 결과를 반환합니다.

## 1. 설치

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. 실행

```bash
cd backend
python run.py
```

기본 주소: `http://localhost:5000`

## 3. 환경 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `EXTERNAL_API_MODE` | `http` | `http`만 지원 |
| `EXTERNAL_API_URL` | (필수) | 외부 API 호출 대상 URL |
| `EXTERNAL_API_TIMEOUT` | `10` | 외부 API 타임아웃(초) |
| `LOG_DIR` | `backend\logs` | 로그 저장 디렉터리 |

## 4. API

### POST `/gateway/text`

입력(JSON):

```json
{
  "text": "홍길동 전화번호는 010-1234-5678, 이메일은 test@example.com 입니다."
}
```

응답 예시:

```json
{
  "success": true,
  "timestamp": "2026-05-08T10:00:00+00:00",
  "original_text": "홍길동 전화번호는 010-1234-5678, 이메일은 test@example.com 입니다.",
  "masked_text": "[NAME] 전화번호는 [PHONE], 이메일은 [EMAIL] 입니다.",
  "detections": [
    {
      "type": "NAME",
      "value": "홍길동",
      "start": 0,
      "end": 3,
      "source": "regex-name"
    }
  ],
  "detected_pii": [
    "NAME",
    "PHONE",
    "EMAIL"
  ],
  "risk_level": "HIGH",
  "masked": true,
  "filter_engine": "REGEX",
  "external_api_response": "{\"result\":\"processed\"}",
  "log_saved": true,
  "saved_file": {
    "saved_file": "C:\\AI-Security-Gateway\\backend\\logs\\gateway.log"
  },
  "external_api": {
    "provider": "configured-http",
    "status_code": 200,
    "request_text": "[NAME] 전화번호는 [PHONE], 이메일은 [EMAIL] 입니다.",
    "response": {
      "result": "processed"
    }
  }
}
```

### POST `/gateway/upload-txt`

`multipart/form-data`로 `file` 파라미터에 `.txt` 파일 업로드:

```bash
curl -X POST http://localhost:5000/gateway/upload-txt ^
  -F "file=@sample.txt"
```

## 5. 로그

요청 처리 시 `backend\logs\gateway.log`에 JSON line 형태로 기록됩니다.
