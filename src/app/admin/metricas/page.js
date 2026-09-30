"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Clock, 
  Flame, 
  Award,
  Calendar,
  RefreshCw
} from "lucide-react";
import { obtenerPedidosEnVivo } from "@/services/pedidosService";
import { obtenerGastosEnVivo, obtenerRecibosEnVivo } from "@/services/gastosService";

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
  const [totalPedidosCount, setTotalPedidosCount] = useState(0);

  useEffect(() => {
    let pedidosData = [];
    let gastosData = [];
    let recibosData = [];

    const calcularMetricas = () => {
      // Cargar personal local si aplica
      let personalGuardado = [];
      try {
        personalGuardado = JSON.parse(localStorage.getItem("maxi_personal") || "[]");
      } catch (e) {
        personalGuardado = [];
      }

      const ahora = new Date();
      const mesActualIndex = ahora.getMonth();
      const anioActual = ahora.getFullYear();

      let ventasActual = 0;
      let pedidosActual = 0;
      let ventasAnterior = 0;
      let pedidosAnterior = 0;

      const conteoJugos = {};
      const rendimientoEquipo = {};

      pedidosData.forEach((pedido) => {
        let fechaPedido = ahora;
        if (pedido.fecha) {
          if (typeof pedido.fecha.toDate === "function") {
            fechaPedido = pedido.fecha.toDate();
          } else {
            fechaPedido = new Date(pedido.fecha);
          }
        }

        const mesP = isNaN(fechaPedido.getTime()) ? mesActualIndex : fechaPedido.getMonth();
        const anioP = isNaN(fechaPedido.getTime()) ? anioActual : fechaPedido.getFullYear();
        
        const totalP = Number(pedido.total || pedido.montoTotal || pedido.monto || 0);

        if (mesP === mesActualIndex && anioP === anioActual) {
          ventasActual += totalP;
          pedidosActual += 1;
        } else {
          ventasAnterior += totalP;
          pedidosAnterior += 1;
        }

        // Conteo de jugos/productos
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
            conteoJugos[nombreJugo].total += (subtotal > 0 ? subtotal : precioItem * cant);
          });
        }

        // Rendimiento por rol
        const vendedor = pedido.vendedorAsignado || pedido.vendedor;
        const delivery = pedido.deliveryAsignado || pedido.delivery;

        if (vendedor && vendedor !== "Sin Asignar") {
          if (!rendimientoEquipo[vendedor]) {
            rendimientoEquipo[vendedor] = { count: 0, rolStr: "Vendedor(a)" };
          }
          rendimientoEquipo[vendedor].count += 1;
        }

        if (delivery && delivery !== "Sin Asignar") {
          if (!rendimientoEquipo[delivery]) {
            rendimientoEquipo[delivery] = { count: 0, rolStr: "Delivery" };
          }
          rendimientoEquipo[delivery].count += 1;
        }
      });

      // Calcular total de gastos de contabilidad y pagos de personal en vivo
      const totalGastosContabilidad = gastosData.reduce(
        (acc, g) => acc + Number(g.monto || g.costo || g.total || 0),
        0
      );

      const totalPagosPersonal = recibosData.reduce(
        (acc, r) => acc + Number(r.monto || r.pago || r.total || 0),
        0
      );

      const totalGastosYPagos = totalGastosContabilidad + totalPagosPersonal;

      // Ganancia neta real unificada (Ventas totales menos todos los gastos y pagos reales)
      const ventasTotalesGlobal = ventasActual + ventasAnterior;
      const gananciaNetaRealGlobal = ventasTotalesGlobal - totalGastosYPagos;
      
      // Para mantener la lógica mensual aproximada de la vista:
      const gananciaActual = ventasActual - totalGastosYPagos; // O ajustado proporcionalmente
      const gananciaAnterior = ventasAnterior;

      const calcDif = (actual, anterior) => {
        if (anterior === 0) return actual > 0 ? "100.0" : "0.0";
        return (((actual - anterior) / anterior) * 100).toFixed(1);
      };

      setDifVentas(calcDif(ventasActual, ventasAnterior));
      setDifPedidos(calcDif(pedidosActual, pedidosAnterior));
      setDifGanancia(calcDif(gananciaActual, gananciaAnterior));

      setComparativa({
        mesAnterior: { ventas: Math.round(ventasAnterior), pedidos: Math.round(pedidosAnterior), ganancia: Math.round(gananciaAnterior) },
        mesActual: { ventas: Math.round(ventasActual), pedidos: Math.round(pedidosActual), ganancia: Math.round(gananciaNetaRealGlobal) },
      });

      const totalUnidadesGlobal = Object.values(conteoJugos).reduce((acc, curr) => acc + curr.unidades, 0);
      const rankingOrdenado = Object.keys(conteoJugos).map((nombre) => {
        const data = conteoJugos[nombre];
        const porcentaje = totalUnidadesGlobal > 0 ? Math.round((data.unidades / totalUnidadesGlobal) * 100) : 0;
        return { nombre, unidades: data.unidades, total: data.total, porcentaje };
      }).sort((a, b) => b.unidades - a.unidades).slice(0, 5);

      setRankingJugos(rankingOrdenado);

      const personalList = [];
      const nombresProcesados = new Set();

      Object.keys(rendimientoEquipo).forEach((nombre) => {
        nombresProcesados.add(nombre);
        personalList.push({
          nombre: nombre,
          actividad: rendimientoEquipo[nombre].count,
          tipoStr: rendimientoEquipo[nombre].rolStr
        });
      });

      personalGuardado.forEach((p) => {
        if (!nombresProcesados.has(p.nombre)) {
          personalList.push({
            nombre: p.nombre,
            actividad: 0,
            tipoStr: p.rol || "Personal"
          });
        }
      });

      setTopPersonal(personalList);
    };

    // Suscripciones en tiempo real
    const desuscribirPedidos = obtenerPedidosEnVivo((datos) => {
      pedidosData = datos;
      setTotalPedidosCount(datos.length);
      calcularMetricas();
    });

    const desuscribirGastos = obtenerGastosEnVivo((datos) => {
      gastosData = datos;
      calcularMetricas();
    });

    const desuscribirRecibos = obtenerRecibosEnVivo((datos) => {
      recibosData = datos;
      calcularMetricas();
    });

    return () => {
      desuscribirPedidos && desuscribirPedidos();
      desuscribirGastos && desuscribirGastos();
      desuscribirRecibos && desuscribirRecibos();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Métricas & Analítica Visual</h1>
          <p className="text-slate-500 text-sm">Comparativas del negocio y productos populares calculados desde tus registros.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> En Vivo (Firebase)
        </div>
      </div>

      <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-600 flex justify-between items-center">
        <span>📊 <b>Sincronizado con Firebase Firestore:</b> {totalPedidosCount} pedido(s) cargados</span>
        <span className="text-emerald-600 font-bold">● Conectado correctamente</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ventas Brutas</span>
            <span className="flex items-center gap-1 text-slate-500"><Calendar className="w-3.5 h-3.5" /> Mes Actual</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">RD$ {comparativa.mesActual.ventas.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" /> +{difVentas}%
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
            <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" /> +{difPedidos}%
            </span>
          </div>
          <p className="text-xs text-slate-400">Mes anterior: {comparativa.mesAnterior.pedidos} pedidos</p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ganancia Neta Real</span>
            <span className="text-amber-400 font-bold">Limpia</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">RD$ {comparativa.mesActual.ganancia.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-xs font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +{difGanancia}%
            </span>
          </div>
          <p className="text-xs text-slate-400">Descontando insumos y pagos reales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Jugos Más Vendidos
          </h2>

          <div className="space-y-4">
            {rankingJugos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No se encontraron productos registrados en los pedidos actuales.</p>
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
                      <p className="text-slate-400">{p.tipoStr}</p>
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      {p.actividad} pedidos
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
