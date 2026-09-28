"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingBag, PlusCircle, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { obtenerPedidosEnVivo } from "../../services/pedidosService";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Gastos y comisiones fijados/estimados temporalmente
  const [gastosHoy] = useState(3200);   // Compras de frutas e insumos
  const [comisionesHoy] = useState(1500); // Vendedores + Deliveries

  useEffect(() => {
    // Escuchar pedidos en tiempo real desde Firestore
    const desuscribir = obtenerPedidosEnVivo((datos) => {
      setPedidos(datos);
      setCargando(false);
    });

    return () => desuscribir();
  }, []);

  // Calcular las ventas totales acumuladas desde los pedidos registrados
  const ventasHoy = pedidos.reduce((total, p) => total + (p.total || 0), 0);

  // Ganancia Neta Limpia = Ventas totales - (Gastos + Comisiones)
  const gananciaNeta = ventasHoy - (gastosHoy + comisionesHoy);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Control - Maxi Jugos 🥤</h1>
          <p className="text-slate-500 text-sm">Resumen financiero y operativo en tiempo real.</p>
        </div>
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Nuevo Pedido (WhatsApp)
        </Link>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-sm font-medium">Ventas Totales</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {cargando ? <Loader2 className="w-7 h-7 animate-spin text-amber-500" /> : `RD$ ${ventasHoy.toLocaleString()}`}
          </div>
          <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> {pedidos.length} pedidos registrados
          </p>
        </div>

        {/* Gastos y Comisiones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-sm font-medium">Gastos & Pagos</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            RD$ {(gastosHoy + comisionesHoy).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            Frutas: RD$ {gastosHoy} | Comisiones: RD$ {comisionesHoy}
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
          <div className="text-3xl font-extrabold">
            {cargando ? <Loader2 className="w-7 h-7 animate-spin text-white" /> : `RD$ ${gananciaNeta.toLocaleString()}`}
          </div>
          <p className="text-xs opacity-80">Ganancia real descontando insumos y pagos</p>
        </div>
      </div>

      {/* Lista de Pedidos Recientes en Firestore */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Pedidos Recientes (Firestore)</h2>
          <span className="text-xs text-slate-400">{pedidos.length} en total</span>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span>Cargando datos desde Firebase...</span>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No hay pedidos registrados en la base de datos todavía.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pedidos.map((pedido) => {
              // Manejo flexible para soportar tanto objetos de cliente como strings simples
              const nombreCliente = typeof pedido.cliente === 'string' 
                ? pedido.cliente 
                : (pedido.cliente?.nombre || "Cliente sin nombre");
                
              const telefonoCliente = pedido.telefono || pedido.cliente?.telefono || "Sin teléfono";

              return (
                <div key={pedido.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 text-sm">
                        {nombreCliente}
                      </p>
                      {pedido.id && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {pedido.id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {telefonoCliente} • {pedido.metodoPago || "Pendiente"} {pedido.origen ? `• ${pedido.origen}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block text-sm">
                      RD$ {(pedido.total || 0).toLocaleString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 capitalize font-medium inline-block mt-0.5">
                      {pedido.estado || "Pendiente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
