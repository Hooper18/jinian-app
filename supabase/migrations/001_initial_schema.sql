-- ============================================================
-- 纪念日 App（jinian-app）初始 schema
-- 对应设计文档 §5：docs/superpowers/specs/2026-07-01-anniversary-app-design.md
-- ============================================================

create table if not exists public.occasions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind          text not null check (kind in ('anniversary','since','until')),
  title         text not null,
  date          date not null,                 -- 公历基准日：锚点/起点/目标
  lunar         boolean not null default false,
  lunar_month   int,                            -- lunar=true 时：农历月 1-12
  lunar_day     int,                            -- lunar=true 时：农历日 1-30
  lunar_is_leap boolean not null default false, -- lunar=true 时：该月是否闰月
  cover_path    text,                           -- 'covers' 桶内相对路径 {user_id}/{id}.jpg
  note          text,
  remind_days   int[]  not null default '{0,1}',            -- 提前几天，0=当天；驱动本地通知排程
  milestones    jsonb  not null default '{"hundreds":true,"thousand":true}'::jsonb,
  leap_fallback text   not null default 'feb28' check (leap_fallback in ('feb28','mar1')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint lunar_only_anniversary check ( (not lunar) or (kind = 'anniversary') )
);

alter table public.occasions enable row level security;

-- updated_at 自动刷新（Postgres 不会自动更新该列）
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists occasions_set_updated_at on public.occasions;
create trigger occasions_set_updated_at before update on public.occasions
  for each row execute function public.set_updated_at();

-- RLS：仅本人可读写自己的行
create policy occasions_select_own on public.occasions for select to authenticated
  using ( (select auth.uid()) = user_id );
create policy occasions_insert_own on public.occasions for insert to authenticated
  with check ( (select auth.uid()) = user_id );
create policy occasions_update_own on public.occasions for update to authenticated
  using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy occasions_delete_own on public.occasions for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ============================================================
-- Storage：covers 私有桶（封面图，路径 {user_id}/{id}.jpg）
-- ============================================================

insert into storage.buckets (id, name, public)
values ('covers', 'covers', false)
on conflict (id) do update set public = false;

create policy covers_select_own on storage.objects for select to authenticated
  using ( bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text );
create policy covers_insert_own on storage.objects for insert to authenticated
  with check ( bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text );
create policy covers_update_own on storage.objects for update to authenticated
  using ( bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text )
  with check ( bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text );
create policy covers_delete_own on storage.objects for delete to authenticated
  using ( bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text );
