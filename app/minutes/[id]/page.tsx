"use client";

import { useFeedback } from "@/components/feedback/FeedbackProvider";
import "../minutes.css";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Minute } from "@/types";
import AttachmentList from "@/components/minutes/AttachmentList";
import { ChevronLeftIcon, ChevronRightIcon, PaperclipIcon } from "@/components/icons";

const formatKo = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

const byDateAsc = (a: Minute, b: Minute) =>
  a.meeting_date.localeCompare(b.meeting_date) ||
  (a.created_at ?? "").localeCompare(b.created_at ?? "");

export default function MinutesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { notify, confirm } = useFeedback();
  const { id } = use(params);
  const router = useRouter();
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);

  // 목록 전체를 한 번 불러와 사이드 목록·이전/다음 이동에 함께 쓴다 (id로만 식별)
  useEffect(() => {
    fetch("/api/minutes")
      .then((r) => r.json())
      .then((d) => setMinutes(d.minutes ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));

    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(["admin", "superadmin"].includes(d.role)))
      .catch(() => {});
  }, []);

  const chronological = useMemo(() => [...minutes].sort(byDateAsc), [minutes]);
  const index = chronological.findIndex((m) => m.id === id);
  const minute = index >= 0 ? chronological[index] : null;
  const prev = index > 0 ? chronological[index - 1] : null;
  const next = index >= 0 && index < chronological.length - 1 ? chronological[index + 1] : null;
  const list = sortDesc ? [...chronological].reverse() : chronological;
  const attachments = minute?.minute_attachments ?? [];

  const remove = async () => {
    if (!minute || !(await confirm("삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.", { danger: true, confirmText: "삭제" }))) return;
    try {
      const res = await fetch(`/api/minutes/${minute.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      setMinutes((prevList) => prevList.filter((m) => m.id !== minute.id));
      const fallback = next ?? prev;
      router.replace(fallback ? `/minutes/${fallback.id}` : "/minutes");
    } catch (err) {
      notify("삭제 실패: " + (err as Error).message, "error");
    }
  };

  return (
    <div className="minutes-page">
      <div className="container wide">
        <div className="breadcrumb">
          <Link href="/minutes">회의록</Link>
          <span aria-hidden="true">›</span>
          <span>상세 보기</span>
        </div>

        <div className="detail-layout">
          {/* 사이드 목록: 현재 회의록 강조, 날짜순 정렬 */}
          <aside className="list-card side-list">
            <div className="row between list-head">
              <div className="list-title">회의록 {minutes.length}건</div>
              <button
                type="button"
                className="link-button"
                onClick={() => setSortDesc((v) => !v)}
                aria-label="정렬 순서 바꾸기"
              >
                {sortDesc ? "최신순" : "오래된순"} ↕
              </button>
            </div>
            <ul className="minute-list">
              {list.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/minutes/${m.id}`}
                    className={`minute-row ${m.id === id ? "active" : ""}`}
                    aria-current={m.id === id ? "page" : undefined}

                  >
                    <span className="minute-row-title">{m.title}</span>
                    <span className="minute-row-meta">
                      {formatKo(m.meeting_date)}
                      {(m.minute_attachments?.length ?? 0) > 0 && (
                        <span className="day-item-meta">
                          <PaperclipIcon className="w-3.5 h-3.5" />
                          {m.minute_attachments!.length}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div className="detail-main">
            {isLoading ? (
              <div className="empty tall">불러오는 중...</div>
            ) : !minute ? (
              <div className="empty tall">
                <div>존재하지 않거나 삭제된 회의록입니다.</div>
                <Link href="/minutes" className="link-button">
                  회의록 목록으로
                </Link>
              </div>
            ) : (
              <div className="detail-card">
                <div className="row between detail-head">
                  <h1 className="detail-card-title">{minute.title}</h1>
                  {isAdmin && (
                    <div className="detail-actions">
                      <Link
                        href={`/minutes?id=${minute.id}&edit=1`}
                        className="button ghost sm"
                      >
                        수정
                      </Link>
                      <button type="button" className="button ghost sm danger" onClick={remove}>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                <div className="meta">
                  {formatKo(minute.meeting_date)}
                  <span className="meta-sep">·</span>
                  {index + 1} / {chronological.length}
                </div>

                <div className="content content-text">
                  {minute.content || <span className="muted">내용이 없습니다.</span>}
                </div>

                <div className="attachments">
                  <div className="attachments-title">
                    <PaperclipIcon className="w-4 h-4" />
                    첨부파일 {attachments.length}개
                  </div>
                  {attachments.length > 0 ? (
                    <AttachmentList minuteId={minute.id} attachments={attachments} />
                  ) : (
                    <div className="muted small">첨부파일이 없습니다.</div>
                  )}
                </div>

                <nav className="pager" aria-label="회의록 이동">
                  {prev ? (
                    <Link href={`/minutes/${prev.id}`} className="pager-item">
                      <span className="pager-label">
                        <ChevronLeftIcon className="w-3.5 h-3.5" /> 이전 회의록
                      </span>
                      <span className="pager-title">{prev.title}</span>
                    </Link>
                  ) : (
                    <span className="pager-item" aria-disabled="true">
                      <span className="pager-label">
                        <ChevronLeftIcon className="w-3.5 h-3.5" /> 이전 회의록
                      </span>
                      <span className="pager-title">없음</span>
                    </span>
                  )}
                  {next ? (
                    <Link href={`/minutes/${next.id}`} className="pager-item next">
                      <span className="pager-label">
                        다음 회의록 <ChevronRightIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="pager-title">{next.title}</span>
                    </Link>
                  ) : (
                    <span className="pager-item next" aria-disabled="true">
                      <span className="pager-label">
                        다음 회의록 <ChevronRightIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="pager-title">없음</span>
                    </span>
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
