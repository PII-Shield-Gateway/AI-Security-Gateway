import "./src/main.jsx";

let currentResult = null;
let currentMaskedText = "";
let maskedTransferStatus = "PENDING";

function getMaskedText(data) {
  return (
    data?.masked_text ||
    data?.maskedText ||
    data?.filtered_text ||
    data?.sanitized_text ||
    data?.masked ||
    ""
  );
}

function updateSendExternalButtonState({ disabled, text }) {
  const sendExternalBtn = document.getElementById("sendExternalBtn");

  if (!sendExternalBtn) {
    return;
  }

  sendExternalBtn.disabled = disabled;
  sendExternalBtn.textContent = text;

  if (disabled) {
    sendExternalBtn.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    sendExternalBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

function updateSecurityLog() {
  const bridge = window.dashboardBridge;
  const state = bridge?.getState?.() ?? {};
  const securityLog = document.getElementById("securityLog");
  const originalTransferStatus = document.getElementById("originalTransferStatus");
  const maskedTransferStatusNode = document.getElementById("maskedTransferStatus");
  const externalResponse = document.getElementById("externalResponse");

  const responseText =
    currentResult?.external_api_response ||
    state.externalApiResponse ||
    "외부 AI API 응답은 비식별화된 자료가 전송된 뒤에 표시됩니다.";
  const timestamp = state.timestamp || "측정 예정";
  const detectedPii = Array.isArray(state.detectedPii) ? state.detectedPii : [];
  const riskLevel = state.riskLevel || "NONE";

  if (originalTransferStatus) {
    originalTransferStatus.textContent = "BLOCKED";
  }

  if (maskedTransferStatusNode) {
    maskedTransferStatusNode.textContent = maskedTransferStatus;
  }

  if (externalResponse) {
    externalResponse.textContent = responseText;
  }

  if (securityLog) {
    securityLog.dataset.transferStatus = maskedTransferStatus;
    securityLog.dataset.timestamp = timestamp;
    securityLog.dataset.detectedPii = detectedPii.join(", ") || "없음";
    securityLog.dataset.riskLevel = riskLevel;
  }
}

function sendToExternalAI() {
  console.log("External AI transfer button clicked");
  console.log("currentResult:", currentResult);
  console.log("currentMaskedText:", currentMaskedText);

  if (!currentMaskedText) {
    window.alert("마스킹 결과가 있을 때만 전송할 수 있습니다.");
    return;
  }

  maskedTransferStatus = "SENT";

  const responseMessage = "외부 AI API에는 비식별화된 자료만 전송되었습니다.";

  const externalResponse = document.getElementById("externalResponse");
  if (externalResponse) {
    externalResponse.textContent = responseMessage;
  }

  const maskedStatus = document.getElementById("maskedTransferStatus");
  if (maskedStatus) {
    maskedStatus.textContent = "SENT";
  }

  const originalStatus = document.getElementById("originalTransferStatus");
  if (originalStatus) {
    originalStatus.textContent = "BLOCKED";
  }

  if (currentResult) {
    currentResult.external_api_response = responseMessage;
  }

  const bridge = window.dashboardBridge;
  bridge?.sendToExternalAIAction?.();
  updateSecurityLog?.();

  updateSendExternalButtonState({
    disabled: true,
    text: "전송 완료",
  });

  console.log("Masked transfer status:", maskedTransferStatus);
}

function renderResult(data) {
  currentResult = data;
  currentMaskedText = getMaskedText(data);
  maskedTransferStatus = currentMaskedText ? "READY" : "PENDING";

  const maskedTextElement = document.getElementById("maskedText");
  if (maskedTextElement) {
    maskedTextElement.textContent =
      currentMaskedText || "보안 검사 실행 후 비식별화된 자료가 표시됩니다.";
  }

  const sendExternalBtn = document.getElementById("sendExternalBtn");
  if (sendExternalBtn) {
    if (currentMaskedText && data?.risk_level !== "CRITICAL") {
      sendExternalBtn.disabled = false;
      sendExternalBtn.textContent = "외부 AI로 안전 전송";
      sendExternalBtn.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      sendExternalBtn.disabled = true;
      sendExternalBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  }

  if ((data?.risk_level || "NONE") === "CRITICAL") {
    updateSendExternalButtonState({
      disabled: true,
      text: "위험도 높음",
    });

    const bridge = window.dashboardBridge;
    bridge?.showCriticalWarning?.(
      "CRITICAL 위험도 자료는 외부 AI로 전송할 수 없습니다."
    );
  }

  console.log("Rendered result:", data);
  console.log("Current masked text:", currentMaskedText);
  console.log("Masked transfer status:", maskedTransferStatus);
  updateSecurityLog();
}

function resetDashboard() {
  currentResult = null;
  currentMaskedText = "";
  maskedTransferStatus = "PENDING";
  console.log("Masked transfer status:", maskedTransferStatus);

  updateSendExternalButtonState({
    disabled: true,
    text: "외부 AI로 안전 전송",
  });

  updateSecurityLog();
}

function bindExternalTransferButton() {
  const sendExternalBtn = document.getElementById("sendExternalBtn");

  if (!sendExternalBtn || sendExternalBtn.dataset.bound === "true") {
    return false;
  }

  sendExternalBtn.addEventListener("click", sendToExternalAI);
  sendExternalBtn.dataset.bound = "true";
  console.log("External AI transfer button event bound");
  return true;
}

function watchForExternalButton() {
  if (bindExternalTransferButton()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (bindExternalTransferButton()) {
      observer.disconnect();
      updateSendExternalButtonState({
        disabled: true,
        text: "외부 AI로 안전 전송",
      });
      updateSecurityLog();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

window.dashboardState = {
  renderResult,
  resetDashboard,
  updateSecurityLog,
  getCurrentResult: () => currentResult,
  getCurrentMaskedText: () => currentMaskedText,
  getMaskedTransferStatus: () => maskedTransferStatus,
};

window.sendToExternalAI = sendToExternalAI;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard script loaded");

  const sendExternalBtn = document.getElementById("sendExternalBtn");

  if (sendExternalBtn) {
    sendExternalBtn.addEventListener("click", sendToExternalAI);
    sendExternalBtn.dataset.bound = "true";
    console.log("External AI transfer button event bound");
  } else {
    watchForExternalButton();
  }

  updateSendExternalButtonState({
    disabled: true,
    text: "외부 AI로 안전 전송",
  });
  updateSecurityLog();
});
