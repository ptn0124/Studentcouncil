-- 건의함: 익명 기능 제거 + 작성자 정보 저장 + 처리 상태 (Supabase SQL Editor에서 실행)

-- 1) 작성자 정보 컬럼 (작성 시점의 이름/이메일을 함께 저장)
--    profiles 테이블은 보통 본인 행만 읽을 수 있어서, 다른 학생의 건의 작성자를 join으로 읽지 못한다.
--    그래서 이름·이메일을 건의 행에 저장하고, 학번은 이메일에서 추출해 화면에 표시한다(lib/studentId.ts).
alter table public.suggestions
  add column if not exists author_id    uuid references auth.users(id) on delete set null,
  add column if not exists author_name  text,
  add column if not exists author_email text;

-- 2) 익명 컬럼은 더 이상 사용하지 않음. 기존 데이터 보존을 위해 컬럼은 남기고 기본값만 false로.
--    (기존 익명 건의는 author_* 가 비어 있어 화면에 '작성자 정보 없음'으로 표시됨)
--    완전히 없애려면 백업 후: alter table public.suggestions drop column is_anonymous;
alter table public.suggestions alter column is_anonymous set default false;

-- 3) 처리 상태: 접수됨(pending) / 처리 중(in_progress) / 해결 완료(resolved) / 반려(rejected)
update public.suggestions set status = 'pending'
  where status is null or status not in ('pending', 'in_progress', 'resolved', 'rejected');
alter table public.suggestions alter column status set default 'pending';
alter table public.suggestions drop constraint if exists suggestions_status_check;
alter table public.suggestions
  add constraint suggestions_status_check
  check (status in ('pending', 'in_progress', 'resolved', 'rejected'));

-- 4) 권한 (RLS) — 로그인 사용자는 모두 읽기, 본인 이름으로만 작성, 수정/삭제는 관리자
--    ※ is_council_admin() 함수는 20261104_01_minute_attachments.sql 에서 생성됩니다.
alter table public.suggestions enable row level security;

drop policy if exists "suggestions read (authenticated)" on public.suggestions;
create policy "suggestions read (authenticated)"
  on public.suggestions for select to authenticated using (true);

drop policy if exists "suggestions insert (own)" on public.suggestions;
create policy "suggestions insert (own)"
  on public.suggestions for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "suggestions update (admin)" on public.suggestions;
create policy "suggestions update (admin)"
  on public.suggestions for update to authenticated
  using (public.is_council_admin()) with check (public.is_council_admin());

drop policy if exists "suggestions delete (admin)" on public.suggestions;
create policy "suggestions delete (admin)"
  on public.suggestions for delete to authenticated
  using (public.is_council_admin());

-- ※ 기존에 익명(anon) 작성이나 관리자 전용 조회를 허용하던 다른 정책이 있다면
--   위 정책과 충돌하지 않는지 Authentication > Policies 에서 확인 후 정리해 주세요.
