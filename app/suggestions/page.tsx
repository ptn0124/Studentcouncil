"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Suggestion } from "@/types";
import {
  SUGGESTION_STATUSES,
  SUGGESTION_STATUS_INFO,
  SuggestionStatus,
} from "@/lib/suggestionStatus";
import {
  AuthorLabel,
  StatusBadge,
  formatSuggestionDate,
} from "@/components/suggestions/SuggestionParts";

type StatusFilter = "all" | SuggestionStatus;

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFetchError, setHasFetchError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 1. 건의함 목록 불러오기 (GET /api/suggestions) — state 갱신은 비동기 콜백 안에서
  const fetchSuggestions = () =>
    fetch("/api/suggestions")
      .then(async (response) => {
        if (!response.ok) {
          console.error("건의글 목록을 불러오는 데 실패했습니다. 상태 코드:", response.status);
          setHasFetchError(true);
          return;
        }
        const data = await response.json();
        setHasFetchError(false);
        setSuggestions(data.suggestions || []);
      })
      .catch((error) => {
        console.error("API 통신 에러:", error);
        setHasFetchError(true);
      })
      .finally(() => setIsLoading(false));

  useEffect(() => {
    fetchSuggestions();

    // 관리자/학생회 권한이면 상태 변경 가능
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(["admin", "superadmin"].includes(d.role)))
      .catch(() => {});
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
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        alert("건의글이 성공적으로 등록되었습니다.");
        setContent("");
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

  // 3. 상태 변경 (관리자 전용, PATCH /api/suggestions/[id])
  const handleStatusChange = async (id: string, status: SuggestionStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      const { suggestion } = await res.json();
      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, ...suggestion } : s)));
    } catch (err) {
      alert("상태 변경에 실패했습니다: " + (err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = SUGGESTION_STATUSES.reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: suggestions.filter((item) => item.status === s).length }),
    {},
  );
  const visible =
    filter === "all" ? suggestions : suggestions.filter((item) => item.status === filter);

  const filterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "전체", count: suggestions.length },
    ...SUGGESTION_STATUSES.map((s) => ({
      value: s,
      label: SUGGESTION_STATUS_INFO[s].label,
      count: counts[s] ?? 0,
    })),
  ];

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

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[13px] text-gray-500">
              건의글에는 작성자 이름과 학번이 함께 표시됩니다.
            </p>

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-[18px] font-bold text-secondary">
            접수된 건의글 목록 ({suggestions.length})
          </h2>

          {/* 상태별 필터 */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="처리 상태 필터">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                aria-pressed={filter === opt.value}
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                  filter === opt.value
                    ? "bg-secondary text-white border-secondary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {opt.label} {opt.count}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-[14px] border border-gray-100">
            건의글을 불러오는 중입니다...
          </div>
        ) : hasFetchError ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-[14px] border border-gray-100">
            건의글 목록을 불러오지 못했습니다. 로그인 상태를 확인한 뒤 새로고침해 주세요.
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-[14px] border border-gray-100">
            {suggestions.length === 0
              ? "아직 등록된 건의글이 없습니다."
              : "해당 상태의 건의글이 없습니다."}
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:border-primary/30"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                    <AuthorLabel suggestion={item} />
                    <span className="text-[12px] text-gray-400">
                      {formatSuggestionDate(item.created_at)}
                    </span>
                  </div>
                  {isAdmin ? (
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value as SuggestionStatus)
                      }
                      aria-label="처리 상태 변경"
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${SUGGESTION_STATUS_INFO[item.status]?.style ?? ""}`}
                    >
                      {SUGGESTION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {SUGGESTION_STATUS_INFO[s].label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </div>

                <Link href={`/suggestions/${item.id}`} className="block group">
                  <p className="text-gray-700 text-[15px] whitespace-pre-wrap break-words [overflow-wrap:anywhere] line-clamp-4 group-hover:text-secondary">
                    {item.content}
                  </p>
                  <span className="inline-block mt-2 text-[13px] font-semibold text-primary opacity-80 group-hover:opacity-100">
                    자세히 보기 →
                  </span>
                </Link>

                {/* 관리자 답변 (reply) 영역 */}
                {item.reply && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-neutralBg/60 p-4 rounded-xl">
                    <div className="mb-1 text-[13px] font-bold text-primary">
                      학생회 답변
                    </div>
                    <p className="text-[14px] text-secondary font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {item.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
