"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  User,
  Phone,
  MapPin,
  Bike,
  Loader2,
  Sparkles,
  Check,
  Zap,
  Users,
  Truck,
  UserCheck,
  Calendar,
  LogOut,
  TrendingUp,
  Package,
  Lock,
  KeyRound,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

// Importación de servicios oficiales de tu proyecto y Firebase
import { crearPedido } from "@/services/pedidosService";
import { obtenerProductosEnVivo, obtenerIngredientesEnVivo } from "@/services/catalogoService";
import { obtenerClientesEnVivo } from "@/services/clientesService";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

// Listas de Zonas de Envío configuradas
const ZONAS_ENVIO = [
  { id: "envio-gratis", nombre: "Envío Gratis (Promoción / Retiro)", tipo: "local", costo: 0 },
  { id: "santiago", nombre: "Santiago de los Caballeros", tipo: "camion", costoNormal: 4000, costoFrio: 5000 },
  { id: "lavega", nombre: "La Vega", tipo: "camion", costoNormal: 3500, costoFrio: 4500 },
  { id: "bonao", nombre: "Bonao", tipo: "camion", costoNormal: 2500, costoFrio: 3500 },
  { id: "villaaltagracia", nombre: "Villa Altagracia", tipo: "camion", costoNormal: 2000, costoFrio: 3000 },
  { id: "laromana", nombre: "La Romana", tipo: "camion", costoNormal: 3000, costoFrio: 4000 },
  { id: "sanpedro", nombre: "San Pedro de Macorís", tipo: "camion", costoNormal: 2000, costoFrio: 3000 },
  { id: "sanjuan", nombre: "San Juan de la Maguana", tipo: "camion", costoNormal: 4500, costoFrio: 5500 },
  { id: "bani", nombre: "Baní", tipo: "camion", costoNormal: 2500, costoFrio: 3500 },
  { id: "sancristobal", nombre: "San Cristóbal", tipo: "camion", costoNormal: 2000, costoFrio: 3000 },
  { id: "azua", nombre: "Azua", tipo: "camion", costoNormal: 3500, costoFrio: 4500 },
  { id: "sdo-herrera", nombre: "Santo Domingo Oeste (Herrera)", tipo: "local", costo: 200 },
  { id: "sdo-otro", nombre: "Santo Domingo Oeste (General)", tipo: "local", costo: 250 },
  { id: "sde", nombre: "Santo Domingo Este", tipo: "local", costo: 350 },
  { id: "sdn", nombre: "Santo Domingo Norte", tipo: "local", costo: 400 },
];

