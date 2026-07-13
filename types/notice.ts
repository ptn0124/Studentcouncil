export interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  views: number;
  author_id?: string;
  author_name?: string; // Google OAuth에서 이메일 앞부분을 파싱해 보여주기 위한 필드 추가
  created_at: string;
  updated_at: string;
}

