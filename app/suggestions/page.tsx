"use client";

import React, { useState, useEffect } from "react";

interface Suggestion {
  id: string;
  content: string;
  is_anonymous: boolean;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  reply: string | null;
  created_at: string;
  updated_at: string;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFetchError, setHasFetchError] = useState(false);

  // 1. 건의함 목록 불러오기 (GET /api/suggestions)
  const fetchSuggestions = async () => {
    setIsLoading(true);
    setHasFetchError(false);
    try {
      const response = await fetch("/api/suggestions");
      if (response.ok) {
        const data = await response.json();
        // { suggestions: [...] } 형태로 전달된 데이터 저장
        setSuggestions(data.suggestions || []);
      } else {
        console.error("건의글 목록을 불러오는 데 실패했습니다. 상태 코드:", response.status);
        setHasFetchError(true);
      }
    } catch (error) {
      console.error("API 통신 에러:", error);
      setHasFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // 2. 건의글 작성 및 제출 (POST /api/suggestions)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return alert("건의 내용을 입력해 주세요.");
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          is_anonymous: isAnonymous,
        }),
      });

      if (response.ok) {
        alert("건의글이 성공적으로 등록되었습니다.");
        setContent("");
        setIsAnonymous(true);
        fetchSuggestions(); // 제출 완료 후 목록 새로고침
      } else {
        alert("건의글 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("제출 에러:", error);
      alert("서버와 통신 중 에러가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // status 종류에 따른 뱃지 라벨 및 스타일 정의
  const getStatusInfo = (status: Suggestion["status"]) => {
    switch (status) {
      case "pending":
        return { label: "대기중", style: "bg-amber-100 text-amber-700 border-amber-200" };
      case "in_progress":
        return { label: "처리중", style: "bg-blue-100 text-blue-700 border-blue-200" };
      case "resolved":
        return { label: "해결됨", style: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "rejected":
        return { label: "반려", style: "bg-gray-100 text-gray-600 border-gray-200" };
      default:
        return { label: "대기중", style: "bg-gray-100 text-gray-600 border-gray-200" };
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <h1 className="text-[28px] font-bold text-secondary mb-2">학생 건의함</h1>
      <p className="text-gray-600 mb-8 text-[15px]">
        학교 생활 중 불편한 점이나 개선되었으면 하는 의견을 자유롭게 남겨주세요.
      </p>

      {/* 건의글 작성 폼 (POST 영역) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
        <h2 className="text-[18px] font-bold text-secondary mb-4">건의글 남기기</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[14px] font-semibold text-secondary mb-1">
              건의 내용
            </label>
            <textarea
              rows={4}
              placeholder="구체적인 건의 내용을 적어주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-[15px] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-600 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span>익명으로 제출하기</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-[14px] transition-all disabled:bg-gray-300"
            >
              {isSubmitting ? "제출 중..." : "건의 등록하기"}
            </button>
          </div>
        </form>
      </div>

      {/* 건의글 목록 (GET 영역) */}
      <div>
        <h2 className="text-[18px] font-bold text-secondary mb-4">
          접수된 건의글 목록 ({suggestions.length})
        </h2>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-[14px] border border-gray-100">
            건의글을 불러오는 중입니다...
          </div>
        ) : hasFetchError ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-[14px] border border-gray-100">
            건의글 목록은 관리자 권한이 필요하거나 연결 후 확인 가능합니다.
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-[14px] border border-gray-100">
            아직 등록된 건의글이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="text-[13px] font-medium text-gray-400">
                      {item.is_anonymous ? "익명 작성자" : "학생"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-bold border ${statusInfo.style}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <p className="text-gray-700 text-[15px] whitespace-pre-wrap mb-4">
                    {item.content}
                  </p>

                  {/* 관리자 답변 (reply) 영역 */}
                  {item.reply && (
                    <div className="mt-4 pt-4 border-t border-gray-100 bg-neutralBg/60 p-4 rounded-xl">
                      <div className="mb-1 text-[13px] font-bold text-primary">
                        학생회 답변
                      </div>
                      <p className="text-[14px] text-secondary font-medium whitespace-pre-wrap">
                        {item.reply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}