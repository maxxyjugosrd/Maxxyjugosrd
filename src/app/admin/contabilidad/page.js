"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, ShoppingCart, Truck, Users } from "lucide-react";

export default function ContabilidadPage() {
  // Datos de ingresos y gastos de ejemplo
  const [ingresosTotales, setIngresosTotales] = useState(48500); // RD$ Ventas totales
  const [gastos, setGastos] = useState([
    { id: 1, concepto: "Compra de Chinola y Fresa (Mercado)", Categoria: "Frutas/Insumos", monto: 8500, fecha: "2026-09-25" },
    { id: 2, concepto: "Vasos de 16oz, tapas y sorbetes", Categoria: "Empaques", monto: 3200, fecha: "2026-09-26" },
    { id: 3, concepto: "Pago comisiones a Deliveries", Categoria: "Delivery", monto: 4200, fecha: "2026-09-27" },
    { id: 4, concepto: "Pago sueldo preparador", Categoria: "Sueldos", monto: 5000, fecha: "2026-09-28" },
  ]);

  const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", categoria: "Frutas/Insumos", monto: "" });
  const [mostrarModal, setMostrarModal] = useState(false);

  // Calculadora de Gastos Totales
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

  // Fórmula: Ganancia Neta = Ventas Totales - Gastos Totales
  const gananciaNeta = ingresosTotales - totalGastos;
  const margenGanancia = ingresosTotales > 0 ? ((gananciaNeta / ingresosTotales) * 100).toFixed(1) : 0;

  const registrarGasto = (e) => {
    e.preventDefault();
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return;

    setGastos([
      ...gastos,
      {
        id: Date.now(),
        concepto: nuevoGasto.concepto,
        categoria: nuevoGasto.categoria,
        monto: Number(nuevoGasto.monto),
        fecha: new Date().toISOString().split("T")[0],
      },
    ]);

    setNuevoGasto({ concepto: "", categoria: "Frutas/Insumos", monto: "" });
    setMostrarModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad & Finanzas</h1>
          <p className="text-slate-500 text-sm">Resumen claro de ingresos, gastos operativos y ganancia neta real.</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Registrar Gasto
        </button>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas Totales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Ventas Totales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">RD$ {ingresosTotales.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-semibold">Ingresos brutos cobrados</p>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Gastos Operativos</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600">RD$ {totalGastos.toLocaleString()}</p>
          <p className="text-xs text-rose-500 font-semibold">Frutas, insumos, envíos y sueldos</p>
        </div>

        {/* Ganancia Neta Limpia */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Ganancia Neta Limpia</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400">RD$ {gananciaNeta.toLocaleString()}</p>
          <p className="text-xs text-amber-300 font-semibold">Margen Neto: {margenGanancia}% libre de costos</p>
        </div>
      </div>

      {/* Historial de Gastos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-500" /> Registro de Compras y Egresos
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-xs font-bold">
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Concepto / Detalle</th>
                <th className="pb-3">Categoría</th>
                <th className="pb-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-slate-50">
                  <td className="py-3 text-slate-500">{gasto.fecha}</td>
                  <td className="py-3 font-semibold text-slate-800">{gasto.concepto}</td>
                  <td className="py-3">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                      {gasto.categoria}
                    </span>
                  </td>
                  <td className="py-3 text-right font-extrabold text-rose-600">
                    - RD$ {gasto.monto.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Gasto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={registrarGasto} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Gasto</h2>
            <div>
              <label className="text-xs font-bold text-slate-600">Concepto / Descripción</label>
              <input
                type="text"
                placeholder="Ej. Compra de 50 lbs de Chinola"
                value={nuevoGasto.concepto}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Categoría</label>
              <select
                value={nuevoGasto.categoria}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
              >
                <option value="Frutas/Insumos">Frutas e Insumos</option>
                <option value="Empaques">Empaques / Vasos / Sorbetes</option>
                <option value="Delivery">Comisiones de Delivery</option>
                <option value="Sueldos">Sueldos y Personal</option>
                <option value="Gastos Fijos">Gastos Fijos (Luz, Local, Agua)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Monto (RD$)</label>
              <input
                type="number"
                placeholder="0.00"
                value={nuevoGasto.monto}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                required
              />
            </div>
            <div className="flex gap-2 pt-3">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 font-bold py-2.5 rounded-xl text-sm transition">
                Guardar Gasto
              </button>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="bg-slate-100 hover:bg-slate-200 font-bold px-4 py-2.5 rounded-xl text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
