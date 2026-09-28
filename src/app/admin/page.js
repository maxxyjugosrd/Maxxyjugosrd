"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, ShoppingBag, PlusCircle, ArrowUpRight } from "lucide-react";

export default function AdminDashboard() {
  // Estados de prueba para visualizar el diseño (se conectarán a Firestore)
  const [ventasHoy] = useState(12500); // RD$ / $
  const [gastosHoy] = useState(3200);   // Compras de frutas, vasos, etc.
  const [comisionesHoy] = useState(1500); // Vendedores + Deliveries

  // Ganancia Neta Limpia = Ventas - (Gastos + Comisiones)
  const gananciaNeta = ventasHoy - (gastosHoy + comisionesHoy);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Control - Maxi Jugos 🥤</h1>
          <p className="text-slate-500 text-sm">Resumen financiero y operativo en tiempo real.</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm">
          <PlusCircle className="w-5 h-5" />
          Nuevo Pedido (WhatsApp)
        </button>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-sm font-medium">Ventas Totales (Hoy)</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">${ventasHoy.toLocaleString()}</div>
          <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> Web + Pedidos Manuales
          </p>
        </div>

        {/* Gastos y Comisiones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-sm font-medium">Gastos & Pagos (Hoy)</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">${(gastosHoy + comisionesHoy).toLocaleString()}</div>
          <p className="text-xs text-slate-400">
            Frutas: ${gastosHoy} | Comisiones: ${comisionesHoy}
          </p>
        </div>

        {/* Ganancia Neta Limpia */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-2xl shadow-md space-y-2">
          <div className="flex justify-between items-center opacity-90">
            <span className="text-sm font-medium">Ganancia Neta Limpia</span>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold">${gananciaNeta.toLocaleString()}</div>
          <p className="text-xs opacity-80">Ganancia real descontando insumos y pagos</p>
        </div>
      </div>
    </div>
  );
}
