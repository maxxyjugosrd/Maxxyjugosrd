"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Receipt,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

export default function ContabilidadPage() {
  // 1. Calcular ventas desde pedidos con estatus 'completado'
  const [ingresosTotales, setIngresosTotales] = useState(0);

  // 2. Gastos registrados manualmente (sin datos predeterminados)
  const [gastos, setGastos] = useState([]);

  // Estado del formulario
  const [gastoForm, setGastoForm] = useState({
    id: null,
    concepto: "",
    categoria: "Frutas/Insumos",
    monto: "",
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    // Cargar Ventas reales desde LocalStorage (pedidos)
    const pedidosGuardados = localStorage.getItem("pedidos");
    if (pedidosGuardados) {
      try {
        const listaPedidos = JSON.parse(pedidosGuardados);
        // Filtrar SOLO los que tienen estado completado o entregado
        const totalVentasCompletadas = listaPedidos
          .filter((p) => {
            const estado = (p.estado || p.status || "").toLowerCase();
            return estado === "completado" || estado === "entregado";
          })
          .reduce((sum, p) => sum + Number(p.total || 0), 0);

        setIngresosTotales(totalVentasCompletadas);
      } catch (error) {
        console.error("Error al leer pedidos:", error);
      }
    }

    // Cargar Gastos guardados
    const gastosGuardados = localStorage.getItem("gastos_contabilidad");
    if (gastosGuardados) {
      try {
        setGastos(JSON.parse(gastosGuardados));
      } catch (error) {
        console.error("Error al leer gastos:", error);
      }
    }
  }, []);

  // Guardar gastos en LocalStorage cada vez que cambien
  const actualizarGastosState = (nuevosGastos) => {
    setGastos(nuevosGastos);
    localStorage.setItem("gastos_contabilidad", JSON.stringify(nuevosGastos));
  };

  // Calculadora de Gastos Totales
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

  // Fórmula: Ganancia Neta = Ventas Totales - Gastos Totales
  const gananciaNeta = ingresosTotales - totalGastos;
  const margenGanancia =
    ingresosTotales > 0 ? ((gananciaNeta / ingresosTotales) * 100).toFixed(1) : 0;

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setGastoForm({ id: null, concepto: "", categoria: "Frutas/Insumos", monto: "" });
    setEditando(false);
    setMostrarModal(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (gasto) => {
    setGastoForm({
      id: gasto.id,
      concepto: gasto.concepto,
      categoria: gasto.categoria || gasto.Categoria || "Frutas/Insumos",
      monto: gasto.monto,
      fecha: gasto.fecha,
    });
    setEditando(true);
    setMostrarModal(true);
  };

  // Guardar o Editar Gasto
  const guardarGasto = (e) => {
    e.preventDefault();
    if (!gastoForm.concepto || !gastoForm.monto) return;

    if (editando) {
      const gastosActualizados = gastos.map((g) =>
        g.id === gastoForm.id
          ? {
              ...g,
              concepto: gastoForm.concepto,
              categoria: gastoForm.categoria,
              monto: Number(gastoForm.monto),
            }
          : g
      );
      actualizarGastosState(gastosActualizados);
    } else {
      const nuevo = {
        id: Date.now(),
        concepto: gastoForm.concepto,
        categoria: gastoForm.categoria,
        monto: Number(gastoForm.monto),
        fecha: new Date().toISOString().split("T")[0],
      };
      actualizarGastosState([...gastos, nuevo]);
    }

    setMostrarModal(false);
  };

  // Eliminar Gasto
  const eliminarGasto = (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      const gastosFiltrados = gastos.filter((g) => g.id !== id);
      actualizarGastosState(gastosFiltrados);
    }
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
          onClick={abrirModalCrear}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Registrar Gasto
        </button>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas Totales (Solo Completadas) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Ventas Totales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">RD$ {ingresosTotales.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-semibold">Solo pedidos completados/cobrados</p>
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
          <p className="text-xs text-rose-500 font-semibold">Gastos ingresados manualmente</p>
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
                <th className="pb-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                    No has registrado ningún gasto todavía.
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-slate-50">
                    <td className="py-3 text-slate-500">{gasto.fecha}</td>
                    <td className="py-3 font-semibold text-slate-800">{gasto.concepto}</td>
                    <td className="py-3">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {gasto.categoria || gasto.Categoria}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-rose-600">
                      - RD$ {Number(gasto.monto).toLocaleString()}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirModalEditar(gasto)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Editar gasto"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarGasto(gasto.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar / Editar Gasto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={guardarGasto} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setMostrarModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {editando ? "Editar Gasto" : "Registrar Nuevo Gasto"}
            </h2>
            <div>
              <label className="text-xs font-bold text-slate-600">Concepto / Descripción</label>
              <input
                type="text"
                placeholder="Ej. Compra de 50 lbs de Chinola"
                value={gastoForm.concepto}
                onChange={(e) => setGastoForm({ ...gastoForm, concepto: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Categoría</label>
              <select
                value={gastoForm.categoria}
                onChange={(e) => setGastoForm({ ...gastoForm, categoria: e.target.value })}
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
                value={gastoForm.monto}
                onChange={(e) => setGastoForm({ ...gastoForm, monto: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                required
              />
            </div>
            <div className="flex gap-2 pt-3">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded-xl text-sm transition">
                {editando ? "Actualizar Gasto" : "Guardar Gasto"}
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
