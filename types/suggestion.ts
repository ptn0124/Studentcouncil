export interface Suggestion {
  id: string;
  content: string;
  is_anonymous: boolean;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  reply: string | null;
  created_at: string;
  updated_at: string;
}

