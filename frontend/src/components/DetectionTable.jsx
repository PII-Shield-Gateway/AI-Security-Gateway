import { getPiiTypeBadgeClasses } from "../utils/badgeStyles";

function DetectionTable({ detections = [] }) {
  if (!Array.isArray(detections) || detections.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Detection Details
        </p>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          PII 탐지 상세
        </h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          데모에서는 탐지 값을 표시하지만, 실제 운영 환경에서는 원본 개인정보 값을 로그에 저장하지 않는 것이 권장됩니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100/80 dark:bg-slate-900">
              <tr>
                <Th>유형</Th>
                <Th>탐지 값</Th>
                <Th>시작 위치</Th>
                <Th>끝 위치</Th>
                <Th>탐지 엔진</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
              {detections.map((detection, index) => (
                <tr key={`${detection.type}-${detection.start}-${index}`}>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPiiTypeBadgeClasses(
                        detection.type
                      )}`}
                    >
                      {detection.type}
                    </span>
                  </Td>
                  <Td className="font-medium text-slate-700 dark:text-slate-200">
                    {detection.value}
                  </Td>
                  <Td>{detection.start}</Td>
                  <Td>{detection.end}</Td>
                  <Td>
                    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-500/20 dark:text-slate-300">
                      {detection.source}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-4 text-sm text-slate-600 dark:text-slate-300 ${className}`}>
      {children}
    </td>
  );
}

export default DetectionTable;
