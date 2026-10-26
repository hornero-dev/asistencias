'use client';
import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw } from 'lucide-react';

export default function KioscoPage({ params }: { params: { terminalId: string } }) {
  const [token, setToken] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNewToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kiosk/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminalId: params.terminalId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setSecondsLeft(30);
      }
    } finally {
      setLoading(false);
    }
  }, [params.terminalId]);

  useEffect(() => { fetchNewToken(); }, [fetchNewToken]);

  useEffect(() => {
    if (secondsLeft <= 0) { fetchNewToken(); return; }
    const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, fetchNewToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 select-none">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terminal de Asistencia</h1>
      <p className="text-slate-400 mb-8">Escanea el código QR desde tu móvil con la PWA</p>
      <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
        {token ? (
          <QRCodeSVG value={token} size={280} level="H" includeMargin={true} />
        ) : (
          <div className="w-[280px] h-[280px] flex items-center justify-center text-slate-500">
            {loading ? 'Cargando QR...' : 'Error al conectar terminal'}
          </div>
        )}
      </div>
      <div className="mt-8 flex items-center gap-6">
        <div className="text-xl font-mono text-slate-300">
          Expira en: <span className="font-bold text-amber-400">{secondsLeft}s</span>
        </div>
        <button onClick={fetchNewToken} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm border border-slate-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Regenerar
        </button>
      </div>
    </div>
  );
}
