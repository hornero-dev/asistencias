'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function IniciarSesionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    // 1. Iniciar sesión en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Credenciales incorrectas.');
      setCargando(false);
      return;
    }

    // 2. Consultar perfil con sesión confirmada
    const { data: perfil, error: perfilError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (perfilError) {
      console.error('Error al consultar perfil:', perfilError);
      setError(`Error de base de datos: ${perfilError.message}`);
      setCargando(false);
      return;
    }

    if (!perfil) {
      setError(`No se encontró registro en public.profiles para el UID: ${authData.user.id}`);
      setCargando(false);
      return;
    }

    if (perfil.role !== 'admin' && perfil.role !== 'supervisor') {
      await supabase.auth.signOut();
      setError(`Rol actual: "${perfil.role}". Se requiere rol admin o supervisor.`);
      setCargando(false);
      return;
    }

    // 3. Redirigir al panel
    router.refresh();
    router.push('/admin');
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-slate-800 mb-1">Panel de Control</h1>
        <p className="text-xs text-center text-slate-500 mb-6">Ingreso restringido para administradores</p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {cargando ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>
      </div>
    </main>
  );
}
