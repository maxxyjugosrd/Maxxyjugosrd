"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Send, User, Phone, MapPin, Bike, Loader2, Sparkles, Check, Zap, Users, Truck, UserCheck, Calendar } from "lucide-react";
import { crearPedido } from "@/services/pedidosService";
import { obtenerProductosEnVivo, obtenerIngredientesEnVivo } from "@/services/catalogoService";
import { obtenerClientesEnVivo } from "@/services/clientesService";

// Listas de Zonas de Envío configuradas
const ZONAS_ENVIO = [
  { id: "envio-gratis", nombre: "Envío Gratis (Promoción / Retiro)", tipo: "local", costo: 0 },
  // Camiones / Provincias
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
  // Locales / Santo Domingo
  { id: "sdo-herrera", nombre: "Santo Domingo Oeste (Herrera)", tipo: "local", costo: 200 },
  { id: "sdo-otro", nombre: "Santo Domingo Oeste (General)", tipo: "local", costo: 250 },
  { id: "sde", nombre: "Santo Domingo Este", tipo: "local", costo: 350 },
  { id: "sdn", nombre: "Santo Domingo Norte", tipo: "local", costo: 400 },
];

export default function PedidosManuales() {
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Lista de clientes existentes para autocompletar
  const [listaClientesCRM, setListaClientesCRM] = useState([]);

  // Listas dinámicas de personal (Deliveries y Vendedores)
  const [listaDeliveries, setListaDeliveries] = useState([]);
  const [listaVendedores, setListaVendedores] = useState([]);

  // Listas dinámicas de ingredientes desde Firestore
  const [listaIngredientesVerdes, setListaIngredientesVerdes] = useState([]);
  const [listaIngredientesShots, setListaIngredientesShots] = useState([]);

  // Cargar catálogo, ingredientes, clientes y personal al iniciar
  useEffect(() => {
    const desuscribirProductos = obtenerProductosEnVivo((datos) => {
      setProductosDisponibles(datos);
      setCargandoProductos(false);
    });

    const desuscribirClientes = obtenerClientesEnVivo((datos) => {
      setListaClientesCRM(datos);
    });

    const desuscribirIngredientes = obtenerIngredientesEnVivo((datos) => {
      setListaIngredientesVerdes(
        datos.filter((i) => i.tipo === "verde" && i.disponible !== false)
      );
      setListaIngredientesShots(
        datos.filter((i) => i.tipo === "shot" && i.disponible !== false)
      );
    });

    const personalGuardado = localStorage.getItem("maxi_personal");
    if (personalGuardado) {
      try {
        const personalArr = JSON.parse(personalGuardado);
        setListaDeliveries(personalArr.filter((p) => p.rol === "Delivery"));
        setListaVendedores(personalArr.filter((p) => p.rol === "Vendedor"));
      } catch (e) {
        console.error("Error al parsear el personal:", e);
      }
    }

    return () => {
      desuscribirProductos && desuscribirProductos();
      desuscribirClientes && desuscribirClientes();
      desuscribirIngredientes && desuscribirIngredientes();
    };
  }, []);

  // Datos del cliente, envío y pedido
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [carrito, setCarrito] = useState([]);
  const [deliveryAsignado, setDeliveryAsignado] = useState("");
  const [vendedorAsignado, setVendedorAsignado] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  
  // Estado para Fecha de Entrega (por defecto la fecha actual en formato YYYY-MM-DD)
  const [fechaEntrega, setFechaEntrega] = useState(() => new Date().toISOString().split("T")[0]);
  
  // Estados de Envío
  const [zonaSeleccionadaId, setZonaSeleccionadaId] = useState("");
  const [tipoCostoCamion, setTipoCostoCamion] = useState("costoNormal"); // "costoNormal" o "costoFrio"
  const [guardando, setGuardando] = useState(false);

  // Estado para el Modal de Personalización de Jugo Verde
  const [modalVerdeAbierto, setModalVerdeAbierto] = useState(false);
  const [ingredientesVerdes, setIngredientesVerdes] = useState([]);
  const [tamanoJugoVerde, setTamanoJugoVerde] = useState("12 oz");

  // Estado para el Modal de Personalización de Shots
  const [modalShotAbierto, setModalShotAbierto] = useState(false);
  const [ingredientesShot, setIngredientesShot] = useState([]);
  const [precioShot] = useState(100);

  // Función para seleccionar un cliente existente del CRM
  const handleSeleccionarClienteExistente = (e) => {
    const idClienteSeleccionado = e.target.value;
    if (!idClienteSeleccionado) {
      setCliente({ nombre: "", telefono: "", direccion: "" });
      return;
    }

    const clienteEncontrado = listaClientesCRM.find((c) => c.idDoc === idClienteSeleccionado || c.id === idClienteSeleccionado);
    if (clienteEncontrado) {
      setCliente({
        nombre: clienteEncontrado.nombre || "",
        telefono: clienteEncontrado.telefono || "",
        direccion: clienteEncontrado.direccionFrecuente || ""
      });

      if (clienteEncontrado.vendedorAsignado && clienteEncontrado.vendedorAsignado !== "Sin Asignar") {
        setVendedorAsignado(clienteEncontrado.vendedorAsignado);
      }
    }
  };

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
      alert("Debes seleccionar al menos 4 ingredientes para el jugo verde.");
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
      alert("Selecciona al menos un ingrediente para armar el Shot.");
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

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((item) => item.id === producto.id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
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

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  // Calcular Costo de Envío
  const zonaActual = ZONAS_ENVIO.find((z) => z.id === zonaSeleccionadaId);
  let costoEnvio = 0;
  if (zonaActual) {
    if (zonaActual.tipo === "camion") {
      costoEnvio = tipoCostoCamion === "costoFrio" ? zonaActual.costoFrio : zonaActual.costoNormal;
    } else {
      costoEnvio = zonaActual.costo;
    }
  }

  const subtotalProductos = carrito.reduce((sum, item) => sum + Number(item.precio || 0) * item.cantidad, 0);
  const totalPedido = subtotalProductos + costoEnvio;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Por favor agrega al menos un producto al pedido.");
      return;
    }

    if (!cliente.nombre.trim()) {
      alert("Ingresa el nombre del cliente.");
      return;
    }

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
      vendedorAsignado: vendedorAsignado || "Sin asignar",
      metodoPago,
      fechaEntrega: fechaEntrega || new Date().toISOString().split("T")[0],
      origen: "WhatsApp / Manual",
      estado: "pendiente",
      fechaCreacion: Date.now(),
    };

    const resultado = await crearPedido(objetoPedido);

    setGuardando(false);

    if (resultado.exito) {
      alert(`¡Pedido registrado en Firestore con éxito por RD$ ${totalPedido.toLocaleString()}!`);
      setCliente({ nombre: "", telefono: "", direccion: "" });
      setCarrito([]);
      setDeliveryAsignado("");
      setVendedorAsignado("");
      setZonaSeleccionadaId("");
    } else {
      alert("Ocurrió un error al guardar el pedido en la base de datos.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Registrar Pedido (WhatsApp / Teléfono)</h1>
        <p className="text-slate-500 text-sm">Selecciona un cliente del CRM o ingresa uno nuevo con sus zonas y detalles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna 1 y 2: Personalización + Catálogo */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl text-white shadow-sm flex flex-col justify-between gap-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Jugo Verde Personalizado
                </h3>
                <p className="text-[11px] text-emerald-100 mt-0.5">Mínimo 4 ingredientes + tamaño.</p>
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
                <p className="text-[11px] text-amber-100 mt-0.5">Mezcla extractos y raíces naturales.</p>
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
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Catálogo Fijo (Firestore)</h2>

            {cargandoProductos ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span>Cargando productos en tiempo real...</span>
              </div>
            ) : productosDisponibles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No hay productos agregados en el catálogo aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productosDisponibles.map((jugo) => {
                  const caracteristica = jugo.tamano || jugo.presentacion || jugo.categoria || "Jugo Natural";
                  return (
                    <div
                      key={jugo.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-slate-800 text-sm">{jugo.nombre}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                            {caracteristica}
                          </span>
                        </div>
                        {jugo.descripcion && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{jugo.descripcion}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                        <span className="text-amber-600 font-bold text-sm">
                          RD$ {Number(jugo.precio || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => agregarAlCarrito(jugo)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-xl flex items-center gap-1 font-semibold text-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Resumen de la Orden y Datos del Cliente */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" /> Resumen de la Orden
          </h2>

          <div className="space-y-3">
            {/* Selector de Cliente Existente del CRM */}
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
              <label className="text-xs font-semibold text-amber-900 flex items-center gap-1 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Seleccionar Cliente Existente (CRM)
              </label>
              <select
                onChange={handleSeleccionarClienteExistente}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
              >
                <option value="">-- O escribir datos manualmente abajo --</option>
                {listaClientesCRM.map((c) => (
                  <option key={c.idDoc || c.id} value={c.idDoc || c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
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
                placeholder="Ej. Maria Lopez"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <Phone className="w-3.5 h-3.5" /> Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Ej. 809-555-0199"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Dirección Detallada
              </label>
              <input
                type="text"
                placeholder="Calle, Sector, Nro"
                value={cliente.direccion}
                onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {/* Campo Nuevo: Fecha de Entrega */}
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
          </div>

          {/* Configuración de Zona de Envío */}
          <div className="space-y-3 border-t pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <Truck className="w-3.5 h-3.5 text-teal-600" /> Zona de Envío / Destino
              </label>
              <select
                value={zonaSeleccionadaId}
                onChange={(e) => setZonaSeleccionadaId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">-- Seleccionar Zona de Envío --</option>
                <optgroup label="Provincias (Camión)">
                  {ZONAS_ENVIO.filter(z => z.tipo === "camion").map((zona) => (
                    <option key={zona.id} value={zona.id}>{zona.nombre}</option>
                  ))}
                </optgroup>
                <optgroup label="Santo Domingo (Local)">
                  {ZONAS_ENVIO.filter(z => z.tipo === "local").map((zona) => (
                    <option key={zona.id} value={zona.id}>{zona.nombre} (RD$ {zona.costo})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Si es camión, mostrar selector de Costo Normal vs Frío */}
            {zonaActual && zonaActual.tipo === "camion" && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Tipo de Tarifa Camión:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoCostoCamion("costoNormal")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                      tipoCostoCamion === "costoNormal"
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Normal (RD$ {zonaActual.costoNormal.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCostoCamion("costoFrio")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                      tipoCostoCamion === "costoFrio"
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Frío (RD$ {zonaActual.costoFrio.toLocaleString()})
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-3 max-h-48 overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-slate-600">Detalle del Pedido:</p>
            {carrito.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">No has agregado productos aún.</p>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs border-b pb-2 gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{item.cantidad}x {item.nombre}</p>
                    {item.detallesPersonalizacion && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">Ingredientes: {item.detallesPersonalizacion}</p>
                    )}
                    <p className="text-amber-600 font-bold mt-0.5">RD$ {(Number(item.precio || 0) * item.cantidad).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                      <button onClick={() => cambiarCantidad(item.id, -1)} className="p-1 hover:bg-slate-200 rounded">
                        <Minus className="w-3 h-3 text-slate-600" />
                      </button>
                      <span className="font-bold px-1.5">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, 1)} className="p-1 hover:bg-slate-200 rounded">
                        <Plus className="w-3 h-3 text-slate-600" />
                      </button>
                    </div>
                    <button
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="text-rose-400 hover:text-rose-600 p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <Bike className="w-3.5 h-3.5" /> Asignar Delivery (Personal)
              </label>
              <select
                value={deliveryAsignado}
                onChange={(e) => setDeliveryAsignado(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">-- Seleccionar Delivery --</option>
                {listaDeliveries.length === 0 ? (
                  <option disabled>No hay deliveries registrados en Personal</option>
                ) : (
                  listaDeliveries.map((del) => (
                    <option key={del.id} value={del.nombre}>{del.nombre}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5" /> Asignar Vendedor
              </label>
              <select
                value={vendedorAsignado}
                onChange={(e) => setVendedorAsignado(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">-- Seleccionar Vendedor --</option>
                {listaVendedores.length === 0 ? (
                  <option disabled>No hay vendedores registrados en Personal</option>
                ) : (
                  listaVendedores.map((vend) => (
                    <option key={vend.id} value={vend.nombre}>{vend.nombre} ({vend.valorConfigurado}%)</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Subtotal Productos:</span>
              <span>RD$ {subtotalProductos.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Costo de Envío:</span>
              <span>RD$ {costoEnvio.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-extrabold text-slate-800 pt-1 border-t">
              <span>Total Final:</span>
              <span className="text-amber-600">RD$ {totalPedido.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={guardando}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 mt-2"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando en Firestore...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Confirmar y Guardar Pedido
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Personalizar Jugo Verde */}
      {modalVerdeAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Sparkles className="text-emerald-500 w-5 h-5" /> Armar Jugo Verde Personalizado
              </h3>
              <button
                onClick={() => setModalVerdeAbierto(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Selecciona el Tamaño:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTamanoJugoVerde("12 oz")}
                  className={`py-2 px-4 rounded-xl border text-xs font-semibold transition ${
                    tamanoJugoVerde === "12 oz"
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Vaso 12 oz (RD$ 180)
                </button>
                <button
                  type="button"
                  onClick={() => setTamanoJugoVerde("Galón")}
                  className={`py-2 px-4 rounded-xl border text-xs font-semibold transition ${
                    tamanoJugoVerde === "Galón"
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Galón (RD$ 600)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600">
                  Selecciona los Ingredientes (Mínimo 4):
                </label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  ingredientesVerdes.length >= 4 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {ingredientesVerdes.length} / 4
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {listaIngredientesVerdes.map((ing) => {
                  const seleccionado = ingredientesVerdes.includes(ing.nombre);
                  return (
                    <button
                      type="button"
                      key={ing.id}
                      onClick={() => toggleIngredienteVerde(ing.nombre)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition ${
                        seleccionado
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{ing.nombre}</span>
                      {seleccionado && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t flex gap-2">
              <button
                type="button"
                onClick={() => setModalVerdeAbierto(false)}
                className="flex-1 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={agregarJugoVerdePersonalizado}
                disabled={ingredientesVerdes.length < 4}
                className="flex-1 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-medium text-xs shadow-sm transition disabled:opacity-40"
              >
                Agregar al Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Personalizar Shots */}
      {modalShotAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Zap className="text-amber-500 w-5 h-5" /> Armar Shot Funcional Personalizado
              </h3>
              <button
                onClick={() => setModalShotAbierto(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600">
                  Selecciona los Componentes (Shot a la medida):
                </label>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {ingredientesShot.length} seleccionados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {listaIngredientesShots.map((ing) => {
                  const seleccionado = ingredientesShot.includes(ing.nombre);
                  return (
                    <button
                      type="button"
                      key={ing.id}
                      onClick={() => toggleIngredienteShot(ing.nombre)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition ${
                        seleccionado
                          ? "bg-amber-50 border-amber-500 text-amber-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{ing.nombre}</span>
                      {seleccionado && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t flex gap-2">
              <button
                type="button"
                onClick={() => setModalShotAbierto(false)}
                className="flex-1 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={agregarShotPersonalizado}
                disabled={ingredientesShot.length === 0}
                className="flex-1 py-2 rounded-xl text-white bg-amber-500 hover:bg-amber-600 font-medium text-xs shadow-sm transition disabled:opacity-40"
              >
                Agregar Shot (RD$ {precioShot})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
