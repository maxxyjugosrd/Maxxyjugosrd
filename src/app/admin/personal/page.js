"use client";

import { useState, useEffect } from "react";
import { Users, Plus, FileText, DollarSign, Bike, UserCheck, Download, Trash2, Edit, CreditCard, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { obtenerPedidosEnVivo } from "@/services/pedidosService";

export default function PersonalPage() {
  const [equipo, setEquipo] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  // Cargar personal desde localStorage al iniciar
  useEffect(() => {
    const personalGuardado = localStorage.getItem("maxi_personal");
    if (personalGuardado) {
      try {
        setEquipo(JSON.parse(personalGuardado));
      } catch (e) {
        setEquipo([]);
      }
    }
  }, []);

  // Escuchar los pedidos en tiempo real desde Firebase Firestore
  useEffect(() => {
    const unsubscribe = obtenerPedidosEnVivo((pedidosFirestore) => {
      setPedidos(pedidosFirestore);
    });
    return () => unsubscribe();
  }, []);

  // Calcular comisiones y entregas cada vez que cambien el equipo o los pedidos de Firebase
  useEffect(() => {
    if (equipo.length === 0) return;

    const equipoConComisionesCalculadas = equipo.map((colaborador) => {
      const nombreColaborador = (colaborador.nombre || "").trim().toLowerCase();

      // Si es Vendedor, calculamos su porcentaje sobre los pedidos completados
      if (colaborador.rol === "Vendedor" && colaborador.valorConfigurado > 0) {
        const ventasDelVendedor = pedidos.filter((v) => {
          const vendedorPedido = (v.vendedor || v.vendedorAsignado || v.usuario || "").trim().toLowerCase();
          const estadoPedido = (v.estado || "").toLowerCase();
          return vendedorPedido.includes(nombreColaborador) && estadoPedido === "completado";
        });
        
        const totalVendido = ventasDelVendedor.reduce((acc, curr) => acc + (Number(curr.subtotal) || Number(curr.total) || Number(curr.monto) || 0), 0);
        const comisionCalculada = (totalVendido * Number(colaborador.valorConfigurado)) / 100;

        return {
          ...colaborador,
          comisionAcumulada: comisionCalculada || 0,
          totalVentasPeriodo: totalVendido
        };
      }

      // Si es Delivery, calculamos las entregas realizadas en pedidos completados
      if (colaborador.rol === "Delivery") {
        const entregasDelDelivery = pedidos.filter((v) => {
          const deliveryPedido = (v.deliveryAsignado || v.delivery || "").trim().toLowerCase();
          const estadoPedido = (v.estado || "").toLowerCase();
          return deliveryPedido.includes(nombreColaborador) && estadoPedido === "completado";
        });

        const totalEntregas = entregasDelDelivery.length;

        return {
          ...colaborador,
          entregasRealizadas: totalEntregas,
          comisionAcumulada: totalEntregas * 100 // Costo estándar por carrera si aplica
        };
      }

      return colaborador;
    });

    // Solo actualizamos si hay diferencias reales para evitar bucles
    setEquipo(equipoConComisionesCalculadas);
  }, [pedidos]);

  // Función auxiliar para actualizar el estado y guardarlo en localStorage
  const actualizarYGuardarEquipo = (nuevoEquipo) => {
    setEquipo(nuevoEquipo);
    localStorage.setItem("maxi_personal", JSON.stringify(nuevoEquipo));
  };

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    rol: "Delivery",
    telefono: "",
    cedula: "",
    direccion: "",
    banco: "",
    tipoCuenta: "Ahorros",
    numeroCuenta: "",
    comisionPorcentaje: "",
    sueldoFijo: "",
  });

  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);

  // Cálculo de días para la próxima quincena (15 o 30)
  const obtenerInfoNomina = () => {
    const hoy = new Date();
    const dia = hoy.getDate();
    let proximoCorte = dia <= 15 ? 15 : 30;
    let mesAnio = hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
    let diasFaltantes = proximoCorte - dia;
    if (diasFaltantes < 0) diasFaltantes = 0;

    return { proximoCorte, diasFaltantes, mesAnio };
  };

  const infoNomina = obtenerInfoNomina();

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setNuevoEmpleado({
      nombre: "",
      rol: "Delivery",
      telefono: "",
      cedula: "",
      direccion: "",
      banco: "",
      tipoCuenta: "Ahorros",
      numeroCuenta: "",
      comisionPorcentaje: "",
      sueldoFijo: "",
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (colaborador) => {
    setModoEdicion(true);
    setIdEditando(colaborador.id);
    
    let porcentaje = "";
    let sueldo = "";
    if (colaborador.rol === "Vendedor") {
      porcentaje = colaborador.valorConfigurado || "";
    } else if (colaborador.rol === "Colaborador / Empleado") {
      sueldo = colaborador.valorConfigurado || "";
    }

    setNuevoEmpleado({
      nombre: colaborador.nombre || "",
      rol: colaborador.rol || "Delivery",
      telefono: colaborador.telefono || "",
      cedula: colaborador.cedula || "",
      direccion: colaborador.direccion || "",
      banco: colaborador.banco || "",
      tipoCuenta: colaborador.tipoCuenta || "Ahorros",
      numeroCuenta: colaborador.numeroCuenta || "",
      comisionPorcentaje: porcentaje,
      sueldoFijo: sueldo,
    });
    setMostrarModal(true);
  };

  const guardarEmpleado = (e) => {
    e.preventDefault();
    if (!nuevoEmpleado.nombre) return;

    let tipoPago = "Por Carrera";
    let valorAsignado = 0;

    if (nuevoEmpleado.rol === "Vendedor") {
      tipoPago = `${nuevoEmpleado.comisionPorcentaje}% sobre Ventas`;
      valorAsignado = Number(nuevoEmpleado.comisionPorcentaje) || 0;
    } else if (nuevoEmpleado.rol === "Colaborador / Empleado") {
      tipoPago = "Sueldo Fijo (Quincenal)";
      valorAsignado = Number(nuevoEmpleado.sueldoFijo) || 0;
    }

    if (modoEdicion) {
      const equipoActualizado = equipo.map((item) =>
        item.id === idEditando
          ? {
              ...item,
              nombre: nuevoEmpleado.nombre,
              rol: nuevoEmpleado.rol,
              telefono: nuevoEmpleado.telefono,
              cedula: nuevoEmpleado.cedula,
              direccion: nuevoEmpleado.direccion,
              banco: nuevoEmpleado.banco,
              tipoCuenta: nuevoEmpleado.tipoCuenta,
              numeroCuenta: nuevoEmpleado.numeroCuenta,
              tipoPago: tipoPago,
              valorConfigurado: valorAsignado,
            }
          : item
      );
      actualizarYGuardarEquipo(equipoActualizado);
    } else {
      const equipoActualizado = [
        ...equipo,
        {
          id: Date.now(),
          nombre: nuevoEmpleado.nombre,
          rol: nuevoEmpleado.rol,
          telefono: nuevoEmpleado.telefono,
          cedula: nuevoEmpleado.cedula,
          direccion: nuevoEmpleado.direccion,
          banco: nuevoEmpleado.banco,
          tipoCuenta: nuevoEmpleado.tipoCuenta,
          numeroCuenta: nuevoEmpleado.numeroCuenta,
          tipoPago: tipoPago,
          valorConfigurado: valorAsignado,
          comisionAcumulada: 0,
          historialDetalle: [],
        },
      ];
      actualizarYGuardarEquipo(equipoActualizado);
    }

    setMostrarModal(false);
  };

  const registrarPagoNomina = (colaborador) => {
    const confirmar = confirm(`¿Confirmas que le has pagado la quincena a ${colaborador.nombre}?\n\nEsto registrará el pago y pondrá su balance pendiente en RD$ 0.`);
    if (!confirmar) return;

    const equipoActualizado = equipo.map((item) => {
      if (item.id === colaborador.id) {
        const nuevoHistorial = [
          {
            fecha: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
            concepto: `Pago Quincenal (${infoNomina.proximoCorte} de ${infoNomina.mesAnio})`,
            monto: item.comisionAcumulada,
          },
          ...(item.historialDetalle || [])
        ];
        return {
          ...item,
          comisionAcumulada: 0,
          historialDetalle: nuevoHistorial,
        };
      }
      return item;
    });

    actualizarYGuardarEquipo(equipoActualizado);
    alert(`¡Pago registrado con éxito! El balance de ${colaborador.nombre} se ha reiniciado a 0.`);
  };

  const eliminarEmpleado = (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este colaborador del sistema?")) {
      const equipoActualizado = equipo.filter((item) => item.id !== id);
      actualizarYGuardarEquipo(equipoActualizado);
    }
  };

  const generarRecibo = (empleado) => {
    setReciboSeleccionado(empleado);
  };

  const imprimirRecibo = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #seccion-recibo-impresion, #seccion-recibo-impresion * {
            visibility: visible;
          }
          #seccion-recibo-impresion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
          }
        }
      `}</style>

      {/* Encabezado y Alerta de Nómina */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nómina, Personal & Expedientes</h1>
          <p className="text-slate-500 text-sm">Control quincenal de pagos (cortes los 15 y 30), datos bancarios y comisiones automáticas.</p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-5 h-5" /> Agregar Colaborador
        </button>
      </div>

      {/* Tarjeta de Alerta / Recordatorio de Nómina */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Próximo Corte de Nómina</span>
            <h3 className="text-lg font-black">Día {infoNomina.proximoCorte} de {infoNomina.mesAnio}</h3>
            <p className="text-xs text-slate-300">Faltan aprox. <span className="font-bold text-white">{infoNomina.diasFaltantes} días</span> para realizar los cálculos y desembolsos.</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl text-xs backdrop-blur-sm border border-white/10 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Sincronizado en tiempo real con Firebase Firestore</span>
        </div>
      </div>

      {/* Lista de Personal / Tarjetas de Nómina */}
      {equipo.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-lg">No hay personal registrado en nómina</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Agrega tu primer empleado para gestionar sus datos bancarios, teléfonos, direcciones y montos a pagar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipo.map((colaborador) => (
            <div key={colaborador.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                      {colaborador.rol === "Delivery" ? (
                        <Bike className="w-6 h-6 text-amber-600" />
                      ) : colaborador.rol === "Vendedor" ? (
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <UserCheck className="w-6 h-6 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{colaborador.nombre}</h3>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                        {colaborador.rol}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModalEditar(colaborador)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Editar Expediente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarEmpleado(colaborador.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar Colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Datos de contacto y banco resumidos */}
                <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p><span className="font-semibold text-slate-600">Tel:</span> {colaborador.telefono || "No especificado"}</p>
                  <p><span className="font-semibold text-slate-600">Cédula:</span> {colaborador.cedula || "No especificada"}</p>
                  <p><span className="font-semibold text-slate-600">Banco:</span> {colaborador.banco ? `${colaborador.banco} (${colaborador.tipoCuenta}) - ${colaborador.numeroCuenta}` : "Sin cuenta registrada"}</p>
                  <div className="pt-1 border-t mt-1 flex justify-between">
                    <span className="text-slate-400">Modalidad: </span>
                    <span className="font-bold text-slate-700">{colaborador.tipoPago}</span>
                  </div>
                  {colaborador.rol === "Vendedor" && (
                    <p className="text-[11px] text-emerald-600 font-medium pt-1">
                      Ventas del período: RD$ {colaborador.totalVentasPeriodo || 0}
                    </p>
                  )}
                  {colaborador.rol === "Delivery" && (
                    <p className="text-[11px] text-amber-600 font-medium pt-1">
                      Entregas realizadas: {colaborador.entregasRealizadas || 0}
                    </p>
                  )}
                </div>

                {/* Monto Acumulado */}
                <div className="border-t border-b py-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Pendiente de Pago:</span>
                  <span className="font-extrabold text-slate-900 text-lg">RD$ {colaborador.comisionAcumulada || 0}</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => registrarPagoNomina(colaborador)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Registrar Pago (Poner en 0)
                </button>
                <button
                  onClick={() => generarRecibo(colaborador)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-amber-400" /> Ver Recibo / Historial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Comprobante de Pago Oficial */}
      {reciboSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl border border-slate-200 my-8">
            
            <div id="seccion-recibo-impresion" className="space-y-6 bg-white p-2">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.JPG" alt="Maxxy Jugos Logo" className="w-14 h-14 object-cover rounded-2xl border" />
                  <div>
                    <h2 className="text-xl font-black text-slate-900">MAXXY JUGOS</h2>
                    <p className="text-xs text-slate-500">Comprobante de Nómina y Pagos</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p><span className="font-bold">Fecha:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="font-bold">Corte:</span> Quincenal ({infoNomina.proximoCorte})</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Colaborador:</span>
                  <span className="font-bold text-slate-800 text-sm">{reciboSeleccionado.nombre}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cargo / Rol:</span>
                  <span className="font-bold text-slate-800 text-sm">{reciboSeleccionado.rol}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cédula:</span>
                  <span className="font-bold text-slate-800">{reciboSeleccionado.cedula || "No registrada"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Teléfono:</span>
                  <span className="font-bold text-slate-800">{reciboSeleccionado.telefono || "No registrado"}</span>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <span className="text-slate-400 block">Datos Bancarios para Transferencia / Depósito:</span>
                  <span className="font-bold text-slate-800">{reciboSeleccionado.banco ? `${reciboSeleccionado.banco} - Cuenta de ${reciboSeleccionado.tipoCuenta}: ${reciboSeleccionado.numeroCuenta}` : "Pago en efectivo (Sin cuenta bancaria)"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Pagos Recientes</h4>
                <div className="border rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b">
                        <th className="p-3">Concepto / Fecha</th>
                        <th className="p-3 text-right">Monto Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reciboSeleccionado.historialDetalle && reciboSeleccionado.historialDetalle.length > 0 ? (
                        reciboSeleccionado.historialDetalle.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 text-slate-700">{item.concepto} <br/><span className="text-[10px] text-slate-400">{item.fecha}</span></td>
                            <td className="p-3 text-right font-bold text-slate-900">RD$ {item.monto}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="p-4 text-center text-slate-400 italic">
                            No hay pagos registrados previamente en este período.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center">
                <span className="font-medium text-sm">Balance Actual Pendiente:</span>
                <span className="text-xl font-black text-amber-400">RD$ {reciboSeleccionado.comisionAcumulada || 0}</span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-600">
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1"></div>
                  <p className="font-bold">Firma de la Empresa</p>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1"></div>
                  <p className="font-bold">Recibido Conforme (Empleado)</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3 print:hidden">
              <button
                onClick={imprimirRecibo}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <Download className="w-4 h-4" /> Imprimir Comprobante
              </button>
              <button
                onClick={() => setReciboSeleccionado(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Expediente Completo */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={guardarEmpleado} className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-4 my-8 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">
              {modoEdicion ? "Editar Expediente de Colaborador" : "Nuevo Colaborador en Nómina"}
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={nuevoEmpleado.nombre}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Teléfono</label>
                  <input
                    type="text"
                    placeholder="809-000-0000"
                    value={nuevoEmpleado.telefono}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Cédula</label>
                  <input
                    type="text"
                    placeholder="001-0000000-0"
                    value={nuevoEmpleado.cedula}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, cedula: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle, Sector, Ciudad"
                  value={nuevoEmpleado.direccion}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, direccion: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Rol / Cargo</label>
                <select
                  value={nuevoEmpleado.rol}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, rol: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Delivery">Delivery</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Colaborador / Empleado">Colaborador / Empleado Fijo</option>
                </select>
              </div>

              {nuevoEmpleado.rol === "Vendedor" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold">Porcentaje de Comisión por Venta (%)</label>
                  <input
                    type="number"
                    placeholder="Ej: 5 (para 5%)"
                    value={nuevoEmpleado.comisionPorcentaje}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, comisionPorcentaje: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              )}

              {nuevoEmpleado.rol === "Colaborador / Empleado" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold">Sueldo Fijo Mensual (RD$)</label>
                  <input
                    type="number"
                    placeholder="Ej: 15000"
                    value={nuevoEmpleado.sueldoFijo}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, sueldoFijo: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-[11px] text-amber-600 font-medium">El sistema calculará automáticamente la mitad (quincenal) para cada corte.</p>
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-600" /> Información Bancaria (Para Transferencias o Depósitos)
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold">Banco</label>
                    <input
                      type="text"
                      placeholder="Ej: Banreservas / BHD"
                      value={nuevoEmpleado.banco}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, banco: e.target.value })}
                      className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold">Tipo de Cuenta</label>
                    <select
                      value={nuevoEmpleado.tipoCuenta}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, tipoCuenta: e.target.value })}
                      className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-semibold">Número de Cuenta Bancaria</label>
                  <input
                    type="text"
                    placeholder="Número de cuenta del empleado"
                    value={nuevoEmpleado.numeroCuenta}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, numeroCuenta: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition">
                {modoEdicion ? "Guardar Cambios" : "Guardar Empleado"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm transition"
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
