// 회의록 첨부파일 정책
export const MINUTES_BUCKET = "minutes-files";
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_FILES_PER_MINUTE = 5;
export const ALLOWED_EXTENSIONS = new Set([
  "pdf", "hwp", "hwpx", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "jpg", "jpeg", "png",
]);

export const extensionOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
};

// 경로 구분자와 제어문자를 제거한 표시용 파일명
export const sanitizeFileName = (name: string) =>
  name.replace(/[\\/\u0000-\u001f]/g, "_").trim().slice(0, 200) || "file";

// 회의록 조회 시 첨부파일 메타데이터를 함께 가져오기 위한 select 문
export const MINUTE_SELECT =
  "id, title, content, meeting_date, author_id, created_at, updated_at, files:meeting_minute_files(id, file_name, size, mime_type)";
