"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  PlusCircle,
  ArrowUpRight,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  obtenerPedidosEnVivo,
  actualizarPedido,
  eliminarPedido,
} from "@/services/pedidosService";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [pedidoAEditar, setPedidoAEditar] = useState(null);

  // Gastos y comisiones fijados/estimados temporalmente
  const [gastosHoy] = useState(3200);
  const [comisionesHoy] = useState(1500);

  useEffect(() => {
    // Escuchar pedidos en tiempo real desde Firestore
    const desuscribir = obtenerPedidosEnVivo((datos) => {
      setPedidos(datos);
      setCargando(false);
    });

    return () => desuscribir && desuscribir();
  }, []);

  // Función para actualizar el estado del pedido en Firestore
  const cambiarEstadoPedido = async (idPedidoDoc, nuevoEstado) => {
    if (!idPedidoDoc) return;
    setActualizandoId(idPedidoDoc);

    const res = await actualizarPedido(idPedidoDoc, { estado: nuevoEstado });
    if (!res.exito) {
      alert("No se pudo actualizar el estado. Inténtalo nuevamente.");
    }
    setActualizandoId(null);
  };

  // Función para eliminar un pedido
  const handleEliminarPedido = async (idPedidoDoc) => {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer."
      )
    ) {
      const res = await eliminarPedido(idPedidoDoc);
      if (!res.exito) {
        alert("Hubo un error al intentar eliminar el pedido.");
      }
    }
  };

  // Función para guardar los cambios editados del pedido
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!pedidoAEditar) return;

    const res = await actualizarPedido(
      pedidoAEditar.idDoc || pedidoAEditar.id,
      {
        cliente: pedidoAEditar.cliente,
        telefono: pedidoAEditar.telefono,
        total: Number(pedidoAEditar.total),
      }
    );

    if (res.exito) {
      setPedidoAEditar(null);
    } else {
      alert("Error al actualizar el pedido.");
    }
  };

  // Calcular las ventas totales acumuladas desde los pedidos registrados
  const ventasHoy = pedidos.reduce(
    (total, p) => total + Number(p.total || 0),
    0
  );

  // Ganancia Neta Limpia = Ventas totales - (Gastos + Comisiones)
  const gananciaNeta = ventasHoy - (gastosHoy + comisionesHoy);

  const obtenerEstiloEstado = (estado = "") => {
    switch (String(estado).toLowerCase()) {
      case "completado":
      case "entregado":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "cancelado":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Panel de Control - Maxxy Jugos 🍓
          </h1>
          <p className="text-sm text-slate-500">
            Resumen financiero y operativo en tiempo real.
          </p>
        </div>
        <Link
          href="/pos"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Nuevo Pedido (WhatsApp)
        </Link>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Ventas Totales</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              RD$ {ventasHoy.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              {pedidos.length} pedidos registrados
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Gastos & Pagos</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              RD$ {(gastosHoy + comisionesHoy).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Frutas: RD$ {gastosHoy} | Comisiones: RD$ {comisionesHoy}
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-500 p-6 rounded-2xl text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-100 font-medium">
              Ganancia Neta Limpia
            </p>
            <h3 className="text-2xl font-bold mt-1">
              RD$ {gananciaNeta.toLocaleString()}
            </h3>
            <p className="text-xs text-amber-200 mt-1">
              Ganancia real descontando insumos y pagos
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos Recientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Pedidos Recientes (Firestore)
          </h2>
          <span className="text-xs text-slate-400">
            {pedidos.length} en total
          </span>
        </div>

        {cargando ? (
          <div className="p-12 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando pedidos en tiempo real...
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No hay pedidos registrados aún.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pedidos.map((p) => {
              const idDoc = p.idDoc || p.id;
              const estaActualizando = actualizandoId === idDoc;

              return (
                <div
                  key={idDoc}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {p.cliente || "Cliente Genérico"}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {idDoc}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.telefono || "Sin teléfono"} •{" "}
                      {p.metodoPago || "Efectivo"} • {p.origen || "Manual"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <div className="text-right mr-2">
                      <p className="font-bold text-slate-800">
                        RD$ {Number(p.total || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Estado con Selector */}
                    <div className="relative">
                      <select
                        disabled={estaActualizando}
                        value={p.estado || "Pendiente"}
                        onChange={(e) =>
                          cambiarEstadoPedido(idDoc, e.target.value)
                        }
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${obtenerEstiloEstado(
                          p.estado
                        )}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                      {estaActualizando && (
                        <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2.5 text-slate-500" />
                      )}
                    </div>

                    {/* Botón Editar (Lápiz) */}
                    <button
                      onClick={() => setPedidoAEditar(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar pedido"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Botón Eliminar (Basura) */}
                    <button
                      onClick={() => handleEliminarPedido(idDoc)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Editar Pedido */}
      {pedidoAEditar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Editar Pedido</h3>
              <button
                onClick={() => setPedidoAEditar(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  value={pedidoAEditar.cliente || ""}
                  onChange={(e) =>
                    setPedidoAEditar({
                      ...pedidoAEditar,
                      cliente: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={pedidoAEditar.telefono || ""}
                  onChange={(e) =>
                    setPedidoAEditar({
                      ...pedidoAEditar,
                      telefono: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Monto Total (RD$)
                </label>
                <input
                  type="number"
                  required
                  value={pedidoAEditar.total || 0}
                  onChange={(e) =>
                    setPedidoAEditar({
                      ...pedidoAEditar,
                      total: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPedidoAEditar(null)}
                  className="flex-1 py-2 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-white bg-amber-500 hover:bg-amber-600 font-medium text-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
