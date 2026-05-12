import { getPiiTypeBadgeClasses } from "../utils/badgeStyles";

function DetectionTable({ detections = [] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Detection Details
          </p>
          <h2 className="mt-1 text-lg font-semibold">탐지 상세 테이블</h2>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
          데모에서는 탐지 값을 표시하지만, 운영 환경에서는 원본 개인정보 값을 로그에 저장하지 않습니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100/80 dark:bg-slate-900">
              <tr>
                <Th>유형</Th>
                <Th>탐지 값</Th>
                <Th>시작 위치</Th>
                <Th>끝 위치</Th>
                <Th>처리 방식</Th>
                <Th>탐지 엔진</Th>
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
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPiiTypeBadgeClasses(detection.type)}`}>
                        {detection.type}
                      </span>
                    </Td>
                    <Td className="max-w-xs truncate font-medium text-slate-700 dark:text-slate-200">
                      {detection.value || "-"}
                    </Td>
                    <Td>{detection.start}</Td>
                    <Td>{detection.end}</Td>
                    <Td>{detection.action || "MASKED"}</Td>
                    <Td>{detection.engine || detection.source || "gateway_detector"}</Td>
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
    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
      {children}
    </th>
  );
}

function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-3 py-3 text-sm text-slate-600 dark:text-slate-300 ${className}`}>
      {children}
    </td>
  );
}

export default DetectionTable;
