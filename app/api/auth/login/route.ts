import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const cookieStore = cookies();

    // 1. Cliente Supabase con gestión nativa de cookies en servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // En un Route Handler cookieStore.set funciona correctamente
            }
          },
        },
      }
    );

    // 2. Iniciar sesión y fijar cookies de sesión
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Credenciales inválidas' }, { status: 401 });
    }

    // 3. Validar rol de administrador o supervisor
    const { data: perfil, error: perfilError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (perfilError || !perfil) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'No se encontró el perfil de usuario' }, { status: 403 });
    }

    if (perfil.role !== 'admin' && perfil.role !== 'supervisor') {
      await supabase.auth.signOut();
      return NextResponse.json({ error: `El rol "${perfil.role}" no tiene permisos de acceso` }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en el servidor' }, { status: 500 });
  }
}
