import { useEffect, useState } from "react";
import { filterText, saveFilteredText } from "./api/gatewayApi";
import Header from "./components/Header";
import SecurityFlow from "./components/SecurityFlow";
import OriginalDocumentPanel from "./components/OriginalDocumentPanel";
import MaskedDocumentPanel from "./components/MaskedDocumentPanel";
import DetectionTable from "./components/DetectionTable";
import SummaryCards from "./components/SummaryCards";
import SecurityLog from "./components/SecurityLog";
import sampleDocuments from "./data/sampleDocuments";

const THEME_STORAGE_KEY = "theme";
const INITIAL_EXTERNAL_API_RESPONSE =
  "보안 검사 후 외부 AI API 응답이 표시됩니다.";

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
  const [transferStatus, setTransferStatus] = useState("WAITING");
  const [gatewayStatus, setGatewayStatus] = useState("READY");
  const [savedFile, setSavedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [logSaved, setLogSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  function resetAnalysisState() {
    setMaskedText("");
    setDetectedPii([]);
    setDetections([]);
    setRiskLevel("NONE");
    setFilterEngine("READY");
    setExternalApiResponse(INITIAL_EXTERNAL_API_RESPONSE);
    setOutputFormat("txt");
    setTransferStatus("WAITING");
    setGatewayStatus("READY");
    setSavedFile(null);
    setIsSaving(false);
    setSaveMessage("");
    setLogSaved(false);
    setErrorMessage("");
    setIsLoading(false);
  }

  function handleSampleClick(sampleKey) {
    setSourceText(sampleDocuments[sampleKey] ?? "");
    setSavedFile(null);
    setSaveMessage("");
    setErrorMessage("");
  }

  function handleSourceTextChange(value) {
    setSourceText(value);
    setSavedFile(null);
    setSaveMessage("");
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
      setSavedFile(null);
      setSaveMessage("");
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
      setMaskedText(result.masked_text ?? "");
      setDetectedPii(Array.isArray(result.detected_pii) ? result.detected_pii : []);
      setDetections(Array.isArray(result.detections) ? result.detections : []);
      setRiskLevel(result.risk_level ?? "NONE");
      setFilterEngine(result.filter_engine ?? "READY");
      setExternalApiResponse(
        result.external_api_response ?? INITIAL_EXTERNAL_API_RESPONSE
      );
      setSavedFile(null);
      setSaveMessage("");
      setLogSaved(Boolean(result.log_saved));
      setTransferStatus("READY");
      setGatewayStatus("MASKED");
    } catch (error) {
      setGatewayStatus("ERROR");
      setErrorMessage(
        "보안 검사 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveFilteredFile() {
    if (!sourceText.trim()) {
      setErrorMessage("저장할 원본 자료가 없습니다.");
      return;
    }

    if (!maskedText.trim()) {
      setErrorMessage("먼저 보안 검사를 실행하세요.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const result = await saveFilteredText(sourceText, outputFormat);
      setSavedFile(result.saved_file ?? null);
      setSaveMessage("필터링 결과가 파일로 저장되었습니다.");
      setLogSaved(Boolean(result.log_saved));
    } catch (error) {
      setErrorMessage(
        "파일 저장 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSendExternal() {
    if (!maskedText) {
      setErrorMessage("먼저 보안 검사를 실행하세요.");
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
            onSendExternal={handleSendExternal}
            canSend={Boolean(maskedText)}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            onSaveFilteredFile={handleSaveFilteredFile}
            isSaving={isSaving}
            savedFile={savedFile}
            saveMessage={saveMessage}
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
          savedFile={savedFile}
          saveMessage={saveMessage}
          logSaved={logSaved}
        />
      </div>
    </main>
  );
}

export default App;
