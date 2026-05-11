import "./src/main.jsx";

let currentResult = null;
let currentMaskedText = "";
let maskedTransferStatus = "PENDING";
let transferNoticeTimer = null;

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

  sendExternalBtn.style.backgroundColor = "";
  sendExternalBtn.style.borderColor = "";
  sendExternalBtn.style.color = "";

  if (disabled) {
    sendExternalBtn.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    sendExternalBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

function getOrCreateExternalResponseElement() {
  const existing = document.getElementById("externalResponse");

  if (existing) {
    return existing;
  }

  const securityLog = document.getElementById("securityLog");
  if (!securityLog) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className =
    "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10";

  const label = document.createElement("p");
  label.className = "text-sm font-medium text-emerald-700 dark:text-emerald-300";
  label.textContent = "외부 AI 응답";

  const value = document.createElement("div");
  value.id = "externalResponse";
  value.className =
    "mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300";
  value.textContent = "외부 AI API 응답은 비식별화된 자료가 전송된 뒤에 표시됩니다.";

  wrapper.append(label, value);
  securityLog.appendChild(wrapper);

  return value;
}

function getOrCreateTransferBadge() {
  const sendExternalBtn = document.getElementById("sendExternalBtn");
  if (!sendExternalBtn) {
    return null;
  }

  const existing = document.getElementById("externalTransferCompleteBadge");
  if (existing) {
    return existing;
  }

  const badge = document.createElement("span");
  badge.id = "externalTransferCompleteBadge";
  badge.className =
    "hidden rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300";
  badge.textContent = "비식별화 자료 전송 완료";

  sendExternalBtn.insertAdjacentElement("afterend", badge);

  return badge;
}

function applyStatusBadgeStyle(element, status) {
  if (!element) {
    return;
  }

  const baseClass =
    "mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1";
  const toneClass =
    status === "SENT"
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
      : status === "BLOCKED"
        ? "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300"
      : status === "READY"
        ? "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300"
        : "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300";

  element.className = `${baseClass} ${toneClass}`;
}

function updateExternalTransferLog(responseMessage) {
  const securityLog = document.getElementById("securityLog");
  if (!securityLog) {
    return;
  }

  let detailLog = document.getElementById("externalTransferDetailLog");
  if (!detailLog) {
    detailLog = document.createElement("div");
    detailLog.id = "externalTransferDetailLog";
    detailLog.className =
      "mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm ring-1 ring-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100";
    securityLog.appendChild(detailLog);
  }

  const detectedPii = Array.isArray(currentResult?.detected_pii)
    ? currentResult.detected_pii.join(", ") || "없음"
    : "없음";
  const riskLevel = currentResult?.risk_level || "NONE";
  const processedAt = new Date().toLocaleString("ko-KR");

  detailLog.innerHTML = "";

  const title = document.createElement("div");
  title.className = "font-semibold";
  title.textContent = "외부 전송 처리 로그";

  const rows = document.createElement("dl");
  rows.className = "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[9rem_1fr]";

  [
    ["처리 시각", processedAt],
    ["original_text", "BLOCKED"],
    ["masked_text", maskedTransferStatus],
    ["risk_level", riskLevel],
    ["detected_pii", detectedPii],
    ["external_api_response", responseMessage],
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.className = "font-semibold text-emerald-700 dark:text-emerald-300";
    dt.textContent = label;

    const dd = document.createElement("dd");
    dd.className = "break-words text-slate-800 dark:text-slate-100";
    dd.textContent = value;

    rows.append(dt, dd);
  });

  detailLog.append(title, rows);
}

function showTransferCompleteNotice() {
  const host =
    document.getElementById("transferNotificationHost") || document.body;
  let notice = document.getElementById("transferCompleteNotice");

  if (!notice) {
    notice = document.createElement("div");
    notice.id = "transferCompleteNotice";
    notice.className =
      "fixed right-4 top-4 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-500/30";
    host.appendChild(notice);
  }

  notice.textContent =
    "비식별화된 자료가 외부 AI API로 안전하게 전송되었습니다.";
  notice.classList.remove("hidden");

  if (transferNoticeTimer) {
    window.clearTimeout(transferNoticeTimer);
  }

  transferNoticeTimer = window.setTimeout(() => {
    notice.classList.add("hidden");
  }, 3000);
}

