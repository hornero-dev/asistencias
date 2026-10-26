'use client';
import { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FicharPage() {
  const [eventType, setEventType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [scanning, setScanning] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const startScanner = () => {
    setStatus({ type: 'idle', message: '' });
    setScanning(true);
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(
      async (qrCodeMessage) => {
        scanner.clear();
        setScanning(false);
        await handleBiometricCheck(qrCodeMessage);
      },
      () => {}
    );
  };

  const handleBiometricCheck = async (qrToken: string) => {
    try {
      setStatus({ type: 'idle', message: 'Verificando huella dactilar...' });
      const chalRes = await fetch('/api/attendance/challenge', { method: 'POST' });
      const chalOptions = await chalRes.json();
      const assertionResponse = await startAuthentication(chalOptions);

      const verifyRes = await fetch('/api/attendance/verify-and-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken, eventType, assertionResponse }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error);

      setStatus({ type: 'success', message: `¡${eventType} registrada correctamente!` });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error de autenticación' });
    }
  };

  return (
    <main className="max-w-md mx-auto p-4 min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-center mt-4">Marcar Asistencia</h1>
      <div className="flex bg-slate-200 p-1 rounded-xl mt-6">
        <button onClick={() => setEventType('ENTRADA')} className={`flex-1 py-2 font-medium rounded-lg text-sm ${eventType === 'ENTRADA' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}>Entrada</button>
        <button onClick={() => setEventType('SALIDA')} className={`flex-1 py-2 font-medium rounded-lg text-sm ${eventType === 'SALIDA' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}>Salida</button>
      </div>
      <div className="mt-8 flex flex-col items-center flex-1 justify-center">
        {scanning ? (
          <div id="qr-reader" className="w-full max-w-xs overflow-hidden rounded-2xl border" />
        ) : (
          <button onClick={startScanner} className="w-48 h-48 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition">
            <Fingerprint className="w-16 h-16" />
            <span className="font-semibold text-lg">Escanear QR</span>
          </button>
        )}
        {status.type === 'success' && <div className="mt-6 flex items-center gap-2 text-emerald-600 font-medium"><CheckCircle2 className="w-5 h-5" /> {status.message}</div>}
        {status.type === 'error' && <div className="mt-6 flex items-center gap-2 text-rose-600 font-medium"><AlertCircle className="w-5 h-5" /> {status.message}</div>}
      </div>
    </main>
  );
}
