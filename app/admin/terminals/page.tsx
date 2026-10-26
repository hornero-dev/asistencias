'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, ExternalLink, Monitor } from 'lucide-react';

export default function TerminalsAdminPage() {
  const [terminals, setTerminals] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('branches').select('*');
    if (bData) setBranches(bData);

    const { data: tData } = await supabase
      .from('terminals')
      .select('*, branches(name)')
      .order('created_at', { ascending: false });
    if (tData) setTerminals(tData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !branchId) return alert('Completa todos los campos');
    setLoading(true);

    const { error } = await supabase.from('terminals').insert({ name, branch_id: branchId });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setName('');
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta terminal?')) return;
    await supabase.from('terminals').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Terminales Kiosco</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de Alta */}
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow border border-slate-200 h-fit">
          <h2 className="font-semibold text-lg mb-4">Nueva Terminal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre / Ubicación</label>
              <input
                type="text"
                placeholder="Ej. Planta Baja - Entrada 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sucursal</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm bg-white"
                required
              >
                <option value="">Selecciona una sucursal</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Terminal'}
            </button>
          </div>
        </form>

        {/* Listado */}
        <div className="md:col-span-2 bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Sucursal</th>
                <th className="p-3">Enlace Kiosco</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {terminals.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-400" /> {t.name}
                  </td>
                  <td className="p-3 text-slate-600">{t.branches?.name || '-'}</td>
                  <td className="p-3">
                    <a
                      href={`/kiosco/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-medium"
                    >
                      Abrir Pantalla <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDelete(t.id)} className="text-rose-600 hover:text-rose-800 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {terminals.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">No hay terminales registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
