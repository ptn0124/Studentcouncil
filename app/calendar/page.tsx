"use client";

import React, { useState, useEffect } from "react";

interface Schedule {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 백엔드 REST API(/api/calendar)에서 학사 일정 불러오기
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/calendar");
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        console.error("일정을 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("API 통신 에러:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <h1 className="text-[28px] font-bold text-secondary mb-6">학사 캘린더</h1>

      {/* 달력 본체 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-bold text-secondary">
            {year}년 {month + 1}월
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-neutralBg rounded-lg hover:bg-gray-200 text-[14px] transition-colors"
            >
              이전 달
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-[14px] transition-opacity"
            >
              다음 달
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 text-center text-[15px] font-semibold mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div
              key={d}
              className={d === "일" ? "text-red-500" : d === "토" ? "text-blue-500" : "text-secondary"}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-[14px]">일정을 불러오는 중입니다...</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySchedules = schedules.filter((s) => s.date === dateStr);

              return (
                <div key={day} className="min-h-[85px] p-2 bg-neutralBg/50 border border-gray-100 rounded-xl">
                  <span className="text-[14px] font-semibold text-secondary">{day}</span>
                  {daySchedules.map((s) => (
                    <div key={s.id} className="text-[11px] bg-primary text-white p-1 rounded mt-1 truncate">
                      {s.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}