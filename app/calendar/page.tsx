"use client";

import React, { useState, useEffect } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  description?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔐 관리자 권한 상태 (실제 서비스에서는 로그인 세션/유저 정보에서 가져옵니다)
  const [isAdmin, setIsAdmin] = useState(true); // 테스트용 (기본값 true)

  // 📝 모달 및 수정 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // 폼 입력 상태
  const [formTitle, setFormTitle] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 학사 일정 불러오기 (GET /api/calendar)
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/calendar");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error("일정을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("API 통신 에러:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 달력 연/월 계산
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 이번 달 첫째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이전/다음 달 이동
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // 날짜 형식 맞추기 (YYYY-MM-DD)
  const formatDateString = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  // 2. 날짜 클릭 처리 (관리자 권한 체크)
  const handleDateClick = (day: number) => {
    const dateStr = formatDateString(day);

    // 🔒 관리자가 아닌 경우 안내 후 종료
    if (!isAdmin) {
      alert("일정 등록 및 수정은 관리자만 가능합니다.");
      return;
    }

    setSelectedDate(dateStr);

    // 해당 날짜에 이미 등록된 일정이 있는지 확인
    const existingEvent = events.find(
      (evt) => evt.start_date <= dateStr && evt.end_date >= dateStr
    );

    if (existingEvent) {
      // 기존 일정 수정 모드
      setEditingEventId(existingEvent.id);
      setFormTitle(existingEvent.title);
      setFormStartDate(existingEvent.start_date);
      setFormEndDate(existingEvent.end_date);
      setFormDescription(existingEvent.description || "");
    } else {
      // 새 일정 등록 모드
      setEditingEventId(null);
      setFormTitle("");
      setFormStartDate(dateStr);
      setFormEndDate(dateStr);
      setFormDescription("");
    }

    setIsModalOpen(true);
  };

  // 3. 일정 저장 (추가 또는 수정)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      return alert("일정 제목을 입력해 주세요.");
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formTitle,
        start_date: formStartDate,
        end_date: formEndDate,
        description: formDescription,
      };

      let response;
      if (editingEventId) {
        // 수정 (PATCH /api/calendar/[id])
        response = await fetch(`/api/calendar/${editingEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // 생성 (POST /api/calendar)
        response = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        alert(editingEventId ? "일정이 수정되었습니다." : "일정이 등록되었습니다.");
        setIsModalOpen(false);
        fetchEvents(); // 목록 새로고침
      } else {
        alert("처리에 실패했습니다. (권한을 확인해 주세요)");
      }
    } catch (error) {
      console.error("일정 저장 에러:", error);
      alert("서버 통신 중 에러가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. 일정 삭제
  const handleDeleteEvent = async () => {
    if (!editingEventId) return;
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/calendar/${editingEventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("일정이 삭제되었습니다.");
        setIsModalOpen(false);
        fetchEvents();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 에러:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      {/* 상단 헤더 & 권한 테스트 토글 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-secondary">학사 일정 캘린더</h1>
          <p className="text-gray-600 text-[14px]">
            {isAdmin
              ? "💡 날짜를 클릭하면 관리자 권한으로 일정을 등록·수정할 수 있습니다."
              : "학교의 주요 학사 일정을 확인하세요."}
          </p>
        </div>

        {/* 테스트용 권한 토글 스위치 (개발 시 확인용) */}
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl text-[13px]">
          <span className="font-semibold text-gray-700">권한 테스트:</span>
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              isAdmin
                ? "bg-primary text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {isAdmin ? "관리자 (수정 가능)" : "학생 (읽기 전용)"}
          </button>
        </div>
      </div>

      {/* 달력 조종 헤더 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[22px] font-bold text-secondary">
              {year}년 {month + 1}월
            </h2>
            <button
              onClick={handleToday}
              className="px-3 py-1 bg-neutralBg hover:bg-gray-200 text-secondary text-[13px] font-semibold rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[14px]"
            >
              ◀ 이전달
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[14px]"
            >
              다음달 ▶
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 text-center font-bold text-[14px] text-gray-500 mb-2 border-b pb-2">
          <span className="text-red-500">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-blue-500">토</span>
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 이전 달 빈 칸 */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-28 bg-gray-50/50 rounded-xl" />
          ))}

          {/* 이번 달 날짜 셀 */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNumber = index + 1;
            const dateStr = formatDateString(dayNumber);

            // 해당 날짜에 걸쳐있는 일정들 찾기
            const dayEvents = events.filter(
              (evt) => evt.start_date <= dateStr && evt.end_date >= dateStr
            );

            const isToday =
              new Date().toISOString().split("T")[0] === dateStr;

            return (
              <div
                key={dayNumber}
                onClick={() => handleDateClick(dayNumber)}
                className={`h-28 p-2 border border-gray-100 rounded-xl transition-all flex flex-col justify-start overflow-hidden ${
                  isAdmin ? "cursor-pointer hover:border-primary hover:shadow-sm" : ""
                } ${isToday ? "bg-blue-50/40 border-primary/30" : "bg-white"}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[13px] font-bold ${
                      isToday
                        ? "w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[12px]"
                        : "text-secondary"
                    }`}
                  >
                    {dayNumber}
                  </span>
                </div>

                {/* 일정 바 표시 */}
                <div className="space-y-1 overflow-y-auto">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-1 rounded truncate"
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🛠️ 관리자 전용 일정 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-[480px] w-full p-6 shadow-xl">
            <h3 className="text-[20px] font-bold text-secondary mb-1">
              {editingEventId ? "학사 일정 수정" : "새 학사 일정 등록"}
            </h3>
            <p className="text-[13px] text-gray-500 mb-6">
              선택한 날짜: <span className="font-bold text-primary">{selectedDate}</span>
            </p>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-secondary mb-1">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  placeholder="예: 중간고사, 개교기념일"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-[14px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-secondary mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-secondary mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-secondary mb-1">
                  상세 설명 (선택)
                </label>
                <textarea
                  rows={3}
                  placeholder="추가 세부 사항을 적어주세요."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-[14px] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {editingEventId ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-[13px] transition-colors"
                  >
                    삭제
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[13px] transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-[13px] transition-colors disabled:bg-gray-300"
                  >
                    {isSubmitting ? "저장 중..." : "저장하기"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}