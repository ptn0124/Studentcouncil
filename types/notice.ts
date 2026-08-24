export interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  view_count: number;
  author_id: string | null;
  created_at: string;
  updated_at?: string;
}