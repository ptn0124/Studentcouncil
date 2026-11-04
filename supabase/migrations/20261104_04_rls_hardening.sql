-- 권한(RLS) 보강 — permissions_audit.sql 점검 결과 기반 (Supabase SQL Editor에서 실행)
-- 여러 번 실행해도 안전합니다. 관리자 기능·학생의 정상 사용(건의 작성, 회의록/건의 열람)은 그대로 동작합니다.

create or replace function public.is_council_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- 0) 모든 관련 테이블에 RLS가 켜져 있도록 (이미 켜져 있으면 변화 없음)
alter table public.profiles           enable row level security;
alter table public.app_config         enable row level security;
alter table public.notices            enable row level security;
alter table public.meeting_minutes    enable row level security;
alter table public.minute_attachments enable row level security;
alter table public.calendar_events    enable row level security;
alter table public.officers           enable row level security;
alter table public.suggestions        enable row level security;

-- 1) [문제] 로그인하지 않은 사람(anon 키만 있으면 누구나)도 건의를 넣을 수 있었음
--    suggestions_insert 정책(with check true, 대상 public)을 제거 → 로그인 사용자만 본인 명의로 작성
drop policy if exists "suggestions_insert" on public.suggestions;

-- 2) [문제] 학생이 Supabase에 직접 요청하면 작성자 이름·이메일(학번)을 남의 것으로,
--    상태를 '해결 완료'로, 답변을 가짜 '학생회 답변'으로 넣을 수 있었음
--    → 작성 시 작성자 정보는 로그인 계정에서 강제로 채우고, 관리자가 아니면 상태/답변을 초기값으로 고정
create or replace function public.suggestions_set_author()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  meta jsonb;
begin
  if auth.uid() is null then
    return new; -- SQL Editor / service_role 에서의 직접 입력은 그대로
  end if;

  select raw_user_meta_data into meta from auth.users where id = auth.uid();

  new.author_id    := auth.uid();
  new.author_email := coalesce(auth.jwt() ->> 'email', new.author_email);
  new.author_name  := coalesce(meta ->> 'full_name', meta ->> 'name', new.author_name);
  -- 학교 계정 이름 끝에 붙은 이메일 아이디 제거 (예: 박태환bi202621208 → 박태환)
  new.author_name  := coalesce(
    nullif(trim(regexp_replace(new.author_name, '[[:space:]_.-]*[A-Za-z]*[0-9]{4,}[[:space:]]*$', '')), ''),
    new.author_name);

  if not public.is_council_admin() then
    new.status := 'pending';
    new.reply  := null;
  end if;
  return new;
end;
$$;

drop trigger if exists suggestions_set_author on public.suggestions;
create trigger suggestions_set_author
  before insert on public.suggestions
  for each row execute function public.suggestions_set_author();

-- 3) [문제] 로그인하지 않아도 회의록 전체를 읽을 수 있었음 (사이트에서는 로그인 필요)
drop policy if exists "minutes_read" on public.meeting_minutes;
create policy "minutes_read" on public.meeting_minutes
  for select to authenticated using (true);

-- 4) [문제] 로그인하지 않아도 전교생 이메일·역할(profiles)을 모두 읽을 수 있었음
--    → 본인 행만 (관리자는 전체) 읽기. 사이트는 본인 역할만 조회하므로 영향 없음
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_council_admin());

-- 참고: 공지사항·학사일정·임원진·app_config 는 지금처럼 누구나 읽기 허용(홈/공지 공개용)으로 둡니다.
--       공지도 로그인한 학생만 보게 하려면 아래 두 줄을 실행하세요.
-- drop policy if exists "notices_read" on public.notices;
-- create policy "notices_read" on public.notices for select to authenticated using (true);
