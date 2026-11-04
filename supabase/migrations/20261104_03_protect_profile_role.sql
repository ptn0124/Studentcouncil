-- 학생이 자기 profiles.role 을 'admin' 등으로 바꾸는 권한 상승 방지 (Supabase SQL Editor에서 실행)
-- profiles 에 "본인 행 수정 허용" 정책이 있으면 role 컬럼까지 바꿀 수 있기 때문에,
-- 정책과 상관없이 트리거로 막습니다. 여러 번 실행해도 안전합니다.
-- (SQL Editor / service_role 처럼 로그인 사용자가 아닌 경로에서는 그대로 변경 가능)

create or replace function public.is_council_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_council_admin() then
    return new; -- 관리자 / 서버(SQL Editor, service_role)는 허용
  end if;

  if tg_op = 'INSERT' and new.role in ('admin', 'superadmin') then
    raise exception '역할(role)은 관리자만 지정할 수 있습니다.';
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception '역할(role)은 관리자만 변경할 수 있습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();
