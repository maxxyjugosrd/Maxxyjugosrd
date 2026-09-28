"use client";

import { useState } from "react";
import { PlusCircle, Receipt, DollarSign, Calendar, FileText, ShoppingBasket } from "lucide-react";

export default function ContabilidadPage() {
  // Estado para el formulario de registro de gasto
  const [gastos, setGastos] = useState([
    { id: 1, concepto: "Compra de Chinola y Fresas (Mercado)", categoria: "Frutas e Insumos", monto: 2500, fecha: "2026-09-28" },
    { id: 2, concepto: "Compra de Vasos 16oz y Sorbetes", categoria: "Empaques", monto: 1200, fecha: "2026-09-28" },
  ]);

  const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", categoria: "Frutas e Insumos", monto: "" });

  const agregarGasto = (e) => {
    e.preventDefault();
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return;

    const gastoCreado = {
      id: Date.now(),
      concepto: nuevoGasto.concepto,
      categoria: nuevoGasto.categoria,
      monto: parseFloat(nuevoGasto.monto),
      fecha: new Date().toISOString().split("T")[0],
    };

    setGastos([gastoCreado, ...gastos]);
    setNuevoGasto({ concepto: "", categoria: "Frutas e Insumos", monto: "" });
  };

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Contabilidad & Gastos Operativos 📊</h1>
        <p className="text-slate-500 text-sm">Lleva el control exacto de compras de frutas, egresos y comprobantes de pago.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario para registrar un gasto */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-3">
            <PlusCircle className="w-5 h-5 text-amber-500" /> Registrar Salida / Gasto
          </h2>

          <form onSubmit={agregarGasto} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Concepto o Descripción</label>
              <input
                type="text"
                placeholder="Ej. Compra de 2 sacos de Naranja"
                value={nuevoGasto.concepto}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Categoría</label>
              <select
                value={nuevoGasto.categoria}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Frutas e Insumos">Frutas e Insumos Naturales</option>
                <option value="Empaques">Empaques y Vasos</option>
                <option value="Servicios/Alquiler">Servicios / Alquiler</option>
                <option value="Sueldos/Pagos">Pago de Personal / Delivery</option>
                <option value="Otros">Otros Gastos</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Monto (RD$)</label>
              <input
                type="number"
                placeholder="Ej. 1500"
                value={nuevoGasto.monto}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Guardar Gasto
            </button>
          </form>
        </div>

        {/* Historial de Gastos y Totales */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-xl">
                <ShoppingBasket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Total Egresos Registrados</p>
                <h3 className="text-2xl font-extrabold text-slate-800">RD$ {totalGastos.toLocaleString()}</h3>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium transition"
            >
              <Receipt className="w-4 h-4" /> Imprimir Reporte
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Historial de Salidas / Compras</h2>
              <span className="text-xs text-slate-400">{gastos.length} registros</span>
            </div>

            <div className="divide-y divide-slate-100">
              {gastos.map((gasto) => (
                <div key={gasto.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 text-sm">{gasto.concepto}</p>
                    <div className="flex gap-2 items-center text-xs text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-600">
                        {gasto.categoria}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {gasto.fecha}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 text-base">
                    - RD$ {gasto.monto.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
