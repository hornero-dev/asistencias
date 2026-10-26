-- Habilitar RLS en tablas críticas
alter table public.branches enable row level security;
alter table public.terminals enable row level security;
alter table public.terminal_qr_tokens enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollment_invitations enable row level security;
alter table public.user_authenticators enable row level security;
alter table public.attendance_logs enable row level security;

-- Política: Solo usuarios autenticados con rol admin o supervisor leen/modifican administración
create policy "Admins y supervisores gestionan todo" on public.profiles
for all to authenticated
using (
  auth.uid() = id or (select role from public.profiles where id = auth.uid()) in ('admin', 'supervisor')
);

create policy "Admins ven y crean sucursales" on public.branches
for all to authenticated
using ((select role from public.profiles where id = auth.uid()) in ('admin', 'supervisor'));

create policy "Admins gestionan terminales" on public.terminals
for all to authenticated
using ((select role from public.profiles where id = auth.uid()) in ('admin', 'supervisor'));

create policy "Admins ven reportes de fichaje" on public.attendance_logs
for select to authenticated
using ((select role from public.profiles where id = auth.uid()) in ('admin', 'supervisor'));

-- El backend (service_role) y las funciones RPC seguras (security definer)
-- siguen teniendo acceso total para emitir tokens, validar QR y asentar marcas.
