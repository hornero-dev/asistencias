'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Building2, Plus, Trash2 } from 'lucide-react';

export default function BranchesAdminPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
    if (data) setBranches(data);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('branches').insert({ name: name.trim() });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setName('');
      fetchBranches();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sucursal? Se desvincularán las terminales y operadores asociados.')) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      fetchBranches();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Sucursales</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de Alta */}
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow border border-slate-200 h-fit">
          <h2 className="font-semibold text-lg mb-4">Nueva Sucursal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la Sucursal</label>
              <input
                type="text"
                placeholder="Ej. Planta Central / Sede Norte"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm shadow hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {loading ? 'Guardando...' : 'Crear Sucursal'}
            </button>
          </div>
        </form>

        {/* Listado */}
        <div className="md:col-span-2 bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Fecha de Creación</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" /> {b.name}
                  </td>
                  <td className="p-3 text-slate-500 font-mono text-xs">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-rose-600 hover:text-rose-800 p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    No hay sucursales registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
