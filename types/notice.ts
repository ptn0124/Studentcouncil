export interface Notice {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  isPinned: boolean;
  views: number;
  createdAt: string;
}