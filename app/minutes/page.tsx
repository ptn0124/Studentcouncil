"use client";

import "./minutes.css";
import "react-calendar/dist/Calendar.css";
import { useId, useMemo, useState } from "react";
import Calendar from "react-calendar";

type Minute = {
  id: number;
  title: string;
  date: string;
  summary: string;
  content: string[];
};

const initial: Minute[] = [
  {
    id: 1,
    title: "2026년 5월 정기회의",
    date: "2026-05-20",
    summary: "예산 집행 및 체육대회 준비 논의",
    content: [
      "1. 예산 집행 현황 보고",
      "2. 체육대회 준비 사항",
      "3. 건의함 처리 개선안 논의",
    ],
  },
  {
    id: 2,
    title: "2026년 5월 임시회의",
    date: "2026-05-10",
    summary: "건의함 처리 방식 개선 논의",
    content: [
      "1. 건의함 운영 방식 검토",
      "2. 익명 처리 절차 개선",
      "3. 후속 조치 담당자 지정",
    ],
  },
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const formatKo = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

export default function MinutesPage() {
  const [minutes, setMinutes] = useState<Minute[]>(initial);
  const [selected, setSelected] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "" });
  const uid = useId();

  const byDate = useMemo(
    () =>
      minutes.reduce<Record<string, Minute[]>>((acc, m) => {
        (acc[m.date] ??= []).push(m);
        return acc;
      }, {}),
    [minutes]
  );

  const dayItems = selected
    ? minutes.filter((m) => m.date === ymd(selected))
    : [];
  const active =
    minutes.find((m) => m.id === activeId) ??
    (dayItems.length === 1 ? dayItems[0] : null);

  const startAdd = () => {
    setAdding(true);
    setActiveId(null);
    setForm({ title: "", summary: "", content: "" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !form.title.trim()) return;
    const next: Minute = {
      id: Math.max(0, ...minutes.map((m) => m.id)) + 1,
      date: ymd(selected),
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setMinutes([...minutes, next]);
    setAdding(false);
    setActiveId(next.id);
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
                onClickDay={(d) => {
                  setSelected(d);
                  setActiveId(null);
                  setAdding(false);
                }}
                value={selected}
                tileContent={({ date, view }) => {
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

            {selected && dayItems.length > 1 && !adding && (
              <div className="day-list">
                <div className="day-label">{formatKo(ymd(selected))} 회의록</div>
                {dayItems.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`card ${active?.id === m.id ? "active" : ""}`}
                    onClick={() => setActiveId(m.id)}
                  >
                    <div className="title">{m.title}</div>
                    <div className="summary">{m.summary}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="right">
            {adding && selected ? (
              <form className="form-card" onSubmit={submit} noValidate>
                <div className="form-title">
                  일정 추가
                  <span className="badge">{formatKo(ymd(selected))}</span>
                </div>

                <div className="form">
                  <div className="field">
                    <label htmlFor={`${uid}-title`} className="field-label">
                      제목 <span className="req" aria-hidden="true">*</span>
                      <span className="field-hint">필수</span>
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
                    <label htmlFor={`${uid}-summary`} className="field-label">
                      요약
                      <span className="field-hint">한 줄 요약</span>
                    </label>
                    <input
                      id={`${uid}-summary`}
                      className="input"
                      placeholder="회의에서 다룬 핵심 내용"
                      value={form.summary}
                      onChange={(e) =>
                        setForm({ ...form, summary: e.target.value })
                      }
                      maxLength={140}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={`${uid}-content`} className="field-label">
                      내용
                      <span className="field-hint">줄바꿈으로 항목 구분</span>
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
                    onClick={() => setAdding(false)}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={!form.title.trim()}
                  >
                    저장
                  </button>
                </div>
              </form>
            ) : active ? (
              <div className="detail-card">
                <div className="row between">
                  <h2 className="title">{active.title}</h2>
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
                <div className="meta">
                  {formatKo(active.date)} · 학생회 회의
                </div>
                <div className="content">
                  {active.content.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <button type="button" className="button">
                  PDF 다운로드
                </button>
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
