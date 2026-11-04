export interface MinuteFile {
  id: string;
  file_name: string;
  size: number;
  mime_type: string | null;
}

export interface Minute {
  id: string;
  title: string;
  content: string;
  meeting_date: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  files: MinuteFile[];
}
