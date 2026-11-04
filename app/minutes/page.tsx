"use client";

import { useFeedback } from "@/components/feedback/FeedbackProvider";
import "./minutes.css";
import "react-calendar/dist/Calendar.css"; //캘린더 표시 위해서 라이브러리 사용.
import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import Calendar from "react-calendar";
import type { Minute } from "@/types";
import type { MinuteAttachment } from "@/lib/attachments";
import AttachmentPicker from "@/components/minutes/AttachmentPicker";
import AttachmentList from "@/components/minutes/AttachmentList";
import { uploadMinuteAttachments } from "@/lib/uploadMinuteAttachments";
import { ChevronLeftIcon, ChevronRightIcon, PaperclipIcon, PlusIcon } from "@/components/icons";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const parseYmd = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatKo = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

/** 회의 날짜 → 등록 시각 순(오래된 것 먼저) 비교 */
const byDateAsc = (a: Minute, b: Minute) =>
  a.meeting_date.localeCompare(b.meeting_date) ||
  (a.created_at ?? "").localeCompare(b.created_at ?? "");

const attachmentsOf = (m: Minute) => m.minute_attachments ?? [];

export default function MinutesPage() {
  const { notify, confirm } = useFeedback();
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  // 선택한 회의록은 항상 id로 식별한다 (배열 인덱스/날짜에 의존하지 않음)
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", meeting_date: "" });
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const uid = useId();

  // 특정 회의록을 선택: 날짜·달력 화면도 그 회의록으로 이동
  const selectMinute = (m: Minute) => {
    const d = parseYmd(m.meeting_date);
    setSelected(d);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setActiveId(m.id);
    setAdding(false);
    setEditingId(null);
    // 모바일(1단 레이아웃)에서는 상세가 달력 아래에 있으므로 상세 위치로 스크롤
    if (window.innerWidth <= 1000) {
      requestAnimationFrame(() =>
        document.querySelector(".minutes-page .right")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  };

  useEffect(() => {
    fetch("/api/minutes")
      .then((r) => r.json())
      .then((d) => {
        const list: Minute[] = d.minutes ?? [];
        setMinutes(list);
        // /minutes?id=...(&edit=1) 로 들어오면 해당 회의록을 바로 연다 (상세 페이지에서 이동)
        const params = new URLSearchParams(window.location.search);
        const target = list.find((m) => m.id === params.get("id"));
        if (target) {
          const date = parseYmd(target.meeting_date);
          setSelected(date);
          setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
          setActiveId(target.id);
          if (params.get("edit") === "1") {
            setEditingId(target.id);
            setForm({ title: target.title, content: target.content ?? "", meeting_date: target.meeting_date });
          }
        }
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));

    // 로그인 사용자의 역할 확인 (admin/superadmin이면 추가·수정·삭제 가능)
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(["admin", "superadmin"].includes(d.role)))
      .catch(() => { });
  }, []);

  /** 날짜순(오래된 → 최신) 전체 목록: 이전/다음 이동 기준 */
  const chronological = useMemo(() => [...minutes].sort(byDateAsc), [minutes]);

  const byDate = useMemo(
    () =>
      chronological.reduce<Record<string, Minute[]>>((acc, m) => {
        (acc[m.meeting_date] ??= []).push(m);
        return acc;
      }, {}),
    [chronological]
  );

  const dayItems = selected ? byDate[ymd(selected)] ?? [] : [];
  // 선택된 id가 이 날짜에 없으면(삭제 등) 그 날짜의 첫 회의록을 보여준다.
  // 이전에는 "그 날짜에 회의록이 정확히 1개일 때"만 자동 선택되어,
  // 삭제 후 2개 이상 남으면 상세와 목록이 함께 사라지는 버그가 있었다.
  const active = dayItems.find((m) => m.id === activeId) ?? dayItems[0] ?? null;

  const activeIndex = active ? chronological.findIndex((m) => m.id === active.id) : -1;
  const prevMinute = activeIndex > 0 ? chronological[activeIndex - 1] : null;
  const nextMinute =
    activeIndex >= 0 && activeIndex < chronological.length - 1
      ? chronological[activeIndex + 1]
      : null;

  const listForAll = sortDesc ? [...chronological].reverse() : chronological;
  const editingMinute = editingId ? minutes.find((m) => m.id === editingId) ?? null : null;

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setNewFiles([]);
    setForm({ title: "", content: "", meeting_date: ymd(selected ?? new Date()) });
  };

  const startEdit = (m: Minute) => {
    setEditingId(m.id);
    setAdding(false);
    setNewFiles([]);
    setForm({ title: m.title, content: m.content ?? "", meeting_date: m.meeting_date });
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingId(null);
    setNewFiles([]);
  };

  /** 저장된 회의록에 첨부파일 목록을 반영 */
  const mergeAttachments = (minuteId: string, added: MinuteAttachment[]) => {
    if (added.length === 0) return;
    setMinutes((prev) =>
      prev.map((m) =>
        m.id === minuteId
          ? { ...m, minute_attachments: [...attachmentsOf(m), ...added] }
          : m
      )
    );
  };

  /** 새 첨부파일 업로드 (실패해도 회의록 자체는 저장된 상태) */
  const uploadNewFiles = async (minuteId: string) => {
    if (newFiles.length === 0) return true;
    try {
      const added = await uploadMinuteAttachments(minuteId, newFiles);
      mergeAttachments(minuteId, added);
      setNewFiles([]);
      return true;
    } catch (err) {
      notify("회의록은 저장되었지만 첨부파일 업로드에 실패했습니다.\n" + (err as Error).message, "error");
      return false;
    }
  };

  const patch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.title.trim() || !form.meeting_date || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/minutes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content,
          meeting_date: form.meeting_date,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      const { minute: updated }: { minute: Minute } = await res.json();
      setMinutes((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? { ...updated, minute_attachments: updated.minute_attachments ?? m.minute_attachments }
            : m
        )
      );
      const ok = await uploadNewFiles(updated.id);
      if (ok) {
        setEditingId(null);
        selectMinute(updated);
      }
    } catch (err) {
      notify("수정 실패: " + (err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!(await confirm("삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.", { danger: true, confirmText: "삭제" }))) return;
    try {
      const res = await fetch(`/api/minutes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      setMinutes((prev) => prev.filter((m) => m.id !== id));
      if (activeId === id) setActiveId(null);
    } catch (err) {
      notify("삭제 실패: " + (err as Error).message, "error");
    }
  };

  const removeAttachment = async (minuteId: string, attachment: MinuteAttachment) => {
    if (!(await confirm(`"${attachment.file_name}" 파일을 삭제하시겠습니까?`, { danger: true, confirmText: "삭제" }))) return;
    setDeletingAttachmentId(attachment.id);
    try {
      const res = await fetch(`/api/minutes/${minuteId}/attachments/${attachment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      setMinutes((prev) =>
        prev.map((m) =>
          m.id === minuteId
            ? { ...m, minute_attachments: attachmentsOf(m).filter((a) => a.id !== attachment.id) }
            : m
        )
      );
    } catch (err) {
      notify("첨부파일 삭제 실패: " + (err as Error).message, "error");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meeting_date || !form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content,
          meeting_date: form.meeting_date,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      const { minute: created }: { minute: Minute } = await res.json();
      setMinutes((prev) => [...prev, { ...created, minute_attachments: [] }]);
      await uploadNewFiles(created.id);
      setAdding(false);
      setNewFiles([]);
      selectMinute(created);
    } catch (err) {
      notify("저장 실패: " + (err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = isAdmin && (adding || !!editingMinute);

  return (
    <div className="minutes-page">
      <div className="container wide">
        <div className="header header-row">
          <div>
            <h1>회의록</h1>
            <p>달력에서 날짜를 선택하면 오른쪽에 상세 내용이 표시됩니다</p>
          </div>
          {/* 관리자 전용: 독립된 추가 버튼 */}
          {isAdmin && (
            <button
              type="button"
              className="button primary add-button"
              onClick={startAdd}
              disabled={adding}
            >
              <PlusIcon className="w-4 h-4" />
              회의록 추가
            </button>
          )}
        </div>

        <div className="split">
          <div className="left">
            <div className="calendar-wrap">
              <Calendar
                onClickDay={(d: Date) => {
                  setSelected(d);
                  setActiveId(null);
                  setAdding(false);
                  setEditingId(null);
                }}
                value={selected}
                activeStartDate={viewDate}
                onActiveStartDateChange={({ activeStartDate }: { activeStartDate: Date | null }) => {
                  if (activeStartDate) setViewDate(activeStartDate);
                }}
                tileContent={({ date, view }: { date: Date; view: string }) => {
                  if (view !== "month") return null;
                  const items = byDate[ymd(date)];
                  if (!items) return null;
                  return (
                    <div className="tile-events">
                      {items.map((m) => (
                        <div key={m.id} className="tile-event" title={m.title}>
                          {m.title}
                        </div>
                      ))}
                    </div>
                  );
                }}
                calendarType="gregory"
                locale="ko-KR"
              />
            </div>
          </div>

          <div className="right">
            {showForm ? (
              <form className="form-card" onSubmit={editingMinute ? patch : submit} noValidate>
                <div className="form-title">
                  {editingMinute ? "회의록 수정" : "회의록 추가"}
                  {form.meeting_date && (
                    <span className="badge">{formatKo(form.meeting_date)}</span>
                  )}
                </div>

                <div className="form">
                  <div className="field">
                    <label htmlFor={`${uid}-title`} className="field-label">
                      제목 <span className="req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`${uid}-title`}
                      className="input"
                      placeholder="예: 2026년 5월 정기회의"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      autoFocus
                      required
                      aria-required="true"
                      maxLength={80}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`${uid}-date`} className="field-label">
                      회의 날짜 <span className="req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`${uid}-date`}
                      type="date"
                      className="input"
                      value={form.meeting_date}
                      onChange={(e) =>
                        setForm({ ...form, meeting_date: e.target.value })
                      }
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`${uid}-content`} className="field-label">
                      내용
                    </label>
                    <textarea
                      id={`${uid}-content`}
                      className="input textarea"
                      value={form.content}
                      onChange={(e) =>
                        setForm({ ...form, content: e.target.value })
                      }
                      rows={8}
                    />
                  </div>
                  <div className="field">
                    <span className="field-label">첨부파일</span>
                    {editingMinute && (
                      <AttachmentList
                        minuteId={editingMinute.id}
                        attachments={attachmentsOf(editingMinute)}
                        onDelete={(a) => removeAttachment(editingMinute.id, a)}
                        deletingId={deletingAttachmentId}
                      />
                    )}
                    <AttachmentPicker
                      files={newFiles}
                      onChange={setNewFiles}
                      existingCount={editingMinute ? attachmentsOf(editingMinute).length : 0}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={cancelForm}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={!form.title.trim() || !form.meeting_date || submitting}
                  >
                    {submitting ? (newFiles.length ? "업로드 중..." : "저장 중...") : "저장"}
                  </button>
                </div>
              </form>
            ) : selected ? (
              active ? (
                <div className="right-panel">
                  <div className="panel-toolbar">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setSelected(null);
                        setActiveId(null);
                      }}
                    >
                      <ChevronLeftIcon className="w-4 h-4" /> 전체 목록
                    </button>
                  </div>

                  {/* 같은 날짜에 회의록이 여러 개면 탭처럼 골라 볼 수 있게 */}
                  {dayItems.length > 1 && (
                    <div className="day-list" role="tablist" aria-label={`${formatKo(ymd(selected))} 회의록`}>
                      <div className="day-label">
                        {formatKo(ymd(selected))} 회의록 {dayItems.length}건
                      </div>
                      {dayItems.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          role="tab"
                          aria-selected={active.id === m.id}
                          className={`day-item ${active.id === m.id ? "active" : ""}`}
                          onClick={() => setActiveId(m.id)}
                        >
                          <span className="day-item-title">{m.title}</span>
                          {attachmentsOf(m).length > 0 && (
                            <span className="day-item-meta">
                              <PaperclipIcon className="w-3.5 h-3.5" />
                              {attachmentsOf(m).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="detail-card">
                    <div className="row between detail-head">
                      <h2 className="detail-card-title">{active.title}</h2>
                      {isAdmin && (
                        <div className="detail-actions">
                          <button
                            type="button"
                            className="button ghost sm"
                            onClick={() => startEdit(active)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="button ghost sm danger"
                            onClick={() => remove(active.id)}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="meta">
                      {formatKo(active.meeting_date)}
                      <span className="meta-sep">·</span>
                      <Link href={`/minutes/${active.id}`} className="meta-link">
                        전체 화면으로 보기
                      </Link>
                    </div>
                    <div className="content content-text">
                      {active.content || <span className="muted">내용이 없습니다.</span>}
                    </div>

                    {attachmentsOf(active).length > 0 && (
                      <div className="attachments">
                        <div className="attachments-title">
                          <PaperclipIcon className="w-4 h-4" />
                          첨부파일 {attachmentsOf(active).length}개
                        </div>
                        <AttachmentList minuteId={active.id} attachments={attachmentsOf(active)} />
                      </div>
                    )}

                    {/* 날짜순 이전/다음 회의록 이동 */}
                    <nav className="pager" aria-label="회의록 이동">
                      <button
                        type="button"
                        className="pager-item"
                        disabled={!prevMinute}
                        onClick={() => prevMinute && selectMinute(prevMinute)}
                      >
                        <span className="pager-label">
                          <ChevronLeftIcon className="w-3.5 h-3.5" /> 이전 회의록
                        </span>
                        <span className="pager-title">
                          {prevMinute ? prevMinute.title : "없음"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="pager-item next"
                        disabled={!nextMinute}
                        onClick={() => nextMinute && selectMinute(nextMinute)}
                      >
                        <span className="pager-label">
                          다음 회의록 <ChevronRightIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="pager-title">
                          {nextMinute ? nextMinute.title : "없음"}
                        </span>
                      </button>
                    </nav>
                  </div>
                </div>
              ) : (
                <div className="empty tall">
                  <div>{formatKo(ymd(selected))}에 등록된 회의록이 없습니다.</div>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setSelected(null)}
                  >
                    전체 목록 보기
                  </button>
                </div>
              )
            ) : (
              /* 날짜를 고르기 전: 전체 회의록 목록 (날짜순 정렬) */
              <div className="list-card">
                <div className="row between list-head">
                  <div className="list-title">전체 회의록 {minutes.length}건</div>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setSortDesc((v) => !v)}
                    aria-label="정렬 순서 바꾸기"
                  >
                    {sortDesc ? "최신순" : "오래된순"} ↕
                  </button>
                </div>
                {isLoading ? (
                  <div className="list-empty">불러오는 중...</div>
                ) : listForAll.length === 0 ? (
                  <div className="list-empty">등록된 회의록이 없습니다.</div>
                ) : (
                  <ul className="minute-list">
                    {listForAll.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="minute-row"
                          onClick={() => selectMinute(m)}
                        >
                          <span className="minute-row-title">{m.title}</span>
                          <span className="minute-row-meta">
                            {formatKo(m.meeting_date)}
                            {attachmentsOf(m).length > 0 && (
                              <span className="day-item-meta">
                                <PaperclipIcon className="w-3.5 h-3.5" />
                                {attachmentsOf(m).length}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
