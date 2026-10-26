'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Key, Copy, Check } from 'lucide-react';

export default function OperatorsAdminPage() {
  const [operators, setOperators] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [branchId, setBranchId] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  const fetchData = async () => {
    const { data: bData } = await supabase.from('branches').select('*');
    if (bData) setBranches(bData);

    const { data: opData } = await supabase
      .from('profiles')
      .select('*, branches(name)')
      .order('created_at', { ascending: false });
    if (opData) setOperators(opData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dni) return alert('Completa los campos obligatorios');

    // 1. Crear perfil
    const { data: newOp, error } = await supabase
      .from('profiles')
      .insert({ full_name: fullName, dni, branch_id: branchId || null, role: 'operador' })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    // 2. Crear invitación de enrolamiento automática (expira en 24h)
    const { data: invite } = await supabase
      .from('enrollment_invitations')
      .insert({ user_id: newOp.id })
      .select()
      .single();

    if (invite) {
      setFullName('');
      setDni('');
      fetchData();
      alert(`Operador creado. Enlace de enrolamiento generado.`);
    }
  };

  const generateInviteLink = async (userId: string) => {
    const { data: invite, error } = await supabase
      .from('enrollment_invitations')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error || !invite) return alert('Error al generar enlace');

    const link = `${window.location.origin}/enrolar/${invite.token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(userId);
    setTimeout(() => setCopiedToken(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Operadores y Biometría</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleCreateOperator} className="bg-white p-4 rounded-xl shadow border border-slate-200 h-fit">
          <h2 className="font-semibold text-lg mb-4">Registrar Operador</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">DNI / Legajo</label>
              <input
                type="text"
                placeholder="Ej. 38123456"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sucursal Asignada</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm bg-white"
              >
                <option value="">Sin sucursal fija</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm shadow hover:bg-blue-700"
            >
              Guardar y Generar Enlace
            </button>
          </div>
        </form>

        <div className="md:col-span-2 bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">DNI</th>
                <th className="p-3">Sucursal</th>
                <th className="p-3 text-right">Enrolamiento Huella</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {operators.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold">{op.full_name}</td>
                  <td className="p-3 text-slate-500 font-mono">{op.dni}</td>
                  <td className="p-3 text-slate-600">{op.branches?.name || '-'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => generateInviteLink(op.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition"
                    >
                      {copiedToken === op.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedToken === op.id ? '¡Enlace copiado!' : 'Copiar link enrolamiento'}
                    </button>
                  </td>
                </tr>
              ))}
              {operators.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">No hay operadores registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
