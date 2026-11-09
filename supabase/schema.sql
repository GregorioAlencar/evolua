-- Evolua beta: executar no SQL Editor de um projeto Supabase NOVO.
-- Cada conta acessa somente o seu documento JSON.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

-- Segurança em camadas: permissões SQL mínimas e políticas RLS.
revoke all on table public.user_state from anon;
revoke all on table public.user_state from authenticated;
grant select, insert, update on table public.user_state to authenticated;

-- Reexecutável no mesmo projeto.
drop policy if exists "user_state_select_own" on public.user_state;
drop policy if exists "user_state_insert_own" on public.user_state;
drop policy if exists "user_state_update_own" on public.user_state;
create policy "user_state_select_own" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_state_insert_own" on public.user_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_state_update_own" on public.user_state
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- updated_at apenas no backend.
create or replace function public.evolua_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists user_state_set_updated_at on public.user_state;
create trigger user_state_set_updated_at before update on public.user_state
for each row execute function public.evolua_set_updated_at();

-- Não há políticas para anon, nem permissão de DELETE pela aplicação.
-- Excluir conta e dados requer fluxo administrativo próprio em próxima versão.
