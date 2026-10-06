"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, Bell, Clock, ArrowLeft, CheckSquare, History, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminGastosFijos() {
  const [gastos, setGastos] = useState([]);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [diaPago, setDiaPago] = useState("");
  const [categoria, setCategoria] = useState("Servicios");

  useEffect(() => {
    const guardados = localStorage.getItem("maxxy_gastos_fijos");
    if (guardados) {
      try {
        const parsed = JSON.parse(guardados).map(g => ({
          ...g,
          ultimoPagoAnioMes: g.ultimoPagoAnioMes || null
        }));
        setGastos(parsed);
      } catch (e) {
        console.error("Error al cargar gastos:", e);
      }
    }

    const historialGuardado = localStorage.getItem("maxxy_historial_pagos");
    if (historialGuardado) {
      try {
        setHistorialPagos(JSON.parse(historialGuardado));
      } catch (e) {
        console.error("Error al cargar historial:", e);
      }
    }
  }, []);

  const guardarEnStorage = (nuevosGastos) => {
    setGastos(nuevosGastos);
    localStorage.setItem("maxxy_gastos_fijos", JSON.stringify(nuevosGastos));
  };

  const guardarHistorialStorage = (nuevoHistorial) => {
    setHistorialPagos(nuevoHistorial);
    localStorage.setItem("maxxy_historial_pagos", JSON.stringify(nuevoHistorial));
  };

  const agregarGasto = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !monto || !diaPago) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const diaNum = parseInt(diaPago);
    if (diaNum < 1 || diaNum > 31) {
      alert("El día de pago debe estar entre 1 y 31.");
      return;
    }

    const nuevoGasto = {
      id: "gasto-" + Date.now(),
      nombre: nombre.trim(),
      monto: parseFloat(monto),
      diaPago: diaNum,
      categoria,
      ultimoPagoAnioMes: null
    };

    guardarEnStorage([...gastos, nuevoGasto]);
    setNombre("");
    setMonto("");
    setDiaPago("");
  };

  const eliminarGasto = (id) => {
    if (confirm("¿Estás seguro de eliminar este gasto fijo?")) {
      const filtrados = gastos.filter((g) => g.id !== id);
      guardarEnStorage(filtrados);
    }
  };

  const eliminarItemHistorial = (idHistorial) => {
    if (confirm("¿Deseas eliminar este registro del historial?")) {
      const historialFiltrado = historialPagos.filter((h) => h.id !== idHistorial);
      guardarHistorialStorage(historialFiltrado);
    }
  };

  // Cálculo corregido de meses atrasados basado en la fecha actual (Octubre 2026)
  const calcularMesesAtrasados = (gasto) => {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth(); // 9 para Octubre
    const diaActual = hoy.getDate();

    // Si tiene registrado un último pago, evaluamos a partir del mes siguiente al pago
    let evalAnio = anioActual;
    let evalMes = mesActual;

    if (gasto.ultimoPagoAnioMes) {
      const [pAnio, pMes] = gasto.ultimoPagoAnioMes.split("-").map(Number);
      // Avanzamos un mes después del último pago registrado
      evalMes = pMes + 1;
      evalAnio = pAnio;
      if (evalMes > 11) {
        evalMes = 0;
        evalAnio++;
      }
    } else {
      // Si nunca se ha pagado, tomamos el mes en que se creó o el mes actual pero respetando el día de corte
      // Por simplicidad, si no hay pago, evaluamos desde el mes actual si ya pasó su día
    }

    let mesesVencidos = 0;

    // Contamos hacia adelante o revisamos si los meses anteriores a hoy ya pasaron su fecha de pago sin pagarse
    // Comprobamos mes a mes desde el último pago hasta el mes actual
    while (
      evalAnio < anioActual || 
      (evalAnio === anioActual && evalMes <= mesActual)
    ) {
      // Verificamos si la fecha de corte de ese mes ya pasó
      const fechaCorte = new Date(evalAnio, evalMes, gasto.diaPago);
      
      // Si hoy es igual o mayor a la fecha de corte de ese mes, se cuenta como vencido/pendiente
      if (hoy >= fechaCorte) {
        // Excepción: si el mes evaluado es el mes actual y hoy es menor al día de pago, no cuenta aún
        if (!(evalAnio === anioActual && evalMes === mesActual && diaActual < gasto.diaPago)) {
          mesesVencidos++;
        }
      }

      evalMes++;
      if (evalMes > 11) {
        evalMes = 0;
        evalAnio++;
      }

      if (mesesVencidos > 24) break; // seguridad
    }

    return Math.max(0, mesesVencidos);
  };

  const registrarPago = (id) => {
    const hoy = new Date();
    // Guardamos el año y mes exacto actual (Ej: "2026-9" para octubre)
    const anioMesActual = `${hoy.getFullYear()}-${hoy.getMonth()}`;
    const fechaLegible = hoy.toLocaleDateString("es-DO", { year: 'numeric', month: 'long', day: 'numeric' });

    let itemPagadoInfo = null;

    const actualizados = gastos.map(g => {
      if (g.id === id) {
        itemPagadoInfo = {
          id: "hist-" + Date.now(),
          nombre: g.nombre,
          monto: g.monto,
          categoria: g.categoria,
          fechaPago: fechaLegible
        };
        return {
          ...g,
          ultimoPagoAnioMes: anioMesActual // Actualiza el ciclo al mes actual para que reinicie la cuenta
        };
      }
      return g;
    });

    guardarEnStorage(actualizados);

    if (itemPagadoInfo) {
      const nuevoHistorial = [itemPagadoInfo, ...historialPagos];
      guardarHistorialStorage(nuevoHistorial);
    }
  };

  const calcularDiasRestantes = (diaPagoObjetivo) => {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    let fechaPago = new Date(anioActual, mesActual, diaPagoObjetivo);

    if (hoy > fechaPago) {
      fechaPago = new Date(anioActual, mesActual + 1, diaPagoObjetivo);
    }

    const diferenciaTiempo = fechaPago.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    return diasRestantes;
  };

  const totalCompromisoMensual = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  
  const totalDeudaPendiente = gastos.reduce((sum, g) => {
    const mesesAtrasados = calcularMesesAtrasados(g);
    return sum + (Number(g.monto || 0) * mesesAtrasados);
  }, 0);

  const cantidadConDeudaVencida = gastos.filter(g => calcularMesesAtrasados(g) > 0).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b pb-4">
        <div>
          <Link href="/admin/finanzas" className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Finanzas
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" /> Control de Gastos Fijos y Alertas
          </h1>
          <p className="text-slate-500 text-sm">Gestiona tus compromisos mensuales y consulta el historial de pagos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/gastos/facturas"
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-amber-400" /> Ver Facturas y Comprobantes
          </Link>

          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">Compromiso Mensual Base</span>
            <span className="text-base font-bold text-slate-700">RD$ {totalCompromisoMensual.toLocaleString()}</span>
          </div>

          <div className={`border px-4 py-2 rounded-2xl shadow-sm text-right ${totalDeudaPendiente > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
            <span className={`text-[11px] font-semibold block ${totalDeudaPendiente > 0 ? 'text-rose-800' : 'text-slate-400'}`}>
              Deuda Vencida ({cantidadConDeudaVencida} {cantidadConDeudaVencida === 1 ? 'servicio' : 'servicios'})
            </span>
            <span className={`text-lg font-extrabold ${totalDeudaPendiente > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              RD$ {totalDeudaPendiente.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" /> Registrar Nuevo Gasto
          </h2>

          <form onSubmit={agregarGasto} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nombre del Servicio / Gasto *</label>
              <input
                type="text"
                required
                placeholder="Ej. Alquiler Casa, Luz Edesur"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Monto Mensual (RD$) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Ej. 15000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Día de Pago (1-31) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="31"
                  placeholder="Ej. 30"
                  value={diaPago}
                  onChange={(e) => setDiaPago(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Local">Local</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Impuestos">Impuestos</option>
                  <option value="Suscripciones">Suscripciones</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm mt-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Guardar Gasto Fijo
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-700">Tus Gastos Registrados y Estado Actual</h2>

            {gastos.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium text-slate-600">No tienes gastos fijos registrados todavía.</p>
                <p className="text-xs">Usa el formulario de la izquierda para agregar la casa o servicios.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gastos.map((gasto) => {
                  const diasRestantes = calcularDiasRestantes(gasto.diaPago);
                  const mesesAtrasados = calcularMesesAtrasados(gasto);
                  const esUrgente = diasRestantes <= 3;
                  
                  const montoMostrar = mesesAtrasados > 0 
                    ? Number(gasto.monto) * mesesAtrasados 
                    : Number(gasto.monto);

                  return (
                    <div
                      key={gasto.id}
                      className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between relative overflow-hidden ${
                        mesesAtrasados > 0
                          ? "border-rose-400 bg-rose-50/20"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => registrarPago(gasto.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm bg-amber-500 text-white hover:bg-amber-600"
                              title="Marcar como pagado y enviar al historial"
                            >
                              <CheckSquare className="w-4 h-4" /> Marcar Pagado
                            </button>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              {gasto.categoria}
                            </span>
                          </div>

                          <button
                            onClick={() => eliminarGasto(gasto.id)}
                            className="text-slate-300 hover:text-rose-500 transition p-1"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3">
                          <h3 className="font-bold text-base text-slate-800">
                            {gasto.nombre}
                          </h3>
                          
                          <div className="mt-2 flex items-baseline justify-between">
                            <div>
                              <span className="text-xl font-extrabold text-slate-900">
                                RD$ {montoMostrar.toLocaleString()}
                              </span>
                              {mesesAtrasados > 1 && (
                                <span className="text-[11px] text-rose-600 font-semibold block">
                                  (RD$ {Number(gasto.monto).toLocaleString()} × {mesesAtrasados} meses vencidos)
                                </span>
                              )}
                              {mesesAtrasados === 0 && (
                                <span className="text-[11px] text-slate-400 block">
                                  Compromiso mes actual
                                </span>
                              )}
                            </div>
                            
                            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-amber-500" /> Día {gasto.diaPago}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {mesesAtrasados > 0 ? (
                          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-100/80 px-2.5 py-1 rounded-xl w-full">
                            <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                            <span>⚠️ Vencido: {mesesAtrasados} {mesesAtrasados === 1 ? 'mes acumulado' : 'meses acumulados'}</span>
                          </div>
                        ) : esUrgente ? (
                          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-100/80 px-2.5 py-1 rounded-xl w-full">
                            <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                            <span>
                              {diasRestantes === 0
                                ? "¡Vence HOY!"
                                : diasRestantes === 1
                                ? "¡Vence mañana!"
                                : `⚠️ Vence en ${diasRestantes} días`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-xl w-full">
                            <Clock className="w-4 h-4 shrink-0 text-amber-500" />
                            <span>Faltan {diasRestantes} días para el corte</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sección de Historial de Pagos Realizados */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <History className="w-5 h-5 text-emerald-500" /> Historial de Pagos Realizados
            </h3>

            {historialPagos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay pagos registrados en el historial todavía. Cuando hagas clic en "Marcar Pagado" aparecerá aquí.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-2">
                {historialPagos.map((pago) => (
                  <div key={pago.id} className="py-3 flex justify-between items-center text-sm gap-2">
                    <div>
                      <p className="font-bold text-slate-700">{pago.nombre}</p>
                      <p className="text-xs text-slate-400">Pagado el {pago.fechaPago}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                        RD$ {Number(pago.monto).toLocaleString()}
                      </span>
                      <button
                        onClick={() => eliminarItemHistorial(pago.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1.5 rounded-lg hover:bg-rose-50"
                        title="Eliminar este registro del historial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