function updateTransferStatusUI() {
  const originalStatus = document.getElementById("originalTransferStatus");
  const maskedStatus = document.getElementById("maskedTransferStatus");
  const externalResponse = getOrCreateExternalResponseElement();
  const sendExternalBtn = document.getElementById("sendExternalBtn");
  const completeBadge = getOrCreateTransferBadge();
  const responseMessage =
    currentResult?.external_api_response ||
    "외부 AI API 응답은 비식별화된 자료가 전송된 뒤에 표시됩니다.";

  if (originalStatus) {
    originalStatus.textContent = "BLOCKED";
    applyStatusBadgeStyle(originalStatus, "BLOCKED");
  }

  if (maskedStatus) {
    maskedStatus.textContent = maskedTransferStatus;
    applyStatusBadgeStyle(maskedStatus, maskedTransferStatus);
  }

  if (externalResponse) {
    externalResponse.textContent = responseMessage;
  }

  if (sendExternalBtn) {
    if (maskedTransferStatus === "SENT") {
      sendExternalBtn.disabled = true;
      sendExternalBtn.textContent = "전송 완료";
      sendExternalBtn.classList.add("cursor-not-allowed");
      sendExternalBtn.classList.remove("opacity-50");
      sendExternalBtn.style.backgroundColor = "#059669";
      sendExternalBtn.style.borderColor = "#047857";
      sendExternalBtn.style.color = "#ffffff";
    } else if (currentMaskedText && currentResult?.risk_level !== "CRITICAL") {
      sendExternalBtn.disabled = false;
      sendExternalBtn.textContent = "외부 AI로 안전 전송";
      sendExternalBtn.classList.remove("opacity-50", "cursor-not-allowed");
      sendExternalBtn.style.backgroundColor = "";
      sendExternalBtn.style.borderColor = "";
      sendExternalBtn.style.color = "";
    } else if (currentResult?.risk_level === "CRITICAL") {
      sendExternalBtn.disabled = true;
      sendExternalBtn.textContent = "위험도 높음";
      sendExternalBtn.classList.add("opacity-50", "cursor-not-allowed");
      sendExternalBtn.style.backgroundColor = "";
      sendExternalBtn.style.borderColor = "";
      sendExternalBtn.style.color = "";
    } else {
      sendExternalBtn.disabled = true;
      sendExternalBtn.textContent = "외부 AI로 안전 전송";
      sendExternalBtn.classList.add("opacity-50", "cursor-not-allowed");
      sendExternalBtn.style.backgroundColor = "";
      sendExternalBtn.style.borderColor = "";
      sendExternalBtn.style.color = "";
    }
  }

  if (completeBadge) {
    completeBadge.classList.toggle("hidden", maskedTransferStatus !== "SENT");
  }
}

function updateSecurityLog() {
  const bridge = window.dashboardBridge;
  const state = bridge?.getState?.() ?? {};
  const securityLog = document.getElementById("securityLog");
  const originalTransferStatus = document.getElementById("originalTransferStatus");
  const maskedTransferStatusNode = document.getElementById("maskedTransferStatus");
  const externalResponse = getOrCreateExternalResponseElement();

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
  updateExternalTransferLog(responseMessage);
  updateTransferStatusUI();
  showTransferCompleteNotice();
  window.setTimeout(updateTransferStatusUI, 0);
  window.setTimeout(updateTransferStatusUI, 50);

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

  updateTransferStatusUI();

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
  updateTransferStatusUI();
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

  const completeBadge = document.getElementById("externalTransferCompleteBadge");
  if (completeBadge) {
    completeBadge.classList.add("hidden");
  }

  const detailLog = document.getElementById("externalTransferDetailLog");
  if (detailLog) {
    detailLog.remove();
  }

  const notice = document.getElementById("transferCompleteNotice");
  if (notice) {
    notice.classList.add("hidden");
  }

  updateSecurityLog();
  updateTransferStatusUI();
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
      updateTransferStatusUI();
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
  updateTransferStatusUI,
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
  updateTransferStatusUI();
});
