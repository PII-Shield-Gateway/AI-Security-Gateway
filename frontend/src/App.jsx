import { useEffect, useMemo, useState } from "react";
import { filterText } from "./api/gatewayApi";
import Header from "./components/Header";
import SecurityFlow from "./components/SecurityFlow";
import OriginalDocumentPanel from "./components/OriginalDocumentPanel";
import MaskedDocumentPanel from "./components/MaskedDocumentPanel";
import DetectionTable from "./components/DetectionTable";
import SummaryCards from "./components/SummaryCards";
import SecurityLog from "./components/SecurityLog";
import CustomFilterBuilder from "./components/CustomFilterBuilder";
import RestorationPanel from "./components/RestorationPanel";
import ExportPanel from "./components/ExportPanel";
import sampleDocuments from "./data/sampleDocuments";
import { downloadTextFile, makeTimestamp } from "./utils/downloadFile";

const THEME_STORAGE_KEY = "theme";
const INITIAL_EXTERNAL_API_RESPONSE =
  "외부 AI API 응답은 비식별화 자료를 전송한 뒤 표시됩니다.";
const RISK_ORDER = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const DEFAULT_POLICY = {
  mask_name: true,
  mask_phone: true,
  mask_email: true,
  mask_address: true,
  block_rrn: true,
  block_card: true,
};

