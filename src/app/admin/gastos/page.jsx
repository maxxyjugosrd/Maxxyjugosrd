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
          fechaInicioPendiente: g.fechaInicioPendiente || new Date().toISOString()
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
      fechaInicioPendiente: new Date().toISOString()
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

  // Función automática para calcular meses atrasados según la fecha actual y el día de pago
  const calcularMesesAtrasados = (gasto) => {
    if (gasto.pagado) return 0;

    const hoy = new Date();
    const inicio = new Date(gasto.fechaInicioPendiente);
    const diaPago = gasto.diaPago;

    let contador = 0;
    let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), diaPago);

    if (cursor < inicio) {
      cursor.setMonth(cursor.getMonth() + 1);
    }

    while (cursor <= hoy) {
      contador++;
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return Math.max(1, contador);
  };

  // Marcar como pagado o pendiente (reinicia la fecha base al pagar)
  const togglePagado = (id) => {
    const actualizados = gastos.map(g => {
      if (g.id === id) {
        const nuevoPagado = !g.pagado;
        return {
          ...g,
          pagado: nuevoPagado,
          fechaInicioPendiente: nuevoPagado ? new Date().toISOString() : g.fechaInicioPendiente
        };
      }
      return g;
    });
    guardarEnStorage(actualizados);
  };

  // Días restantes para el próximo corte
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
  
  const gastosPendientes = gastos.filter(g => !g.pagado);
  const cantidadPendientes = gastosPendientes.length;
  
  const totalDeudaPendiente = gastosPendientes.reduce((sum, g) => {
    const meses = calcularMesesAtrasados(g);
    return sum + (Number(g.monto || 0) * meses);
  }, 0);

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
          <p className="text-slate-500 text-sm">El sistema calcula de forma automática los meses acumulados si pasa tu fecha de corte.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">Compromiso Mensual Base</span>
            <span className="text-base font-bold text-slate-700">RD$ {totalCompromisoMensual.toLocaleString()}</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl shadow-sm text-right">
            <span className="text-[11px] font-semibold text-rose-800 block">
              Deuda Acumulada ({cantidadPendientes} {cantidadPendientes === 1 ? 'servicio' : 'servicios'})
            </span>
            <span className="text-lg font-extrabold text-rose-700">RD$ {totalDeudaPendiente.toLocaleString()}</span>
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
          <h2 className="text-base font-semibold text-slate-700">Tus Gastos Registrados y Cálculo Automático</h2>

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
                const montoTotalItem = Number(gasto.monto) * mesesAtrasados;

                return (
                  <div
                    key={gasto.id}
                    className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between relative overflow-hidden ${
                      gasto.pagado
                        ? "bg-slate-50 border-slate-200 opacity-80"
                        : esUrgente
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
                              RD$ {montoTotalItem.toLocaleString()}
                            </span>
                            {mesesAtrasados > 1 && !gasto.pagado && (
                              <span className="text-[11px] text-rose-600 font-semibold block">
                                (RD$ {Number(gasto.monto).toLocaleString()} × {mesesAtrasados} meses acumulados)
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
                      ) : mesesAtrasados > 1 ? (
                        <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-100/80 px-2.5 py-1 rounded-xl w-full">
                          <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                          <span>⚠️ Tienes {mesesAtrasados} meses acumulados sin pagar</span>
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
