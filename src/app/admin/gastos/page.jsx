"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, Bell, Clock, ArrowLeft, CheckSquare, Square } from "lucide-react";
import Link from "next/link";

export default function AdminGastosFijos() {
  const [gastos, setGastos] = useState([]);
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
          pagado: g.pagado ?? false,
          // Guardamos el año y mes del último pago o la fecha de creación
          ultimoPagoAnioMes: g.ultimoPagoAnioMes || null
        }));
        setGastos(parsed);
      } catch (e) {
        console.error("Error al cargar gastos:", e);
      }
    }
  }, []);

  const guardarEnStorage = (nuevosGastos) => {
    setGastos(nuevosGastos);
    localStorage.setItem("maxxy_gastos_fijos", JSON.stringify(nuevosGastos));
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
      pagado: false,
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

  // Calcula cuántos meses se deben realmente (solo si la fecha ya pasó del día de pago y no se ha pagado)
  const calcularMesesAtrasados = (gasto) => {
    if (gasto.pagado) return 0;

    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth(); // 0 = Enero, 9 = Octubre, etc.
    const diaActual = hoy.getDate();

    // Fecha límite de pago de este mes
    const fechaCorteEsteMes = new Date(anioActual, mesActual, gasto.diaPago);

    // Si ya pasó el día de pago de este mes y no está pagado, contamos al menos 1 mes vencido
    let mesesVencidos = 0;
    
    // Evaluamos mes a mes hacia atrás desde el mes actual o el último mes pendiente
    let cursorAnio = anioActual;
    let cursorMes = mesActual;

    // Si hoy es menor al día de pago, el mes actual todavía NO está vencido
    if (diaActual < gasto.diaPago) {
      // Retrocedemos un mes para empezar a evaluar los verdaderamente atrasados
      cursorMes -= 1;
      if (cursorMes < 0) {
        cursorMes = 11;
        cursorAnio -= 1;
      }
    }

    // Comprobamos hacia atrás cuántos ciclos de pago se han cumplido sin pagar
    // Tomamos como referencia la fecha en que se creó o el último mes pagado
    let anioLimite = 2026;
    let mesLimite = 0; // Por defecto evaluamos este año

    if (gasto.ultimoPagoAnioMes) {
      const [pAnio, pMes] = gasto.ultimoPagoAnioMes.split("-").map(Number);
      anioLimite = pAnio;
      mesLimite = pMes;
    } else {
      // Si nunca se ha pagado, tomamos el mes actual como inicio del compromiso
      anioLimite = anioActual;
      mesLimite = mesActual;
    }

    // Contar cuántos meses han pasado desde el último pago hasta hoy donde ya cruzó el día de pago
    let contador = 0;
    let evalAnio = anioActual;
    let evalMes = mesActual;

    // Si el día actual es menor al día de pago, el mes corriente no cuenta como vencido aún
    if (diaActual < gasto.diaPago) {
      evalMes--;
      if (evalMes < 0) {
        evalMes = 11;
        evalAnio--;
      }
    }

    // Ciclo para contar meses hacia atrás que ya pasaron de su fecha
    while (evalAnio > anioLimite || (evalAnio === anioLimite && evalMes >= mesLimite)) {
      // Verificamos si este mes específico ya pasó su fecha de pago
      const fechaRevision = new Date(evalAnio, evalMes, gasto.diaPago);
      if (hoy >= fechaRevision) {
        contador++;
      }
      evalMes--;
      if (evalMes < 0) {
        evalMes = 11;
        evalAnio--;
      }
      // Evitar bucles infinitos por seguridad
      if (contador > 24) break; 
    }

    return Math.max(0, contador);
  };

  // Marcar como pagado o pendiente
  const togglePagado = (id) => {
    const hoy = new Date();
    const anioMesActual = `${hoy.getFullYear()}-${hoy.getMonth()}`;

    const actualizados = gastos.map(g => {
      if (g.id === id) {
        const nuevoPagado = !g.pagado;
        return {
          ...g,
          pagado: nuevoPagado,
          // Si lo marca como pagado, guardamos el año-mes actual para que el próximo mes se reactive solo
          ultimoPagoAnioMes: nuevoPagado ? anioMesActual : g.ultimoPagoAnioMes
        };
      }
      return g;
    });
    guardarEnStorage(actualizados);
  };

  // Días restantes para el próximo corte (para alertas visuales)
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
  
  // Total de deuda acumulada real (solo suma los meses que YA están vencidos / pasados de fecha)
  const totalDeudaPendiente = gastos.reduce((sum, g) => {
    if (g.pagado) return sum;
    const mesesAtrasados = calcularMesesAtrasados(g);
    return sum + (Number(g.monto || 0) * mesesAtrasados);
  }, 0);

  const cantidadConDeudaVencida = gastos.filter(g => !g.pagado && calcularMesesAtrasados(g) > 0).length;

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
          <p className="text-slate-500 text-sm">Gestiona tus compromisos mensuales. La deuda solo se acumula si pasa la fecha de corte.</p>
        </div>

        <div className="flex flex-wrap gap-3">
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

        <div className="lg:col-span-2 space-y-4">
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
                const esUrgente = diasRestantes <= 3 && !gasto.pagado;
                
                // Si hay meses atrasados reales se multiplica, si no, muestra el monto base mensual de este período
                const montoMostrar = mesesAtrasados > 0 
                  ? Number(gasto.monto) * mesesAtrasados 
                  : Number(gasto.monto);

                return (
                  <div
                    key={gasto.id}
                    className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between relative overflow-hidden ${
                      gasto.pagado
                        ? "bg-slate-50 border-slate-200 opacity-80"
                        : mesesAtrasados > 0
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePagado(gasto.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-sm ${
                              gasto.pagado
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                            title="Marcar como pagado o pendiente"
                          >
                            {gasto.pagado ? (
                              <>
                                <CheckSquare className="w-4 h-4 text-emerald-600" /> Pagado
                              </>
                            ) : (
                              <>
                                <Square className="w-4 h-4 text-slate-500" /> Pendiente
                              </>
                            )}
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
                        <h3 className={`font-bold text-base ${gasto.pagado ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {gasto.nombre}
                        </h3>
                        
                        <div className="mt-2 flex items-baseline justify-between">
                          <div>
                            <span className={`text-xl font-extrabold ${gasto.pagado ? "text-slate-400 line-through" : "text-slate-900"}`}>
                              RD$ {montoMostrar.toLocaleString()}
                            </span>
                            {mesesAtrasados > 1 && !gasto.pagado && (
                              <span className="text-[11px] text-rose-600 font-semibold block">
                                (RD$ {Number(gasto.monto).toLocaleString()} × {mesesAtrasados} meses vencidos)
                              </span>
                            )}
                            {mesesAtrasados === 0 && !gasto.pagado && (
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
                      {gasto.pagado ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl w-full">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Factura al día (Pagado)</span>
                        </div>
                      ) : mesesAtrasados > 0 ? (
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
      </div>
    </div>
  );
}
