"use client";

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, TrendingDown, Award, Target, Flame, DollarSign, Users } from "lucide-react";
import { obtenerPedidosEnVivo } from "@/services/pedidosService";

export default function CompetenciaVendedores() {
  const [equipo, setEquipo] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [metaMensualDefault, setMetaMensualDefault] = useState(15000); // Meta por defecto en RD$ (configurable)

  // Mes actual para el análisis
  const fechaActualStr = new Date().toISOString().slice(0, 7);
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActualStr);

  useEffect(() => {
    const personalGuardado = localStorage.getItem("maxi_personal");
    if (personalGuardado) {
      try {
        const parsed = JSON.parse(personalGuardado);
        if (Array.isArray(parsed)) {
          setEquipo(parsed.filter(p => p.rol === "Vendedor"));
        }
      } catch (e) {
        setEquipo([]);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = obtenerPedidosEnVivo((pedidosFirestore) => {
      if (Array.isArray(pedidosFirestore)) {
        setPedidos(pedidosFirestore);
      }
    });
    return () => unsubscribe();
  }, []);

  // Función para obtener las ventas de un vendedor en un mes específico (YYYY-MM)
  const calcularVentasMes = (nombreVendedor, mesAnio) => {
    const nombreClean = (nombreVendedor || "").trim().toLowerCase();
    
    const ventasFiltradas = pedidos.filter((v) => {
      const vendedorPedido = (v.vendedor || v.vendedorAsignado || v.usuario || "").toString().trim().toLowerCase();
      const estadoPedido = (v.estado || "").toString().trim().toLowerCase();
      
      let fechaPedidoStr = "";
      const fechaPedido = v.fecha || v.creadoEn || v.createdAt;
      if (fechaPedido && typeof fechaPedido.toDate === "function") {
        fechaPedidoStr = fechaPedido.toDate().toISOString().slice(0, 7);
      } else if (typeof fechaPedido === "string") {
        fechaPedidoStr = fechaPedido.slice(0, 7);
      }

      return vendedorPedido.includes(nombreClean) && 
             estadoPedido === "completado" && 
             (!fechaPedidoStr || fechaPedidoStr === mesAnio);
    });

    // Calcular el monto total de esas ventas
    let totalVendido = 0;
    ventasFiltradas.forEach((pedido) => {
      const monto = Number(pedido.subtotal) || Number(pedido.total) || Number(pedido.monto) || 0;
      totalVendido += monto;
    });

    return {
      totalVendido,
      cantidadPedidos: ventasFiltradas.length
    };
  };

  // Obtener el mes anterior en formato YYYY-MM
  const obtenerMesAnterior = (mesStr) => {
    const [anio, mes] = mesStr.split("-").map(Number);
    let d = new Date(anio, mes - 2, 1);
    return d.toISOString().slice(0, 7);
  };

  const mesAnteriorStr = obtenerMesAnterior(mesSeleccionado);

  // Procesar ranking y métricas de cada vendedor
  const rankingVendedores = equipo.map((vendedor) => {
    const datosMesActual = calcularVentasMes(vendedor.nombre, mesSeleccionado);
    const datosMesAnterior = calcularVentasMes(vendedor.nombre, mesAnteriorStr);

    const diferenciaMonto = datosMesActual.totalVendido - datosMesAnterior.totalVendido;
    const porcentajeCrecimiento = datosMesAnterior.totalVendido > 0 
      ? ((diferenciaMonto / datosMesAnterior.totalVendido) * 100).toFixed(1) 
      : datosMesActual.totalVendido > 0 ? 100 : 0;

    const metaVendedor = Number(vendedor.metaMensual) || metaMensualDefault;
    const porcentajeCumplimientoMeta = metaVendedor > 0 ? Math.min(Math.round((datosMesActual.totalVendido / metaVendedor) * 100), 100) : 0;

    return {
      ...vendedor,
      ventasActuales: datosMesActual.totalVendido,
      pedidosActuales: datosMesActual.cantidadPedidos,
      ventasAnteriores: datosMesAnterior.totalVendido,
      diferenciaMonto,
      porcentajeCrecimiento: Number(porcentajeCrecimiento),
      metaVendedor,
      porcentajeCumplimientoMeta
    };
  }).sort((a, b) => b.ventasActuales - a.ventasActuales); // Ordenar de mayor a menor ventas (Ranking)

  return (
    <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" /> Competencia y Rendimiento Comercial
          </div>
          <h2 className="text-xl font-black text-slate-900">Ranking y KPIs de Vendedores</h2>
          <p className="text-xs text-slate-500">Mide el volumen, la competencia interna y el crecimiento mes a mes de tu equipo.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Periodo de Evaluación:</span>
          <input
            type="month"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Podio de Competencia */}
      {rankingVendedores.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-400 text-xs">
          No hay vendedores registrados en el sistema ("Personal & Recibos").
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankingVendedores.map((vendedor, index) => {
            const esPrimero = index === 0 && vendedor.ventasActuales > 0;
            return (
              <div 
                key={vendedor.id || index}
                className={`p-5 rounded-2xl border relative flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                  esPrimero ? "bg-gradient-to-br from-amber-500/10 via-white to-white border-amber-400 ring-2 ring-amber-400/30" : "bg-white border-slate-200"
                }`}
              >
                {/* Posición / Medalla */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      index === 0 ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" :
                      index === 1 ? "bg-slate-300 text-slate-800" :
                      index === 2 ? "bg-amber-700/30 text-amber-900" : "bg-slate-100 text-slate-600"
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{vendedor.nombre}</h3>
                      <span className="text-[10px] text-slate-400">Comisión: {vendedor.valorConfigurado}% por ventas</span>
                    </div>
                  </div>
                  {esPrimero && (
                    <span className="bg-amber-500/20 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600" /> Líder
                    </span>
                  )}
                </div>

                {/* Ventas del Mes y Metas */}
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Ventas ({mesSeleccionado}):</span>
                      <span className="font-black text-slate-900 text-sm">RD$ {vendedor.ventasActuales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Pedidos completados:</span>
                      <span className="font-bold text-slate-700">{vendedor.pedidosActuales} colmados/pedidos</span>
                    </div>
                  </div>

                  {/* Comparativa Mes a Mes */}
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-slate-500">Vs Mes Anterior:</span>
                    <div className={`flex items-center gap-1 font-bold ${vendedor.porcentajeCrecimiento >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {vendedor.porcentajeCrecimiento >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{vendedor.porcentajeCrecimiento >= 0 ? `+${vendedor.porcentajeCrecimiento}%` : `${vendedor.porcentajeCrecimiento}%`}</span>
                      <span className="text-[10px] text-slate-400 font-normal">(RD$ {vendedor.ventasAnteriores.toLocaleString()})</span>
                    </div>
                  </div>

                  {/* KPI / Cumplimiento de Meta */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Target className="w-3 h-3 text-amber-600" /> Meta del Mes:
                      </span>
                      <span className="text-slate-800">{vendedor.porcentajeCumplimientoMeta}% <span className="text-[10px] text-slate-400 font-normal">(Meta: RD$ {vendedor.metaVendedor.toLocaleString()})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${vendedor.porcentajeCumplimientoMeta >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} 
                        style={{ width: `${vendedor.porcentajeCumplimientoMeta}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
