"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function SuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 처리 폼
  const [status, setStatus] = useState<SuggestionStatus>("pending");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/suggestions/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const s: Suggestion | null = d?.suggestion ?? null;
        setSuggestion(s);
        if (s) {
          setStatus(s.status);
          setReply(s.reply ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(["admin", "superadmin"].includes(d.role)))
      .catch(() => {});
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reply: reply.trim() ? reply : null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      const { suggestion: updated } = await res.json();
      setSuggestion((prev) => (prev ? { ...prev, ...updated } : updated));
      alert("저장되었습니다.");
    } catch (err) {
      alert("저장에 실패했습니다: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 건의글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      router.push("/suggestions");
    } catch (err) {
      alert("삭제에 실패했습니다: " + (err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-gray-400 text-[14px]">
        건의글을 불러오는 중입니다...
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-[16px] font-semibold text-secondary">존재하지 않거나 삭제된 건의글입니다.</p>
        <Link href="/suggestions" className="text-[14px] font-semibold text-primary">
          건의함으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2 text-[14px] text-gray-500">
        <Link href="/suggestions" className="hover:text-primary transition-colors">
          학생 건의함
        </Link>
        <span>&gt;</span>
        <span>상세 보기</span>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex flex-col gap-1 min-w-0">
            <AuthorLabel suggestion={suggestion} />
            <span className="text-[12px] text-gray-400">
              {formatSuggestionDate(suggestion.created_at)} 접수
            </span>
          </div>
          <StatusBadge status={suggestion.status} />
        </div>

        <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {suggestion.content}
        </p>

        {suggestion.reply && (
          <div className="mt-6 bg-neutralBg/60 p-4 rounded-xl">
            <div className="mb-1 text-[13px] font-bold text-primary">학생회 답변</div>
            <p className="text-[14px] text-secondary font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {suggestion.reply}
            </p>
          </div>
        )}
      </div>

      {/* 관리자/학생회 전용: 처리 상태·답변 */}
      {isAdmin && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4"
        >
          <h2 className="text-[16px] font-bold text-secondary">처리 상태 관리</h2>

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="처리 상태">
            {SUGGESTION_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                onClick={() => setStatus(s)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-all ${
                  status === s
                    ? `${SUGGESTION_STATUS_INFO[s].style} ring-2 ring-offset-1 ring-current`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {SUGGESTION_STATUS_INFO[s].label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-secondary mb-1" htmlFor="reply">
              학생회 답변 (선택)
            </label>
            <textarea
              id="reply"
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="처리 결과나 답변을 적어 주세요."
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-[14px] resize-none"
            />
          </div>

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-[13px] transition-colors"
            >
              삭제
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-[13px] transition-colors disabled:bg-gray-300"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      )}

      <Link
        href="/suggestions"
        className="inline-flex items-center gap-1 text-[15px] font-semibold text-secondary hover:text-primary transition-colors"
      >
        ← 목록으로 돌아가기
      </Link>
    </div>
  );
}
