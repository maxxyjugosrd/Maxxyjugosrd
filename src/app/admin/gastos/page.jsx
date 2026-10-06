"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, Bell, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminGastosFijos() {
  const [gastos, setGastos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [diaPago, setDiaPago] = useState("");
  const [categoria, setCategoria] = useState("Servicios");

  // Cargar gastos guardados en localStorage al iniciar (vacío por defecto)
  useEffect(() => {
    const guardados = localStorage.getItem("maxxy_gastos_fijos");
    if (guardados) {
      try {
        setGastos(JSON.parse(guardados));
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
      categoria
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

  // Función para calcular los días faltantes para el próximo pago
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

  const totalGastosFijos = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabecera con navegación hacia Finanzas o Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <Link href="/admin/finanzas" className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Finanzas
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" /> Control de Gastos Fijos
          </h1>
          <p className="text-slate-500 text-sm">Administra tus servicios recurrentes y mantén el control de tus fechas de corte.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl shadow-sm text-right">
          <span className="text-xs font-semibold text-amber-800 block">Total Compromiso Mensual</span>
          <span className="text-lg font-extrabold text-amber-700">RD$ {totalGastosFijos.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
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
                placeholder="Ej. Luz Edesur, Alquiler, Internet"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Monto Estimado (RD$) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Ej. 4500"
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
                  placeholder="Ej. 15"
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
                  <option value="Servicios">Servicios</option>
                  <option value="Local">Local</option>
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

        {/* Listado con alertas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-slate-700">Tus Gastos Registrados y Alertas de Pago</h2>

          {gastos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-slate-600">No tienes gastos fijos registrados todavía.</p>
              <p className="text-xs">Usa el formulario de la izquierda para agregar la luz, el local o cualquier servicio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gastos.map((gasto) => {
                const diasRestantes = calcularDiasRestantes(gasto.diaPago);
                const esUrgente = diasRestantes <= 3;
                const esAlertaCercana = diasRestantes > 3 && diasRestantes <= 7;

                return (
                  <div
                    key={gasto.id}
                    className={`bg-white p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between relative overflow-hidden ${
                      esUrgente
                        ? "border-rose-400 bg-rose-50/20"
                        : esAlertaCercana
                        ? "border-amber-400 bg-amber-50/10"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                            {gasto.categoria}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base">{gasto.nombre}</h3>
                        </div>
                        <button
                          onClick={() => eliminarGasto(gasto.id)}
                          className="text-slate-300 hover:text-rose-500 transition p-1"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-slate-900">
                          RD$ {Number(gasto.monto).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" /> Paga el día {gasto.diaPago}
                        </span>
                      </div>
                    </div>

                    {/* Alerta de días restantes */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {esUrgente ? (
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
                      ) : esAlertaCercana ? (
                        <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold bg-amber-100/70 px-2.5 py-1 rounded-xl w-full">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Faltan {diasRestantes} días para pagar</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium bg-emerald-50 px-2.5 py-1 rounded-xl w-full">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Faltan {diasRestantes} días (Al día)</span>
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
