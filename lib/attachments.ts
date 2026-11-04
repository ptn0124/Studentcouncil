// 회의록 첨부파일 공통 규칙 (클라이언트 검증 + 서버 검증에서 함께 사용)

/** Supabase Storage 버킷 이름 (비공개 버킷, supabase/migrations 참고) */
export const MINUTES_BUCKET = "minutes-attachments";

/** 파일 1개 최대 크기: 20MB */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** 회의록 1건당 최대 첨부 개수 */
export const MAX_FILES_PER_MINUTE = 10;

/** 허용 확장자 (hwp 등은 브라우저마다 MIME 타입이 제각각이라 확장자로 검사) */
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "hwp", "hwpx",
  "doc", "docx",
  "ppt", "pptx",
  "xls", "xlsx",
  "txt",
  "png", "jpg", "jpeg", "gif", "webp",
] as const;

/** <input accept> 속성 값 */
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export interface MinuteAttachment {
  id: string;
  minute_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export function getExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i < 0 ? "" : fileName.slice(i + 1).toLowerCase();
}

/** 파일 검증. 문제가 있으면 사용자에게 보여줄 오류 메시지, 없으면 null */
export function validateAttachment(file: { name: string; size: number }): string | null {
  const ext = getExtension(file.name);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `"${file.name}": 허용되지 않는 형식입니다. (${ALLOWED_EXTENSIONS.join(", ")})`;
  }
  if (file.size <= 0) {
    return `"${file.name}": 빈 파일은 첨부할 수 없습니다.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}": 파일 크기는 ${formatBytes(MAX_FILE_SIZE)} 이하여야 합니다. (현재 ${formatBytes(file.size)})`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
