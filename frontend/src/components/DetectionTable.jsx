import { getPiiTypeBadgeClasses } from "../utils/badgeStyles";

function DetectionTable({ detections = [] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Detection Details
        </p>
        <h2 className="text-xl font-semibold">탐지 상세 결과</h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          데모 테이블에는 value를 표시하지만, 다운로드되는 보안 로그에는 value를 제외합니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100/80 dark:bg-slate-900">
              <tr>
                <Th>유형</Th>
                <Th>탐지 값</Th>
                <Th>시작</Th>
                <Th>끝</Th>
                <Th>엔진</Th>
                <Th>처리</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
              {detections.length === 0 ? (
                <tr>
                  <Td colSpan={6}>탐지 결과가 없습니다.</Td>
                </tr>
              ) : (
                detections.map((detection, index) => (
                  <tr key={`${detection.type}-${detection.start}-${index}`}>
                    <Td>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPiiTypeBadgeClasses(detection.type)}`}>
                        {detection.type}
                      </span>
                    </Td>
                    <Td className="font-medium text-slate-700 dark:text-slate-200">
                      {detection.value || "-"}
                    </Td>
                    <Td>{detection.start}</Td>
                    <Td>{detection.end}</Td>
                    <Td>{detection.engine || detection.source || "gateway_detector"}</Td>
                    <Td>{detection.action || "MASKED"}</Td>
                  </tr>
                ))
              )}
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

function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-4 text-sm text-slate-600 dark:text-slate-300 ${className}`}>
      {children}
    </td>
  );
}

export default DetectionTable;
