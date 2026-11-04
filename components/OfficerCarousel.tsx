"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Officer } from "@/types";

/** 흐르는 속도: 1초에 카드 폭의 몇 배만큼 이동할지 (0.25 = 카드 하나 지나가는 데 약 4초) */
const CARDS_PER_SECOND = 0.25;

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
    <div className="h-full bg-white/70 backdrop-blur-md border border-[#2c3e50]/10 rounded-2xl p-6 text-center">
      {/* 프로필 이미지 혹은 이니셜 플레이스홀더 */}
      <div className="w-24 h-24 mx-auto mb-5 rounded-full overflow-hidden border-2 border-[#2c3e50]/10 bg-gradient-to-br from-[#f39733]/15 to-[#2c3e50]/10 flex items-center justify-center text-[28px] font-bold text-[#2c3e50]/80">
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
 * 임원진 자동 순환 슬라이드 (외부 라이브러리 없이 구현)
 * - 버튼 조작 없이 왼쪽으로 천천히, 끊김 없이 계속 흐른다 (무한 루프)
 * - 마우스·터치 등 어떤 조작에도 멈추지 않는다
 * - 화면 폭에 따라 1~4장 노출
 */
export default function OfficerCarousel({ officers }: { officers: Officer[] }) {
  const perView = useSyncExternalStore(
    subscribeResize,
    () => getPerView(window.innerWidth),
    () => 4,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 한 바퀴(set) 안에 최소 perView장 이상이 되도록 목록을 반복 → 그 set을 2번 이어 붙여 끊김 없이 순환
  const repeat = Math.max(1, Math.ceil(perView / officers.length));
  const set = Array.from({ length: repeat }, () => officers).flat();
  const slides = [...set, ...set];

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    let offset = 0;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100); // 탭 전환 등으로 오래 멈췄다 돌아와도 크게 튀지 않게
      last = now;
      const cardWidth = viewport.clientWidth / perView;
      const setWidth = cardWidth * set.length;
      if (setWidth > 0) {
        offset = (offset + (cardWidth * CARDS_PER_SECOND * dt) / 1000) % setWidth;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [perView, set.length]);

  return (
    <div
      ref={viewportRef}
      className="relative overflow-hidden py-2"
      aria-roledescription="carousel"
      aria-label="학생회 임원진 (자동으로 넘어갑니다)"
    >
      <div ref={trackRef} className="flex will-change-transform">
        {slides.map((officer, i) => (
          <div
            key={`${officer.id}-${i}`}
            className="shrink-0 px-3"
            style={{ width: `${100 / perView}%` }}
            // 반복 복제본은 스크린리더에서 한 번만 읽히도록
            aria-hidden={i >= officers.length}
          >
            <OfficerCard officer={officer} />
          </div>
        ))}
      </div>
    </div>
  );
}
