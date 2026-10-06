"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BookOpen, 
  Users,
  UtensilsCrossed, 
  BarChart3,
  UserCheck,
  Package,
  Calculator,
  Bell,
  LogOut 
  
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../../lib/firebase";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleCerrarSesion = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/login");
  };

  const menuItems = [
    { nombre: "Dashboard", ruta: "/admin", icono: LayoutDashboard },
    { nombre: "Punto de Venta (POS)", ruta: "/admin/pos", icono: ShoppingCart },
    { nombre: "Catálogo & Menú", ruta: "/admin/catalogo", icono: UtensilsCrossed },
    { nombre: "Contabilidad Full", ruta: "/admin/contabilidad", icono: BookOpen },    
    { nombre: "Métricas & Analítica", ruta: "/admin/metricas", icono: BarChart3 },
    { nombre: "Inventario & Envases", ruta: "/admin/productos", icono: Package },
    { nombre: "Finanzas & Compras", ruta: "/admin/finanzas", icono: Calculator },
    { nombre: "Gastos Fijos", ruta: "/admin/gastos", icono: Bell },
    { nombre: "Clientes (CRM)", ruta: "/admin/clientes", icono: UserCheck },
    { nombre: "Recursos Humanos / Gestión de Personal", ruta: "/admin/personal", icono: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar de Navegación */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Logo / Encabezado */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <img 
              src="/logo.JPG" 
              alt="Maxxy Jugos Logo" 
              className="w-10 h-10 object-cover rounded-xl border border-slate-700 shadow-sm" 
            />
            <div>
              <h2 className="font-black tracking-wider text-amber-500 text-lg">MAXXY JUGOS</h2>
              <p className="text-xs text-slate-400">Panel de Control</p>
            </div>
          </div>

          {/* Menú de Botones */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icono = item.icono;
              const activo = pathname === item.ruta;
              return (
                <Link
                  key={item.ruta}
                  href={item.ruta}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    activo
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icono className="w-5 h-5" />
                  {item.nombre}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área del Contenido */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
