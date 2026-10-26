import Link from 'next/link';
export default function HomePage() {
  return (
    <main className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center gap-4">
      <h1 className="text-2xl font-bold text-center text-slate-800">Sistema de Asistencia</h1>
      <Link href="/fichar" className="p-4 bg-blue-600 text-white font-semibold rounded-xl text-center shadow">Ir al Lector Móvil (Fichar)</Link>
      <Link href="/admin" className="p-4 bg-slate-800 text-white font-semibold rounded-xl text-center shadow">Panel de Administración</Link>
    </main>
  );
}
