"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Notice } from "@/types";
import { AlertIcon, CalendarIcon, EyeIcon, PinIcon, UserIcon } from "@/components/icons";

export interface NoticeDetailProps {
  params: Promise<{ id: string }>;
}

export default function NoticeDetailPage({ params }: NoticeDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 관리자 여부 + 수정 상태
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    is_pinned: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const res = await fetch(`/api/notices/${id}`);
        if (!res.ok) {
          throw new Error("Notice not found");
        }
        const data = await res.json();
        // 조회수 증가 요청과 응답 순서가 엇갈려도 더 큰(최신) 조회수를 유지
        setNotice((prev) =>
          prev && prev.id === data.notice.id
            ? { ...data.notice, view_count: Math.max(prev.view_count, data.notice.view_count) }
            : data.notice,
        );
      } catch (error) {
        console.error("Failed to fetch notice detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 조회수 증가: 같은 탭(세션)에서는 공지당 1회만 요청한다.
    // effect가 두 번 실행돼도(개발 모드 StrictMode) 키를 먼저 기록하므로 중복 요청되지 않는다.
    // 서버도 쿠키로 브라우저 세션당 1회만 증가시킨다.
    const countView = async () => {
      const key = `notice_viewed_${id}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        // sessionStorage를 쓸 수 없는 환경이면 서버 쿠키 검사에만 의존
      }
      try {
        const res = await fetch(`/api/notices/${id}/view`, { method: "POST" });
        if (!res.ok) return;
        const { view_count } = await res.json();
        if (typeof view_count === "number") {
          setNotice((prev) =>
            prev ? { ...prev, view_count: Math.max(prev.view_count, view_count) } : prev,
          );
        }
      } catch (error) {
        console.error("Failed to count view:", error);
      }
    };

    countView();
    fetchNoticeDetail();
  }, [id]);

  // 로그인 사용자의 역할 확인 (admin/superadmin이면 수정·삭제 노출)
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(["admin", "superadmin"].includes(d.role)))
      .catch(() => {});
  }, []);

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

  // 수정 시작 (현재 값으로 폼 채우기)
  const startEdit = () => {
    if (!notice) return;
    setEditForm({
      title: notice.title,
      content: notice.content,
      is_pinned: notice.is_pinned,
    });
    setIsEditing(true);
  };

  // 수정 저장 (PATCH /api/notices/[id])
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.content.trim()) {
      return alert("제목과 내용을 입력해 주세요.");
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/notices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "수정 실패");
      const data = await res.json();
      setNotice(data.notice);
      setIsEditing(false);
    } catch (err) {
      alert("공지 수정에 실패했습니다: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 삭제 (DELETE /api/notices/[id])
  const handleDelete = async () => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "삭제 실패");
      alert("공지가 삭제되었습니다.");
      router.push("/notices");
    } catch (err) {
      alert("공지 삭제에 실패했습니다: " + (err as Error).message);
    }
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
        <AlertIcon className="w-10 h-10 mx-auto text-[#f39733]" />
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
    <article className="max-w-[900px] w-full min-w-0 mx-auto space-y-8 py-6">
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

      {isEditing ? (
        /* ── 수정 모드 ── */
        <form
          onSubmit={handleUpdate}
          className="bg-white/70 backdrop-blur-sm border border-[#2c3e50]/10 rounded-2xl p-6 md:p-10 space-y-4 shadow-sm"
        >
          <h2 className="text-[20px] font-bold text-[#2c3e50]">공지 수정</h2>

          <input
            type="text"
            placeholder="제목"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full text-[16px] px-4 py-3 bg-white border border-[#2c3e50]/20 rounded-xl focus:outline-none focus:border-[#f39733]"
          />

          <textarea
            placeholder="내용"
            rows={10}
            value={editForm.content}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            className="w-full text-[16px] px-4 py-3 bg-white border border-[#2c3e50]/20 rounded-xl focus:outline-none focus:border-[#f39733] resize-none"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#2c3e50]/70 select-none">
              <input
                type="checkbox"
                checked={editForm.is_pinned}
                onChange={(e) =>
                  setEditForm({ ...editForm, is_pinned: e.target.checked })
                }
                className="w-4 h-4 accent-[#f39733]"
              />
              <span className="inline-flex items-center gap-1"><PinIcon className="w-3.5 h-3.5 text-[#f39733]" />중요 공지로 고정</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[14px] font-semibold px-4 py-2.5 text-[#2c3e50] border border-[#2c3e50]/20 rounded-xl hover:bg-[#2c3e50]/5"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-[14px] font-semibold px-5 py-2.5 bg-[#f39733] text-[#faf8f5] rounded-xl hover:opacity-90 transition-all disabled:bg-gray-300"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* ── 보기 모드 ── */
        <>
          {/* 헤더 영역 */}
          <div className="space-y-4 pb-6 border-b border-[#2c3e50]/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {notice.is_pinned && (
                  <span className="inline-flex items-center gap-1 bg-[#f39733] text-[#faf8f5] text-[12px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                    <PinIcon className="w-3.5 h-3.5" /> 중요 공지
                  </span>
                )}
              </div>

              {/* 관리자 전용: 수정·삭제 */}
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={startEdit}
                    className="text-[13px] font-semibold px-3.5 py-1.5 text-[#2c3e50] border border-[#2c3e50]/20 rounded-lg hover:bg-[#2c3e50]/5 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-[13px] font-semibold px-3.5 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* H1: 30px */}
            <h1 className="text-[24px] sm:text-[30px] font-extrabold text-[#2c3e50] leading-snug tracking-tight break-words [overflow-wrap:anywhere]">
              {notice.title}
            </h1>

            {/* 메타정보 (캡션) caption: 14px */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#2c3e50]/50">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#2c3e50]/70">
                <UserIcon /> 작성자: 학생회
              </span>
              <span aria-hidden="true" className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon /> 등록: {formatDate(notice.created_at)}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <EyeIcon /> 조회수: {notice.view_count}
              </span>
            </div>
          </div>

          {/* 본문 영역 body: 16px */}
          {/* 개행(\n) 유지 + 긴 단어·URL도 컨테이너 안에서 줄바꿈 */}
          <div className="min-w-0 bg-white/70 backdrop-blur-sm border border-[#2c3e50]/10 rounded-2xl p-5 sm:p-6 md:p-10 shadow-sm">
            <div className="text-[16px] text-[#2c3e50] whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
              {notice.content}
            </div>
          </div>
        </>
      )}

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