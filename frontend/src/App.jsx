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

const DASHBOARD_NAV_ITEMS = [
  {
    key: "overview",
    label: "Overview",
    description: "분석 요약",
    sectionId: "overview-section",
  },
  {
    key: "inspect",
    label: "Inspect",
    description: "문서 검사",
    sectionId: "inspect-section",
  },
  {
    key: "policies",
    label: "Policies",
    description: "보안 정책",
    sectionId: "policies-section",
  },
  {
    key: "restore",
    label: "Restore",
    description: "마스킹 복구",
    sectionId: "restore-section",
  },
  {
    key: "exports",
    label: "Exports",
    description: "파일 내보내기",
    sectionId: "exports-section",
  },
  {
    key: "audit",
    label: "Audit",
    description: "보안 로그",
    sectionId: "audit-section",
  },
];

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

  return {
    original_text: data.original_text || inputText || "",
    masked_text: getMaskedText(data),
    detected_pii: detectedPii.map((item) => normalizeType(item)),
    detections,
    risk_level: normalizeRisk(data.risk_level || "NONE"),
    filter_engine: data.filter_engine || "gateway_detector",
    external_api_response:
      data.external_api_response || INITIAL_EXTERNAL_API_RESPONSE,
    timestamp: data.timestamp || new Date().toLocaleString(),
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
  const [externalApiResponse, setExternalApiResponse] = useState(INITIAL_EXTERNAL_API_RESPONSE);
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
  const [activeMenu, setActiveMenu] = useState("overview");

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

  useEffect(() => {
    const sectionElements = DASHBOARD_NAV_ITEMS.map((item) => ({
      ...item,
      element: document.getElementById(item.sectionId),
    })).filter((item) => item.element);

    if (sectionElements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const matchedItem = sectionElements.find(
          (item) => item.sectionId === visibleEntry.target.id
        );
        if (matchedItem) {
          setActiveMenu(matchedItem.key);
        }
      },
      {
        root: null,
        rootMargin: "-96px 0px -60% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sectionElements.forEach((item) => observer.observe(item.element));

    return () => observer.disconnect();
  }, []);

  function handleSidebarNavigation(menuKey, sectionId) {
    setActiveMenu(menuKey);

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }

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
      setErrorMessage("보안 검사 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요.");
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
    const responseMessage = "외부 AI API에는 비식별화된 masked_text만 전송했습니다.";
    setExternalApiResponse(responseMessage);
    setCurrentResult((previousResult) =>
      previousResult
        ? { ...previousResult, external_api_response: responseMessage }
        : previousResult
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar
          riskLevel={riskLevel}
          transferStatus={transferStatus}
          detectionCount={detections.length}
          customFilterCount={customFilters.length}
          activeMenu={activeMenu}
          onNavigate={handleSidebarNavigation}
        />

        <div className="min-w-0 flex-1">
          <Header
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((current) => !current)}
            gatewayStatus={gatewayStatus}
            timestamp={timestamp}
          />

          <div className="space-y-5 px-4 pb-8 pt-4 sm:px-5 lg:px-6">
            <section id="overview-section" className="scroll-mt-24">
              <SectionHeading eyebrow="Overview" title="분석 요약" />
              <SummaryCards
                riskLevel={riskLevel}
                detections={detections}
                detectedPii={detectedPii}
                transferStatus={transferStatus}
                filterEngine={filterEngine}
              />
            </section>

            <section id="inspect-section" className="scroll-mt-24">
              <SectionHeading eyebrow="Inspect" title="문서 검사" />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
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
            </section>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.95fr] 2xl:grid-cols-[1.2fr_0.9fr_0.7fr]">
              <section id="policies-section" className="scroll-mt-24">
                <SectionHeading eyebrow="Policies" title="보안 정책 및 커스텀 필터" />
                <CustomFilterBuilder
                  customFilters={customFilters}
                  onCustomFiltersChange={setCustomFilters}
                />
              </section>
              <section id="restore-section" className="scroll-mt-24">
                <SectionHeading eyebrow="Restore" title="마스킹 복구" />
                <RestorationPanel
                  maskedText={maskedText}
                  restoredText={restoredText}
                  tokenMap={tokenMap}
                  onRestore={handleRestore}
                  onDownloadRestoredTxt={handleDownloadRestoredTxt}
                />
              </section>
              <section id="exports-section" className="scroll-mt-24">
                <SectionHeading eyebrow="Exports" title="파일 내보내기" />
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
              </section>
            </div>

            <section id="audit-section" className="scroll-mt-24">
              <SectionHeading eyebrow="Audit" title="탐지 상세 및 보안 로그" />
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.35fr_0.65fr]">
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
                  onDownloadSecurityLogJson={handleDownloadSecurityLogJson}
                />
              </div>
            </section>

            <SecurityFlow />
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardSidebar({
  riskLevel,
  transferStatus,
  detectionCount,
  customFilterCount,
  activeMenu = "overview",
  onNavigate = () => {},
}) {
  const navItems = [
    ["Overview", "대시보드"],
    ["Inspect", "보안 검사"],
    ["Policies", "정책 설정"],
    ["Restore", "내부 복구"],
    ["Exports", "다운로드"],
    ["Audit", "보안 로그"],
  ];

  return (
    <aside className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white shadow-xl lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r lg:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-black">
          AI
        </div>
        <div>
          <p className="text-sm font-semibold">AI Security Gateway</p>
          <p className="text-xs text-slate-400">Enterprise Console</p>
        </div>
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key, item.sectionId)}
            className={`rounded-xl px-3 py-2.5 text-left transition-colors ${
              activeMenu === item.key
                ? "bg-white/10 text-white ring-1 ring-white/10"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="mt-0.5 text-xs text-slate-400">{item.description}</div>
          </button>
        ))}
      </nav>

      <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
        <SidebarMetric label="Risk Level" value={riskLevel} tone={riskLevel === "CRITICAL" ? "red" : "green"} />
        <SidebarMetric label="Detections" value={`${detectionCount} items`} />
        <SidebarMetric label="Masked Text" value={transferStatus} tone="green" />
        <SidebarMetric label="Custom Filters" value={`${customFilterCount} active`} />
      </div>

      <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
        복구 데이터는 내부 검토용이며 외부 전송 대상이 아닙니다.
      </div>
    </aside>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {eyebrow}
      </span>
      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
    </div>
  );
}

function SidebarMetric({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "red"
      ? "text-rose-200"
      : tone === "green"
        ? "text-emerald-200"
        : "text-slate-100";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-base font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default App;
