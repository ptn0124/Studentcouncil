import { getStatusInfo } from "@/lib/suggestionStatus";
import { parseStudentId } from "@/lib/studentId";
import { UserIcon } from "@/components/icons";
import type { Suggestion } from "@/types";

export function StatusBadge({ status }: { status: string }) {
  const info = getStatusInfo(status);
  return (
    <span className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-bold border ${info.style}`}>
      {info.label}
    </span>
  );
}

/** 작성자 이름 + 이메일에서 추출한 학번. 학번이 없는 계정(교사 등)은 이름(또는 이메일)만 표시 */
export function AuthorLabel({ suggestion }: { suggestion: Pick<Suggestion, "author_name" | "author_email"> }) {
  const { author_name, author_email } = suggestion;
  const studentId = parseStudentId(author_email);

  if (!author_name && !author_email) {
    // 익명 기능 제거 이전에 작성된 건의
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400">
        <UserIcon className="w-3.5 h-3.5" /> 작성자 정보 없음
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 min-w-0">
      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
      <span className="truncate">{author_name ?? author_email}</span>
      {studentId && (
        <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-neutralBg text-[12px] font-semibold text-secondary/70">
          {studentId}
        </span>
      )}
    </span>
  );
}

export const formatSuggestionDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
