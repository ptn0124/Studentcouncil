import "../minutes.css";

export default async function MinutesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="page">
      <div className="container">
        <div className="detail-card">
          <h1 className="title">2026년 {id}번 회의록</h1>

          <div className="meta">2026-05-20 · 학생회 회의</div>

          <div className="content">
            <p>1. 예산 집행 현황 보고</p>
            <p>2. 체육대회 준비 사항</p>
            <p>3. 건의함 처리 개선안 논의</p>
          </div>

          <button className="button">PDF 다운로드</button>
        </div>
      </div>
    </div>
  );
}
