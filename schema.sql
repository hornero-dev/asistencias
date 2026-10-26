-- Extensión para criptografía
create extension if not exists "pgcrypto";

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table public.terminals (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  api_key text unique default encode(gen_random_bytes(24), 'hex'),
  is_active boolean default true,
  last_heartbeat timestamptz default now(),
  created_at timestamptz default now()
);

create table public.terminal_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  terminal_id uuid not null references public.terminals(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  is_used boolean default false,
  created_at timestamptz default now()
);
create index idx_qr_validity on public.terminal_qr_tokens(token, is_used, expires_at);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  dni text unique not null,
  email text,
  role text not null check (role in ('admin', 'supervisor', 'operador')) default 'operador',
  branch_id uuid references public.branches(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.enrollment_invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text unique default encode(gen_random_bytes(16), 'hex'),
  current_challenge text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  is_used boolean default false,
  created_at timestamptz default now()
);

create table public.user_authenticators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credential_id text unique not null,
  public_key bytea not null,
  counter bigint not null default 0,
  device_name text,
  created_at timestamptz default now()
);

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  terminal_id uuid not null references public.terminals(id) on delete cascade,
  event_type text not null check (event_type in ('ENTRADA', 'SALIDA')),
  logged_at timestamptz default now(),
  qr_token_id uuid references public.terminal_qr_tokens(id)
);

create or replace function public.process_attendance(
  p_user_id uuid,
  p_terminal_qr text,
  p_event_type text,
  p_new_counter bigint,
  p_credential_id text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_qr_record public.terminal_qr_tokens%rowtype;
  v_term_record public.terminals%rowtype;
  v_log_id uuid;
begin
  select * into v_qr_record 
  from public.terminal_qr_tokens 
  where token = p_terminal_qr for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Token QR no existe');
  end if;

  if v_qr_record.is_used then
    return jsonb_build_object('success', false, 'error', 'Este código QR ya fue utilizado');
  end if;

  if v_qr_record.expires_at < now() then
    return jsonb_build_object('success', false, 'error', 'El código QR ha expirado');
  end if;

  select * into v_term_record 
  from public.terminals 
  where id = v_qr_record.terminal_id;

  if not v_term_record.is_active then
    return jsonb_build_object('success', false, 'error', 'Terminal deshabilitada');
  end if;

  update public.terminal_qr_tokens 
  set is_used = true 
  where id = v_qr_record.id;

  update public.user_authenticators
  set counter = p_new_counter
  where credential_id = p_credential_id;

  insert into public.attendance_logs (user_id, terminal_id, event_type, qr_token_id)
  values (p_user_id, v_term_record.id, p_event_type, v_qr_record.id)
  returning id into v_log_id;

  return jsonb_build_object('success', true, 'log_id', v_log_id);
end;
$$;
