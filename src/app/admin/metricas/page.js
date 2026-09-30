"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Flame, 
  Users, 
  Award,
  Calendar,
  RefreshCw
} from "lucide-react";

export default function MetricasPage() {
  const [comparativa, setComparativa] = useState({
    mesAnterior: { ventas: 0, pedidos: 0, ganancia: 0 },
    mesActual: { ventas: 0, pedidos: 0, ganancia: 0 },
  });
  const [difVentas, setDifVentas] = useState("0.0");
  const [difPedidos, setDifPedidos] = useState("0.0");
  const [difGanancia, setDifGanancia] = useState("0.0");
  const [rankingJugos, setRankingJugos] = useState([]);
  const [topPersonal, setTopPersonal] = useState([]);
  const [debugKeys, setDebugKeys] = useState([]);

  const cargarMetricas = () => {
    try {
      // 1. Diagnóstico de llaves disponibles en localStorage
      const keysEnStorage = [];
      for (let i = 0; i < localStorage.length; i++) {
        keysEnStorage.push(localStorage.key(i));
      }
      setDebugKeys(keysEnStorage);

      // 2. Intentar buscar los pedidos en cualquier llave común posible
      let pedidosGuardados = [];
      const posiblesLlaves = ["maxi_pedidos", "maxxy_pedidos", "pedidos", "maxxy_ventas", "maxi_ventas", "ventas"];
      
      for (const llave of posiblesLlaves) {
        const data = localStorage.getItem(llave);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              pedidosGuardados = parsed;
              break;
            }
          } catch (err) {
            // continuar buscando si falla el parse
          }
        }
      }

      const personalGuardado = JSON.parse(localStorage.getItem("maxi_personal") || localStorage.getItem("maxxy_personal") || "[]");

      const ahora = new Date();
      const mesActualIndex = ahora.getMonth();
      const anioActual = ahora.getFullYear();

      let ventasActual = 0;
      let pedidosActual = 0;
      let gananciaActual = 0;
      
      let ventasAnterior = 0;
      let pedidosAnterior = 0;
      let gananciaAnterior = 0;

      const conteoJugos = {};
      const rendimientoEquipo = {};

      pedidosGuardados.forEach((pedido) => {
        // Intentar leer la fecha del pedido con varios nombres de campo posibles
        const fechaStr = pedido.fecha || pedido.createdAt || pedido.date || Date.now();
        const fechaPedido = new Date(fechaStr);
        const mesP = fechaPedido.getMonth();
        const anioP = fechaPedido.getFullYear();
        
        const totalP = Number(pedido.total || pedido.montoTotal || pedido.monto || 0);
        const gananciaP = Number(pedido.ganancia || totalP * 0.55); // Estimación del 55% si no existe campo

        // Filtrar por Mes Actual vs Mes Anterior
        if (mesP === mesActualIndex && anioP === anioActual) {
          ventasActual += totalP;
          pedidosActual += 1;
          gananciaActual += gananciaP;
        } else {
          ventasAnterior += totalP;
          pedidosAnterior += 1;
          gananciaAnterior += gananciaP;
        }

        // Conteo de productos / jugos (soportando varios formatos de items)
        const items = pedido.items || pedido.productos || [];
        if (Array.isArray(items)) {
          items.forEach((item) => {
            const nombreJugo = item.nombre || item.producto || item.titulo || "Jugo Natural";
            const cant = Number(item.cantidad || item.qty || 1);
            const precioItem = Number(item.precio || item.price || 0);
            const subtotal = precioItem > 0 ? precioItem * cant : Number(item.subtotal || 0);

            if (!conteoJugos[nombreJugo]) {
              conteoJugos[nombreJugo] = { unidades: 0, total: 0 };
            }
            conteoJugos[nombreJugo].unidades += cant;
            conteoJugos[nombreJugo].total += subtotal;
          });
        }

        // Rendimiento de personal
        const personaAsignada = pedido.vendedor || pedido.delivery || pedido.empleado;
        if (personaAsignada) {
          if (!rendimientoEquipo[personaAsignada]) {
            rendimientoEquipo[personaAsignada] = 0;
          }
          rendimientoEquipo[personaAsignada] += 1;
        }
      });

      const calcDif = (actual, anterior) => {
        if (anterior === 0) return actual > 0 ? "100.0" : "0.0";
        return (((actual - anterior) / anterior) * 100).toFixed(1);
      };

      setDifVentas(calcDif(ventasActual, ventasAnterior));
      setDifPedidos(calcDif(pedidosActual, pedidosAnterior));
      setDifGanancia(calcDif(gananciaActual, gananciaAnterior));

      setComparativa({
        mesAnterior: { ventas: Math.round(ventasAnterior), pedidos: Math.round(pedidosAnterior), ganancia: Math.round(gananciaAnterior) },
        mesActual: { ventas: Math.round(ventasActual), pedidos: Math.round(pedidosActual), ganancia: Math.round(gananciaActual) },
      });

      const totalUnidadesGlobal = Object.values(conteoJugos).reduce((acc, curr) => acc + curr.unidades, 0);
      const rankingOrdenado = Object.keys(conteoJugos).map((nombre) => {
        const data = conteoJugos[nombre];
        const porcentaje = totalUnidadesGlobal > 0 ? Math.round((data.unidades / totalUnidadesGlobal) * 100) : 0;
        return { nombre, unidades: data.unidades, total: data.total, porcentaje };
      }).sort((a, b) => b.unidades - a.unidades).slice(0, 5);

      setRankingJugos(rankingOrdenado);

      const personalList = personalGuardado.map((p) => {
        const stats = rendimientoEquipo[p.nombre] || 0;
        return {
          nombre: p.nombre,
          rol: p.rol,
          actividad: stats,
          tipoStr: p.rol === "Delivery" ? "envíos" : "ventas"
        };
      });
      setTopPersonal(personalList);

    } catch (e) {
      console.error("Error al calcular métricas reales:", e);
    }
  };

  useEffect(() => {
    cargarMetricas();
  }, []);

  return (
    <div className="space-y-8">
      {/* Encabezado con botón de refrescar */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Métricas & Analítica Visual</h1>
          <p className="text-slate-500 text-sm">Comparativas del negocio y productos populares calculados desde tus registros.</p>
        </div>
        <button 
          onClick={cargarMetricas}
          className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recargar Datos
        </button>
      </div>

      {/* Panel de Diagnóstico Oculto/Informativo si gustas verificar */}
      <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-500 flex flex-wrap gap-2 items-center">
        <span className="font-bold text-slate-700">Llaves detectadas en navegador:</span>
        {debugKeys.length === 0 ? "Ninguna" : debugKeys.join(", ")}
      </div>

      {/* Tarjetas Comparativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ventas Brutas</span>
            <span className="flex items-center gap-1 text-slate-500"><Calendar className="w-3.5 h-3.5" /> Mes Actual</span>
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

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ganancia Neta Estimada</span>
            <span className="text-amber-400 font-bold">Real</span>
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
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Jugos Más Vendidos
          </h2>

          <div className="space-y-4">
            {rankingJugos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No se encontraron productos registrados en los pedidos actuales. Verifica que tus pedidos guarden la estructura de items.</p>
            ) : (
              rankingJugos.map((jugo, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-800">{i + 1}. {jugo.nombre}</span>
                    <span className="text-slate-600">{jugo.unidades} unidades (RD$ {jugo.total.toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${jugo.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3 text-sm">
              <Clock className="w-4 h-4 text-amber-500" /> Horas de Mayor Movimiento
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded-xl font-bold text-amber-800">
                <span>12:00 PM - 2:30 PM</span>
                <span>🔥 Almuerzo / Colmados</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-slate-700">
                <span>4:00 PM - 6:30 PM</span>
                <span>🥤 Reposición Tarde</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3 text-sm">
              <Award className="w-4 h-4 text-amber-500" /> Rendimiento de Personal
            </h3>
            <div className="space-y-3">
              {topPersonal.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No hay personal registrado.</p>
              ) : (
                topPersonal.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{p.nombre}</p>
                      <p className="text-slate-400">{p.rol}</p>
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      {p.actividad} {p.tipoStr}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
