import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center shadow gap-4">
        <span className="font-bold text-lg">Panel de Control - Asistencia</span>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/admin" className="hover:text-blue-400">Monitor en Vivo</Link>
          <Link href="/admin/branches" className="hover:text-blue-400">Sucursales</Link>
          <Link href="/admin/terminals" className="hover:text-blue-400">Terminales</Link>
          <Link href="/admin/operators" className="hover:text-blue-400">Operadores</Link>
          <Link href="/admin/reports" className="hover:text-blue-400">Reportes</Link>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
