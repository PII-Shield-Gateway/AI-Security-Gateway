from __future__ import annotations

from dataclasses import dataclass

import requests


class ExternalApiError(Exception):
    pass


@dataclass
class ExternalApiClient:
    config: dict

    def call(self, masked_text: str) -> dict:
        mode = self.config["EXTERNAL_API_MODE"]
        if mode != "http":
            raise ExternalApiError("EXTERNAL_API_MODE는 'http'만 지원합니다.")

        url = self.config["EXTERNAL_API_URL"]
        if not url:
            raise ExternalApiError("EXTERNAL_API_MODE=http 인 경우 EXTERNAL_API_URL이 필요합니다.")

        try:
            response = requests.post(
                url,
                json={"text": masked_text},
                timeout=self.config["EXTERNAL_API_TIMEOUT"],
            )
        except requests.RequestException as error:
            raise ExternalApiError(f"외부 API 호출 실패: {error}") from error

        if response.status_code >= 400:
            raise ExternalApiError(
                f"외부 API 에러(status={response.status_code}): {response.text[:300]}"
            )

        try:
            data = response.json()
        except ValueError:
            data = response.text

        return {
            "provider": "configured-http",
            "status_code": response.status_code,
            "request_text": masked_text,
            "response": data,
        }
