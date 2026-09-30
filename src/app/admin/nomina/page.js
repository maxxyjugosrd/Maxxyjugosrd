"use client";

import { useState, useEffect } from "react";
import { FileText, DollarSign, Bike, Calendar, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { obtenerPedidosEnVivo } from "@/services/pedidosService";

export default function NominaPage() {
  const [equipo, setEquipo] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [mostrarDetalleId, setMostrarDetalleId] = useState(null);
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);

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

  useEffect(() => {
    const unsubscribe = obtenerPedidosEnVivo((pedidosFirestore) => {
      setPedidos(pedidosFirestore);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (equipo.length === 0) return;

    const equipoConComisionesCalculadas = equipo.map((colaborador) => {
      const nombreColaborador = (colaborador.nombre || "").trim().toLowerCase();

      if (colaborador.rol === "Vendedor" && colaborador.valorConfigurado > 0) {
        const ventasDelVendedor = pedidos.filter((v) => {
          const vendedorPedido = (v.vendedor || v.vendedorAsignado || v.usuario || "").toString().trim().toLowerCase();
          const estadoPedido = (v.estado || "").toString().trim().toLowerCase();
          return vendedorPedido.includes(nombreColaborador) && estadoPedido === "completado";
        });
        
        const ventasPorCliente = {};
        ventasDelVendedor.forEach((pedido) => {
          let clienteBruto = pedido.cliente || pedido.nombreCliente || pedido.telefonoCliente || "cliente_general";
          if (typeof clienteBruto === "object" && clienteBruto !== null) {
            clienteBruto = clienteBruto.nombre || clienteBruto.nombreCliente || clienteBruto.telefono || "cliente_general";
          }
          const clienteKey = clienteBruto.toString().trim().toLowerCase();
          const montoPedido = Number(pedido.subtotal) || Number(pedido.total) || Number(pedido.monto) || 0;

          if (!ventasPorCliente[clienteKey]) ventasPorCliente[clienteKey] = 0;
          ventasPorCliente[clienteKey] += montoPedido;
        });

        const totalVendido = Object.values(ventasPorCliente).reduce((acc, curr) => acc + curr, 0);
        const comisionCalculada = (totalVendido * Number(colaborador.valorConfigurado)) / 100;

        return {
          ...colaborador,
          comisionAcumulada: comisionCalculada || 0,
          totalVentasPeriodo: totalVendido,
          registrosAsociados: ventasDelVendedor
        };
      }

      if (colaborador.rol === "Delivery") {
        const entregasDelDelivery = pedidos.filter((v) => {
          let deliveryBruto = v.deliveryAsignado || v.delivery || "";
          if (typeof deliveryBruto === "object" && deliveryBruto !== null) {
            deliveryBruto = deliveryBruto.nombre || "";
          }
          const deliveryPedido = deliveryBruto.toString().trim().toLowerCase();
          const estadoPedido = (v.estado || "").toString().trim().toLowerCase();
          return deliveryPedido.includes(nombreColaborador) && estadoPedido === "completado";
        });

        const totalEntregas = entregasDelDelivery.length;

        return {
          ...colaborador,
          entregasRealizadas: totalEntregas,
          comisionAcumulada: totalEntregas * 100,
          registrosAsociados: entregasDelDelivery
        };
      }

      return colaborador;
    });

    setEquipo(equipoConComisionesCalculadas);
  }, [pedidos]);

  const actualizarYGuardarEquipo = (nuevoEquipo) => {
    setEquipo(nuevoEquipo);
    localStorage.setItem("maxi_personal", JSON.stringify(nuevoEquipo));
  };

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
        return { ...item, comisionAcumulada: 0, historialDetalle: nuevoHistorial };
      }
      return item;
    });

    actualizarYGuardarEquipo(equipoActualizado);
    alert(`¡Pago registrado con éxito! El balance de ${colaborador.nombre} se ha reiniciado a 0.`);
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #seccion-recibo-impresion, #seccion-recibo-impresion * { visibility: visible; }
          #seccion-recibo-impresion { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: white !important; }
        }
      `}</style>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Control de Nómina & Pagos</h1>
        <p className="text-slate-500 text-sm">Cortes automáticos quincenales, auditoría de comisiones por pedidos y recibos oficiales.</p>
      </div>

      {/* Alerta de Nómina */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Próximo Corte Quincenal</span>
            <h3 className="text-lg font-black">Día {infoNomina.proximoCorte} de {infoNomina.mesAnio}</h3>
            <p className="text-xs text-slate-300">Faltan aprox. <span className="font-bold text-white">{infoNomina.diasFaltantes} días</span> para realizar los desembolsos.</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl text-xs backdrop-blur-sm border border-white/10 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Sincronizado con Firebase Firestore</span>
        </div>
      </div>

      {/* Listado de colaboradores para auditoría de pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {equipo.map((colaborador) => {
          const estaExpandido = mostrarDetalleId === colaborador.id;

          return (
            <div key={colaborador.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                      {colaborador.rol === "Delivery" ? <Bike className="w-6 h-6 text-amber-600" /> : colaborador.rol === "Vendedor" ? <DollarSign className="w-6 h-6 text-emerald-600" /> : <FileText className="w-6 h-6 text-slate-700" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{colaborador.nombre}</h3>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">{colaborador.rol}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p><span className="font-semibold text-slate-600">Banco:</span> {colaborador.banco ? `${colaborador.banco} (${colaborador.tipoCuenta}) - ${colaborador.numeroCuenta}` : "Sin cuenta bancaria registrada"}</p>
                  <div className="pt-1 border-t mt-1 flex justify-between">
                    <span className="text-slate-400">Modalidad:</span>
                    <span className="font-bold text-slate-700">{colaborador.tipoPago}</span>
                  </div>
                </div>

                <div className="border-t border-b py-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Total Pendiente:</span>
                  <span className="font-extrabold text-slate-900 text-xl text-emerald-600">RD$ {colaborador.comisionAcumulada || 0}</span>
                </div>

                {(colaborador.rol === "Delivery" || colaborador.rol === "Vendedor") && (
                  <div>
                    <button
                      onClick={() => setMostrarDetalleId(estaExpandido ? null : colaborador.id)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <span>{estaExpandido ? "Ocultar desglose" : `Auditar cuentas (${colaborador.rol === "Delivery" ? `${colaborador.entregasRealizadas || 0} entregas` : `RD$ ${colaborador.totalVentasPeriodo || 0} ventas`})`}</span>
                      {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {estaExpandido && (
                      <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs max-h-60 overflow-y-auto">
                        <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px] border-b border-slate-700 pb-1">Pedidos completados asociados:</p>
                        {colaborador.registrosAsociados && colaborador.registrosAsociados.length > 0 ? (
                          colaborador.registrosAsociados.map((ped, idx) => {
                            const monto = Number(ped.subtotal) || Number(ped.total) || Number(ped.monto) || 0;
                            const cliente = ped.cliente || ped.nombreCliente || "Cliente";
                            return (
                              <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-1.5 pt-1">
                                <div>
                                  <span className="font-bold text-white block">{cliente}</span>
                                  <span className="text-[10px] text-slate-400">ID: {ped.id?.slice(-6)}</span>
                                </div>
                                <div className="text-right">
                                  {colaborador.rol === "Delivery" ? <span className="font-bold text-amber-400">+ RD$ 100</span> : <span className="font-bold text-emerald-400">RD$ {monto}</span>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-slate-400 italic text-center py-2">No hay registros completados en este corte.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <button onClick={() => registrarPagoNomina(colaborador)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
                  <CheckCircle2 className="w-4 h-4" /> Registrar Pago Quincenal (Poner en 0)
                </button>
                <button onClick={() => setReciboSeleccionado(colaborador)} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
                  <FileText className="w-4 h-4 text-amber-400" /> Ver Comprobante Impreso
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Comprobante / Recibo de Pago */}
      {reciboSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl border my-8">
            <div id="seccion-recibo-impresion" className="space-y-6 bg-white p-2">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.JPG" alt="Logo" className="w-14 h-14 object-cover rounded-2xl border" />
                  <div>
                    <h2 className="text-xl font-black text-slate-900">MAXXY JUGOS</h2>
                    <p className="text-xs text-slate-500">Comprobante Oficial de Pago de Nómina</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p><span className="font-bold">Fecha:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="font-bold">Corte:</span> Quincenal ({infoNomina.proximoCorte})</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-slate-400 block">Colaborador:</span><span className="font-bold text-slate-800 text-sm">{reciboSeleccionado.nombre}</span></div>
                <div><span className="text-slate-400 block">Cargo / Rol:</span><span className="font-bold text-slate-800 text-sm">{reciboSeleccionado.rol}</span></div>
                <div><span className="text-slate-400 block">Cédula:</span><span className="font-bold text-slate-800">{reciboSeleccionado.cedula || "N/D"}</span></div>
                <div><span className="text-slate-400 block">Teléfono:</span><span className="font-bold text-slate-800">{reciboSeleccionado.telefono || "N/D"}</span></div>
                <div className="col-span-2 border-t pt-2"><span className="text-slate-400 block">Datos Bancarios:</span><span className="font-bold text-slate-800">{reciboSeleccionado.banco ? `${reciboSeleccionado.banco} - Cuenta de ${reciboSeleccionado.tipoCuenta}: ${reciboSeleccionado.numeroCuenta}` : "Efectivo"}</span></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Pagos Anteriores</h4>
                <div className="border rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b"><th className="p-3">Concepto</th><th className="p-3 text-right">Monto</th></tr>
                    </thead>
                    <tbody>
                      {reciboSeleccionado.historialDetalle?.length > 0 ? (
                        reciboSeleccionado.historialDetalle.map((h, i) => (
                          <tr key={i} className="border-b"><td className="p-3">{h.concepto}<br/><span className="text-[10px] text-slate-400">{h.fecha}</span></td><td className="p-3 text-right font-bold">RD$ {h.monto}</td></tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="p-4 text-center text-slate-400 italic">No hay pagos anteriores registrados.</td></tr>
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
                <div className="space-y-6"><div className="border-b border-slate-400 pb-1"></div><p className="font-bold">Firma de la Empresa</p></div>
                <div className="space-y-6"><div className="border-b border-slate-400 pb-1"></div><p className="font-bold">Recibido Conforme (Empleado)</p></div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3 print:hidden">
              <button onClick={() => window.print()} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                <Download className="w-4 h-4" /> Imprimir Comprobante
              </button>
              <button onClick={() => setReciboSeleccionado(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
