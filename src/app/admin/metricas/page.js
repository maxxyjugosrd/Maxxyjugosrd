"use client";

import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Flame, 
  Users, 
  Award,
  Calendar
} from "lucide-react";

export default function MetricasPage() {
  // Datos comparativos del Mes Anterior vs. Mes Actual
  const comparativa = {
    mesAnterior: { ventas: 38200, pedidos: 210, ganancia: 19500 },
    mesActual: { ventas: 48500, pedidos: 268, ganancia: 27600 },
  };

  // Crecimiento porcentual
  const difVentas = (((comparativa.mesActual.ventas - comparativa.mesAnterior.ventas) / comparativa.mesAnterior.ventas) * 100).toFixed(1);
  const difPedidos = (((comparativa.mesActual.pedidos - comparativa.mesAnterior.pedidos) / comparativa.mesAnterior.pedidos) * 100).toFixed(1);
  const difGanancia = (((comparativa.mesActual.ganancia - comparativa.mesAnterior.ganancia) / comparativa.mesAnterior.ganancia) * 100).toFixed(1);

  // Jugos más vendidos
  const rankingJugos = [
    { nombre: "Jugo de Chinola (Maracuyá)", unidades: 98, total: 14700, porcentaje: 36 },
    { nombre: "Morir Soñando", unidades: 74, total: 14800, porcentaje: 28 },
    { nombre: "Jugo de Fresa Natural", unidades: 52, total: 9360, porcentaje: 19 },
    { nombre: "Jugo de Zapote", unidades: 26, total: 4160, porcentaje: 10 },
    { nombre: "Jugo de Mango", unidades: 18, total: 2520, porcentaje: 7 },
  ];

  // Rendimiento de Vendedores / Deliveries
  const topPersonal = [
    { nombre: "Carlos Gómez", rol: "Delivery", entregas: 142, comisiones: "RD$ 4,260" },
    { nombre: "María Rodriguez", rol: "Vendedora Web/POS", ventas: 89, total: "RD$ 16,020" },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Métricas & Analítica Visual</h1>
        <p className="text-slate-500 text-sm">Comparativas del negocio, horas de mayor demanda y productos más populares.</p>
      </div>

      {/* Tarjetas Comparativas: Mes Pasado vs Mes Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ventas Brutas</span>
            <span className="flex items-center gap-1 text-slate-500"><Calendar className="w-3.5 h-3.5" /> Septiembre vs Agosto</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">RD$ {comparativa.mesActual.ventas.toLocaleString()}</span>
            <span className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
              Number(difVentas) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {Number(difVentas) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {difVentas}%
            </span>
          </div>
          <p className="text-xs text-slate-400">Mes anterior: RD$ {comparativa.mesAnterior.ventas.toLocaleString()}</p>
        </div>

        {/* Total Pedidos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Pedidos Realizados</span>
            <span className="flex items-center gap-1 text-slate-500"><Calendar className="w-3.5 h-3.5" /> Mes Actual</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{comparativa.mesActual.pedidos} pedidos</span>
            <span className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
              Number(difPedidos) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {Number(difPedidos) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {difPedidos}%
            </span>
          </div>
          <p className="text-xs text-slate-400">Mes anterior: {comparativa.mesAnterior.pedidos} pedidos</p>
        </div>

        {/* Ganancia Limpia */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ganancia Neta Limpia</span>
            <span className="text-amber-400 font-bold">Límite Real</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">RD$ {comparativa.mesActual.ganancia.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-xs font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              +{difGanancia}%
            </span>
          </div>
          <p className="text-xs text-slate-400">Mes anterior: RD$ {comparativa.mesAnterior.ganancia.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ranking: Jugo más vendido */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Jugos Más Vendidos (Para compra de frutas)
          </h2>

          <div className="space-y-4">
            {rankingJugos.map((jugo, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-800">{i + 1}. {jugo.nombre}</span>
                  <span className="text-slate-600">{jugo.unidades} jugos (RD$ {jugo.total.toLocaleString()})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${jugo.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horas Pico y Rendimiento de Personal */}
        <div className="space-y-6">
          {/* Horas Pico */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3 text-sm">
              <Clock className="w-4 h-4 text-amber-500" /> Horas Pico de Demanda
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded-xl font-bold text-amber-800">
                <span>12:00 PM - 2:30 PM</span>
                <span>🔥 Hora del Almuerzo (45%)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-slate-700">
                <span>4:00 PM - 6:30 PM</span>
                <span>🥤 Tarde Fresca (35%)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-slate-500">
                <span>8:00 AM - 10:00 AM</span>
                <span>Mañana (20%)</span>
              </div>
            </div>
          </div>

          {/* Destacados del Equipo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3 text-sm">
              <Award className="w-4 h-4 text-amber-500" /> Rendimiento de Personal
            </h3>
            <div className="space-y-3">
              {topPersonal.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{p.nombre}</p>
                    <p className="text-slate-400">{p.rol}</p>
                  </div>
                  <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {p.entregas ? `${p.entregas} envíos` : `${p.ventas} ventas`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
