import type { MinuteAttachment } from "@/lib/attachments";

export type { MinuteAttachment };

// meeting_minutes 테이블 + 첨부파일(minute_attachments) 목록
export interface Minute {
  id: string;
  title: string;
  content: string;
  meeting_date: string; // YYYY-MM-DD
  author_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
  minute_attachments?: MinuteAttachment[];
}
