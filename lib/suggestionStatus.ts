// 건의 처리 상태 (DB suggestions.status 값 ↔ 화면 표시)
export const SUGGESTION_STATUSES = ["pending", "in_progress", "resolved", "rejected"] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export const SUGGESTION_STATUS_INFO: Record<SuggestionStatus, { label: string; style: string }> = {
  pending: { label: "접수됨", style: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "처리 중", style: "bg-blue-100 text-blue-700 border-blue-200" },
  resolved: { label: "해결 완료", style: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "반려", style: "bg-gray-100 text-gray-600 border-gray-200" },
};

export function isSuggestionStatus(value: unknown): value is SuggestionStatus {
  return typeof value === "string" && (SUGGESTION_STATUSES as readonly string[]).includes(value);
}

export function getStatusInfo(status: string | null | undefined) {
  return isSuggestionStatus(status) ? SUGGESTION_STATUS_INFO[status] : SUGGESTION_STATUS_INFO.pending;
}

/** API에서 조회하는 컬럼 (is_anonymous 등 더 이상 쓰지 않는 컬럼 제외) */
export const SUGGESTION_COLUMNS =
  "id, content, status, reply, author_id, author_name, author_email, created_at, updated_at";
