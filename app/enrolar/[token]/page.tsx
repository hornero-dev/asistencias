'use client';
import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function EnrolarPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const registerBiometrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentToken: params.token }),
      });
      const options = await res.json();
      if (!res.ok) throw new Error(options.error);

      const regResp = await startRegistration(options);
      const verifyRes = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentToken: params.token,
          response: regResp,
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Dispositivo Móvil',
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error);
      setDone(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-2xl font-bold">Vincular Dispositivo</h1>
      <p className="text-slate-600 mt-2 text-sm">Registra tu huella digital o Face ID para fichar desde este móvil.</p>
      {done ? (
        <div className="mt-8 p-4 bg-emerald-50 text-emerald-800 rounded-xl font-medium">¡Dispositivo registrado con éxito!</div>
      ) : (
        <button onClick={registerBiometrics} disabled={loading} className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow disabled:opacity-50">
          {loading ? 'Esperando sensor...' : 'Activar Huella / Biometría'}
        </button>
      )}
    </div>
  );
}
