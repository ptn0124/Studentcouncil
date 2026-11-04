"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Officer } from "@/types";

/** 자동으로 넘어가는 간격(ms) */
const AUTOPLAY_MS = 3500;
/** 슬라이드 이동 애니메이션 시간(ms) */
const TRANSITION_MS = 500;
/** 이 거리(px) 이상 스와이프하면 슬라이드를 넘긴다 */
const SWIPE_THRESHOLD = 40;

/** 화면 폭에 따라 한 번에 보이는 카드 수 (Tailwind 브레이크포인트 기준) */
function getPerView(width: number) {
  if (width >= 1024) return 4; // lg
  if (width >= 768) return 3; // md
  if (width >= 480) return 2;
  return 1;
}

// 창 크기 변화 구독 (SSR에서는 데스크탑 기준 4장)
const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

function OfficerCard({ officer }: { officer: Officer }) {
  return (
    <div className="group h-full bg-white/70 backdrop-blur-md border border-[#2c3e50]/10 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-[#f39733]/5 hover:border-[#f39733]/30 hover:-translate-y-1">
      {/* 프로필 이미지 혹은 이니셜 플레이스홀더 */}
      <div className="w-24 h-24 mx-auto mb-5 rounded-full overflow-hidden border-2 border-[#2c3e50]/10 group-hover:border-[#f39733]/40 transition-colors duration-300 bg-gradient-to-br from-[#f39733]/15 to-[#2c3e50]/10 flex items-center justify-center text-[28px] font-bold text-[#2c3e50]/80">
        {officer.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={officer.image_url}
            alt={officer.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          officer.name[0] // 성씨 첫 글자를 플레이스홀더 글자로 사용 (예: "박")
        )}
      </div>

      {/* 직책 */}
      <span className="inline-block text-[14px] font-bold text-[#f39733] bg-[#f39733]/10 px-3 py-1 rounded-full mb-2">
        {officer.position}
      </span>

      {/* 이름 */}
      <h3 className="text-[18px] font-bold text-[#2c3e50] mb-1">
        {officer.name}
      </h3>

      {/* 학과 (캡션) caption: 14px */}
      <p className="text-[14px] text-[#2c3e50]/50">
        {officer.department || "학과 정보 없음"}
      </p>
    </div>
  );
}

/**
 * 임원진 가로 슬라이드 (외부 라이브러리 없이 구현)
 * - 일정 간격 자동 순환 + 무한 루프 (목록을 3벌 이어 붙이고, 가운데 벌을 벗어나면 애니메이션 없이 위치를 되돌림)
 * - 마우스를 올리거나 키보드 포커스가 있으면 일시정지
 * - 터치/마우스 드래그 스와이프
 * - 화면 폭에 따라 1~4장 노출
 */
export default function OfficerCarousel({ officers }: { officers: Officer[] }) {
  const count = officers.length;
  const perView = useSyncExternalStore(
    subscribeResize,
    () => getPerView(window.innerWidth),
    () => 4,
  );
  const [index, setIndex] = useState(count); // 가운데 벌의 첫 카드에서 시작
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);

  // 카드 수가 화면에 보이는 수 이하이면 슬라이드할 필요가 없다
  const isStatic = count <= perView;

  const go = useCallback(
    (delta: number) => {
      setAnimate(true);
      // 빠르게 연속 클릭해도 복제 영역 밖으로 벗어나지 않게 범위를 제한
      setIndex((i) => Math.min(Math.max(i + delta, 0), count * 3 - perView));
    },
    [count, perView],
  );

  // 자동 순환
  useEffect(() => {
    if (isStatic || paused) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isStatic, paused, go]);

  // 무한 루프: 가운데 벌을 벗어나면 애니메이션 없이 같은 위치의 가운데 벌 카드로 점프
  const handleTransitionEnd = () => {
    if (index >= count * 2 || index < count) {
      setAnimate(false);
      setIndex(count + (((index - count) % count) + count) % count);
    }
  };

  // 점프 후 다음 프레임에 애니메이션 다시 켜기
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  // ── 스와이프 (Pointer Events: 터치/마우스 공통) ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (isStatic) return;
    dragStartX.current = e.clientX;
    setPaused(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    setDragOffset(e.clientX - dragStartX.current);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    setDragOffset(0);
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    if (e.pointerType !== "mouse") setPaused(false);
  };

  if (isStatic) {
    return (
      <div className="flex flex-wrap justify-center -mx-3">
        {officers.map((officer) => (
          <div
            key={officer.id}
            className="px-3 pb-6"
            style={{ width: `${100 / perView}%` }}
          >
            <OfficerCard officer={officer} />
          </div>
        ))}
      </div>
    );
  }

  const slides = [...officers, ...officers, ...officers];
  const activeDot = ((index % count) + count) % count;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="학생회 임원진"
    >
      <div
        className="overflow-hidden -mx-3 py-2 touch-pan-y select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => dragStartX.current !== null && endDrag(e)}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(calc(${(-index * 100) / perView}% + ${dragOffset}px))`,
            transition:
              animate && dragOffset === 0
                ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((officer, i) => {
            // 화면에 보이는 카드만 스크린리더/탭 대상으로 둔다
            const visible = i >= index && i < index + perView;
            return (
              <div
                key={`${officer.id}-${i}`}
                className="shrink-0 px-3"
                style={{ width: `${100 / perView}%` }}
                aria-hidden={!visible}
              >
                <OfficerCard officer={officer} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 이전/다음 버튼 + 위치 표시 */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          onClick={() => go(-1)}
          className="w-9 h-9 rounded-full border border-[#2c3e50]/15 bg-white/70 text-[#2c3e50]/70 hover:text-[#f39733] hover:border-[#f39733]/40 transition-colors flex items-center justify-center"
          aria-label="이전 임원"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex gap-1.5">
          {officers.map((officer, i) => (
            <button
              key={officer.id}
              type="button"
              onClick={() => {
                setAnimate(true);
                setIndex(count + i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeDot ? "w-5 bg-[#f39733]" : "w-2 bg-[#2c3e50]/20 hover:bg-[#2c3e50]/40"
              }`}
              aria-label={`${i + 1}번째 임원으로 이동`}
              aria-current={i === activeDot}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="w-9 h-9 rounded-full border border-[#2c3e50]/15 bg-white/70 text-[#2c3e50]/70 hover:text-[#f39733] hover:border-[#f39733]/40 transition-colors flex items-center justify-center"
          aria-label="다음 임원"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
