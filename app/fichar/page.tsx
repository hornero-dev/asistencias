'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, CheckCircle2, AlertCircle, Clock, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function FicharMovilPage() {
  const [tipoEvento, setTipoEvento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [escaneando, setEscaneando] = useState<boolean>(false);
  const [enrolado, setEnrolado] = useState<boolean | null>(null);
  const [nombreOperador, setNombreOperador] = useState<string>('');
  const [fichajesHoy, setFichajesHoy] = useState<{ hora: string; tipo: string }[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'neutro' | 'exito' | 'error'; texto: string }>({
    tipo: 'neutro',
    texto: '',
  });

  useEffect(() => {
    // Verificar si este teléfono ya fue activado por un operador
    const passkeyActiva = localStorage.getItem('asistencia_passkey_activa');
    const nombre = localStorage.getItem('asistencia_operador_nombre');
    const registrosLocales = JSON.parse(localStorage.getItem('asistencia_marcas_hoy') || '[]');

    setEnrolado(passkeyActiva === 'true');
    if (nombre) setNombreOperador(nombre);
    setFichajesHoy(registrosLocales);
  }, []);

  const iniciarLectorQR = () => {
    setMensaje({ tipo: 'neutro', texto: '' });
    setEscaneando(true);

    const scanner = new Html5QrcodeScanner(
      'qr-lector-contenedor',
      { fps: 12, qrbox: { width: 240, height: 240 } },
      false
    );

    scanner.render(
      async (qrCodeMessage) => {
        scanner.clear();
        setEscaneando(false);
        await procesarFichajeBiometrico(qrCodeMessage);
      },
      () => {}
    );
  };

  const procesarFichajeBiometrico = async (tokenQR: string) => {
    try {
      setMensaje({ tipo: 'neutro', texto: 'Verificando huella / Face ID...' });

      // 1. Solicitar desafío WebAuthn al servidor
      const resDesafio = await fetch('/api/attendance/challenge', { method: 'POST' });
      const opcionesDesafio = await resDesafio.json();

      // 2. Disparar el sensor nativo del móvil
      const respuestaBiometrica = await startAuthentication(opcionesDesafio);

      // 3. Enviar todo al servidor para validación atómica
      const resVerificacion = await fetch('/api/attendance/verify-and-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: tokenQR,
          eventType: tipoEvento,
          assertionResponse: respuestaBiometrica,
        }),
      });

      const datos = await resVerificacion.json();
      if (!resVerificacion.ok) throw new Error(datos.error || 'Error al validar fichaje');

      // Guardar registro visual en el móvil para tranquilidad del operario
      const nuevaMarca = {
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: tipoEvento,
      };
      const nuevasMarcas = [nuevaMarca, ...fichajesHoy];
      setFichajesHoy(nuevasMarcas);
      localStorage.setItem('asistencia_marcas_hoy', JSON.stringify(nuevasMarcas));

      setMensaje({
        tipo: 'exito',
        texto: `¡${tipoEvento} registrada exitosamente a las ${nuevaMarca.hora}!`,
      });
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'No se pudo completar el fichaje biométrico',
      });
    }
  };

  if (enrolado === false) {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center text-center">
        <ShieldCheck className="w-16 h-16 text-blue-600 mb-4" />
        <h1 className="text-xl font-bold text-slate-800">Dispositivo No Vinculado</h1>
        <p className="text-sm text-slate-600 mt-2 mb-6">
          Para registrar asistencia con tu huella digital, primero debes abrir el enlace de invitación temporal que te envió tu supervisor.
        </p>
        <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-left">
          <strong>Pasos:</strong>
          <ol className="list-decimal pl-4 mt-1 space-y-1">
            <li>Pide a tu supervisor el enlace de enrolamiento.</li>
            <li>Ábrelo en este mismo navegador.</li>
            <li>Presiona &quot;Activar Huella&quot;.</li>
          </ol>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 flex flex-col justify-between">
      {/* Cabecera Móvil */}
      <div>
        <header className="flex justify-between items-center py-2 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700">
              {nombreOperador ? `Operador: ${nombreOperador}` : 'Terminal Móvil'}
            </span>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
            Biometría Activa
          </span>
        </header>

        {/* Selector de Entrada / Salida */}
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setTipoEvento('ENTRADA')}
            className={`flex-1 py-2.5 font-bold rounded-lg text-sm transition ${
              tipoEvento === 'ENTRADA' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
            }`}
          >
            ENTRADA
          </button>
          <button
            onClick={() => setTipoEvento('SALIDA')}
            className={`flex-1 py-2.5 font-bold rounded-lg text-sm transition ${
              tipoEvento === 'SALIDA' ? 'bg-amber-600 text-white shadow' : 'text-slate-600'
            }`}
          >
            SALIDA
          </button>
        </div>
      </div>

      {/* Botón Central / Lector */}
      <div className="my-auto flex flex-col items-center">
        {escaneando ? (
          <div className="w-full max-w-xs bg-black rounded-2xl overflow-hidden p-2 shadow-2xl border">
            <div id="qr-lector-contenedor" className="w-full" />
            <button
              onClick={() => setEscaneando(false)}
              className="w-full mt-2 py-2 bg-slate-800 text-white text-xs rounded-lg font-semibold"
            >
              Cancelar Escaneo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={iniciarLectorQR}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 text-white shadow-xl active:scale-95 transition ${
                tipoEvento === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Fingerprint className="w-16 h-16" />
              <span className="font-bold tracking-wide text-sm">FICHAR {tipoEvento}</span>
            </button>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Apunta la cámara al QR de la terminal de tu sucursal
            </p>
          </div>
        )}

        {/* Mensajes de Estado */}
        {mensaje.texto && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 max-w-xs text-center ${
              mensaje.tipo === 'exito'
                ? 'bg-emerald-100 text-emerald-800'
                : mensaje.tipo === 'error'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            {mensaje.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {mensaje.tipo === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{mensaje.texto}</span>
          </div>
        )}
      </div>

      {/* Historial Rápido de Hoy */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm mt-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Marcaciones de Hoy
        </h3>
        {fichajesHoy.length === 0 ? (
          <p className="text-xs text-slate-400">Aún no has registrado marcaciones hoy.</p>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {fichajesHoy.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                <span className="font-semibold text-slate-700">{m.tipo}</span>
                <span className="font-mono text-slate-500">{m.hora}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
