"use client";

import { useId, useRef, useState } from "react";
import {
  ACCEPT_ATTR,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_MINUTE,
  formatBytes,
  validateAttachment,
} from "@/lib/attachments";
import { PaperclipIcon, UploadIcon, XIcon } from "@/components/icons";

interface Props {
  /** 업로드 대기 중인 새 파일 */
  files: File[];
  onChange: (files: File[]) => void;
  /** 이미 등록된 첨부 개수 (수정 시) */
  existingCount?: number;
  disabled?: boolean;
}

/** 파일 선택 버튼 + 드래그앤드롭 + 업로드 전 목록(파일명·크기·삭제) */
export default function AttachmentPicker({ files, onChange, existingCount = 0, disabled }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const remaining = MAX_FILES_PER_MINUTE - existingCount - files.length;

  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files];
    const errs: string[] = [];
    for (const file of Array.from(incoming)) {
      const err = validateAttachment(file);
      if (err) {
        errs.push(err);
        continue;
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) {
        errs.push(`"${file.name}": 이미 추가된 파일입니다.`);
        continue;
      }
      if (existingCount + next.length >= MAX_FILES_PER_MINUTE) {
        errs.push(`첨부파일은 회의록당 최대 ${MAX_FILES_PER_MINUTE}개까지 가능합니다.`);
        break;
      }
      next.push(file);
    }
    setErrors(errs);
    onChange(next);
  };

  const removeAt = (index: number) => {
    setErrors([]);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="attach-picker">
      <div
        className={`dropzone ${dragOver ? "over" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        <UploadIcon className="w-6 h-6 dropzone-icon" />
        <div className="dropzone-text">
          파일을 여기로 끌어다 놓거나{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || remaining <= 0}
          >
            파일 선택
          </button>
        </div>
        <div className="dropzone-hint">
          {ALLOWED_EXTENSIONS.join(", ")} · 파일당 {formatBytes(MAX_FILE_SIZE)} · 최대 {MAX_FILES_PER_MINUTE}개
          {existingCount + files.length > 0 && ` (남은 개수 ${Math.max(remaining, 0)}개)`}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = ""; // 같은 파일을 다시 고를 수 있게 초기화
          }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="attach-errors" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.size}-${i}`} className="file-item pending">
              <PaperclipIcon className="w-4 h-4 file-icon" />
              <span className="file-name" title={file.name}>{file.name}</span>
              <span className="file-size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`${file.name} 첨부 취소`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
