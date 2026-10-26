'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Download, Search } from 'lucide-react';

export default function ReportsAdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = useCallback(async () => {
    let query = supabase
      .from('attendance_logs')
      .select('*, profiles(full_name, dni), terminals(name, branches(name))')
      .order('logged_at', { ascending: false });

    if (startDate) query = query.gte('logged_at', `${startDate}T00:00:00`);
    if (endDate) query = query.lte('logged_at', `${endDate}T23:59:59`);

    const { data } = await query;
    if (data) setLogs(data);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const downloadCSV = () => {
    const headers = ['Fecha/Hora,Operador,DNI,Tipo,Terminal,Sucursal\n'];
    const rows = logs.map((l) =>
      `"${l.logged_at}","${l.profiles?.full_name || ''}","${l.profiles?.dni || ''}","${l.event_type}","${l.terminals?.name || ''}","${l.terminals?.branches?.name || ''}"`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-asistencia-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Reportes y Historial de Asistencia</h1>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow"
        >
          <Download className="w-4 h-4" /> Descargar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          />
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium h-10"
        >
          <Search className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3">Operador</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Evento</th>
              <th className="p-3">Terminal</th>
              <th className="p-3">Sucursal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono">{new Date(log.logged_at).toLocaleString()}</td>
                <td className="p-3 font-semibold">{log.profiles?.full_name}</td>
                <td className="p-3 text-slate-500">{log.profiles?.dni}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.event_type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {log.event_type}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{log.terminals?.name}</td>
                <td className="p-3 text-slate-600">{log.terminals?.branches?.name || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">No hay registros para este período.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
