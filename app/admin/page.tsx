'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('attendance_logs')
        .select('*, profiles(full_name, dni), terminals(name)')
        .order('logged_at', { ascending: false })
        .limit(20);
      if (data) setLogs(data);
    };
    fetchLogs();

    const channel = supabase
      .channel('realtime:attendance_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, () => fetchLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Monitor en Vivo</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="p-3">Hora</th><th className="p-3">Operador</th><th className="p-3">DNI</th><th className="p-3">Tipo</th><th className="p-3">Terminal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-3 font-mono">{new Date(log.logged_at).toLocaleTimeString()}</td>
                <td className="p-3 font-semibold">{log.profiles?.full_name || '-'}</td>
                <td className="p-3 text-slate-500">{log.profiles?.dni || '-'}</td>
                <td className="p-3">{log.event_type}</td>
                <td className="p-3 text-slate-600">{log.terminals?.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
