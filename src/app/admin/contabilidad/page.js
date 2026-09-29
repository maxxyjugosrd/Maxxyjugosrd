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
import { obtenerPedidosEnVivo } from "@/services/pedidosService";
import {
  obtenerGastosEnVivo,
  crearGasto,
  eliminarGasto,
} from "@/services/gastosService";

export default function ContabilidadPage() {
  // 1. Calcular ventas desde pedidos con estatus 'completado'
  const [ingresosTotales, setIngresosTotales] = useState(0);

  // 2. Gastos registrados manualmente
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
    // 1. Escuchar pedidos en tiempo real desde Firestore
    const unsubscribe = obtenerPedidosEnVivo((listaPedidos) => {
      const totalVentasCompletadas = listaPedidos
        .filter((p) => {
          const estado = String(p.estado || p.status || "").toLowerCase();
          return estado === "completado" || estado === "entregado";
        })
        .reduce((sum, p) => sum + Number(p.total || 0), 0);

      setIngresosTotales(totalVentasCompletadas);
    });

    // 2. Cargar Gastos guardados de localStorage
    const gastosGuardados = localStorage.getItem("gastos_contabilidad");
    if (gastosGuardados) {
      try {
        setGastos(JSON.parse(gastosGuardados));
      } catch (error) {
        console.error("Error al leer gastos:", error);
      }
    }

    return () => unsubscribe && unsubscribe();
  }, []);

  // Guardar gastos en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem("gastos_contabilidad", JSON.stringify(gastos));
  }, [gastos]);

  // Manejadores para el formulario de gastos
  const handleAgregarOGuardarGasto = (e) => {
    e.preventDefault();
    if (!gastoForm.concepto || !gastoForm.monto) return;

    if (editando) {
      setGastos((prev) =>
        prev.map((g) =>
          g.id === gastoForm.id
            ? { ...gastoForm, monto: Number(gastoForm.monto) }
            : g
        )
      );
    } else {
      const nuevoGasto = {
        ...gastoForm,
        id: Date.now(),
        monto: Number(gastoForm.monto),
        fecha: new Date().toLocaleDateString("es-DO"),
      };
      setGastos((prev) => [nuevoGasto, ...prev]);
    }

    cerrarModal();
  };

  const handleEditar = (gasto) => {
    setGastoForm(gasto);
    setEditando(true);
    setMostrarModal(true);
  };

  const handleEliminar = (id) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  };

  const cerrarModal = () => {
    setGastoForm({
      id: null,
      concepto: "",
      categoria: "Frutas/Insumos",
      monto: "",
    });
    setEditando(false);
    setMostrarModal(false);
  };

  // Cálculos financieros
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  const gananciaNeta = ingresosTotales - totalGastos;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad Full</h1>
          <p className="text-sm text-slate-500">
            Control financiero en tiempo real (Ventas completadas vs. Gastos)
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Ventas Totales</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              RD$ {ingresosTotales.toLocaleString()}
            </h3>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Pedidos Completados
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Gastos Totales</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              RD$ {totalGastos.toLocaleString()}
            </h3>
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Insumos / Pagos
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Ganancia Neta</p>
            <h3
              className={`text-2xl font-bold mt-1 ${
                gananciaNeta >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              RD$ {gananciaNeta.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {gananciaNeta >= 0 ? "Balance Positivo" : "Balance Negativo"}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl ${
              gananciaNeta >= 0
                ? "bg-emerald-50 text-emerald-500"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabla de Gastos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Registro de Gastos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-medium border-b border-slate-100">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Concepto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Monto</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No hay gastos registrados.
                  </td>
                </tr>
              ) : (
                gastos.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 text-xs text-slate-400">{g.fecha}</td>
                    <td className="p-4 font-medium text-slate-800">{g.concepto}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                        {g.categoria}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-rose-500">
                      RD$ {Number(g.monto).toLocaleString()}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEditar(g)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(g.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para agregar/editar gasto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">
                {editando ? "Editar Gasto" : "Registrar Nuevo Gasto"}
              </h3>
              <button
                onClick={cerrarModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAgregarOGuardarGasto} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Concepto / Descripción
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Compra de Piñas / Pago de Delivery"
                  value={gastoForm.concepto}
                  onChange={(e) =>
                    setGastoForm({ ...gastoForm, concepto: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Categoría
                </label>
                <select
                  value={gastoForm.categoria}
                  onChange={(e) =>
                    setGastoForm({ ...gastoForm, categoria: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500"
                >
                  <option value="Frutas/Insumos">Frutas / Insumos</option>
                  <option value="Comisión Delivery">Comisión Delivery</option>
                  <option value="Servicios/Local">Servicios / Local</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Monto (RD$)
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={gastoForm.monto}
                  onChange={(e) =>
                    setGastoForm({ ...gastoForm, monto: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 py-2 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-white bg-orange-500 hover:bg-orange-600 font-medium text-sm"
                >
                  {editando ? "Guardar Cambios" : "Agregar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
