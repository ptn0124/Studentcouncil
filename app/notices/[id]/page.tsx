"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Notice } from "@/types";

export interface NoticeDetailProps {
  params: Promise<{ id: string }>;
}

export default function NoticeDetailPage({ params }: NoticeDetailProps) {
  const { id } = use(params);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const res = await fetch(`/api/notices/${id}`);
        if (!res.ok) {
          throw new Error("Notice not found");
        }
        const data = await res.json();
        setNotice(data.notice);
      } catch (error) {
        console.error("Failed to fetch notice detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoticeDetail();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f39733]" />
        <p className="text-[14px] text-[#2c3e50]/50">공지사항 상세 내용을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#2c3e50]/10 max-w-[600px] mx-auto space-y-4">
        <p className="text-[32px]">⚠️</p>
        <h2 className="text-[20px] font-bold text-[#2c3e50]">존재하지 않는 공지사항</h2>
        <p className="text-[14px] text-[#2c3e50]/50">삭제되었거나 잘못된 경로입니다.</p>
        <div className="pt-4">
          <Link
            href="/notices"
            className="text-[14px] font-semibold px-6 py-2.5 bg-[#2c3e50] text-[#faf8f5] rounded-xl hover:bg-[#f39733] transition-colors duration-300"
          >
            공지사항 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-[900px] mx-auto space-y-8 py-6">
      {/* 상단 네비게이션 경로 */}
      <div className="flex items-center space-x-2 text-[14px] text-[#2c3e50]/50">
        <Link href="/" className="hover:text-[#f39733] transition-colors duration-200">
          홈
        </Link>
        <span>&gt;</span>
        <Link href="/notices" className="hover:text-[#f39733] transition-colors duration-200">
          공지사항
        </Link>
        <span>&gt;</span>
        <span className="text-[#2c3e50]/70 truncate max-w-[200px] sm:max-w-[400px]">
          상세 보기
        </span>
      </div>

      {/* 헤더 영역 */}
      <div className="space-y-4 pb-6 border-b border-[#2c3e50]/10">
        <div className="flex items-center gap-2">
          {notice.isPinned && (
            <span className="bg-[#f39733] text-[#faf8f5] text-[12px] font-bold px-2.5 py-1 rounded-md shadow-sm">
              📌 중요 공지
            </span>
          )}
        </div>

        {/* H1: 30px */}
        <h1 className="text-[30px] font-extrabold text-[#2c3e50] leading-snug tracking-tight">
          {notice.title}
        </h1>

        {/* 메타정보 (캡션) caption: 14px */}
        <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#2c3e50]/50">
          <span className="font-medium text-[#2c3e50]/70">👤 작성자: {notice.author || "작성자 없음"}</span>
          <span>•</span>
          <span>📅 등록: {formatDate(notice.createdAt)}</span>
          <span>•</span>
          <span>👀 조회수: {notice.views}</span>
        </div>
      </div>

      {/* 본문 영역 body: 16px */}
      <div className="bg-white/70 backdrop-blur-sm border border-[#2c3e50]/10 rounded-2xl p-6 md:p-10 shadow-sm">
        <div className="text-[16px] text-[#2c3e50] whitespace-pre-wrap leading-relaxed space-y-4">
          {notice.content}
        </div>
      </div>

      {/* 하단 이동 버튼 */}
      <div className="flex justify-between items-center pt-4 border-t border-[#2c3e50]/10">
        <Link
          href="/notices"
          className="inline-flex items-center gap-1 text-[16px] font-semibold text-[#2c3e50] hover:text-[#f39733] transition-colors duration-300"
        >
          <span className="text-[18px]">←</span> 목록으로 돌아가기
        </Link>
      </div>
    </article>
  );
}
