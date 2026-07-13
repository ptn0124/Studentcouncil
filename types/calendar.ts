export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  category: "general" | "exam" | "event" | "holiday";
  author_id?: string;
  created_at: string;
  updated_at: string;
}
