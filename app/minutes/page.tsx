"use client";

import "./minutes.css";
import "react-calendar/dist/Calendar.css"; //캘린더 표시 위해서 라이브러리 사용.
import { useEffect, useId, useMemo, useState } from "react";
import Calendar from "react-calendar";

type Minute = {
  id: string;
  title: string;
  content: string;
  meeting_date: string;
  author_id?: string;
  created_at?: string;
  updated_at?: string; //..?
};

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const formatKo = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

export default function MinutesPage() {
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [selected, setSelected] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const uid = useId();

  useEffect(() => {
    fetch("/api/minutes")
      .then((r) => r.json())
      .then((d) => setMinutes(d.minutes ?? []))
      .catch(() => {});
  }, []);

  const byDate = useMemo(
    () =>
      minutes.reduce<Record<string, Minute[]>>((acc, m) => {
        (acc[m.meeting_date] ??= []).push(m);
        return acc;
      }, {}),
    [minutes]
  );

  const dayItems = selected
    ? minutes.filter((m) => m.meeting_date === ymd(selected))
    : [];
  const active =
    minutes.find((m) => m.id === activeId) ??
    (dayItems.length === 1 ? dayItems[0] : null);

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setActiveId(null);
    setForm({ title: "", content: "" });
  };

  const startEdit = (m: Minute) => {
    setEditingId(m.id);
    setAdding(false);
    setForm({ title: m.title, content: m.content });
  };

  const patch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/minutes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: Minute = await res.json();
      setMinutes((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      alert("수정 실패: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/minutes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setMinutes((prev) => prev.filter((m) => m.id !== id));
      if (activeId === id) setActiveId(null);
    } catch (err) {
      alert("삭제 실패: " + (err as Error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content,
          meeting_date: ymd(selected),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Minute = await res.json();
      setMinutes((prev) => [...prev, created]);
      setAdding(false);
      setActiveId(created.id);
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container wide">
        <div className="header">
          <h1>회의록</h1>
          <p>달력에서 날짜를 선택하면 오른쪽에 상세 내용이 표시됩니다</p>
        </div>

        <div className="split">
          <div className="left">
            <div className="calendar-wrap">
              <Calendar
                onClickDay={(d: Date) => {
                  setSelected(d);
                  setActiveId(null);
                  setAdding(false);
                }}
                value={selected}
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

            

            {(adding && selected) || editingId ? (
              <form className="form-card" onSubmit={editingId ? patch : submit} noValidate>
                <div className="form-title">
                  {editingId ? "회의록 수정" : "일정 추가"}
                  {selected && !editingId && (
                    <span className="badge">{formatKo(ymd(selected))}</span>
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
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => {
                      setAdding(false);
                      setEditingId(null);
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={!form.title.trim() || submitting}
                  >
                    {submitting ? "저장 중..." : "저장"}
                  </button>
                </div>
              </form>
            ) : active ? (
              <div className="right-panel">
              <div className="detail-card-head">
                {selected && dayItems.length > 1 && !adding && (
                  <div className="day-list">
                    <div className="day-label">{formatKo(ymd(selected))} 회의록</div>
                    {dayItems.map((m) => (
                      <div className="right-head-button">
                        <button
                          key={m.id}
                          type="button"
                          className={`card ${active?.id === m.id ? "active" : ""}`}
                          onClick={() => setActiveId(m.id)}
                        >
                          <div className="title">{m.title}</div>
                        </button>
                        <button>
                          
                        </button>
                      </div>
                    ))}
                  </div>
                 )}
              </div>
              <div className="detail-card">
                <div className="row between">
                  <h2 className="detail-card-title">{active.title}</h2>
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
                      className="button ghost sm"
                      onClick={() => remove(active.id)}
                    >
                      삭제
                    </button>
                    {selected && (
                      <button
                        type="button"
                        className="button ghost sm"
                        onClick={startAdd}
                      >
                        + 일정 추가
                      </button>
                    )}
                  </div>
                </div>
                <div className="meta">
                  {formatKo(active.meeting_date)}
                </div>
                <div className="content">
                  {active.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
            ) : (
              <div className="empty tall">
                {selected ? (
                  <>
                    <div className="icon" aria-hidden="true">
                      +
                    </div>
                    <div>
                      {formatKo(ymd(selected))}에 등록된 회의록이 없습니다.
                    </div>
                    <button
                      type="button"
                      className="button primary"
                      onClick={startAdd}
                    >
                      일정 추가
                    </button>
                  </>
                ) : (
                  "달력에서 날짜를 선택해 주세요."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
