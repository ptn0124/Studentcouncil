export type SuggestionStatus = "pending" | "in_progress" | "resolved" | "rejected";

export interface Suggestion {
  id: string;
  content: string;
  status: SuggestionStatus;
  reply: string | null;
  student_id: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  replied_at: string | null;
}
