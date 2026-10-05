"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, DollarSign, Bike, Calendar, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Download, Search, Filter, Users, Wallet, Trophy, TrendingUp, TrendingDown, Target, Flame, X } from "lucide-react";
import { obtenerPedidosEnVivo } from "@/services/pedidosService";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function NominaPage() {
  const [equipo, setEquipo] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [mostrarDetalleId, setMostrarDetalleId] = useState(null);
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);
  
  // Estado para la fecha personalizada a mostrar/imprimir en el comprobante
  const [fechaReciboFiltro, setFechaReciboFiltro] = useState(() => new Date().toISOString().slice(0, 10));
  
  // Estado para abrir/cerrar el panel de competencias
  const [mostrarCompetencia, setMostrarCompetencia] = useState(false);
  const [metaMensualDefault] = useState(150000); // Meta por defecto en RD$

  // Estados para filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("Todos");
  
  // Filtro por mes (por defecto el mes actual en formato YYYY-MM)
  const fechaActualStr = new Date().toISOString().slice(0, 7);
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActualStr);

  const yaCalculoInicial = useRef(false);

  useEffect(() => {
    const unsubscribe = obtenerPedidosEnVivo((pedidosFirestore) => {
      if (Array.isArray(pedidosFirestore)) {
        setPedidos(pedidosFirestore);
      }
    });
    return () => unsubscribe();
  }, []);

 useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "personal"), (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({ idDoc: docSnap.id, ...docSnap.data() }));
      setEquipo(lista); // Actualiza la lista en vivo en la nómina de admin
    });
    return () => unsubscribe();
  }, []);
  
  // Función auxiliar para verificar si una fecha de pedido coincide con un mes (YYYY-MM)
  const coincideMesEspecifico = (fechaPedido, mesTarget) => {
    if (!fechaPedido) return true;
    let fechaStr = "";
    if (typeof fechaPedido.toDate === "function") {
      fechaStr = fechaPedido.toDate().toISOString().slice(0, 7);
    } else if (typeof fechaPedido === "string") {
      fechaStr = fechaPedido.slice(0, 7);
    } else if (fechaPedido instanceof Date) {
      fechaStr = fechaPedido.toISOString().slice(0, 7);
    }
    if (!fechaStr) return true;
    return fechaStr === mesTarget;
  };

  useEffect(() => {
    if (equipo.length === 0) return;

    setEquipo((equipoActual) => 
      equipoActual.map((colaborador) => {
        const nombreColaborador = (colaborador.nombre || "").trim().toLowerCase();

        if (colaborador.rol === "Vendedor" && Number(colaborador.valorConfigurado) > 0) {
          const ventasDelVendedor = pedidos.filter((v) => {
            const vendedorPedido = (v.vendedor || v.vendedorAsignado || v.usuario || "").toString().trim().toLowerCase();
            const estadoPedido = (v.estado || "").toString().trim().toLowerCase();
            const fechaPedido = v.fecha || v.creadoEn || v.createdAt;

            return vendedorPedido.includes(nombreColaborador) && 
                   estadoPedido === "completado" && 
                   coincideMesEspecifico(fechaPedido, mesSeleccionado);
          });
          
          const ventasPorCliente = {};
          ventasDelVendedor.forEach((pedido) => {
            let clienteBruto = pedido.cliente || pedido.nombreCliente || pedido.telefonoCliente || "cliente_general";
            if (typeof clienteBruto === "object" && clienteBruto !== null) {
              clienteBruto = clienteBruto.nombre || clienteBruto.nombreCliente || clienteBruto.telefono || "cliente_general";
            }
            const clienteKey = clienteBruto.toString().trim().toLowerCase();
            const montoPedido = Number(pedido.subtotal) || 0;

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
            const fechaPedido = v.fecha || v.creadoEn || v.createdAt;

            return deliveryPedido.includes(nombreColaborador) && 
                   estadoPedido === "completado" &&
                   coincideMesEspecifico(fechaPedido, mesSeleccionado);
          });

          const totalEntregas = entregasDelDelivery.length;
          const totalComisionEnvios = entregasDelDelivery.reduce((acc, ped) => {
            const costoEnvioReal = Number(ped.costoEnvio) || (ped.zonaEnvio && Number(ped.zonaEnvio.costo)) || 100;
            return acc + costoEnvioReal;
          }, 0);

          return {
            ...colaborador,
            entregasRealizadas: totalEntregas,
            comisionAcumulada: totalComisionEnvios || 0,
            registrosAsociados: entregasDelDelivery
          };
        }

        return colaborador;
      })
    );
  }, [pedidos, mesSeleccionado]);

  const actualizarYGuardarEquipo = async (colaboradorActualizado) => {
    try {
      if (!colaboradorActualizado.idDoc) return;
      const docRef = doc(db, "personal", colaboradorActualizado.idDoc);
      await updateDoc(docRef, {
        comisionAcumulada: colaboradorActualizado.comisionAcumulada,
        historialDetalle: colaboradorActualizado.historialDetalle || [],
        totalVentasPeriodo: colaboradorActualizado.totalVentasPeriodo || 0,
      });
    } catch (error) {
      console.error("Error al actualizar en Firebase:", error);
    }
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

  const registrarPagoNomina = async (colaborador) => {
    const confirmar = confirm(`¿Confirmas que le has pagado la quincena a ${colaborador.nombre} para el mes ${mesSeleccionado}?\n\nEsto registrará el pago y pondrá su balance pendiente en RD$ 0.`);
    if (!confirmar) return;

    const nuevoHistorial = [
      {
        fecha: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
        concepto: `Pago Quincenal (${infoNomina.proximoCorte}) [Mes: ${mesSeleccionado}]`,
        monto: colaborador.comisionAcumulada || 0,
      },
      ...(Array.isArray(colaborador.historialDetalle) ? colaborador.historialDetalle : [])
    ];

    const colaboradorActualizado = {
      ...colaborador,
      comisionAcumulada: 0,
      historialDetalle: nuevoHistorial,
    };

    await actualizarYGuardarEquipo(colaboradorActualizado);
    alert(`¡Pago registrado con éxito en Firebase! El balance de ${colaborador.nombre} se ha reiniciado a 0.`);
  };

  const formatearTextoSeguro = (valor) => {
    if (!valor) return "N/D";
    if (typeof valor === "object") {
      return valor.nombre || valor.telefono || JSON.stringify(valor);
    }
    return String(valor);
  };

  const calcularVentasMesEspecifico = (nombreVendedor, mesAnio) => {
    const nombreClean = (nombreVendedor || "").trim().toLowerCase();
    const ventasFiltradas = pedidos.filter((v) => {
      const vendedorPedido = (v.vendedor || v.vendedorAsignado || v.usuario || "").toString().trim().toLowerCase();
      const estadoPedido = (v.estado || "").toString().trim().toLowerCase();
      const fechaPedido = v.fecha || v.creadoEn || v.createdAt;

      return vendedorPedido.includes(nombreClean) && 
             estadoPedido === "completado" && 
             coincideMesEspecifico(fechaPedido, mesAnio);
    });

    let totalVendido = 0;
    ventasFiltradas.forEach((pedido) => {
      const monto = Number(pedido.subtotal) || 0;
      totalVendido += monto;
    });

    return { totalVendido, cantidadPedidos: ventasFiltradas.length };
  };

  const obtenerMesAnterior = (mesStr) => {
    const [anio, mes] = mesStr.split("-").map(Number);
    let d = new Date(anio, mes - 2, 1);
    return d.toISOString().slice(0, 7);
  };

  const mesAnteriorStr = obtenerMesAnterior(mesSeleccionado);

  const vendedoresList = equipo.filter(c => c.rol === "Vendedor");
  const rankingVendedores = vendedoresList.map((vendedor) => {
    const datosActuales = calcularVentasMesEspecifico(vendedor.nombre, mesSeleccionado);
    const datosAnteriores = calcularVentasMesEspecifico(vendedor.nombre, mesAnteriorStr);

    const diferenciaMonto = datosActuales.totalVendido - datosAnteriores.totalVendido;
    const porcentajeCrecimiento = datosAnteriores.totalVendido > 0 
      ? ((diferenciaMonto / datosAnteriores.totalVendido) * 100).toFixed(1) 
      : datosActuales.totalVendido > 0 ? 100 : 0;

    const metaVendedor = Number(vendedor.metaMensual) || metaMensualDefault;
    const porcentajeCumplimientoMeta = metaVendedor > 0 ? Math.min(Math.round((datosActuales.totalVendido / metaVendedor) * 100), 100) : 0;

    return {
      ...vendedor,
      ventasActuales: datosActuales.totalVendido,
      pedidosActuales: datosActuales.cantidadPedidos,
      ventasAnteriores: datosAnteriores.totalVendido,
      porcentajeCrecimiento: Number(porcentajeCrecimiento),
      metaVendedor,
      porcentajeCumplimientoMeta
    };
  }).sort((a, b) => b.ventasActuales - a.ventasActuales);

  const equipoFiltrado = equipo.filter((colaborador) => {
    const nombreMatch = (colaborador.nombre || "").toLowerCase().includes(busqueda.toLowerCase());
    const cedulaMatch = (colaborador.cedula || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideTexto = nombreMatch || cedulaMatch;

    if (filtroPosicion === "Todos") return coincideTexto;
    return coincideTexto && colaborador.rol === filtroPosicion;
  });

  const totalNominaMes = equipoFiltrado.reduce((acc, curr) => acc + (Number(curr.comisionAcumulada) || 0), 0);

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #seccion-recibo-impresion, #seccion-recibo-impresion * { visibility: visible; }
          #seccion-recibo-impresion { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: white !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Nómina & Pagos</h1>
          <p className="text-slate-500 text-sm">Cortes automáticos quincenales, auditoría de comisiones por pedidos y recibos oficiales.</p>
        </div>

        <button
          onClick={() => setMostrarCompetencia(!mostrarCompetencia)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2.5 transition text-xs uppercase tracking-wider"
        >
          <Trophy className="w-4 h-4 text-slate-950" />
          <span>{mostrarCompetencia ? "Ocultar Competencia" : " Ver Competencia y Ranking"}</span>
        </button>
      </div>

      {mostrarCompetencia && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4" /> Competencia Comercial Interna
              </div>
              <h2 className="text-lg font-black text-white">Ranking y KPIs de Vendedores ({mesSeleccionado})</h2>
            </div>
            <button 
              onClick={() => setMostrarCompetencia(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {vendedoresList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay vendedores registrados en el sistema. Asegúrate de registrar personal con el rol "Vendedor".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankingVendedores.map((vendedor, index) => {
                const esPrimero = index === 0 && vendedor.ventasActuales > 0;
                return (
                  <div 
                    key={vendedor.id || index}
                    className={`p-5 rounded-2xl border relative flex flex-col justify-between space-y-4 transition-all ${
                      esPrimero ? "bg-slate-800/90 border-amber-500/50 shadow-lg shadow-amber-500/10" : "bg-slate-800/40 border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          index === 0 ? "bg-amber-500 text-slate-950 shadow-md" :
                          index === 1 ? "bg-slate-300 text-slate-900" :
                          index === 2 ? "bg-amber-700/50 text-amber-200" : "bg-slate-700 text-slate-300"
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{vendedor.nombre}</h3>
                          <span className="text-[10px] text-slate-400">Comisión: {vendedor.valorConfigurado}%</span>
                        </div>
                      </div>
                      {esPrimero && (
                        <span className="bg-amber-500/20 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" /> Líder
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Ventas en el mes:</span>
                          <span className="font-black text-white text-sm">RD$ {vendedor.ventasActuales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Pedidos completados:</span>
                          <span className="font-bold text-slate-300">{vendedor.pedidosActuales} colmados</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs px-1">
                        <span className="text-slate-400">Vs Mes Anterior ({mesAnteriorStr}):</span>
                        <div className={`flex items-center gap-1 font-bold ${vendedor.porcentajeCrecimiento >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {vendedor.porcentajeCrecimiento >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{vendedor.porcentajeCrecimiento >= 0 ? `+${vendedor.porcentajeCrecimiento}%` : `${vendedor.porcentajeCrecimiento}%`}</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Target className="w-3 h-3 text-amber-400" /> Meta Mensual:
                          </span>
                          <span className="text-white">{vendedor.porcentajeCumplimientoMeta}% <span className="text-[10px] text-slate-500 font-normal">(RD$ {vendedor.metaVendedor.toLocaleString()})</span></span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-col justify-between shadow-lg md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Próximo Corte Quincenal</span>
              <h3 className="text-lg font-black">Día {infoNomina.proximoCorte} de {infoNomina.mesAnio}</h3>
              <p className="text-xs text-slate-300">Faltan aprox. <span className="font-bold text-white">{infoNomina.diasFaltantes} días</span> para realizar los desembolsos.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-emerald-600" /> Total Nómina Pendiente
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">RD$ {totalNominaMes.toLocaleString()}</h2>
            <p className="text-[11px] text-slate-400">Filtrado para el mes: {mesSeleccionado}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold px-2">
            <Filter className="w-3.5 h-3.5" /> Posición:
          </div>
          <select
            value={filtroPosicion}
            onChange={(e) => setFiltroPosicion(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="Todos">Todas las posiciones</option>
            <option value="Delivery">Delivery</option>
            <option value="Vendedor">Vendedor</option>
            <option value="Colaborador / Empleado">Empleado Fijo</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold px-2">
            Mes:
          </div>
          <input
            type="month"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {equipoFiltrado.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-sm font-medium">No se encontraron colaboradores con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {equipoFiltrado.map((colaborador) => {
            const estaExpandido = mostrarDetalleId === colaborador.idDoc || mostrarDetalleId === colaborador.id;

            return (
              <div key={colaborador.idDoc || colaborador.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                        {colaborador.rol === "Delivery" ? <Bike className="w-6 h-6 text-amber-600" /> : colaborador.rol === "Vendedor" ? <DollarSign className="w-6 h-6 text-emerald-600" /> : <FileText className="w-6 h-6 text-slate-700" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{formatearTextoSeguro(colaborador.nombre)}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">{formatearTextoSeguro(colaborador.rol)}</span>
                          <span className="text-[11px] text-slate-400">Cédula: {formatearTextoSeguro(colaborador.cedula)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p><span className="font-semibold text-slate-600">Banco:</span> {colaborador.banco ? `${formatearTextoSeguro(colaborador.banco)} (${formatearTextoSeguro(colaborador.tipoCuenta)}) - ${formatearTextoSeguro(colaborador.numeroCuenta)}` : "Sin cuenta bancaria registrada"}</p>
                    <div className="pt-1 border-t mt-1 flex justify-between">
                      <span className="text-slate-400">Modalidad:</span>
                      <span className="font-bold text-slate-700">{formatearTextoSeguro(colaborador.tipoPago)}</span>
                    </div>
                  </div>

                  <div className="border-t border-b py-3 flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Total Pendiente ({mesSeleccionado}):</span>
                    <span className="font-extrabold text-slate-900 text-xl text-emerald-600">RD$ {(colaborador.comisionAcumulada || 0).toLocaleString()}</span>
                  </div>

                  {(colaborador.rol === "Delivery" || colaborador.rol === "Vendedor") && (
                    <div>
                      <button
                        onClick={() => setMostrarDetalleId(estaExpandido ? null : (colaborador.idDoc || colaborador.id))}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <span>{estaExpandido ? "Ocultar desglose" : `Auditar cuentas (${colaborador.rol === "Delivery" ? `${colaborador.entregasRealizadas || 0} entregas` : `RD$ ${(colaborador.totalVentasPeriodo || 0).toLocaleString()} ventas`})`}</span>
                        {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {estaExpandido && (
                        <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs max-h-60 overflow-y-auto">
                          <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px] border-b border-slate-700 pb-1">Pedidos completados ({mesSeleccionado}):</p>
                          {colaborador.registrosAsociados && colaborador.registrosAsociados.length > 0 ? (
                            colaborador.registrosAsociados.map((ped, idx) => {
                              const monto = Number(ped.subtotal) || 0;
                              const costoEnvioReal = Number(ped.costoEnvio) || (ped.zonaEnvio && Number(ped.zonaEnvio.costo)) || 100;
                              const clienteStr = formatearTextoSeguro(ped.cliente || ped.nombreCliente || "Cliente");
                              return (
                                <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-1.5 pt-1">
                                  <div>
                                    <span className="font-bold text-white block">{clienteStr}</span>
                                    <span className="text-[10px] text-slate-400">ID: {ped.id ? String(ped.id).slice(-6) : "N/A"} {ped.zonaEnvio ? `• ${ped.zonaEnvio.nombre}` : ""}</span>
                                  </div>
                                  <div className="text-right">
                                    {colaborador.rol === "Delivery" ? (
                                      <span className="font-bold text-amber-400">+ RD$ {costoEnvioReal.toLocaleString()}</span>
                                    ) : (
                                      <span className="font-bold text-emerald-400">RD$ {monto.toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-slate-400 italic text-center py-2">No hay registros completados en este mes.</p>
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
      )}

      {reciboSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl border my-8">
            
            {/* Controles de filtro de fecha específicos para el comprobante (ocultos al imprimir) */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Calendar className="w-4 h-4 text-amber-600" /> Fecha del Comprobante / Pago:
              </div>
              <input
                type="date"
                value={fechaReciboFiltro}
                onChange={(e) => setFechaReciboFiltro(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

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
                  <p><span className="font-bold">Fecha de Pago:</span> {fechaReciboFiltro}</p>
                  <p><span className="font-bold">Mes Evaluado:</span> {mesSeleccionado}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-slate-400 block">Colaborador:</span><span className="font-bold text-slate-800 text-sm">{formatearTextoSeguro(reciboSeleccionado.nombre)}</span></div>
                <div><span className="text-slate-400 block">Cargo / Rol:</span><span className="font-bold text-slate-800 text-sm">{formatearTextoSeguro(reciboSeleccionado.rol)}</span></div>
                <div><span className="text-slate-400 block">Cédula:</span><span className="font-bold text-slate-800">{formatearTextoSeguro(reciboSeleccionado.cedula)}</span></div>
                <div><span className="text-slate-400 block">Teléfono:</span><span className="font-bold text-slate-800">{formatearTextoSeguro(reciboSeleccionado.telefono)}</span></div>
                <div className="col-span-2 border-t pt-2"><span className="text-slate-400 block">Datos Bancarios:</span><span className="font-bold text-slate-800">{reciboSeleccionado.banco ? `${formatearTextoSeguro(reciboSeleccionado.banco)} - Cuenta de ${formatearTextoSeguro(reciboSeleccionado.tipoCuenta)}: ${formatearTextoSeguro(reciboSeleccionado.numeroCuenta)}` : "Efectivo"}</span></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Pagos Anteriores</h4>
                <div className="border rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b"><th className="p-3">Concepto</th><th className="p-3 text-right">Monto</th></tr>
                    </thead>
                    <tbody>
                      {Array.isArray(reciboSeleccionado.historialDetalle) && reciboSeleccionado.historialDetalle.length > 0 ? (
                        reciboSeleccionado.historialDetalle.map((h, i) => (
                          <tr key={i} className="border-b"><td className="p-3">{formatearTextoSeguro(h.concepto)}<br/><span className="text-[10px] text-slate-400">{formatearTextoSeguro(h.fecha)}</span></td><td className="p-3 text-right font-bold">RD$ {(h.monto || 0).toLocaleString()}</td></tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="p-4 text-center text-slate-400 italic">No hay pagos anteriores registrados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center">
                <span className="font-medium text-sm">Balance Actual Pagado / Pendiente ({mesSeleccionado}):</span>
                <span className="text-xl font-black text-amber-400">RD$ {(reciboSeleccionado.comisionAcumulada || 0).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-600">
                <div className="space-y-6"><div className="border-b border-slate-400 pb-1"></div><p className="font-bold">Firma de la Empresa</p></div>
                <div className="space-y-6"><div className="border-b border-slate-400 pb-1"></div><p className="p-4 text-center font-bold">Recibido Conforme (Empleado)</p></div>
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
