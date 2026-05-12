import { useState } from "react";

const emptyForm = {
  name: "",
  label: "",
  mask: "",
  keywordsText: "",
  action: "MASK",
  risk_level: "MEDIUM",
};

const sampleFilterGroups = {
  finance: [
    {
      name: "계좌번호",
      label: "ACCOUNT_NUMBER",
      mask: "[ACCOUNT]",
      keywords: ["110-123-456789"],
      action: "MASK",
      risk_level: "HIGH",
    },
  ],
  enterprise: [
    {
      name: "프로젝트명",
      label: "PROJECT_NAME",
      mask: "[PROJECT]",
      keywords: ["Project Aurora"],
      action: "MASK",
      risk_level: "MEDIUM",
    },
  ],
  medical: [
    {
      name: "환자번호",
      label: "PATIENT_ID",
      mask: "[PATIENT_ID]",
      keywords: ["P-2025-001"],
      action: "MASK",
      risk_level: "HIGH",
    },
  ],
};

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

  function addSamples(group) {
    const withIds = sampleFilterGroups[group].map((filter) => ({
      ...filter,
      id: createId(filter.label),
    }));
    onCustomFiltersChange([...customFilters, ...withIds]);
  }

  function removeFilter(id) {
    onCustomFiltersChange(customFilters.filter((filter) => filter.id !== id));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Custom Filter Builder
          </p>
          <h2 className="mt-1 text-lg font-semibold">정책 설정</h2>
        </div>
        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-500/20 dark:text-indigo-300">
          {customFilters.length} active
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextInput label="보호 대상 이름" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="계좌번호" />
        <TextInput label="라벨명" value={form.label} onChange={(value) => updateForm("label", value)} placeholder="ACCOUNT_NUMBER" />
        <TextInput label="마스킹 토큰" value={form.mask} onChange={(value) => updateForm("mask", value)} placeholder="[ACCOUNT]" />
        <TextInput label="키워드/예시 값" value={form.keywordsText} onChange={(value) => updateForm("keywordsText", value)} placeholder="110-123-456789, Project Aurora" />
        <Select label="처리 방식" value={form.action} onChange={(value) => updateForm("action", value)} options={["MASK", "BLOCK"]} />
        <Select label="위험도" value={form.risk_level} onChange={(value) => updateForm("risk_level", value)} options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addFilter}
          className="h-9 rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          필터 추가
        </button>
        <SampleButton onClick={() => addSamples("finance")}>금융 샘플</SampleButton>
        <SampleButton onClick={() => addSamples("enterprise")}>기업 보안 샘플</SampleButton>
        <SampleButton onClick={() => addSamples("medical")}>의료 샘플</SampleButton>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        {customFilters.length === 0 ? (
          <p className="bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            등록된 사용자 맞춤형 필터가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <Th>이름</Th>
                  <Th>라벨</Th>
                  <Th>토큰</Th>
                  <Th>방식</Th>
                  <Th>위험도</Th>
                  <Th>삭제</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {customFilters.map((filter) => (
                  <tr key={filter.id}>
                    <Td>{filter.name}</Td>
                    <Td>{filter.label}</Td>
                    <Td>{filter.mask}</Td>
                    <Td>{filter.action}</Td>
                    <Td>{filter.risk_level}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => removeFilter(filter.id)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        삭제
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
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
        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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

function SampleButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {children}
    </button>
  );
}

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{children}</td>;
}

export default CustomFilterBuilder;
