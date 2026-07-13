"use client";

import "./minutes.css";
import Link from "next/link";

const minutes = [
  {
    id: 1,
    title: "2026년 5월 정기회의",
    date: "2026-05-20",
    summary: "예산 집행 및 체육대회 준비 논의",
  },
  {
    id: 2,
    title: "2026년 5월 임시회의",
    date: "2026-05-10",
    summary: "건의함 처리 방식 개선 논의",
  },
];

export default function MinutesPage() {
  return (
    <div className="page">
      <div className="container wide">
        <div className="header">
          <h1>회의록</h1>
          <p>달력에서 날짜를 선택하면 오른쪽에 상세 내용이 표시됩니다</p>
        </div>

        <div className="list">
          {minutes.map((m) => (
            <Link key={m.id} href={`/minutes/${m.id}`} className="card">
              <div className="title">{m.title}</div>
              <div className="date">{m.date}</div>
              <div className="summary">{m.summary}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