function getInitialDarkMode() {
  if (typeof window === "undefined") return false;
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark") return true;
  if (storedTheme === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

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

function normalizeType(type = "") {
  return String(type || "CUSTOM")
    .replace(/^\[|\]$/g, "")
    .replace(/_\d+$/g, "")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toUpperCase();
}

function normalizeRisk(riskLevel) {
  const normalized = String(riskLevel || "NONE").toUpperCase();
  return RISK_ORDER.includes(normalized) ? normalized : "NONE";
}

function maxRisk(...riskLevels) {
  return riskLevels.reduce((highest, current) => {
    const next = normalizeRisk(current);
    return RISK_ORDER.indexOf(next) > RISK_ORDER.indexOf(highest) ? next : highest;
  }, "NONE");
}

function normalizeDetection(detection = {}) {
  const type = normalizeType(detection.type || detection.label || detection.pii_type);
  const value = String(detection.value ?? detection.text ?? "");

  return {
    type,
    value,
    start: Number.isFinite(Number(detection.start)) ? Number(detection.start) : "",
    end: Number.isFinite(Number(detection.end)) ? Number(detection.end) : "",
    engine: detection.engine || detection.source || detection.detector || "gateway_detector",
    source: detection.source || detection.engine || detection.detector || "gateway_detector",
    action: detection.action || "MASKED",
    risk_level: normalizeRisk(detection.risk_level || detection.riskLevel || "MEDIUM"),
  };
}

function normalizeResult(data = {}, inputText = "") {
  const detectedPii = Array.isArray(data.detected_pii) ? data.detected_pii : [];
  const detections = Array.isArray(data.detections)
    ? data.detections.map(normalizeDetection)
    : [];
  const timestamp = data.timestamp || new Date().toLocaleString();

  return {
    original_text: data.original_text || inputText || "",
    masked_text: getMaskedText(data),
    detected_pii: detectedPii.map((item) => normalizeType(item)),
    detections,
    risk_level: normalizeRisk(data.risk_level || "NONE"),
    filter_engine: data.filter_engine || "gateway_detector",
    external_api_response:
      data.external_api_response || INITIAL_EXTERNAL_API_RESPONSE,
    timestamp,
    latency_ms: data.latency_ms ?? "측정 예정",
    log_saved: Boolean(data.log_saved),
  };
}

function findAllOccurrences(text, keyword) {
  if (!text || !keyword) return [];
  const positions = [];
  let cursor = 0;

  while (cursor <= text.length) {
    const index = text.indexOf(keyword, cursor);
    if (index === -1) break;
    positions.push({ start: index, end: index + keyword.length });
    cursor = index + Math.max(keyword.length, 1);
  }

  return positions;
}

function buildCustomDetections(text, customFilters) {
  return customFilters.flatMap((filter) => {
    const keywords = filter.keywords.filter(Boolean);
    return keywords.flatMap((keyword) =>
      findAllOccurrences(text, keyword).map((position) => ({
        type: normalizeType(filter.label),
        value: keyword,
        start: position.start,
        end: position.end,
        engine: "custom_user_policy",
        source: "custom_user_policy",
        action: filter.action === "BLOCK" ? "BLOCKED" : "MASKED",
        risk_level: normalizeRisk(filter.risk_level),
        mask_token_base: normalizeType(filter.mask),
      }))
    );
  });
}

function applyCustomMask(maskedText, customFilters) {
  return customFilters.reduce((text, filter) => {
    return filter.keywords.filter(Boolean).reduce((currentText, keyword) => {
      return currentText.split(keyword).join(filter.mask || `[${normalizeType(filter.label)}]`);
    }, text);
  }, maskedText);
}

function makeTokenBase(detection) {
  return normalizeType(detection.mask_token_base || detection.type || "CUSTOM");
}

function buildTokenizedMask(originalText, fallbackMaskedText, detections) {
  const counters = {};
  const tokenMap = {};
  const usableDetections = detections
    .filter((detection) => detection.value)
    .map((detection, index) => ({ ...detection, index }))
    .sort((a, b) => {
      const aStart = Number.isFinite(Number(a.start)) ? Number(a.start) : -1;
      const bStart = Number.isFinite(Number(b.start)) ? Number(b.start) : -1;
      return bStart - aStart || b.value.length - a.value.length;
    });

  let tokenizedText = originalText || fallbackMaskedText || "";
  let positionBased = Boolean(originalText);
  const occupied = [];

  for (const detection of usableDetections) {
    const tokenBase = makeTokenBase(detection);
    counters[tokenBase] = (counters[tokenBase] || 0) + 1;
    const token = `[${tokenBase}_${counters[tokenBase]}]`;
    tokenMap[token] = detection.value;
    detection.mask_token = token;

    const start = Number(detection.start);
    const end = Number(detection.end);
    const validRange =
      positionBased &&
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= 0 &&
      end > start &&
      end <= tokenizedText.length &&
      tokenizedText.slice(start, end) === detection.value &&
      !occupied.some((range) => start < range.end && end > range.start);

    if (validRange) {
      tokenizedText = `${tokenizedText.slice(0, start)}${token}${tokenizedText.slice(end)}`;
      occupied.push({ start, end });
      continue;
    }

    positionBased = false;
  }

  if (!positionBased) {
    tokenizedText = fallbackMaskedText || originalText || "";
    usableDetections
      .slice()
      .reverse()
      .forEach((detection) => {
        if (!detection.value || !detection.mask_token) return;
        tokenizedText = tokenizedText.split(detection.value).join(detection.mask_token);
      });
  }

  return { maskedText: tokenizedText, tokenMap };
}

function restoreFromTokenMap(maskedText, tokenMap) {
  return Object.entries(tokenMap).reduce(
    (text, [token, value]) => text.split(token).join(value),
    maskedText
  );
}

function makeCustomPolicy(customFilters) {
  return {
    custom_filters: customFilters.map((filter) => ({
      name: filter.name,
      label: filter.label,
      mask: filter.mask,
      keywords: filter.keywords,
      action: filter.action,
      risk_level: filter.risk_level,
    })),
  };
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [sourceText, setSourceText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [restoredText, setRestoredText] = useState("");
  const [tokenMap, setTokenMap] = useState({});
  const [detectedPii, setDetectedPii] = useState([]);
  const [detections, setDetections] = useState([]);
  const [riskLevel, setRiskLevel] = useState("NONE");
  const [filterEngine, setFilterEngine] = useState("gateway_detector");
  const [externalApiResponse, setExternalApiResponse] = useState(
    INITIAL_EXTERNAL_API_RESPONSE
  );
  const [transferStatus, setTransferStatus] = useState("PENDING");
  const [gatewayStatus, setGatewayStatus] = useState("READY");
  const [downloadedFile, setDownloadedFile] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [logSaved, setLogSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleString());
  const [latencyMs, setLatencyMs] = useState("측정 예정");
  const [customFilters, setCustomFilters] = useState([]);

  const safeDetections = useMemo(
    () => detections.map(({ value, ...rest }) => rest),
    [detections]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
      return;
    }

    root.classList.remove("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  }, [isDarkMode]);

  function clearDownloadState() {
    setDownloadedFile(null);
    setDownloadMessage("");
  }

  function applyResult(rawData) {
    const data = normalizeResult(rawData, sourceText);
    const customDetections = buildCustomDetections(sourceText, customFilters);
    const mergedDetections = [...data.detections, ...customDetections];
    const customMaskedText = applyCustomMask(data.masked_text || sourceText, customFilters);
    const tokenized = buildTokenizedMask(sourceText, customMaskedText, mergedDetections);
    const mergedDetectedPii = Array.from(
      new Set([...data.detected_pii, ...mergedDetections.map((detection) => detection.type)])
    );
    const customRisk = customDetections.reduce(
      (risk, detection) => maxRisk(risk, detection.risk_level),
      "NONE"
    );
    const finalRisk = maxRisk(data.risk_level, customRisk);
    const finalResult = {
      ...data,
      masked_text: tokenized.maskedText,
      detections: mergedDetections,
      detected_pii: mergedDetectedPii,
      risk_level: finalRisk,
      filter_engine:
        customDetections.length > 0
          ? `${data.filter_engine}+custom_user_policy`
          : data.filter_engine,
    };

    setCurrentResult(finalResult);
    setMaskedText(finalResult.masked_text);
    setRestoredText("");
    setTokenMap(tokenized.tokenMap);
    setDetectedPii(finalResult.detected_pii);
    setDetections(finalResult.detections);
    setRiskLevel(finalResult.risk_level);
    setFilterEngine(finalResult.filter_engine);
    setExternalApiResponse(finalResult.external_api_response);
    setTimestamp(finalResult.timestamp);
    setLatencyMs(finalResult.latency_ms);
    setLogSaved(finalResult.log_saved);
    setTransferStatus("READY");
    setGatewayStatus("MASKED");
    clearDownloadState();
  }

  function resetAnalysisState() {
    setMaskedText("");
    setRestoredText("");
    setTokenMap({});
    setDetectedPii([]);
    setDetections([]);
    setRiskLevel("NONE");
    setFilterEngine("gateway_detector");
    setExternalApiResponse(INITIAL_EXTERNAL_API_RESPONSE);
    setTransferStatus("PENDING");
    setGatewayStatus("READY");
    setDownloadedFile(null);
    setDownloadMessage("");
    setLogSaved(false);
    setErrorMessage("");
    setIsLoading(false);
    setCurrentResult(null);
    setTimestamp(new Date().toLocaleString());
    setLatencyMs("측정 예정");
  }

  function handleSampleClick(sampleKey) {
    setSourceText(sampleDocuments[sampleKey] ?? "");
    clearDownloadState();
    setErrorMessage("");
  }

  function handleSourceTextChange(value) {
    setSourceText(value);
    clearDownloadState();
    setErrorMessage("");
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isTxtFile =
      file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";
    if (!isTxtFile) {
      setErrorMessage("TXT 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceText(typeof reader.result === "string" ? reader.result : "");
      clearDownloadState();
      setErrorMessage("");
    };
    reader.onerror = () => setErrorMessage("파일을 읽는 중 오류가 발생했습니다.");
    reader.readAsText(file);
  }

  function handleReset() {
    setSourceText("");
    resetAnalysisState();
  }

  async function handleRunCheck() {
    if (!sourceText.trim()) {
      setErrorMessage("검사할 내부 원본 자료를 입력하세요.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);
    setGatewayStatus("SCANNING");

    try {
      const result = await filterText(sourceText, {
        policy: DEFAULT_POLICY,
        customPolicy: makeCustomPolicy(customFilters),
      });
      applyResult(result);
    } catch (error) {
      setGatewayStatus("ERROR");
      setTransferStatus("PENDING");
      setErrorMessage(
        "보안 검사 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleRestore() {
    if (!maskedText || Object.keys(tokenMap).length === 0) {
      setErrorMessage("복구할 마스킹 결과와 tokenMap이 없습니다.");
      return;
    }

    setErrorMessage("");
    setRestoredText(restoreFromTokenMap(maskedText, tokenMap));
  }

  function markDownloaded(format, filename, message) {
    setDownloadedFile({ format, filename });
    setDownloadMessage(message);
    setLogSaved(true);
  }

  function handleDownloadMaskedTxt() {
    if (!maskedText.trim()) {
      setErrorMessage("먼저 보안 검사를 실행하세요.");
      return;
    }
    const filename = `masked_${makeTimestamp()}.txt`;
    downloadTextFile(maskedText, filename, "text/plain;charset=utf-8");
    markDownloaded("txt", filename, "마스킹 결과 TXT 파일이 저장되었습니다.");
  }

  function handleDownloadMaskedJson() {
    if (!maskedText.trim()) {
      setErrorMessage("먼저 보안 검사를 실행하세요.");
      return;
    }
    const filename = `masked_${makeTimestamp()}.json`;
    const payload = {
      masked_text: maskedText,
      detected_pii: detectedPii,
      risk_level: riskLevel,
      detections,
      timestamp,
      external_transfer_status: transferStatus === "SENT" ? "SENT" : "READY",
    };
    downloadTextFile(JSON.stringify(payload, null, 2), filename, "application/json;charset=utf-8");
    markDownloaded("json", filename, "마스킹 결과 JSON 파일이 저장되었습니다.");
  }

  function handleDownloadRestoredTxt() {
    if (!restoredText.trim()) {
      setErrorMessage("복구 실행 후 다운로드할 수 있습니다.");
      return;
    }
    const filename = `restored_internal_${makeTimestamp()}.txt`;
    downloadTextFile(restoredText, filename, "text/plain;charset=utf-8");
    markDownloaded("txt", filename, "복구 결과 TXT 파일이 저장되었습니다.");
  }

  function handleDownloadSecurityLogJson() {
    const filename = `security_log_${makeTimestamp()}.json`;
    const payload = {
      timestamp,
      detected_pii: detectedPii,
      risk_level: riskLevel,
      original_text_status: "BLOCKED",
      masked_text_status: transferStatus === "SENT" ? "SENT" : transferStatus,
      restored_text_status: restoredText ? "INTERNAL ONLY" : "NOT RESTORED",
      latency_ms: latencyMs,
      filter_engine: filterEngine,
      detections: safeDetections,
    };
    downloadTextFile(JSON.stringify(payload, null, 2), filename, "application/json;charset=utf-8");
    markDownloaded("json", filename, "개인정보 value를 제외한 보안 로그가 저장되었습니다.");
  }

  function handleSendExternal() {
    if (!maskedText) {
      window.alert("마스킹 결과가 있을 때만 전송할 수 있습니다.");
      return;
    }

    setErrorMessage("");
    setTransferStatus("SENT");
    setGatewayStatus("SENT");
    const responseMessage =
      "외부 AI API에는 비식별화된 masked_text만 전송되었습니다.";
    setExternalApiResponse(responseMessage);
    setCurrentResult((previousResult) =>
      previousResult
        ? { ...previousResult, external_api_response: responseMessage }
        : previousResult
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        />
        <SecurityFlow />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <OriginalDocumentPanel
            sourceText={sourceText}
            onSourceTextChange={handleSourceTextChange}
            onSampleClick={handleSampleClick}
            onTxtUpload={handleFileUpload}
            onRunCheck={handleRunCheck}
            onReset={handleReset}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
          <MaskedDocumentPanel
            maskedText={maskedText}
            transferStatus={transferStatus}
            onSendExternal={handleSendExternal}
            canSend={Boolean(maskedText) && riskLevel !== "CRITICAL"}
            onDownloadMaskedTxt={handleDownloadMaskedTxt}
            onDownloadMaskedJson={handleDownloadMaskedJson}
            riskLevel={riskLevel}
          />
        </div>

        <SummaryCards
          riskLevel={riskLevel}
          detections={detections}
          detectedPii={detectedPii}
          transferStatus={transferStatus}
          filterEngine={filterEngine}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <CustomFilterBuilder
            customFilters={customFilters}
            onCustomFiltersChange={setCustomFilters}
          />
          <RestorationPanel
            maskedText={maskedText}
            restoredText={restoredText}
            tokenMap={tokenMap}
            onRestore={handleRestore}
            onDownloadRestoredTxt={handleDownloadRestoredTxt}
          />
          <ExportPanel
            maskedText={maskedText}
            restoredText={restoredText}
            onDownloadMaskedTxt={handleDownloadMaskedTxt}
            onDownloadMaskedJson={handleDownloadMaskedJson}
            onDownloadRestoredTxt={handleDownloadRestoredTxt}
            onDownloadSecurityLogJson={handleDownloadSecurityLogJson}
            downloadedFile={downloadedFile}
            downloadMessage={downloadMessage}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DetectionTable detections={detections} />
          <SecurityLog
            transferStatus={transferStatus}
            gatewayStatus={gatewayStatus}
            externalApiResponse={externalApiResponse}
            filterEngine={filterEngine}
            downloadedFile={downloadedFile}
            downloadMessage={downloadMessage}
            logSaved={logSaved}
            detectedPii={detectedPii}
            riskLevel={riskLevel}
            timestamp={timestamp}
            latencyMs={latencyMs}
            restoredText={restoredText}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
