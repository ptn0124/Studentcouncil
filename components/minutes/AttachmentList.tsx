"use client";

import { MinuteAttachment, formatBytes } from "@/lib/attachments";
import { DownloadIcon, PaperclipIcon, XIcon } from "@/components/icons";

interface Props {
  minuteId: string;
  attachments: MinuteAttachment[];
  /** 지정하면 각 파일에 삭제 버튼을 표시 (관리자 수정 화면) */
  onDelete?: (attachment: MinuteAttachment) => void;
  deletingId?: string | null;
}

/** 등록된 첨부파일 목록 (다운로드 링크) */
export default function AttachmentList({ minuteId, attachments, onDelete, deletingId }: Props) {
  if (attachments.length === 0) return null;
  return (
    <ul className="file-list">
      {attachments.map((a) => (
        <li key={a.id} className="file-item">
          <PaperclipIcon className="w-4 h-4 file-icon" />
          <a
            className="file-name file-link"
            href={`/api/minutes/${minuteId}/attachments/${a.id}`}
            title={`${a.file_name} 다운로드`}
            download={a.file_name}
          >
            {a.file_name}
          </a>
          <span className="file-size">{formatBytes(a.file_size)}</span>
          {onDelete ? (
            <button
              type="button"
              className="icon-button danger"
              onClick={() => onDelete(a)}
              disabled={deletingId === a.id}
              aria-label={`${a.file_name} 삭제`}
            >
              <XIcon className="w-4 h-4" />
            </button>
          ) : (
            <a
              className="icon-button"
              href={`/api/minutes/${minuteId}/attachments/${a.id}`}
              download={a.file_name}
              aria-label={`${a.file_name} 다운로드`}
            >
              <DownloadIcon className="w-4 h-4" />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
