import { useState } from "react";

const emptyForm = {
  name: "",
  label: "",
  mask: "",
  keywordsText: "",
  action: "MASK",
  risk_level: "MEDIUM",
};

const sampleFilters = [
  {
    name: "계좌번호",
    label: "ACCOUNT_NUMBER",
    mask: "[ACCOUNT]",
    keywords: ["110-123-456789"],
    action: "MASK",
    risk_level: "HIGH",
  },
  {
    name: "프로젝트명",
    label: "PROJECT_NAME",
    mask: "[PROJECT]",
    keywords: ["Project Aurora"],
    action: "MASK",
    risk_level: "MEDIUM",
  },
  {
    name: "환자번호",
    label: "PATIENT_ID",
    mask: "[PATIENT_ID]",
    keywords: ["P-2025-001"],
    action: "MASK",
    risk_level: "HIGH",
  },
];

function createId(prefix = "filter") {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function CustomFilterBuilder({ customFilters = [], onCustomFiltersChange = () => {} }) {
  const [form, setForm] = useState(emptyForm);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addFilter() {
    const keywords = form.keywordsText
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    if (!form.name.trim() || !form.label.trim() || !form.mask.trim() || keywords.length === 0) {
      return;
    }

    onCustomFiltersChange([
      ...customFilters,
      {
        id: createId("custom"),
        name: form.name.trim(),
        label: form.label.trim().toUpperCase(),
        mask: form.mask.trim(),
        keywords,
        action: form.action,
        risk_level: form.risk_level,
      },
    ]);
    setForm(emptyForm);
  }

  function addSamples() {
    const withIds = sampleFilters.map((filter) => ({
      ...filter,
      id: createId(filter.label),
    }));
    onCustomFiltersChange([...customFilters, ...withIds]);
  }

  function removeFilter(id) {
    onCustomFiltersChange(customFilters.filter((filter) => filter.id !== id));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <PanelHeader />

      <div className="mt-5 grid grid-cols-1 gap-3">
        <TextInput label="보호할 데이터 이름" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="계좌번호" />
        <TextInput label="라벨명" value={form.label} onChange={(value) => updateForm("label", value)} placeholder="ACCOUNT_NUMBER" />
        <TextInput label="마스킹 토큰" value={form.mask} onChange={(value) => updateForm("mask", value)} placeholder="[ACCOUNT]" />
        <TextInput label="예시 값 또는 키워드" value={form.keywordsText} onChange={(value) => updateForm("keywordsText", value)} placeholder="110-123-456789, Project Aurora" />

        <div className="grid grid-cols-2 gap-3">
          <Select label="처리 방식" value={form.action} onChange={(value) => updateForm("action", value)} options={["MASK", "BLOCK"]} />
          <Select label="위험도" value={form.risk_level} onChange={(value) => updateForm("risk_level", value)} options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addFilter}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          커스텀 필터 추가
        </button>
        <button
          type="button"
          onClick={addSamples}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          샘플 필터 추가
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {customFilters.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            등록된 사용자 맞춤형 필터가 없습니다.
          </p>
        ) : (
          customFilters.map((filter) => (
            <div key={filter.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{filter.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {filter.label} · {filter.mask} · {filter.action} · {filter.risk_level}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {filter.keywords.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PanelHeader() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Custom Filter Builder
      </p>
      <h2 className="mt-2 text-xl font-semibold">사용자 맞춤형 필터</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        개발자가 아니어도 보호하고 싶은 데이터 유형을 직접 추가할 수 있습니다.
        예시 값이나 키워드가 문서에 포함되면 자동으로 마스킹됩니다.
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        향후에는 누적된 사용자 정책 데이터를 기반으로 Privacy Filter fine-tuning까지 확장할 수 있습니다.
      </p>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default CustomFilterBuilder;
