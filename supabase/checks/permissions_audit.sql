-- 권한(RLS) 점검용 조회 쿼리 — 읽기 전용, 아무것도 바꾸지 않습니다.
-- Supabase SQL Editor에서 실행하고 결과를 그대로 복사해 주세요.
--
-- 왜 필요한가: 학생도 자기 로그인 토큰 + 공개 anon 키로 Supabase에 직접 요청할 수 있어서,
-- 웹사이트 API의 권한 검사를 거치지 않는 요청은 오직 DB의 RLS 정책이 막아야 합니다.

-- 1) 테이블별 RLS 켜짐 여부 (rls_enabled = false 이면 누구나 읽기/쓰기 가능할 수 있음)
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('profiles', 'notices', 'meeting_minutes', 'minute_attachments',
                    'suggestions', 'calendar_events', 'officers', 'app_config')
order by 1;

-- 2) 정책 목록 (cmd: SELECT/INSERT/UPDATE/DELETE/ALL, qual/with_check: 허용 조건)
select tablename, policyname, cmd, roles::text, permissive, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by tablename, cmd, policyname;
