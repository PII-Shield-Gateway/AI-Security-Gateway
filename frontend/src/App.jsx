import { useEffect, useState } from "react";
import { filterText } from "./api/gatewayApi";
import Header from "./components/Header";
import SecurityFlow from "./components/SecurityFlow";
import OriginalDocumentPanel from "./components/OriginalDocumentPanel";
import MaskedDocumentPanel from "./components/MaskedDocumentPanel";
import DetectionTable from "./components/DetectionTable";
import SummaryCards from "./components/SummaryCards";
import SecurityLog from "./components/SecurityLog";
import sampleDocuments from "./data/sampleDocuments";
import { downloadTextFile, makeTimestamp } from "./utils/downloadFile";

const THEME_STORAGE_KEY = "theme";
const INITIAL_EXTERNAL_API_RESPONSE =
  "외부 AI API 응답은 비식별화된 자료가 전송된 뒤에 표시됩니다.";

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark") {
    return true;
  }

  if (storedTheme === "light") {
    return false;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function normalizeResult(data = {}) {
  return {
    original_text: data.original_text ?? "",
    masked_text: data.masked_text ?? "",
    detected_pii: Array.isArray(data.detected_pii) ? data.detected_pii : [],
    detections: Array.isArray(data.detections) ? data.detections : [],
    risk_level: data.risk_level ?? "NONE",
    filter_engine: data.filter_engine ?? "READY",
    external_api_response:
      data.external_api_response ?? INITIAL_EXTERNAL_API_RESPONSE,
    timestamp: data.timestamp ?? "측정 예정",
    log_saved: Boolean(data.log_saved),
  };
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [sourceText, setSourceText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [detectedPii, setDetectedPii] = useState([]);
  const [detections, setDetections] = useState([]);
  const [riskLevel, setRiskLevel] = useState("NONE");
  const [filterEngine, setFilterEngine] = useState("READY");
  const [externalApiResponse, setExternalApiResponse] = useState(
    INITIAL_EXTERNAL_API_RESPONSE
  );
  const [outputFormat, setOutputFormat] = useState("txt");
  const [transferStatus, setTransferStatus] = useState("PENDING");
  const [gatewayStatus, setGatewayStatus] = useState("READY");
  const [downloadedFile, setDownloadedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [logSaved, setLogSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [timestamp, setTimestamp] = useState("측정 예정");

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
    window.dashboardBridge = {
      sendToExternalAIAction: handleSendExternal,
      getCurrentResult: () => currentResult,
      getState: () => ({
        externalApiResponse,
        timestamp,
        detectedPii,
        riskLevel,
        transferStatus,
      }),
      showCriticalWarning: (message) => setErrorMessage(message),
    };

    return () => {
      delete window.dashboardBridge;
    };
  }, [currentResult, detectedPii, externalApiResponse, riskLevel, timestamp, transferStatus]);

  useEffect(() => {
    window.dashboardState?.updateSecurityLog?.();
  }, [transferStatus, externalApiResponse, detectedPii, riskLevel, timestamp]);

  function applyResult(rawData) {
    const data = normalizeResult(rawData);

    setCurrentResult(data);
    setMaskedText(data.masked_text);
    setDetectedPii(data.detected_pii);
    setDetections(data.detections);
    setRiskLevel(data.risk_level);
    setFilterEngine(data.filter_engine);
    setExternalApiResponse(data.external_api_response);
    setTimestamp(data.timestamp);
    setLogSaved(data.log_saved);
    setTransferStatus("READY");
    setGatewayStatus("MASKED");
    clearDownloadState();
    window.dashboardState?.renderResult?.(data);
  }

  function resetAnalysisState() {
    setMaskedText("");
    setDetectedPii([]);
    setDetections([]);
    setRiskLevel("NONE");
    setFilterEngine("READY");
    setExternalApiResponse(INITIAL_EXTERNAL_API_RESPONSE);
    setOutputFormat("txt");
    setTransferStatus("PENDING");
    setGatewayStatus("READY");
    setDownloadedFile(null);
    setIsDownloading(false);
    setDownloadMessage("");
    setLogSaved(false);
    setErrorMessage("");
    setIsLoading(false);
    setCurrentResult(null);
    setTimestamp("측정 예정");
    window.dashboardState?.resetDashboard?.();
  }

  function clearDownloadState() {
    setDownloadedFile(null);
    setDownloadMessage("");
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

    if (!file) {
      return;
    }

    const isTxtFile =
      file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";
    const isPdfFile =
      file.name.toLowerCase().endsWith(".pdf") ||
      file.type === "application/pdf";
    const isDocxFile =
      file.name.toLowerCase().endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isTxtFile && !isPdfFile && !isDocxFile) {
      setErrorMessage("TXT, PDF, DOCX 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceText(typeof reader.result === "string" ? reader.result : "");
      clearDownloadState();
      setErrorMessage("");
    };
    reader.onerror = () => {
      setErrorMessage("파일을 읽는 중 오류가 발생했습니다.");
    };
    reader.readAsText(file);
  }

  function handleReset() {
    setSourceText("");
    resetAnalysisState();
  }

  async function handleRunCheck() {
    if (!sourceText.trim()) {
      setErrorMessage("자료를 입력하세요.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);
    setGatewayStatus("SCANNING");

    try {
      const result = await filterText(sourceText);
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

  async function handleDownloadFilteredFile() {
    if (!sourceText.trim()) {
      setErrorMessage("저장할 원본 자료가 없습니다.");
      return;
    }

    if (!maskedText.trim()) {
      setErrorMessage("먼저 보안 검사를 실행하세요.");
      return;
    }

    setErrorMessage("");
    setIsDownloading(true);

    try {
      if (outputFormat === "json") {
        const payload = {
          original_text: sourceText,
          masked_text: maskedText,
          detected_pii: detectedPii,
          risk_level: riskLevel,
          detections,
          filter_engine: filterEngine,
          downloaded_at: new Date().toISOString(),
        };
        const filename = `result_${makeTimestamp()}.json`;
        downloadTextFile(
          JSON.stringify(payload, null, 2),
          filename,
          "application/json;charset=utf-8"
        );
        setDownloadedFile({ format: "json", filename });
      } else {
        const filename = `masked_${makeTimestamp()}.txt`;
        downloadTextFile(maskedText, filename, "text/plain;charset=utf-8");
        setDownloadedFile({ format: "txt", filename });
      }

      setDownloadMessage("필터링 결과가 다운로드되었습니다.");
      setLogSaved(true);
    } catch (error) {
      setErrorMessage(
        "파일 다운로드 중 오류가 발생했습니다. 브라우저에서 다운로드가 차단되지 않았는지 확인하세요."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  function handleSendExternal() {
    const result = currentResult || { masked_text: maskedText };
    if (!result?.masked_text) {
      window.alert("먼저 보안 검사를 실행하세요.");
      return;
    }

    setErrorMessage("");
    setTransferStatus("SENT");
    setGatewayStatus("SENT");
    setExternalApiResponse(
      "외부 AI API에는 비식별화된 자료만 전송되었습니다."
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
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
            onSendExternal={() => {}}
            canSend={Boolean(maskedText) && riskLevel !== "CRITICAL"}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            onDownloadFilteredFile={handleDownloadFilteredFile}
            isDownloading={isDownloading}
            downloadedFile={downloadedFile}
            downloadMessage={downloadMessage}
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
        />
      </div>
    </main>
  );
}

export default App;
