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
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Package,
  Printer,
  Filter,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  obtenerPedidosEnVivo,
  actualizarPedido,
  eliminarPedido,
} from "../../services/pedidosService";
import {
  obtenerGastosEnVivo,
  obtenerRecibosEnVivo,
} from "../../services/gastosService";

// Importación de Firestore para actualizar documentos
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [gastosLista, setGastosLista] = useState([]);
  const [recibosLista, setRecibosLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [pedidoVerDetalles, setPedidoVerDetalles] = useState(null);

  // Estados para la alerta de gastos fijos
  const [gastosPendientesAlerta, setGastosPendientesAlerta] = useState([]);

  // Estados para filtros de fecha (por defecto vacíos para mostrar todo o el mes actual)
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    // Escuchar pedidos en tiempo real desde Firestore
    const desuscribirPedidos = obtenerPedidosEnVivo((datos) => {
      setPedidos(datos);
      setCargando(false);
    });

    // Escuchar gastos de Contabilidad en tiempo real
    const desuscribirGastos = obtenerGastosEnVivo((datos) => {
      setGastosLista(datos);
    });

    // Escuchar recibos/pagos de Personal en tiempo real
    const desuscribirRecibos = obtenerRecibosEnVivo((datos) => {
      setRecibosLista(datos);
    });

    // Cargar gastos fijos desde localStorage para la alerta del Dashboard
    const guardados = localStorage.getItem("maxxy_gastos_fijos");
    if (guardados) {
      try {
        const parsed = JSON.parse(guardados);
        setGastosPendientesAlerta(parsed);
      } catch (e) {
        console.error("Error al cargar gastos fijos para alerta:", e);
      }
    }

    return () => {
      desuscribirPedidos && desuscribirPedidos();
      desuscribirGastos && desuscribirGastos();
      desuscribirRecibos && desuscribirRecibos();
    };
  }, []);

  // Función para obtener objeto Date limpio de un pedido (compatible con Timestamps de Firebase o strings)
  const obtenerObjetoFecha = (fechaRaw) => {
    if (!fechaRaw) return null;
    if (fechaRaw.seconds) {
      return new Date(fechaRaw.seconds * 1000);
    }
    if (typeof fechaRaw === "string") {
      const fecha = new Date(fechaRaw);
      return isNaN(fecha.getTime()) ? null : fecha;
    }
    return null;
  };

  // Filtrar pedidos según el rango de fechas seleccionado
  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (!fechaInicio && !fechaFin) return true;

    const fechaPedido = obtenerObjetoFecha(pedido.fecha || pedido.fechaCreacion);
    if (!fechaPedido) return false;

    // Normalizar la fecha del pedido a formato YYYY-MM-DD para comparar de forma exacta
    const anio = fechaPedido.getFullYear();
    const mes = String(fechaPedido.getMonth() + 1).padStart(2, "0");
    const dia = String(fechaPedido.getDate).padStart ? String(fechaPedido.getDate()).padStart(2, "0") : "01";
    const fechaStr = `${anio}-${mes}-${dia}`;

    if (fechaInicio && fechaFin) {
      return fechaStr >= fechaInicio && fechaStr <= fechaFin;
    } else if (fechaInicio) {
      return fechaStr >= fechaInicio;
    } else if (fechaFin) {
      return fechaStr <= fechaFin;
    }
    return true;
  });

  // Función para imprimir el reporte de ventas filtradas
  const handleImprimirReporte = () => {
    window.print();
  };

  // Función para actualizar el estado del pedido en Firestore
  const cambiarEstadoPedido = async (idPedidoDoc, nuevoEstado) => {
    if (!idPedidoDoc) return;
    setActualizandoId(idPedidoDoc);
    try {
      const pedidoActual = pedidos.find(p => (p.idDoc || p.id) === idPedidoDoc);
      const estadoAnterior = pedidoActual?.estado || "Pendiente";

      const pedidoRef = doc(db, "pedidos", idPedidoDoc);
      await updateDoc(pedidoRef, { estado: nuevoEstado });

      if (nuevoEstado.toLowerCase() === "completado" && estadoAnterior.toLowerCase() !== "completado") {
        const personalGuardado = localStorage.getItem("maxi_personal");
        if (personalGuardado && pedidoActual) {
          try {
            let personalArr = JSON.parse(personalGuardado);
            const vendedorAsignado = pedidoActual.vendedor || pedidoActual.vendedorAsignado || pedidoActual.Asignado;
            const deliveryAsignado = pedidoActual.deliveryAsignado;
            const subtotalVenta = Number(pedidoActual.subtotal || pedidoActual.total || 0);

            personalArr = personalArr.map((persona) => {
              if (persona.rol === "Vendedor" && persona.nombre === vendedorAsignado) {
                const porcentaje = Number(persona.valorConfigurado || 0);
                const comisionGanada = (subtotalVenta * porcentaje) / 100;
                return {
                  ...persona,
                  ventasTotales: (persona.ventasTotales || 0) + subtotalVenta,
                  comisionesAcumuladas: (persona.comisionesAcumuladas || 0) + comisionGanada,
                };
              }
              if (persona.rol === "Delivery" && persona.nombre === deliveryAsignado) {
                return {
                  ...persona,
                  entregasRealizadas: (persona.entregasRealizadas || 0) + 1,
                };
              }
              return persona;
            });

            localStorage.setItem("maxi_personal", JSON.stringify(personalArr));
          } catch (e) {
            console.error("Error al actualizar la nómina del personal:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error al actualizar estado del pedido:", error);
      alert("No se pudo actualizar el estado. Inténtalo nuevamente.");
    } finally {
      setActualizandoId(null);
    }
  };

  // Función para eliminar un pedido
  const handleEliminarPedido = async (idPedidoDoc) => {
    if (confirm("¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.")) {
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

    const idDoc = pedidoAEditar.idDoc || pedidoAEditar.id;
    const res = await actualizarPedido(idDoc, {
      cliente: pedidoAEditar.nombreCliente,
      telefono: pedidoAEditar.telefonoCliente,
      total: Number(pedidoAEditar.total),
    });

    if (res.exito) {
      setPedidoAEditar(null);
    } else {
      alert("Error al actualizar el pedido.");
    }
  };

  // Helper para formatear fechas
  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return "No especificada";
    if (fechaRaw.seconds) {
      return new Date(fechaRaw.seconds * 1000).toLocaleString("es-DO", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
    if (typeof fechaRaw === "string") {
      const fecha = new Date(fechaRaw);
      return isNaN(fecha.getTime())
        ? fechaRaw
        : fecha.toLocaleString("es-DO", {
            dateStyle: "medium",
            timeStyle: "short",
          });
    }
    return String(fechaRaw);
  };

  // CÁLCULOS BASADOS EN LOS PEDIDOS FILTRADOS
  const ventasFiltradasTotal = pedidosFiltrados.reduce((total, p) => total + (p.total || 0), 0);

  const totalGastosContabilidad = gastosLista.reduce(
    (acc, g) => acc + Number(g.monto || g.costo || g.total || 0),
    0
  );

  const totalPagosPersonal = recibosLista.reduce(
    (acc, r) => acc + Number(r.monto || r.pago || r.total || 0),
    0
  );

  const totalGastosYPagos = totalGastosContabilidad + totalPagosPersonal;
  const gananciaNeta = ventasFiltradasTotal - totalGastosYPagos;

  // Helper de estilos por estado
  const obtenerEstiloEstado = (estado = "") => {
    switch (estado.toLowerCase()) {
      case "completado":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "en proceso":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelado":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Ocultable / Adaptable para impresión */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Panel de Control - Maxxy Jugos 
          </h1>
          <p className="text-slate-500 text-sm">
            Resumen financiero y operativo en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImprimirReporte}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte
          </button>
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Pedido
          </Link>
        </div>
      </div>

      {/* ALERTA DE GASTOS FIJOS EN EL DASHBOARD */}
      {gastosPendientesAlerta.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Tienes {gastosPendientesAlerta.length} {gastosPendientesAlerta.length === 1 ? 'gasto fijo registrado' : 'gastos fijos registrados'}
              </h4>
              <p className="text-xs text-amber-700">Revisa tus compromisos y fechas de corte para mantener las finanzas al día.</p>
            </div>
          </div>
          <Link 
            href="/admin/gastos" 
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm whitespace-nowrap"
          >
            Ver Gastos
          </Link>
        </div>
      )}

      {/* CABECERA EXCLUSIVA PARA IMPRESIÓN (Logo y Título formal) */}
      <div className="hidden print:flex flex-col items-center justify-center space-y-2 mb-6 border-b pb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Maxxy Jugos Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">Maxxy Jugos S.R.L.</h1>
            <p className="text-xs text-slate-500">Santo Domingo, Rep. Dominicana • Reporte de Ventas</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-medium pt-2">
          Período: {fechaInicio || "Inicio"} al {fechaFin || "Actualidad"} | Generado el {new Date().toLocaleDateString("es-DO")}
        </p>
      </div>

      {/* SECCIÓN DE FILTROS POR FECHA (Día a día o Mes a mes) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>Filtrar Pedidos por Fecha:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-amber-500"
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button
              onClick={() => {
                setFechaInicio("");
                setFechaFin("");
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline px-2 py-1"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-sm font-medium">Ventas en el Período</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {cargando ? (
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            ) : (
              `RD$ ${ventasFiltradasTotal.toLocaleString()}`
            )}
          </div>
          <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> {pedidosFiltrados.length} pedidos encontrados
          </p>
        </div>

        {/* Gastos y Pagos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-sm font-medium">Gastos & Pagos Generales</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            RD$ {totalGastosYPagos.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            Gastos: RD$ {totalGastosContabilidad.toLocaleString()} | Personal: RD$ {totalPagosPersonal.toLocaleString()}
          </p>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-2xl shadow-md space-y-2">
          <div className="flex justify-between items-center opacity-90">
            <span className="text-sm font-medium">Ganancia Neta Limpia</span>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold">
            {cargando ? (
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            ) : (
              `RD$ ${gananciaNeta.toLocaleString()}`
            )}
          </div>
          <p className="text-xs opacity-80">
            Ganancia real descontando insumos y pagos
          </p>
        </div>
      </div>

      {/* Lista de Pedidos Filtrados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">
            Registro de Pedidos {fechaInicio || fechaFin ? "(Filtrados)" : "(Todos)"}
          </h2>
          <span className="text-xs text-slate-400">
            {pedidosFiltrados.length} registros listos
          </span>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span>Cargando datos desde Firebase...</span>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No se encontraron pedidos en el período seleccionado.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pedidosFiltrados.map((pedido) => {
              const idDoc = pedido.idDoc || pedido.id;
              const nombreCliente =
                typeof pedido.cliente === "string"
                  ? pedido.cliente
                  : pedido.cliente?.nombre || "Cliente sin nombre";

              const telefonoCliente =
                pedido.telefono || pedido.cliente?.telefono || "Sin teléfono";

              return (
                <div
                  key={idDoc}
                  className="p-4 flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 text-sm">
                        {nombreCliente}
                      </p>
                      {idDoc && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {idDoc}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {telefonoCliente} • {pedido.metodoPago || "Pendiente"} {pedido.origen ? `• ${pedido.origen}` : ""} • <span className="font-medium text-slate-500">{formatearFecha(pedido.fecha || pedido.fechaCreacion)}</span>
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span className="font-bold text-slate-800 block text-sm mr-2">
                      RD$ {(pedido.total || 0).toLocaleString()}
                    </span>

                    {/* Selector de estado (Oculto al imprimir para mayor prolijidad) */}
                    <div className="relative print:hidden">
                      <select
                        value={pedido.estado || "Pendiente"}
                        disabled={actualizandoId === idDoc}
                        onChange={(e) =>
                          cambiarEstadoPedido(idDoc, e.target.value)
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer capitalize transition-colors ${obtenerEstiloEstado(
                          pedido.estado
                        )}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                      {actualizandoId === idDoc && (
                        <Loader2 className="w-3 h-3 animate-spin absolute right-1 top-2 text-slate-500" />
                      )}
                    </div>

                    {/* Botones de acción (Ocultos al imprimir) */}
                    <div className="flex items-center gap-1 print:hidden">
                      <button
                        onClick={() => setPedidoVerDetalles(pedido)}
                        className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Ver detalles completos del pedido"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setPedidoAEditar({
                            ...pedido,
                            idDoc,
                            nombreCliente,
                            telefonoCliente,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar pedido"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEliminarPedido(idDoc)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PIE DE PÁGINA EXCLUSIVO PARA IMPRESIÓN */}
      <div className="hidden print:block pt-8 text-center text-xs text-slate-500 border-t mt-12">
        <p>Maxxy Jugos S.R.L. • Documento de control interno de ventas y operaciones.</p>
        <p className="mt-1">Total recaudado en este reporte: <strong className="text-slate-800">RD$ {ventasFiltradasTotal.toLocaleString()}</strong></p>
      </div>

      {/* Modal para Ver Detalles Completos del Pedido */}
      {pedidoVerDetalles && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Detalles de la Orden
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  ID: {pedidoVerDetalles.idDoc || pedidoVerDetalles.id}
                </p>
              </div>
              <button
                onClick={() => setPedidoVerDetalles(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fechas y Personal */}
            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600 border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Fecha de Pedido:</span>{" "}
                {formatearFecha(
                  pedidoVerDetalles.fecha || pedidoVerDetalles.fechaCreacion
                )}
              </div>
              <div className="flex justify-between text-xs py-1 border-b">
                <span className="text-slate-500 font-medium">Vendedor:</span>
                <span className="font-bold text-slate-800">
                  {pedidoVerDetalles.vendedor || pedidoVerDetalles.vendedorAsignado || pedidoVerDetalles.Asignado || "Sin Asignar"}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b">
                <span className="text-slate-500 font-medium">Delivery:</span>
                <span className="font-bold text-slate-800">
                  {pedidoVerDetalles.deliveryAsignado || "No asignado"}
                </span>
              </div>
            </div>

            {/* Datos del Cliente y Envío */}
            <div className="space-y-2 text-sm text-slate-700">
              <h4 className="font-bold text-slate-800 border-b pb-1 text-xs uppercase tracking-wider text-slate-400">
                Información de Envío & Cliente
              </h4>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Cliente:</span>{" "}
                {typeof pedidoVerDetalles.cliente === "string"
                  ? pedidoVerDetalles.cliente
                  : pedidoVerDetalles.cliente?.nombre || "N/A"}
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {pedidoVerDetalles.telefono ||
                  pedidoVerDetalles.datosEnvio?.telefono ||
                  "Sin teléfono"}
              </p>
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    Dirección de Entrega:
                  </p>
                  <p>
                    {pedidoVerDetalles.direccion ||
                      pedidoVerDetalles.datosEnvio?.direccion ||
                      "No especificada"}
                  </p>
                </div>
              </div>
            </div>

            {/* Productos Solicitados */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 border-b pb-1 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-500" /> Productos / Orden
              </h4>
              {pedidoVerDetalles.productos &&
              pedidoVerDetalles.productos.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {pedidoVerDetalles.productos.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.cantidad || 1}x {item.nombre || item.titulo}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Tamaño: {item.tamano || item.presentacion || "Estándar"}
                        </p>
                      </div>
                      <span className="font-medium text-slate-700">
                        RD${" "}
                        {(
                          (item.precio || 0) * (item.cantidad || 1)
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {pedidoVerDetalles.detalles || "Sin detalle especificado."}
                </p>
              )}
            </div>

            {/* Resumen de Pago */}
            <div className="border-t pt-3 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between font-bold text-slate-800 text-sm pt-1 border-t">
                <span>Total a Pagar:</span>
                <span className="text-amber-600">
                  RD$ {Number(pedidoVerDetalles.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPedidoVerDetalles(null)}
                className="w-full py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium text-sm transition-colors"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Pedido */}
      {pedidoAEditar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
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
                  value={pedidoAEditar.nombreCliente || ""}
                  onChange={(e) =>
                    setPedidoAEditar({
                      ...pedidoAEditar,
                      nombreCliente: e.target.value,
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
                  value={pedidoAEditar.telefonoCliente || ""}
                  onChange={(e) =>
                    setPedidoAEditar({
                      ...pedidoAEditar,
                      telefonoCliente: e.target.value,
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
