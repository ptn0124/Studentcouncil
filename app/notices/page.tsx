"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Notice } from "@/types";

export interface NoticeListProps {
  // 정의된 props가 있다면 여기에 작성합니다. (현재는 없음)
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 디바운스 처리 (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 공지사항 데이터 페칭
  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoading(true);
      try {
        const url = debouncedSearch
          ? `/api/notices?search=${encodeURIComponent(debouncedSearch)}`
          : "/api/notices";
        const res = await fetch(url);
        const data = await res.json();
        setNotices(data.notices || []);
      } catch (error) {
        console.error("Failed to fetch notices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, [debouncedSearch]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-10 py-6">
      {/* 헤더 & 검색바 영역 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2c3e50]/10">
        <div className="space-y-2">
          {/* H1: 30px */}
          <h1 className="text-[30px] font-extrabold text-[#2c3e50] tracking-tight">
            공지사항
          </h1>
          <p className="text-[14px] text-[#2c3e50]/60">
            학생회의 새로운 소식과 주요 안내 사항을 전달합니다.
          </p>
        </div>

        {/* 검색창 */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="공지 제목 또는 본문 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[16px] px-4 py-3 pl-10 bg-white border border-[#2c3e50]/20 rounded-xl focus:outline-none focus:border-[#f39733] focus:ring-2 focus:ring-[#f39733]/10 transition-all duration-300 shadow-sm"
          />
          <div className="absolute left-3.5 top-3.5 text-[#2c3e50]/40">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-3.5 text-[#2c3e50]/40 hover:text-[#2c3e50]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 공지사항 목록 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f39733]" />
          <p className="text-[14px] text-[#2c3e50]/50">공지사항을 불러오는 중입니다...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#2c3e50]/5">
          <p className="text-[24px] mb-3">🔍</p>
          <p className="text-[16px] text-[#2c3e50]/60 font-medium">검색 결과가 없습니다.</p>
          <p className="text-[14px] text-[#2c3e50]/40 mt-1">다른 검색어를 입력해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice) => {
            return (
              <Link
                key={notice.id}
                href={`/notices/${notice.id}`}
                className={`block group relative rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
                  notice.is_pinned
                    ? "bg-[#f39733]/5 hover:bg-[#f39733]/10 border-[#f39733]/30"
                    : "bg-white/70 backdrop-blur-sm hover:bg-white border-[#2c3e50]/10"
                }`}
              >
                {/* 중요 핀 표식 */}
                {notice.is_pinned && (
                  <div className="absolute right-0 top-0 bg-[#f39733] text-[#faf8f5] text-[12px] font-bold px-3.5 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    📌 <span>중요</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* 제목 H2: 20px */}
                  <h2 className={`text-[20px] font-bold text-[#2c3e50] group-hover:text-[#f39733] transition-colors duration-300 pr-16 leading-snug`}>
                    {notice.title}
                  </h2>

                  {/* 본문 미리보기 (일부만) body: 16px */}
                  <p className="text-[16px] text-[#2c3e50]/70 line-clamp-2 leading-relaxed">
                    {notice.content}
                  </p>

                  {/* 메타정보 (캡션) caption: 14px */}
                  <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#2c3e50]/50 pt-2">
                    <span className="flex items-center gap-1 font-medium text-[#2c3e50]/60">
                      👤 {notice.author_name || "작성자 없음"}
                    </span>
                    <span>•</span>
                    <span>📅 {formatDate(notice.created_at)}</span>
                    <span>•</span>
                    <span>👀 조회수 {notice.views}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
