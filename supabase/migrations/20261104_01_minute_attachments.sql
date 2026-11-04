-- 회의록 첨부파일 (Supabase SQL Editor에서 실행)
-- 1) 첨부파일 메타데이터 테이블
create table if not exists public.minute_attachments (
  id          uuid primary key default gen_random_uuid(),
  minute_id   uuid not null references public.meeting_minutes(id) on delete cascade,
  file_name   text not null,            -- 원래 파일명 (한글 가능)
  file_path   text not null unique,     -- 스토리지 경로: {minute_id}/{uuid}.{ext}
  file_size   bigint not null check (file_size > 0),
  mime_type   text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
-- ※ meeting_minutes.id 타입이 uuid가 아니라면 minute_id 타입을 그에 맞게 바꿔 주세요.

create index if not exists minute_attachments_minute_id_idx on public.minute_attachments(minute_id);

alter table public.minute_attachments enable row level security;

-- 관리자 여부 판단 (profiles.role)
create or replace function public.is_council_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

drop policy if exists "minute_attachments read (authenticated)" on public.minute_attachments;
create policy "minute_attachments read (authenticated)"
  on public.minute_attachments for select to authenticated using (true);

drop policy if exists "minute_attachments insert (admin)" on public.minute_attachments;
create policy "minute_attachments insert (admin)"
  on public.minute_attachments for insert to authenticated with check (public.is_council_admin());

drop policy if exists "minute_attachments delete (admin)" on public.minute_attachments;
create policy "minute_attachments delete (admin)"
  on public.minute_attachments for delete to authenticated using (public.is_council_admin());

-- 2) 비공개 스토리지 버킷 (파일당 20MB — lib/attachments.ts 의 MAX_FILE_SIZE와 맞춤)
insert into storage.buckets (id, name, public, file_size_limit)
values ('minutes-attachments', 'minutes-attachments', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

-- 3) 스토리지 권한: 로그인 사용자는 다운로드(서명 URL 생성), 관리자만 업로드/삭제
drop policy if exists "minutes-attachments read (authenticated)" on storage.objects;
create policy "minutes-attachments read (authenticated)"
  on storage.objects for select to authenticated
  using (bucket_id = 'minutes-attachments');

drop policy if exists "minutes-attachments insert (admin)" on storage.objects;
create policy "minutes-attachments insert (admin)"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'minutes-attachments' and public.is_council_admin());

drop policy if exists "minutes-attachments delete (admin)" on storage.objects;
create policy "minutes-attachments delete (admin)"
  on storage.objects for delete to authenticated
  using (bucket_id = 'minutes-attachments' and public.is_council_admin());
