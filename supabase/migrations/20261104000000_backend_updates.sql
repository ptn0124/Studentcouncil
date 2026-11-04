-- =====================================================================
-- 백엔드 개편용 마이그레이션 (Supabase SQL Editor에서 직접 실행)
--  1. 관리자 판별 함수
--  2. 공지 조회수 중복 방지 (notice_views, record_notice_view)
--  3. 건의함: 익명 제거, 작성자/학번/답변시각 추가, 상태 제약, RLS
--  4. 회의록 첨부파일 (meeting_minute_files + Storage 버킷)
--
-- 가정: notices.id / meeting_minutes.id 는 uuid 입니다.
--       bigint 라면 아래의 `uuid` 를 `bigint` 로 바꿔서 실행하세요.
-- 여러 번 실행해도 안전하도록 작성했습니다 (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 관리자 판별 함수 (RLS 정책에서 사용)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 2. 공지 조회수: 사용자당 1회만 반영
-- ---------------------------------------------------------------------
create table if not exists public.notice_views (
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id   uuid not null references auth.users(id)   on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (notice_id, user_id)
);
alter table public.notice_views enable row level security;  -- 정책 없음: 아래 함수(security definer)로만 접근

create or replace function public.record_notice_view(p_notice_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
  v_count    integer;
begin
  if auth.uid() is not null then
    insert into public.notice_views (notice_id, user_id)
    values (p_notice_id, auth.uid())
    on conflict do nothing;
    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      update public.notices
         set view_count = coalesce(view_count, 0) + 1
       where id = p_notice_id;
    end if;
  end if;

  select view_count into v_count from public.notices where id = p_notice_id;
  return coalesce(v_count, 0);
end;
$$;
grant execute on function public.record_notice_view(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. 건의함
-- ---------------------------------------------------------------------
alter table public.suggestions
  add column if not exists author_id  uuid references auth.users(id) on delete set null,
  add column if not exists student_id text,
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by uuid references auth.users(id) on delete set null;

-- 익명 기능 제거: 코드는 더 이상 쓰지 않는다. 기존 데이터 보존을 위해 컬럼은 남겨 두고 제약만 푼다.
-- (확인 후 지워도 되면: alter table public.suggestions drop column is_anonymous;)
alter table public.suggestions alter column is_anonymous drop not null;
alter table public.suggestions alter column is_anonymous drop default;

-- status 값 제한 (기존 행은 검사하지 않음)
alter table public.suggestions drop constraint if exists suggestions_status_check;
alter table public.suggestions
  add constraint suggestions_status_check
  check (status in ('pending', 'in_progress', 'resolved', 'rejected')) not valid;

create index if not exists suggestions_author_created_idx
  on public.suggestions (author_id, created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "suggestions_insert_own"      on public.suggestions;
drop policy if exists "suggestions_select_own_admin" on public.suggestions;
drop policy if exists "suggestions_update_admin"    on public.suggestions;
drop policy if exists "suggestions_delete_admin"    on public.suggestions;

create policy "suggestions_insert_own" on public.suggestions
  for insert to authenticated with check (author_id = auth.uid());
create policy "suggestions_select_own_admin" on public.suggestions
  for select to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "suggestions_update_admin" on public.suggestions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "suggestions_delete_admin" on public.suggestions
  for delete to authenticated using (public.is_admin());
-- ※ 예전에 만든 '누구나 insert 가능' 같은 정책이 남아 있으면 OR 로 합쳐져 우회됩니다.
--    Dashboard > Authentication > Policies 에서 suggestions 의 옛 정책을 삭제하세요.

-- ---------------------------------------------------------------------
-- 4. 회의록 첨부파일
-- ---------------------------------------------------------------------
-- 첨부파일만 올리는 회의록도 가능하도록 내용은 선택 항목으로
alter table public.meeting_minutes alter column content drop not null;
alter table public.meeting_minutes alter column content set default '';

create table if not exists public.meeting_minute_files (
  id           uuid primary key default gen_random_uuid(),
  minute_id    uuid not null references public.meeting_minutes(id) on delete cascade,
  storage_path text not null unique,
  file_name    text not null,
  size         integer not null check (size >= 0 and size <= 2097152),  -- 2MB
  mime_type    text,
  uploaded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists meeting_minute_files_minute_idx
  on public.meeting_minute_files (minute_id);

alter table public.meeting_minute_files enable row level security;
drop policy if exists "minute_files_select" on public.meeting_minute_files;
drop policy if exists "minute_files_insert" on public.meeting_minute_files;
drop policy if exists "minute_files_delete" on public.meeting_minute_files;
create policy "minute_files_select" on public.meeting_minute_files
  for select to authenticated using (true);
create policy "minute_files_insert" on public.meeting_minute_files
  for insert to authenticated with check (public.is_admin());
create policy "minute_files_delete" on public.meeting_minute_files
  for delete to authenticated using (public.is_admin());

-- Storage 버킷 (비공개, 파일당 2MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('minutes-files', 'minutes-files', false, 2097152)
on conflict (id) do update
  set public = false, file_size_limit = 2097152;

drop policy if exists "minutes_files_read"   on storage.objects;
drop policy if exists "minutes_files_upload" on storage.objects;
drop policy if exists "minutes_files_remove" on storage.objects;
create policy "minutes_files_read" on storage.objects
  for select to authenticated using (bucket_id = 'minutes-files');
create policy "minutes_files_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'minutes-files' and public.is_admin());
create policy "minutes_files_remove" on storage.objects
  for delete to authenticated using (bucket_id = 'minutes-files' and public.is_admin());
