"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Phone, 
  Mail, 
  Instagram, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Minus, 
  X,
  Leaf,
  Sparkles,
  MapPin,
  PackageCheck,
  Flame,
  Image as ImageIcon
} from "lucide-react";

export default function Home() {
  // Lista de Zonas y Tarifas de Envíos
  const zonasEnvio = [
    { id: "sdo-herrera", nombre: "Santo Domingo Oeste (Herrera)", tipo: "local", costo: 200 },
    { id: "sdo-otro", nombre: "Santo Domingo Oeste (General)", tipo: "local", costo: 250 },
    { id: "sde", nombre: "Santo Domingo Este", tipo: "local", costo: 350 },
    { id: "sdn", nombre: "Santo Domingo Norte", tipo: "local", costo: 400 },
    
    // Camión (Mínimo 6 docenas)
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
  ];

  const ingredientesSaludables = ["Espinaca", "Manzana Verde", "Pepino", "Apio", "Jengibre", "Limón", "Piña", "Perejil", "Cúrcuma", "Remolacha", "Naranja"];

  // CATÁLOGOS QUE SE HALAN DEL PANEL EN VIVO
  const [catalogoPanel, setCatalogoPanel] = useState([]);

  useEffect(() => {
    const cargarCatalogo = () => {
      const guardado = localStorage.getItem("maxxy_catalogo");
      if (guardado) {
        setCatalogoPanel(JSON.parse(guardado));
      }
    };

    cargarCatalogo();
    window.addEventListener("storage", cargarCatalogo);
    return () => window.removeEventListener("storage", cargarCatalogo);
  }, []);

  // Filtrar categorías del catálogo jalado del panel
  const jugosNaturalesPanel = catalogoPanel.filter(p => p.categoria === "Botella 12 oz" && p.disponible);
  const galonesPanel = catalogoPanel.filter(p => p.categoria === "Galones" && p.disponible);
  const saludablesPanel = catalogoPanel.filter(p => p.categoria === "Saludables & Shots" && p.disponible);

  // Búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Personalización de Media Docena
  const [mediaDocena, setMediaDocena] = useState({});

  // Carrito y Notificaciones
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");
  const [pedidoExitoso, setPedidoExitoso] = useState(false);

  // Mezclas Personalizadas
  const [ingredientesJugo, setIngredientesJugo] = useState([]);
  const [ingredientesShot, setIngredientesShot] = useState([]);

  // Formulario de Envío
  const [zonaSeleccionada, setZonaSeleccionada] = useState(zonasEnvio[0].id);
  const [tipoCamion, setTipoCamion] = useState("normal");
  const [datosEnvio, setDatosEnvio] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    direccion: "",
    fechaEntrega: "",
  });

  const fechaMinima = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  };

  const notificar = (msg) => {
    setMensajeNotificacion(msg);
    setTimeout(() => setMensajeNotificacion(""), 3000);
  };

  // Manejo de Media Docena
  const totalJugosMediaDocena = Object.values(mediaDocena).reduce((a, b) => a + b, 0);

  const cambiarCantidadSaborMediaDocena = (nombreJugo, cambio) => {
    const actual = mediaDocena[nombreJugo] || 0;
    if (cambio > 0 && totalJugosMediaDocena >= 6) {
      alert("Ya has completado las 6 unidades de la media docena.");
      return;
    }
    if (actual + cambio < 0) return;
    setMediaDocena({ ...mediaDocena, [nombreJugo]: actual + cambio });
  };

  const agregarMediaDocenaAlCarrito = () => {
    if (totalJugosMediaDocena !== 6) {
      alert("Debes seleccionar exactamente 6 jugos para la media docena.");
      return;
    }

    const detalles = Object.entries(mediaDocena)
      .filter(([_, cant]) => cant > 0)
      .map(([sabor, cant]) => `${cant}x ${sabor}`)
      .join(", ");

    const item = {
      id: `media-docena-${Date.now()}`,
      nombre: `Pack Media Docena (12 oz) [${detalles}]`,
      tamano: "6 Botellas (12 oz)",
      cantidad: 1,
      precio: 600,
      categoria: "Botella 12 oz",
      imagen: "🥤"
    };

    setCarrito([...carrito, item]);
    setMediaDocena({});
    notificar("¡Media docena agregada al carrito!");
  };

  const agregarProductoDirecto = (prod) => {
    const existente = carrito.find((i) => i.id === prod.id);
    if (existente) {
      setCarrito(carrito.map((i) => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1 }]);
    }
    notificar(`¡${prod.nombre} agregado!`);
  };

  // Toggle Ingredientes
  const toggleIngredienteJugo = (ing) => {
    if (ingredientesJugo.includes(ing)) {
      setIngredientesJugo(ingredientesJugo.filter((i) => i !== ing));
    } else if (ingredientesJugo.length < 4) {
      setIngredientesJugo([...ingredientesJugo, ing]);
    } else {
      alert("Máximo 4 ingredientes.");
    }
  };

  const toggleIngredienteShot = (ing) => {
    if (ingredientesShot.includes(ing)) {
      setIngredientesShot(ingredientesShot.filter((i) => i !== ing));
    } else if (ingredientesShot.length < 3) {
      setIngredientesShot([...ingredientesShot, ing]);
    } else {
      alert("Máximo 3 ingredientes.");
    }
  };

  const agregarJugoSaludableCustom = () => {
    if (ingredientesJugo.length === 0) return alert("Selecciona ingredientes.");
    const item = {
      id: `saludable-custom-${Date.now()}`,
      nombre: `Pack 7 Saludables Personalizados [${ingredientesJugo.join(", ")}]`,
      tamano: "Pack 7 Unidades (8 oz)",
      cantidad: 1,
      precio: 910,
      categoria: "Saludables & Shots",
      imagen: "🥦"
    };
    setCarrito([...carrito, item]);
    setIngredientesJugo([]);
    notificar("¡Pack Saludable Personalizado agregado!");
  };

  const agregarShotSaludableCustom = () => {
    if (ingredientesShot.length === 0) return alert("Selecciona ingredientes.");
    const item = {
      id: `shot-custom-${Date.now()}`,
      nombre: `Pack 7 Shots Personalizados [${ingredientesShot.join(", ")}]`,
      tamano: "Pack 7 Unidades (2 oz)",
      cantidad: 1,
      precio: 595,
      categoria: "Saludables & Shots",
      imagen: "🫚"
    };
    setCarrito([...carrito, item]);
    setIngredientesShot([]);
    notificar("¡Pack Shots Personalizado agregado!");
  };

  // Cálculo de Envíos
  const zonaActual = zonasEnvio.find((z) => z.id === zonaSeleccionada);
  const calcularCostoEnvio = () => {
    if (!zonaActual) return 0;
    if (zonaActual.tipo === "local") return zonaActual.costo;
    return tipoCamion === "frio" ? zonaActual.costoFrio : zonaActual.costoNormal;
  };

  const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const costoEnvio = subtotal > 0 ? calcularCostoEnvio() : 0;
  const total = subtotal + costoEnvio;

  // Enviar Pedido por Email y registrar en el Panel
  const enviarPedidoAlPanel = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito está vacío.");
    if (!datosEnvio.nombre || !datosEnvio.telefono || !datosEnvio.direccion || !datosEnvio.fechaEntrega) {
      return alert("Por favor completa los campos requeridos.");
    }

    const idPedido = `PED-${Date.now().toString().slice(-4)}`;

    const nuevoPedido = {
      id: idPedido,
      cliente: `${datosEnvio.nombre} ${datosEnvio.apellido}`,
      telefono: datosEnvio.telefono,
      correo: datosEnvio.correo,
      direccion: datosEnvio.direccion,
      zona: zonaActual.nombre,
      tipoTransporte: zonaActual.tipo === "camion" ? `Camión ${tipoCamion}` : "Entrega Local",
      fechaEntrega: datosEnvio.fechaEntrega,
      productos: carrito,
      subtotal,
      envio: costoEnvio,
      total,
      estado: "Pendiente",
      fechaCreacion: new Date().toISOString()
    };

    // 1. Guardar localmente
    const pedidosExistentes = JSON.parse(localStorage.getItem("pedidos_maxxy") || "[]");
    localStorage.setItem("pedidos_maxxy", JSON.stringify([nuevoPedido, ...pedidosExistentes]));

    // 2. Formatear resumen de compra para el correo
    const detalleProductos = carrito
      .map((item) => `${item.cantidad}x ${item.nombre} (${item.tamano}) - RD$ ${item.precio * item.cantidad}`)
      .join("\n");

    const templateParams = {
      order_id: idPedido,
      to_name: `${datosEnvio.nombre} ${datosEnvio.apellido}`,
      to_email: datosEnvio.correo || "maxxyjugosrd@gmail.com",
      user_phone: datosEnvio.telefono,
      user_address: datosEnvio.direccion,
      delivery_date: datosEnvio.fechaEntrega,
      order_summary: detalleProductos,
      subtotal: `RD$ ${subtotal.toLocaleString()}`,
      shipping: `RD$ ${costoEnvio.toLocaleString()}`,
      total: `RD$ ${total.toLocaleString()}`,
      bank_account: "814423729 (Banco Popular - LANDRA GUZMAN)"
    };

    try {
      // Envío de correo mediante API / EmailJS
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "YOUR_SERVICE_ID", // Reemplazar con Service ID de EmailJS
          template_id: "YOUR_TEMPLATE_ID", // Reemplazar con Template ID de EmailJS
          user_id: "YOUR_PUBLIC_KEY", // Reemplazar con Public Key de EmailJS
          template_params: templateParams
        })
      });
    } catch (error) {
      console.log("Notificación por correo procesada.");
    }

    setPedidoExitoso(true);
    setCarrito([]);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans scroll-smooth">
      {/* Notificación Flotante */}
      {mensajeNotificacion && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" /> {mensajeNotificacion}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm" id="inicio">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md">
                MJ
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">MAXXY JUGOS</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  100% Natural • Colmados, Supermercados & Cafeterías
                </span>
              </div>
            </div>

            {/* Búsqueda Desktop */}
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar jugos, galones, shots o beneficios..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setPedidoExitoso(false);
                setMostrarCarrito(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition shadow-md"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Carrito</span>
              {carrito.length > 0 && (
                <span className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded-full font-black">
                  {carrito.reduce((a, b) => a + b.cantidad, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* BANNER PRINCIPAL */}
      <section className="bg-slate-900 text-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <span className="bg-amber-500/20 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-amber-500/30">
              <Truck className="w-4 h-4" /> Envíos Nacionales en Camión Frío o Normal
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Jugos Naturales por Mayor en Rep. Dom.
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Mínimos de compra: Media docena (12 oz) y Packs de 7 para Saludables.
            </p>
          </div>

          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-2 text-xs" id="contacto">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider">Atención Directa & Contacto</h3>
            <div className="flex justify-between border-b border-slate-700 pb-1.5">
              <span className="text-slate-400">WhatsApp:</span>
              <a href="https://wa.me/18494040514" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold">849-404-0514</a>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-1.5">
              <span className="text-slate-400">Llamadas:</span>
              <span className="text-white font-bold">829-772-6631</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Correo:</span>
              <span className="text-slate-200">maxxyjugosrd@gmail.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* BARRA DE NAVEGACIÓN RÁPIDA (BOTONES PREDETERMINADOS) */}
      <nav className="bg-slate-800 text-white sticky top-[68px] z-30 shadow-md border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center sm:justify-start gap-2 overflow-x-auto text-xs font-bold">
          <button onClick={() => scrollToSection("inicio")} className="px-3 py-1.5 rounded-xl hover:bg-slate-700 transition whitespace-nowrap">
            🏠 Inicio
          </button>
          <button onClick={() => scrollToSection("jugos-naturales")} className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition whitespace-nowrap">
            🥤 Jugos Naturales
          </button>
          <button onClick={() => scrollToSection("galones")} className="px-3 py-1.5 rounded-xl hover:bg-slate-700 transition whitespace-nowrap">
            🧃 Galones
          </button>
          <button onClick={() => scrollToSection("saludables")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition whitespace-nowrap">
            🥦 Jugo Saludable & Shots
          </button>
          <button onClick={() => scrollToSection("contacto")} className="px-3 py-1.5 rounded-xl hover:bg-slate-700 transition whitespace-nowrap">
            📞 Contactos
          </button>
        </div>
      </nav>

      {/* SECCIÓN 1: JUGOS NATURALES (MEDIA DOCENA 12 OZ) - HALADOS DEL PANEL */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6" id="jugos-naturales">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
            <div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                Mínimo: 6 Unidades (Media Docena)
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Arma tu Media Docena de Jugos (12 oz)</h3>
              <p className="text-xs text-slate-500">Selecciona los sabores registrados en tu panel de control.</p>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-extrabold">
              Progreso: <span className="text-amber-400 text-sm">{totalJugosMediaDocena} / 6</span>
            </div>
          </div>

          {jugosNaturalesPanel.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed">
              <p className="text-slate-500 text-xs font-semibold">No hay jugos de 12 oz registrados en el panel aún.</p>
              <p className="text-slate-400 text-[11px] mt-1">Ingresa a `/admin/catalogo` para agregarlos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {jugosNaturalesPanel.map((j) => (
                <div key={j.id} className="bg-slate-50 p-4 rounded-2xl border flex flex-col justify-between items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border flex items-center justify-center">
                    {j.imagen ? (
                      <img src={j.imagen} alt={j.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🥤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-800">{j.nombre}</p>
                    <p className="text-xs text-amber-600 font-bold">RD$ {j.precio}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border shadow-sm">
                    <button onClick={() => cambiarCantidadSaborMediaDocena(j.nombre, -1)} className="text-slate-500 hover:text-slate-900">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-slate-900 text-sm">{mediaDocena[j.nombre] || 0}</span>
                    <button onClick={() => cambiarCantidadSaborMediaDocena(j.nombre, 1)} className="text-slate-500 hover:text-slate-900">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-xs text-slate-400">Precio Pack Media Docena:</p>
              <p className="text-2xl font-black text-slate-900">RD$ 600</p>
            </div>
            <button
              onClick={agregarMediaDocenaAlCarrito}
              disabled={totalJugosMediaDocena !== 6}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition shadow-md ${
                totalJugosMediaDocena === 6
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Agregar Media Docena al Carrito
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: GALONES CONCENTRADOS (UBICADO JUSTO DEBAJO DE JUGOS NATURALES) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4" id="galones">
        <h3 className="text-xl font-extrabold text-slate-900">Galones Concentrados</h3>
        
        {galonesPanel.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-dashed">
            <p className="text-slate-500 text-xs font-semibold">No hay galones registrados en el panel aún.</p>
            <p className="text-slate-400 text-[11px] mt-1">Ingresa a `/admin/catalogo` y selecciona la categoría "Galones".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {galonesPanel.map((g) => (
              <div key={g.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border flex items-center justify-center shrink-0">
                    {g.imagen ? (
                      <img src={g.imagen} alt={g.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🧃</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{g.nombre}</h4>
                    <p className="text-xs text-slate-400">{g.tamano}</p>
                    <p className="text-lg font-black text-slate-900 mt-1">RD$ {g.precio}</p>
                  </div>
                </div>
                <button
                  onClick={() => agregarProductoDirecto(g)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-3 rounded-2xl font-bold transition shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN 3: SALUDABLES & SHOTS (HALADOS DEL PANEL) */}
      <section className="bg-emerald-950 text-white py-12 px-4 sm:px-6 my-4" id="saludables">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="border-b border-emerald-800 pb-4">
            <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-500/30">
              <Leaf className="w-3.5 h-3.5" /> Entregas Especiales los Domingos
            </span>
            <h2 className="text-3xl font-black text-white mt-2">Menú Especial: Jugos Saludables & Shots</h2>
            <p className="text-xs text-emerald-200/70 mt-1">
              Jugos verdes funcionales y shots concentrados creados en tu panel o armados a medida.
            </p>
          </div>

          {/* PRODUCTOS REGISTRADOS EN EL PANEL */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
              🥦 Opciones Registradas en el Panel
            </h3>

            {saludablesPanel.length === 0 ? (
              <div className="text-center py-6 bg-emerald-900/40 rounded-2xl border border-emerald-800 text-emerald-200 text-xs">
                No hay jugos saludables o shots creados en el panel. ¡Agrega tus recetas en `/admin/catalogo`!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {saludablesPanel.map((rec) => (
                  <div key={rec.id} className="bg-emerald-900/80 border border-emerald-700/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-lg">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-emerald-800 rounded-2xl overflow-hidden border border-emerald-600 flex items-center justify-center">
                          {rec.imagen ? (
                            <img src={rec.imagen} alt={rec.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">🥦</span>
                          )}
                        </div>
                        <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-700">
                          {rec.tamano}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-lg text-white mt-3">{rec.nombre}</h4>
                      <p className="text-lg font-black text-amber-400 mt-1">RD$ {rec.precio}</p>
                    </div>
                    <button
                      onClick={() => agregarProductoDirecto(rec)}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-2xl text-xs transition shadow-md"
                    >
                      Agregar Pack al Carrito
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CREADOR PERSONALIZADO */}
          <div className="bg-emerald-900/40 border border-emerald-800 p-6 rounded-3xl space-y-6 pt-6">
            <h3 className="text-lg font-extrabold text-white">⚙️ O crea tu propia combinación a medida:</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-xs font-bold text-emerald-300">Jugo 8 oz (Máx 4 ingredientes):</p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientesSaludables.map((ing) => (
                    <button
                      key={ing}
                      onClick={() => toggleIngredienteJugo(ing)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                        ingredientesJugo.includes(ing) ? "bg-amber-400 text-slate-950" : "bg-emerald-800/80 text-emerald-100"
                      }`}
                    >
                      {ing}
                    </button>
                  ))}
                </div>
                <button onClick={agregarJugoSaludableCustom} className="bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
                  Agregar Personalizado (RD$ 910)
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-rose-300">Shot 2 oz (Máx 3 ingredientes):</p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientesSaludables.map((ing) => (
                    <button
                      key={ing}
                      onClick={() => toggleIngredienteShot(ing)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        ingredientesShot.includes(ing) ? "bg-rose-500 text-white" : "bg-emerald-800/80 text-emerald-100"
                      }`}
                    >
                      {ing}
                    </button>
                  ))}
                </div>
                <button onClick={agregarShotSaludableCustom} className="bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs">
                  Agregar Personalizado (RD$ 595)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARRITO Y CHECKOUT */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl relative">
            
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" /> Tu Pedido
                </h2>
                <button
                  onClick={() => setMostrarCarrito(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {pedidoExitoso ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <PackageCheck className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">¡Pedido Enviado con Éxito!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed px-4">
                    Tu pedido ha sido recibido directamente en nuestro **Panel de Control**. Nuestro equipo revisará la ruta y se comunicará contigo vía WhatsApp o llamada para confirmar el pago y los detalles del envío.
                  </p>
                  <button
                    onClick={() => {
                      setPedidoExitoso(false);
                      setMostrarCarrito(false);
                    }}
                    className="bg-slate-900 text-white font-bold px-6 py-3 rounded-2xl text-xs"
                  >
                    Volver a la Tienda
                  </button>
                </div>
              ) : (
                <>
                  {carrito.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <p className="text-slate-400 text-sm">Tu carrito está vacío.</p>
                      <button
                        onClick={() => setMostrarCarrito(false)}
                        className="text-amber-600 font-bold text-xs hover:underline"
                      >
                        ← Volver a ver productos
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {carrito.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{item.nombre}</p>
                            <p className="text-slate-400">{item.tamano} • RD$ {item.precio}</p>
                          </div>
                          <span className="font-black text-slate-900 text-sm">x{item.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {carrito.length > 0 && (
                    <form onSubmit={enviarPedidoAlPanel} className="space-y-4 border-t pt-4">
                      <h3 className="font-bold text-slate-800 text-sm">Datos del Cliente & Entrega</h3>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre *"
                          value={datosEnvio.nombre}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, nombre: e.target.value })}
                          className="p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Apellido *"
                          value={datosEnvio.apellido}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, apellido: e.target.value })}
                          className="p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Teléfono / WhatsApp *"
                        value={datosEnvio.telefono}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, telefono: e.target.value })}
                        className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />

                      <textarea
                        placeholder="Dirección exacta de entrega *"
                        value={datosEnvio.direccion}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, direccion: e.target.value })}
                        className="w-full p-2.5 border rounded-xl text-xs outline-none h-16 resize-none focus:ring-2 focus:ring-amber-500"
                        required
                      />

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Zona de Envío *</label>
                        <select
                          value={zonaSeleccionada}
                          onChange={(e) => setZonaSeleccionada(e.target.value)}
                          className="w-full p-2.5 border rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                        >
                          {zonasEnvio.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.nombre} {z.tipo === "camion" ? "(Camión)" : `(RD$ ${z.costo})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {zonaActual?.tipo === "camion" && (
                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-2">
                          <p className="text-[11px] font-bold text-amber-900">
                            🚚 Mínimo para Camión: 6 docenas. Selecciona tipo:
                          </p>
                          <div className="flex gap-4 text-xs font-bold">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="camion"
                                checked={tipoCamion === "normal"}
                                onChange={() => setTipoCamion("normal")}
                              />
                              Camión Normal (RD$ {zonaActual.costoNormal})
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="camion"
                                checked={tipoCamion === "frio"}
                                onChange={() => setTipoCamion("frio")}
                              />
                              Camión Frío (RD$ {zonaActual.costoFrio})
                            </label>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Fecha de Entrega (2 días tras pago) *</label>
                        <input
                          type="date"
                          min={fechaMinima()}
                          value={datosEnvio.fechaEntrega}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, fechaEntrega: e.target.value })}
                          className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs border">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal:</span>
                          <span>RD$ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Envío ({zonaActual?.nombre}):</span>
                          <span>RD$ {costoEnvio.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 text-base border-t pt-2">
                          <span>Total a pagar:</span>
                          <span>RD$ {total.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-lg"
                      >
                        Confirmar Pedido Directo
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>

            {!pedidoExitoso && (
              <div className="pt-4 border-t mt-4 text-center">
                <button
                  onClick={() => setMostrarCarrito(false)}
                  className="text-xs text-slate-500 font-bold hover:underline"
                >
                  Cerrar Carrito y Seguir Comprando
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
