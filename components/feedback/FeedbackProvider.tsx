"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * 사이트 자체 알림 (브라우저 alert / confirm 대체)
 *
 *   const { notify, confirm } = useFeedback();
 *   notify("저장되었습니다.", "success");
 *   if (!(await confirm("삭제하시겠습니까?", { danger: true }))) return;
 */

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  /** 삭제 등 되돌릴 수 없는 작업이면 확인 버튼을 빨간색으로 */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (ok: boolean) => void;
}

interface FeedbackContextValue {
  notify: (message: string, type?: ToastType) => void;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const TOAST_DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  error: 6000,
};

const TOAST_STYLE: Record<ToastType, { box: string; icon: string; path: string }> = {
  success: {
    box: "border-emerald-200",
    icon: "text-emerald-500",
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  error: {
    box: "border-red-200",
    icon: "text-red-500",
    path: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  info: {
    box: "border-[#f39733]/30",
    icon: "text-[#f39733]",
    path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId.current++;
      // 같은 메시지가 연달아 쌓이지 않도록, 최대 4개까지만 유지
      setToasts((prev) => [...prev.filter((t) => t.message !== message), { id, message, type }].slice(-4));
      window.setTimeout(() => dismiss(id), TOAST_DURATION[type]);
    },
    [dismiss],
  );

  const confirm = useCallback(
    (message: string, options: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ message, ...options, resolve });
      }),
    [],
  );

  const closeConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* 토스트 알림 — 모바일: 하단 중앙 / 데스크탑: 우측 상단 */}
      <div
        className="fixed z-[100] inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:top-20 sm:right-6 flex flex-col gap-2 sm:w-[360px] pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => {
          const style = TOAST_STYLE[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 bg-white border ${style.box} rounded-xl shadow-lg px-4 py-3 animate-[toast-in_0.2s_ease-out]`}
            >
              <svg className={`w-5 h-5 shrink-0 mt-0.5 ${style.icon}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
              </svg>
              <p className="flex-1 text-[14px] text-[#2c3e50] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 -mr-1 p-1 rounded-md text-[#2c3e50]/40 hover:text-[#2c3e50] hover:bg-[#2c3e50]/5"
                aria-label="알림 닫기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && <ConfirmDialog state={confirmState} onClose={closeConfirm} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: (ok: boolean) => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4"
      onClick={() => onClose(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="bg-white rounded-2xl max-w-[400px] w-full p-6 shadow-xl animate-[toast-in_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="text-[18px] font-bold text-[#2c3e50] mb-2">
          {state.title ?? "확인"}
        </h3>
        <p id="confirm-message" className="text-[14px] text-[#2c3e50]/70 leading-relaxed whitespace-pre-line mb-6">
          {state.message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[13px] transition-colors"
          >
            {state.cancelText ?? "취소"}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`px-5 py-2.5 font-bold rounded-xl text-[13px] text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              state.danger
                ? "bg-red-500 hover:bg-red-600 focus:ring-red-300"
                : "bg-[#f39733] hover:opacity-90 focus:ring-[#f39733]/40"
            }`}
          >
            {state.confirmText ?? "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback은 FeedbackProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
