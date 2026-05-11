import "./src/main.jsx";

let currentResult = null;
let maskedTransferStatus = "PENDING";

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

  const bridge = window.dashboardBridge;
  const result = currentResult || bridge?.getCurrentResult?.() || null;
  const maskedText = result?.masked_text || "";

  if (!maskedText) {
    window.alert("먼저 보안 검사를 실행하세요.");
    return;
  }

  maskedTransferStatus = "SENT";
  console.log("Masked transfer status:", maskedTransferStatus);

  bridge?.sendToExternalAIAction?.();

  updateSendExternalButtonState({
    disabled: true,
    text: "전송 완료",
  });

  updateSecurityLog();
}

function renderResult(data) {
  currentResult = data;
  maskedTransferStatus = "READY";

  const sendExternalBtn = document.getElementById("sendExternalBtn");
  if (sendExternalBtn) {
    sendExternalBtn.disabled = false;
    sendExternalBtn.textContent = "외부 AI로 안전 전송";
    sendExternalBtn.classList.remove("opacity-50", "cursor-not-allowed");
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

  console.log("Masked transfer status:", maskedTransferStatus);
  updateSecurityLog();
}

function resetDashboard() {
  currentResult = null;
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