export default function PanelVendedorSeguro() {
  // Autenticación por PIN del Vendedor (dinámico desde Firebase)
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState([]);
  const [vendedorSeleccionadoPrevia, setVendedorSeleccionadoPrevia] = useState("");
  const [pinIngresado, setPinIngresado] = useState("");
  const [requiereCrearPin, setRequiereCrearPin] = useState(false);
  const [nuevoPinInput, setNuevoPinInput] = useState("");
  const [vendedorActual, setVendedorActual] = useState("");

  // Control de Vistas / Páginas ("principal", "nuevo_pedido", "historial_pedidos")
  const [vistaActual, setVistaActual] = useState("principal");

  // Filtros de métricas y rangos de fecha personalizados
  const mesActualStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActualStr);
  const [fechaInicioComision, setFechaInicioComision] = useState("");
  const [fechaFinComision, setFechaFinComision] = useState("");

  // Datos de Firestore en vivo
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [listaClientesCRM, setListaClientesCRM] = useState([]);
  const [listaDeliveries, setListaDeliveries] = useState([]);
  const [listaIngredientesVerdes, setListaIngredientesVerdes] = useState([]);
  const [listaIngredientesShots, setListaIngredientesShots] = useState([]);
  const [personalFirebase, setPersonalFirebase] = useState([]);
  const [pedidosFirebase, setPedidosFirebase] = useState([]);

  // Formulario del pedido
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [clienteSeleccionadoObj, setClienteSeleccionadoObj] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [deliveryAsignado, setDeliveryAsignado] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [fechaEntrega, setFechaEntrega] = useState(() => new Date().toISOString().split("T")[0]);

  // Estados de Envío y control
  const [zonaSeleccionadaId, setZonaSeleccionadaId] = useState("");
  const [tipoCostoCamion, setTipoCostoCamion] = useState("costoNormal");
  const [guardando, setGuardando] = useState(false);
  const [exitoMensaje, setExitoMensaje] = useState("");

  // Estados para Historial y Filtros del Vendedor
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "Pendiente", "Completado"
  const [busquedaHistorial, setBusquedaHistorial] = useState("");

  // Modales de personalización
  const [modalVerdeAbierto, setModalVerdeAbierto] = useState(false);
  const [ingredientesVerdes, setIngredientesVerdes] = useState([]);
  const [tamanoJugoVerde, setTamanoJugoVerde] = useState("12 oz");

  const [modalShotAbierto, setModalShotAbierto] = useState(false);
  const [ingredientesShot, setIngredientesShot] = useState([]);
  const [precioShot] = useState(100);

  // Modal contraseña de supervisora (para reasignar cliente de otro vendedor)
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordSupervisorInput, setPasswordSupervisorInput] = useState("");
  const [pedidoPendienteGuardar, setPedidoPendienteGuardar] = useState(null);

  // 1. Cargar Catálogo, Clientes e Ingredientes en vivo desde Firebase
  useEffect(() => {
    if (typeof window === "undefined") return;

    const desuscribirProductos = obtenerProductosEnVivo((datos) => {
      setProductosDisponibles(datos);
      setCargandoProductos(false);
    });

    const desuscribirClientes = obtenerClientesEnVivo((datos) => {
      setListaClientesCRM(datos);
    });

    const desuscribirIngredientes = obtenerIngredientesEnVivo((datos) => {
      setListaIngredientesVerdes(datos.filter((i) => i.tipo === "verde" && i.disponible !== false));
      setListaIngredientesShots(datos.filter((i) => i.tipo === "shot" && i.disponible !== false));
    });

    const desuscribirPedidos = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setPedidosFirebase(lista);
    });

    return () => {
      desuscribirProductos && desuscribirProductos();
      desuscribirClientes && desuscribirClientes();
      desuscribirIngredientes && desuscribirIngredientes();
      desuscribirPedidos && desuscribirPedidos();
    };
  }, []);

  // 2. Cargar Personal, Vendedores, Deliveries y Comisiones en vivo desde la colección "personal" de Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "personal"), (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setPersonalFirebase(lista);

      // Filtrar deliveries para el formulario de pedidos
      setListaDeliveries(lista.filter((p) => p.rol === "Delivery"));

      // Extraer nombres reales de vendedores para el login por PIN
      const soloVendedores = lista.filter((p) => p.rol === "Vendedor").map((p) => p.nombre);
      setVendedoresDisponibles(soloVendedores);
    });
    return () => unsubscribe();
  }, []);

  // Lectura robusta del porcentaje de comisión y meta mensual del vendedor
  const obtenerInfoVendedor = () => {
    const info = personalFirebase.find(
      (p) => p.nombre?.trim().toUpperCase() === vendedorActual?.trim().toUpperCase() && p.rol?.trim().toLowerCase() === "vendedor"
    );

    const porcentajeCrudo = info?.comisionPorcentaje ?? info?.valorConfigurado ?? 0;
    const metaCruda = info?.metaMensual ?? 0;

    return {
      porcentaje: Number(porcentajeCrudo) || 0,
      metaMensual: Number(metaCruda) || 0,
    };
  };

  const { porcentaje, metaMensual } = obtenerInfoVendedor();
  
  /// Pedidos del vendedor actual filtrados por mes seleccionado (sumando estrictamente el subtotal)
  const pedidosVendedorMes = pedidosFirebase.filter((p) => {
    const esDelVendedor = p.vendedorAsignado?.trim().toUpperCase() === vendedorActual?.trim().toUpperCase();
    if (!esDelVendedor) return false;

    // Tomar fecha de entrega o de creación para el filtro mensual
    let fechaRef = "";
    if (p.fechaEntrega) {
      fechaRef = String(p.fechaEntrega);
    } else if (p.fechaCreacion) {
      const fechaObj = typeof p.fechaCreacion === "number" ? new Date(p.fechaCreacion) : p.fechaCreacion.toDate ? p.fechaCreacion.toDate() : new Date(p.fechaCreacion);
      fechaRef = fechaObj.toISOString().split("T")[0];
    }

    return fechaRef.startsWith(mesSeleccionado);
  });

  const ventasTotalesMes = pedidosVendedorMes
    .filter((p) => {
      const estadoLimpio = p.estado?.trim().toLowerCase() || "";
      return estadoLimpio === "completado" || estadoLimpio === "completada";
    })
    .reduce((sum, p) => sum + Number(p.subtotal || 0), 0);

  const progresoMetaPorcentaje = metaMensual > 0 ? Math.min(Math.round((ventasTotalesMes / metaMensual) * 100), 100) : 0;

  // Cálculo de comisiones en base al rango de fechas personalizado (o todas si no se especifica)
  const calcularComisionPorFechas = () => {
    if (!vendedorActual) return { acumulada: 0, pendiente: 0, totalVentasRango: 0 };

    const filtradosRango = pedidosFirebase.filter((p) => {
      const esDelVendedor = p.vendedorAsignado?.trim().toUpperCase() === vendedorActual?.trim().toUpperCase();
      if (!esDelVendedor) return false;

      const fechaRef = p.fechaEntrega || (p.fechaCreacion ? new Date(p.fechaCreacion).toISOString().split("T")[0] : "");
      if (fechaInicioComision && fechaRef < fechaInicioComision) return false;
      if (fechaFinComision && fechaRef > fechaFinComision) return false;
      return true;
    });

    const completadosRango = filtradosRango.filter((p) => p.estado === "Completado");
    const pendientesRango = filtradosRango.filter((p) => p.estado !== "Completado" && p.estado !== "Cancelado");

    const subtotalCompletados = completadosRango.reduce((sum, p) => sum + Number(p.subtotal || 0), 0);
    const subtotalPendientes = pendientesRango.reduce((sum, p) => sum + Number(p.subtotal || 0), 0);

    return {
      acumulada: subtotalCompletados * (porcentaje / 100),
      pendiente: subtotalPendientes * (porcentaje / 100),
      totalVentasRango: subtotalCompletados,
    };
  };

  const comisionFechas = calcularComisionPorFechas();

  // Manejar PIN del Vendedor
  const handleSeleccionarNombreDropdown = (nombre) => {
    setVendedorSeleccionadoPrevia(nombre);
    setPinIngresado("");
    setNuevoPinInput("");

    if (!nombre || typeof window === "undefined") {
      setRequiereCrearPin(false);
      return;
    }

    const pinesGuardados = JSON.parse(localStorage.getItem("maxi_vendedores_pines") || "{}");
    if (!pinesGuardados[nombre]) {
      setRequiereCrearPin(true);
    } else {
      setRequiereCrearPin(false);
    }
  };

  const handleLoginVendedor = (e) => {
    e.preventDefault();
    if (!vendedorSeleccionadoPrevia || typeof window === "undefined") return;

    const pinesGuardados = JSON.parse(localStorage.getItem("maxi_vendedores_pines") || "{}");

    if (requiereCrearPin) {
      if (nuevoPinInput.length < 4) {
        alert("El PIN debe tener al menos 4 dígitos.");
        return;
      }
      pinesGuardados[vendedorSeleccionadoPrevia] = nuevoPinInput;
      localStorage.setItem("maxi_vendedores_pines", JSON.stringify(pinesGuardados));
      setVendedorActual(vendedorSeleccionadoPrevia);
    } else {
      if (pinIngresado === pinesGuardados[vendedorSeleccionadoPrevia]) {
        setVendedorActual(vendedorSeleccionadoPrevia);
      } else {
        alert("PIN incorrecto.");
      }
    }
  };

  // Selección de cliente desde CRM
  const handleSeleccionarClienteExistente = (e) => {
    const idClienteSeleccionado = e.target.value;
    if (!idClienteSeleccionado) {
      setCliente({ nombre: "", telefono: "", direccion: "" });
      setClienteSeleccionadoObj(null);
      return;
    }

    const clienteEncontrado = listaClientesCRM.find((c) => (c.idDoc || c.id) === idClienteSeleccionado);
    if (clienteEncontrado) {
      setCliente({
        nombre: clienteEncontrado.nombre || "",
        telefono: clienteEncontrado.telefono || "",
        direccion: clienteEncontrado.direccionFrecuente || clienteEncontrado.direccion || ""
      });
      setClienteSeleccionadoObj(clienteEncontrado);
    }
  };

  // Carrito y Modales personalizados
  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((item) => item.id === producto.id);
    if (existe) {
      setCarrito(carrito.map((item) => (item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(
      carrito
        .map((item) => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const eliminarDelCarrito = (id) => setCarrito(carrito.filter((item) => item.id !== id));

  const toggleIngredienteVerde = (nombreIng) => {
    if (ingredientesVerdes.includes(nombreIng)) {
      setIngredientesVerdes(ingredientesVerdes.filter((i) => i !== nombreIng));
    } else {
      setIngredientesVerdes([...ingredientesVerdes, nombreIng]);
    }
  };

  const toggleIngredienteShot = (nombreIng) => {
    if (ingredientesShot.includes(nombreIng)) {
      setIngredientesShot(ingredientesShot.filter((i) => i !== nombreIng));
    } else {
      setIngredientesShot([...ingredientesShot, nombreIng]);
    }
  };

  const agregarJugoVerdePersonalizado = () => {
    if (ingredientesVerdes.length < 4) {
      alert("Debes seleccionar al menos 4 ingredientes.");
      return;
    }
    const itemPersonalizado = {
      id: "jugo-verde-" + Date.now(),
      nombre: `Jugo Verde Personalizado (${tamanoJugoVerde})`,
      precio: tamanoJugoVerde === "Galón" ? 600 : 180,
      cantidad: 1,
      tamano: tamanoJugoVerde,
      categoria: "Jugo Verde Personalizado",
      detallesPersonalizacion: ingredientesVerdes.join(", ")
    };
    setCarrito([...carrito, itemPersonalizado]);
    setIngredientesVerdes([]);
    setModalVerdeAbierto(false);
  };

  const agregarShotPersonalizado = () => {
    if (ingredientesShot.length === 0) {
      alert("Selecciona al menos un ingrediente.");
      return;
    }
    const itemShot = {
      id: "shot-" + Date.now(),
      nombre: `Shot Funcional Personalizado`,
      precio: precioShot,
      cantidad: 1,
      categoria: "Shot Personalizado",
      detallesPersonalizacion: ingredientesShot.join(", ")
    };
    setCarrito([...carrito, itemShot]);
    setIngredientesShot([]);
    setModalShotAbierto(false);
  };

  // Cálculos de Envío y Totales
  const zonaActual = ZONAS_ENVIO.find((z) => z.id === zonaSeleccionadaId);
  let costoEnvio = 0;
  if (zonaActual) {
    costoEnvio = zonaActual.tipo === "camion" ? (tipoCostoCamion === "costoFrio" ? zonaActual.costoFrio : zonaActual.costoNormal) : zonaActual.costo;
  }

  const subtotalProductos = carrito.reduce((sum, item) => sum + Number(item.precio || 0) * item.cantidad, 0);
  const totalPedido = subtotalProductos + costoEnvio;

  // Ejecución de guardado de pedido en Firebase
  const ejecutarGuardadoPedido = async (vendedorFinal) => {
    setGuardando(true);

    const objetoPedido = {
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim() || "Sin teléfono",
      },
      telefono: cliente.telefono.trim(),
      direccion: cliente.direccion.trim() || "Local / Mostrador",
      zonaEnvio: zonaActual ? { nombre: zonaActual.nombre, tipo: zonaActual.tipo, costo: costoEnvio } : null,
      productos: carrito,
      subtotal: subtotalProductos,
      costoEnvio,
      total: totalPedido,
      deliveryAsignado: deliveryAsignado || "Sin asignar",
      vendedorAsignado: vendedorFinal,
      metodoPago,
      fechaEntrega: fechaEntrega || new Date().toISOString().split("T")[0],
      origen: "Panel Vendedor",
      estado: "Pendiente",
      fechaCreacion: Date.now(),
    };

    const resultado = await crearPedido(objetoPedido);
    
    if (resultado.exito) {
      setExitoMensaje("¡Pedido registrado con éxito! Quedó en estado Pendiente.");
      setCliente({ nombre: "", telefono: "", direccion: "" });
      setClienteSeleccionadoObj(null);
      setCarrito([]);
      setDeliveryAsignado("");
      setZonaSeleccionadaId("");
      setTimeout(() => setExitoMensaje(""), 5000);
      // Regresar al historial tras confirmar pedido con éxito
      setVistaActual("historial_pedidos");
    } else {
      alert("Error al guardar el pedido en Firestore.");
    }
    
    setGuardando(false);
    setModalPasswordAbierto(false);
    setPasswordSupervisorInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Agrega al menos un producto al carrito.");
      return;
    }
    if (!cliente.nombre.trim()) {
      alert("Ingresa el nombre del cliente.");
      return;
    }

    if (
      clienteSeleccionadoObj &&
      clienteSeleccionadoObj.vendedorAsignado &&
      clienteSeleccionadoObj.vendedorAsignado !== "Sin Asignar" &&
      clienteSeleccionadoObj.vendedorAsignado !== vendedorActual
    ) {
      setPedidoPendienteGuardar({ vendedorOriginal: clienteSeleccionadoObj.vendedorAsignado });
      setModalPasswordAbierto(true);
      return;
    }

    ejecutarGuardadoPedido(vendedorActual);
  };

  const handleVerificarPasswordSupervisor = (e) => {
    e.preventDefault();
    const passLocal = typeof window !== "undefined" ? localStorage.getItem("maxi_admin_pass") || "maxxy2026" : "maxxy2026";
    if (passwordSupervisorInput === passLocal) {
      alert("Contraseña correcta. Autorizado.");
      ejecutarGuardadoPedido(vendedorActual);
    } else {
      alert("Contraseña incorrecta.");
    }
  };

  // Filtrar pedidos del historial del vendedor actual
  const pedidosDelVendedorActual = pedidosFirebase.filter(
    (p) => p.vendedorAsignado?.trim().toUpperCase() === vendedorActual?.trim().toUpperCase()
  );

  const pedidosFiltradosHistorial = pedidosDelVendedorActual.filter((p) => {
    const nombreClienteStr = typeof p.cliente === "string" ? p.cliente : p.cliente?.nombre || "";
    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "Pendiente" && p.estado !== "Completado" && p.estado !== "Cancelado") ||
      (filtroEstado === "Completado" && p.estado === "Completado");

    const coincideBusqueda = nombreClienteStr.toLowerCase().includes(busquedaHistorial.toLowerCase());

    return coincideEstado && coincideBusqueda;
  });

  // Pantalla de Autenticación por PIN del Vendedor
  if (!vendedorActual) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-md mb-3 border border-slate-100">
              <img src="/logo.JPG" alt="Maxxy Jugos" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Maxxy Jugos</h1>
            <p className="text-sm text-slate-500 mt-1">Acceso Seguro de Vendedores</p>
          </div>

          <form onSubmit={handleLoginVendedor} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1">
                Selecciona tu Nombre:
              </label>
              <select
                value={vendedorSeleccionadoPrevia}
                onChange={(e) => handleSeleccionarNombreDropdown(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium outline-none focus:border-amber-500"
              >
                <option value="">-- Selecciona quién eres --</option>
                {vendedoresDisponibles.length === 0 ? (
                  <option disabled value="">Cargando vendedores desde Firebase...</option>
                ) : (
                  vendedoresDisponibles.map((v, idx) => (
                    <option key={idx} value={v}>{v}</option>
                  ))
                )}
              </select>
            </div>

            {vendedorSeleccionadoPrevia && requiereCrearPin && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-amber-900">Crea tu PIN de seguridad de 4 dígitos:</p>
                <input
                  type="password"
                  required
                  placeholder="Ej. 1234"
                  value={nuevoPinInput}
                  onChange={(e) => setNuevoPinInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-300 text-sm bg-white outline-none font-mono"
                />
              </div>
            )}

            {vendedorSeleccionadoPrevia && !requiereCrearPin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Ingresa tu PIN:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••"
                  value={pinIngresado}
                  onChange={(e) => setPinIngresado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-amber-500 font-mono tracking-widest text-center text-lg"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!vendedorSeleccionadoPrevia}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-sm transition shadow-md"
            >
              {requiereCrearPin ? "Crear PIN y Entrar" : "Entrar al Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Barra superior con Logo corporativo */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border">
            <img src="/logo.JPG" alt="Maxxy Jugos" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base">Panel de Ventas Seguro</h1>
            <p className="text-xs text-slate-500">Vendedor: <strong className="text-amber-600">{vendedorActual}</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vistaActual !== "principal" && (
            <button
              onClick={() => setVistaActual("principal")}
              className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio
            </button>
          )}
          <button
            onClick={() => { setVendedorActual(""); setVendedorSeleccionadoPrevia(""); setVistaActual("principal"); }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-2 rounded-xl font-semibold transition"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {exitoMensaje && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-sm">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exitoMensaje}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 1: PÁGINA PRINCIPAL (Métricas Mes por Mes, Meta y Botón Pedidos) */}
        {/* ------------------------------------------------------------- */}
        {vistaActual === "principal" && (
          <div className="space-y-6">
            {/* Barra de Navegación Rápida a la Sección de Pedidos */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Package className="w-6 h-6 text-amber-400" /> Historial de Mis Pedidos
                </h2>
                <p className="text-xs text-slate-300 mt-1">Monitorea el estatus de tus clientes, filtralos y revisa todos tus registros.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setVistaActual("historial_pedidos")}
                  className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" /> Ver Pedidos
                </button>
                <button
                  type="button"
                  onClick={() => setVistaActual("nuevo_pedido")}
                  className="flex-1 sm:flex-none bg-white hover:bg-slate-100 text-slate-900 px-6 py-3.5 rounded-2xl font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5 text-amber-600" /> Nuevo Pedido
                </button>
              </div>
            </div>

            {/* SECCIÓN DE MÉTRICAS MES POR MES Y META MENSUAL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" /> Métricas y Desempeño Mensual
                  </h3>
                  <p className="text-xs text-slate-500">Visualiza tus logros y cumplimiento de metas mes a mes</p>
                </div>
                {/* Filtro Mes por Mes */}
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="month"
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Tarjetas de Métricas del Mes Seleccionado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase tracking-wider opacity-90 font-semibold">Ventas Completadas ({mesSeleccionado})</span>
                    <div className="text-3xl font-black mt-1">RD$ {ventasTotalesMes.toLocaleString()}</div>
                    <p className="text-xs opacity-80 mt-1">Comisión estimada: RD$ {(ventasTotalesMes * (porcentaje / 100)).toLocaleString()} ({porcentaje}%)</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs uppercase tracking-wider opacity-80 font-semibold">Meta Mensual Asignada</span>
                      <div className="text-3xl font-black text-amber-400 mt-1">RD$ {metaMensual.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                      <Zap className="w-8 h-8 text-amber-400" />
                    </div>
                  </div>
                  
                  {/* Barra de Progreso de la Meta */}
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Progreso: {progresoMetaPorcentaje}%</span>
                      <span className="text-amber-400">RD$ {ventasTotalesMes.toLocaleString()} / {metaMensual.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progresoMetaPorcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE COMISIONES POR RANGO DE FECHAS (CALENDARIO) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" /> Comisiones por Rango de Fechas
                  </h3>
                  <p className="text-xs text-slate-500">Selecciona una fecha de inicio y fin para calcular tus comisiones exactas</p>
                </div>
                
                {/* Selector de Fechas (Desde - Hasta) */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600">Desde:</span>
                    <input
                      type="date"
                      value={fechaInicioComision}
                      onChange={(e) => setFechaInicioComision(e.target.value)}
                      className="bg-white border rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600">Hasta:</span>
                    <input
                      type="date"
                      value={fechaFinComision}
                      onChange={(e) => setFechaFinComision(e.target.value)}
                      className="bg-white border rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  {(fechaInicioComision || fechaFinComision) && (
                    <button
                      type="button"
                      onClick={() => { setFechaInicioComision(""); setFechaFinComision(""); }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2 py-1 bg-rose-50 rounded-xl transition"
                    >
                      Limpiar fechas
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-teal-50 border border-teal-200 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase font-bold text-teal-800 block">Comisión en Rango (Completados)</span>
                    <div className="text-2xl font-black text-teal-900 mt-1">RD$ {comisionFechas.acumulada.toLocaleString()}</div>
                    <p className="text-[11px] text-teal-700 mt-0.5">Ventas netas en rango: RD$ {comisionFechas.totalVentasRango.toLocaleString()}</p>
                  </div>
                  <div className="bg-teal-200/60 p-3 rounded-xl text-teal-800">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase font-bold text-amber-900 block">Comisión Pendiente en Rango</span>
                    <div className="text-2xl font-black text-amber-800 mt-1">RD$ {comisionFechas.pendiente.toLocaleString()}</div>
                    <p className="text-[11px] text-amber-700 mt-0.5">Basado en pedidos pendientes en este período</p>
                  </div>
                  <div className="bg-amber-200/60 p-3 rounded-xl text-amber-800">
                    <Clock className="w-7 h-7" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 2: HISTORIAL DE PEDIDOS Y MONITOREO DE CLIENTES */}
        {/* ------------------------------------------------------------- */}
        {vistaActual === "historial_pedidos" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" /> Historial de Mis Pedidos
                  </h2>
                  <p className="text-xs text-slate-500">Monitorea el estatus de tus clientes en este mes</p>
                </div>

                {/* Filtro por Estatus */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                  <button
                    type="button"
                    onClick={() => setFiltroEstado("todos")}
                    className={`px-3 py-1.5 rounded-lg transition ${filtroEstado === "todos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado("Pendiente")}
                    className={`px-3 py-1.5 rounded-lg transition ${filtroEstado === "Pendiente" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}
                  >
                    Pendientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado("Completado")}
                    className={`px-3 py-1.5 rounded-lg transition ${filtroEstado === "Completado" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
                  >
                    Completados
                  </button>
                </div>
              </div>

              {/* Barra de Búsqueda por Nombre de Cliente */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar pedido por nombre de cliente..."
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Lista de Pedidos Filtrados */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {pedidosFiltradosHistorial.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10 italic">No se encontraron pedidos con estos criterios.</p>
                ) : (
                  pedidosFiltradosHistorial.map((ped) => {
                    const nombreCliente = typeof ped.cliente === "string" ? ped.cliente : ped.cliente?.nombre || "Cliente";
                    const telefonoCliente = typeof ped.cliente === "object" ? ped.cliente?.telefono : ped.telefono || "Sin teléfono";
                    const esCompletado = ped.estado === "Completado";

                    return (
                      <div key={ped.id} className="border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm">{nombreCliente}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${esCompletado ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {esCompletado ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {ped.estado || "Pendiente"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Tel: {telefonoCliente} • Dirección: {ped.direccion || "Local"}</p>
                          <p className="text-[11px] text-slate-400">Entrega: {ped.fechaEntrega || "Hoy"} • Delivery: {ped.deliveryAsignado || "Sin asignar"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-slate-800">RD$ {Number(ped.total || 0).toLocaleString()}</div>
                          <span className="text-[10px] text-slate-400 block">Comisión est.: RD$ {(Number(ped.subtotal || 0) * (porcentaje / 100)).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 3: NUEVO PEDIDO Y CATÁLOGO */}
        {/* ------------------------------------------------------------- */}
        {vistaActual === "nuevo_pedido" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Catálogo y Opciones Personalizadas */}
            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl text-white shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Jugo Verde Personalizado
                    </h3>
                    <p className="text-[11px] text-emerald-100 mt-0.5">Mínimo 4 ingredientes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalVerdeAbierto(true)}
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-3 py-2 rounded-xl text-xs transition shadow-sm w-full text-center"
                  >
                    Armar Jugo Verde
                  </button>
                </div>

                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-2xl text-white shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Shot Funcional Personalizado
                    </h3>
                    <p className="text-[11px] text-amber-100 mt-0.5">Mezcla extractos naturales.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalShotAbierto(true)}
                    className="bg-white text-amber-800 hover:bg-amber-50 font-bold px-3 py-2 rounded-xl text-xs transition shadow-sm w-full text-center"
                  >
                    Armar Shot
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-700 mb-3">Catálogo en Vivo (Firestore)</h2>
                {cargandoProductos ? (
                  <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    <span>Cargando productos...</span>
                  </div>
                ) : productosDisponibles.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border">
                    No hay productos en el catálogo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productosDisponibles.map((jugo) => (
                      <div key={jugo.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-slate-800 text-sm">{jugo.nombre}</h3>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                              {jugo.tamano || jugo.presentacion || "16 oz"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t">
                          <span className="text-amber-600 font-bold text-sm">RD$ {Number(jugo.precio || 0).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => agregarAlCarrito(jugo)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-xl flex items-center gap-1 font-semibold text-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Formulario de Pedido y CRM */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" /> Registrar Pedido
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                  <label className="text-xs font-semibold text-amber-900 flex items-center gap-1 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Seleccionar Cliente (CRM)
                  </label>
                  <select
                    onChange={handleSeleccionarClienteExistente}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
                  >
                    <option value="">-- Nuevo cliente o manual --</option>
                    {listaClientesCRM.map((c) => (
                      <option key={c.idDoc || c.id} value={c.idDoc || c.id}>
                        {c.nombre} {c.telefono ? `(${c.telefono})` : ""} {c.vendedorAsignado ? `[Asignado a: ${c.vendedorAsignado}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <User className="w-3.5 h-3.5" /> Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Colmado El Pana"
                    value={cliente.nombre}
                    onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <Phone className="w-3.5 h-3.5" /> Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="809-000-0000"
                    value={cliente.telefono}
                    onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5" /> Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Sector / Calle"
                    value={cliente.direccion}
                    onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Fecha de Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

             {/* Zona de Envío */}
<div className="space-y-3 border-t pt-3">
  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
    <Truck className="w-3.5 h-3.5 text-teal-600" /> Zona de Envío
  </label>
  <select
    value={zonaSeleccionadaId}
    onChange={(e) => setZonaSeleccionadaId(e.target.value)}
    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
  >
    <option value="">-- Seleccionar Zona --</option>
    {/* Opción destacada de Envío Gratis */}
    {ZONAS_ENVIO.filter(z => z.id === "envio-gratis").map((zona) => (
      <option key={zona.id} value={zona.id}>🎉 {zona.nombre} (RD$ 0)</option>
    ))}
    <optgroup label="Provincias (Camión)">
      {ZONAS_ENVIO.filter(z => z.tipo === "camion").map((zona) => (
        <option key={zona.id} value={zona.id}>{zona.nombre}</option>
      ))}
    </optgroup>
    <optgroup label="Santo Domingo (Local)">
      {ZONAS_ENVIO.filter(z => z.tipo === "local" && z.id !== "envio-gratis").map((zona) => (
        <option key={zona.id} value={zona.id}>{zona.nombre} (RD$ {zona.costo})</option>
      ))}
    </optgroup>
  </select>

  {zonaActual && zonaActual.tipo === "camion" && (
    <div className="bg-slate-50 p-3 rounded-xl border space-y-2">
      <label className="text-xs font-semibold text-slate-600 block">Tarifa Camión:</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTipoCostoCamion("costoNormal")}
          className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${tipoCostoCamion === "costoNormal" ? "bg-teal-600 text-white" : "bg-white text-slate-700"}`}
        >
          Normal (RD$ {zonaActual.costoNormal})
        </button>
        <button
          type="button"
          onClick={() => setTipoCostoCamion("costoFrio")}
          className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${tipoCostoCamion === "costoFrio" ? "bg-teal-600 text-white" : "bg-white text-slate-700"}`}
        >
          Frío (RD$ {zonaActual.costoFrio})
        </button>
      </div>
    </div>
  )}
</div>

                {/* Carrito Resumen */}
                <div className="space-y-2 border-t pt-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-600">Productos Seleccionados:</p>
                  {carrito.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-2">Carrito vacío.</p>
                  ) : (
                    carrito.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-xs border-b pb-2 gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{item.cantidad}x {item.nombre}</p>
                          {item.detallesPersonalizacion && (
                            <p className="text-[10px] text-emerald-600">Ingredientes: {item.detallesPersonalizacion}</p>
                          )}
                          <p className="text-amber-600 font-bold">RD$ {(Number(item.precio || 0) * item.cantidad).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                            <button type="button" onClick={() => cambiarCantidad(item.id, -1)} className="p-1"><Minus className="w-3 h-3" /></button>
                            <span className="font-bold px-1.5">{item.cantidad}</span>
                            <button type="button" onClick={() => cambiarCantidad(item.id, 1)} className="p-1"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button type="button" onClick={() => eliminarDelCarrito(item.id)} className="text-rose-400 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Asignar Delivery y Pago */}
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                      <Bike className="w-3.5 h-3.5" /> Asignar Delivery
                    </label>
                    <select
                      value={deliveryAsignado}
                      onChange={(e) => setDeliveryAsignado(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                    >
                      <option value="">-- Seleccionar --</option>
                      {listaDeliveries.map((del) => (
                        <option key={del.id} value={del.nombre}>{del.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Método de Pago</label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Subtotal:</span>
                    <span>RD$ {subtotalProductos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Envío:</span>
                    <span>RD$ {costoEnvio.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-extrabold text-slate-800 pt-1 border-t">
                    <span>Total:</span>
                    <span className="text-amber-600">RD$ {totalPedido.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 mt-2"
                  >
                    {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Send className="w-4 h-4" /> Confirmar Pedido</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL JUGOS VERDES */}
      {modalVerdeAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="text-emerald-500 w-5 h-5" /> Armar Jugo Verde
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTamanoJugoVerde("12 oz")}
                className={`py-2 rounded-xl border text-xs font-semibold ${tamanoJugoVerde === "12 oz" ? "bg-emerald-500 text-white" : "bg-slate-50"}`}
              >
                12 oz (RD$ 180)
              </button>
              <button
                type="button"
                onClick={() => setTamanoJugoVerde("Galón")}
                className={`py-2 rounded-xl border text-xs font-semibold ${tamanoJugoVerde === "Galón" ? "bg-emerald-500 text-white" : "bg-slate-50"}`}
              >
                Galón (RD$ 600)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {listaIngredientesVerdes.map((ing) => {
                const seleccionado = ingredientesVerdes.includes(ing.nombre);
                return (
                  <button
                    type="button"
                    key={ing.id}
                    onClick={() => toggleIngredienteVerde(ing.nombre)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium flex justify-between ${seleccionado ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-white"}`}
                  >
                    <span>{ing.nombre}</span>
                    {seleccionado && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t flex gap-2">
              <button type="button" onClick={() => setModalVerdeAbierto(false)} className="flex-1 py-2 rounded-xl bg-slate-100 text-xs font-medium">Cancelar</button>
              <button type="button" onClick={agregarJugoVerdePersonalizado} disabled={ingredientesVerdes.length < 4} className="flex-1 py-2 rounded-xl text-white bg-emerald-600 text-xs font-medium disabled:opacity-40">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SHOTS */}
      {modalShotAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Zap className="text-amber-500 w-5 h-5" /> Armar Shot Funcional
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {listaIngredientesShots.map((ing) => {
                const seleccionado = ingredientesShot.includes(ing.nombre);
                return (
                  <button
                    type="button"
                    key={ing.id}
                    onClick={() => toggleIngredienteShot(ing.nombre)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium flex justify-between ${seleccionado ? "bg-amber-50 border-amber-500 text-amber-900" : "bg-white"}`}
                  >
                    <span>{ing.nombre}</span>
                    {seleccionado && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t flex gap-2">
              <button type="button" onClick={() => setModalShotAbierto(false)} className="flex-1 py-2 rounded-xl bg-slate-100 text-xs font-medium">Cancelar</button>
              <button type="button" onClick={agregarShotPersonalizado} disabled={ingredientesShot.length === 0} className="flex-1 py-2 rounded-xl text-white bg-amber-500 text-xs font-medium disabled:opacity-40">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASSWORD SUPERVISORA */}
      {modalPasswordAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl">
              <Lock className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Cliente Asignado a Otro Vendedor</h3>
                <p className="text-xs text-slate-600 mt-0.5">Ingresa tu contraseña de supervisora para autorizar.</p>
              </div>
            </div>
            <form onSubmit={handleVerificarPasswordSupervisor} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                placeholder="••••••••"
                value={passwordSupervisorInput}
                onChange={(e) => setPasswordSupervisorInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-mono"
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalPasswordAbierto(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-xl text-white bg-slate-900 text-xs font-semibold shadow-md">Autorizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
