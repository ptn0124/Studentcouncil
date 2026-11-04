import type { SuggestionStatus } from "@/lib/suggestionStatus";

// suggestions 테이블 (익명 기능 제거: 작성자 정보를 작성 시점에 함께 저장)
export interface Suggestion {
  id: string;
  content: string;
  status: SuggestionStatus;
  reply: string | null;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
  updated_at: string | null;
}
