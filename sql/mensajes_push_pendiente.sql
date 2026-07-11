-- =====================================================================
-- Pendiente: difusión + push (SANTAMARIA IXHUATÁN)
-- Ejecutar en Supabase SQL Editor.
-- Requiere: auth.users, sis_configuracion (ya existente)
-- Una sola política por tabla: authenticated → ALL
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Columnas de metas para nivel de compromiso (sis_configuracion)
-- ---------------------------------------------------------------------
alter table public.sis_configuracion
  add column if not exists meta_celula integer not null default 15;

alter table public.sis_configuracion
  add column if not exists meta_celula_minima integer not null default 10;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sis_configuracion_meta_check'
      and conrelid = 'public.sis_configuracion'::regclass
  ) then
    alter table public.sis_configuracion
      add constraint sis_configuracion_meta_check
      check (meta_celula_minima < meta_celula);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Mensajes de difusión
-- ---------------------------------------------------------------------
create table if not exists public.sis_mensajes (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  mensaje text not null,
  publico_objetivo text not null default 'Todos',
  usuarios_especificos uuid[] not null default '{}',
  ruta text not null default '/',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sis_mensajes
  add column if not exists titulo text;

alter table public.sis_mensajes
  add column if not exists ruta text not null default '/';

alter table public.sis_mensajes
  add column if not exists usuarios_especificos uuid[] not null default '{}';

alter table public.sis_mensajes
  add column if not exists activo boolean not null default true;

create index if not exists idx_sis_mensajes_activo_created
  on public.sis_mensajes (activo, created_at desc);

create index if not exists idx_sis_mensajes_publico
  on public.sis_mensajes (publico_objetivo);

alter table public.sis_mensajes enable row level security;

create policy "mensajes_auth_all"
  on public.sis_mensajes
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- 3) Lecturas (cola de mensajes no leídos)
-- ---------------------------------------------------------------------
create table if not exists public.sis_mensajes_lecturas (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid not null references public.sis_mensajes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  leido_en timestamptz not null default now(),
  unique (mensaje_id, user_id)
);

create index if not exists idx_mensajes_lecturas_user
  on public.sis_mensajes_lecturas (user_id);

create index if not exists idx_mensajes_lecturas_mensaje
  on public.sis_mensajes_lecturas (mensaje_id);

alter table public.sis_mensajes_lecturas enable row level security;

create policy "lecturas_auth_all"
  on public.sis_mensajes_lecturas
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- 4) Suscripciones push (Web Push / VAPID)
-- ---------------------------------------------------------------------
create table if not exists public.sis_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subs_user_id
  on public.sis_push_subscriptions (user_id);

alter table public.sis_push_subscriptions enable row level security;

create policy "push_auth_all"
  on public.sis_push_subscriptions
  for all
  to authenticated
  using (true)
  with check (true);
