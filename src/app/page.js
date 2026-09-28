"use client";

import { useState } from "react";
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
  Trash2, 
  Sparkles, 
  Calendar,
  X,
  Leaf
} from "lucide-react";

export default function Home() {
  // Lista de Productos Principales
  const productosIniciales = [
    { id: 1, nombre: "Jugo de Chinola Natural", tamano: "12 oz (Botella)", minUnidades: 6, precio: 100, categoria: "Botella 12 oz", imagen: "🥤" },
    { id: 2, nombre: "Morir Soñando Tradicional", tamano: "12 oz (Botella)", minUnidades: 6, precio: 120, categoria: "Botella 12 oz", imagen: "🥛" },
    { id: 3, nombre: "Jugo de Fresa Natural", tamano: "12 oz (Botella)", minUnidades: 6, precio: 110, categoria: "Botella 12 oz", imagen: "🍓" },
    { id: 4, nombre: "Jugo de Zapote Concentrado", tamano: "12 oz (Botella)", minUnidades: 6, precio: 110, categoria: "Botella 12 oz", imagen: "🥤" },
    { id: 5, nombre: "Jugo de Chinola en Galón", tamano: "1 Galón", minUnidades: 1, precio: 650, categoria: "Galones", imagen: "🧃" },
    { id: 6, nombre: "Morir Soñando en Galón", tamano: "1 Galón", minUnidades: 1, precio: 750, categoria: "Galones", imagen: "🧃" },
    { id: 7, nombre: "Jugo de Fresa en Galón", tamano: "1 Galón", minUnidades: 1, precio: 700, categoria: "Galones", imagen: "🧃" },
  ];

  // Opciones para Arma tu Jugo / Shot Saludable
  const ingredientesSaludables = [
    "Espinaca", "Manzana Verde", "Pepino", "Apio", "Jengibre", 
    "Limón", "Piña", "Perejil", "Cúrcuma", "Remolacha", "Naranja"
  ];

  // Estados del Buscador y Filtro
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");

  // Estados del Carrito
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");

  // Estados de Personalización Saludable
  const [ingredientesJugo, setIngredientesJugo] = useState([]);
  const [ingredientesShot, setIngredientesShot] = useState([]);

  // Formulario de Checkout
  const [datosEnvio, setDatosEnvio] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    direccion: "",
    fechaEntrega: "",
  });

  // Calcular la fecha mínima de entrega (2 días después de hoy)
  const fechaMinima = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  };

  // Notificación flotante al agregar al carrito
  const notificar = (msg) => {
    setMensajeNotificacion(msg);
    setTimeout(() => setMensajeNotificacion(""), 3000);
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (producto, cantidadManual) => {
    const cantidad = cantidadManual || producto.minUnidades || 1;
    const existente = carrito.find((item) => item.id === producto.id);

    if (existente) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad }]);
    }
    notificar(`¡Se agregó ${producto.nombre} al carrito!`);
  };

  // Manejo de Ingredientes Personalizados (Jugo Saludable 8 oz - Max 4)
  const toggleIngredienteJugo = (ing) => {
    if (ingredientesJugo.includes(ing)) {
      setIngredientesJugo(ingredientesJugo.filter((i) => i !== ing));
    } else {
      if (ingredientesJugo.length < 4) {
        setIngredientesJugo([...ingredientesJugo, ing]);
      } else {
        alert("Máximo 4 ingredientes para el jugo saludable de 8 oz.");
      }
    }
  };

  // Manejo de Ingredientes Personalizados (Shot 2 oz - Max 3)
  const toggleIngredienteShot = (ing) => {
    if (ingredientesShot.includes(ing)) {
      setIngredientesShot(ingredientesShot.filter((i) => i !== ing));
    } else {
      if (ingredientesShot.length < 3) {
        setIngredientesShot([...ingredientesShot, ing]);
      } else {
        alert("Máximo 3 ingredientes para el shot saludable de 2 oz.");
      }
    }
  };

  // Agregar Jugo Personalizado al Carrito
  const agregarJugoPersonalizado = () => {
    if (ingredientesJugo.length === 0) {
      alert("Selecciona al menos 1 ingrediente.");
      return;
    }
    const item = {
      id: `saludable-${Date.now()}`,
      nombre: `Jugo Verde Personalizado (8 oz) [${ingredientesJugo.join(", ")}]`,
      tamano: "8 oz (Saludable)",
      minUnidades: 7,
      cantidad: 7, // Mínimo 7 jugos
      precio: 130,
      categoria: "Saludables",
      entregaDomingo: true,
      imagen: "🥦"
    };
    setCarrito([...carrito, item]);
    setIngredientesJugo([]);
    notificar("¡Jugo Saludable personalizado agregado al carrito (Mínimo 7 und)!");
  };

  // Agregar Shot Personalizado al Carrito
  const agregarShotPersonalizado = () => {
    if (ingredientesShot.length === 0) {
      alert("Selecciona al menos 1 ingrediente.");
      return;
    }
    const item = {
      id: `shot-${Date.now()}`,
      nombre: `Shot Desinflamatorio / Peso (2 oz) [${ingredientesShot.join(", ")}]`,
      tamano: "2 oz (Shot)",
      minUnidades: 7,
      cantidad: 7, // Mínimo 7 shots
      precio: 85,
      categoria: "Saludables",
      entregaDomingo: true,
      imagen: "🫚"
    };
    setCarrito([...carrito, item]);
    setIngredientesShot([]);
    notificar("¡Shot Saludable personalizado agregado al carrito (Mínimo 7 und)!");
  };

  // Cambiar cantidad en carrito
  const actualizarCantidad = (id, cambio) => {
    setCarrito(
      carrito
        .map((item) => {
          if (item.id === id) {
            const nuevaCant = item.cantidad + cambio;
            return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Cálculos de Totales
  const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const costoEnvio = subtotal > 0 ? 300 : 0; // Envío por ruta base
  const total = subtotal + costoEnvio;

  // Filtrar productos para búsqueda
  const productosFiltrados = productosIniciales.filter((p) => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.tamano.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todos" || p.categoria === categoriaFiltro;
    return coincideTexto && coincideCategoria;
  });

  // Enviar pedido por WhatsApp
  const procesarPedidoWhatsApp = (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    if (!datosEnvio.nombre || !datosEnvio.telefono || !datosEnvio.direccion || !datosEnvio.fechaEntrega) {
      alert("Por favor completa los campos requeridos (Nombre, Teléfono, Dirección y Fecha de Entrega).");
      return;
    }

    let texto = `*NUEVO PEDIDO EN MAXXY JUGOS*%0A%0A`;
    texto += `*Cliente:* ${datosEnvio.nombre} ${datosEnvio.apellido}%0A`;
    texto += `*Teléfono:* ${datosEnvio.telefono}%0A`;
    if (datosEnvio.correo) texto += `*Correo:* ${datosEnvio.correo}%0A`;
    texto += `*Dirección:* ${datosEnvio.direccion}%0A`;
    texto += `*Fecha de Entrega solicitada:* ${datosEnvio.fechaEntrega}%0A%0A`;
    texto += `*DETALLE DEL PEDIDO:*%0A`;

    carrito.forEach((item) => {
      texto += `- ${item.nombre} (${item.tamano}) x${item.cantidad} = RD$ ${(item.precio * item.cantidad).toLocaleString()}%0A`;
    });

    texto += `%0A*Subtotal:* RD$ ${subtotal.toLocaleString()}`;
    texto += `%0A*Envío (Ruta Base):* RD$ ${costoEnvio.toLocaleString()}`;
    texto += `%0A*TOTAL A PAGAR:* RD$ ${total.toLocaleString()}%0A%0A`;
    texto += `_Recuerde que para envíos mayores a 6 docenas disponemos de transporte refrigerado o convencional a preferencia del cliente._`;

    window.open(`https://wa.me/18494040514?text=${texto}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Bar de Notificación Flotante */}
      {mensajeNotificacion && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" /> {mensajeNotificacion}
        </div>
      )}

      {/* Header / Barra de Navegación */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md tracking-wider">
              MJ
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">MAXXY JUGOS</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                100% Natural • Colmados, Supermercados & Cafeterías
              </span>
            </div>
          </div>

          {/* Enlaces Directos de Contacto / Redes */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="https://www.instagram.com/maxxyjugosrd/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-rose-600 transition">
              <Instagram className="w-4 h-4 text-rose-500" /> @maxxyjugosrd
            </a>
            <a href="https://wa.me/18494040514" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-emerald-600 transition">
              {/* Ícono estilo WhatsApp */}
              <svg className="w-4 h-4 fill-emerald-500" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              849-404-0514
            </a>
            <a href="tel:8297726631" className="flex items-center gap-1.5 hover:text-amber-600 transition">
              <Phone className="w-4 h-4 text-amber-500" /> 829-772-6631
            </a>
            <a href="mailto:maxxyjugosrd@gmail.com" className="flex items-center gap-1.5 hover:text-sky-600 transition">
              <Mail className="w-4 h-4 text-sky-500" /> maxxyjugosrd@gmail.com
            </a>
          </div>

          {/* Botón Carrito */}
          <button
            onClick={() => setMostrarCarrito(true)}
            className="relative bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition shadow-md"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Carrito</span>
            {carrito.length > 0 && (
              <span className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded-full font-black">
                {carrito.reduce((a, b) => a + b.cantidad, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner Principal / Información del Negocio */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="bg-amber-500/20 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-amber-500/30">
              <Truck className="w-4 h-4" /> Envíos a Nivel Nacional • Transporte Frío o Convencional
            </span>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
              Jugos Naturales para tu Negocio o Evento
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Ventas al por mayor en botellas de 12 oz (mínimo 6 unidades por sabor) y galones ideales para colmados, supermercados y cafeterías. Sin local para retirar: entregamos directo en tu dirección.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-xl">📦 Mínimo Botellas: 6 unidades</span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-xl">🚛 Camión Frío: Mayor a 6 docenas</span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-xl">🚚 Envíos por ruta desde RD$300</span>
            </div>
          </div>

          {/* Tarjeta Visual Informativa */}
          <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl space-y-4 text-xs">
            <h3 className="font-bold text-amber-400 text-sm uppercase tracking-wider">Contacto & Pedidos</h3>
            <div className="space-y-2">
              <p className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">WhatsApp Oficial:</span>
                <a href="https://wa.me/18494040514" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold hover:underline">849-404-0514</a>
              </p>
              <p className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Llamada Directa:</span>
                <a href="tel:8297726631" className="text-white font-bold hover:underline">829-772-6631</a>
              </p>
              <p className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Correo Electrónico:</span>
                <span className="text-slate-200 font-medium">maxxyjugosrd@gmail.com</span>
              </p>
              <p className="flex justify-between pb-1">
                <span className="text-slate-400">Instagram:</span>
                <a href="https://www.instagram.com/maxxyjugosrd/" target="_blank" rel="noreferrer" className="text-rose-400 font-bold hover:underline">@maxxyjugosrd</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Buscador & Filtros Principales */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Buscador */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sabor o presentación (ej. Chinola, Galón)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {["Todos", "Botella 12 oz", "Galones"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  categoriaFiltro === cat
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catálogo de Jugos Comerciales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
              <div>
                <div className="text-5xl mb-3 text-center">{prod.imagen}</div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {prod.tamano}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-2">{prod.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {prod.minUnidades > 1 ? `Pedido mínimo de ${prod.minUnidades} unidades.` : "Disponible por unidad (Galón)."}
                </p>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">Precio por unidad:</span>
                  <span className="text-2xl font-black text-slate-900">RD$ {prod.precio}</span>
                </div>
                <button
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN ESPECIAL: JUGOS SALUDABLES & SHOTS (ESTILO VERDE/SALUDABLE) */}
      <section className="bg-emerald-950 text-white py-12 px-4 sm:px-6 my-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-800 pb-6">
            <div>
              <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-500/30">
                <Leaf className="w-3.5 h-3.5" /> Línea Detox & Saludable • Entregas Exclusivas los Domingos
              </span>
              <h2 className="text-3xl font-black text-white mt-2">Menú Saludable (8 oz) & Shots (2 oz)</h2>
              <p className="text-emerald-200 text-xs sm:text-sm mt-1">
                Empieza tu semana renovado. Mínimo de pedido: 7 jugos/shots. Se entregas los domingos.
              </p>
            </div>
            <div className="bg-emerald-900/80 px-4 py-2 rounded-2xl border border-emerald-700 text-xs text-emerald-200 font-semibold">
              📅 Días de entrega: <strong className="text-amber-400">Todos los Domingos</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ARMA TU JUGO SALUDABLE (8 oz) - MÁX 4 INGREDIENTES */}
            <div className="bg-emerald-900/60 border border-emerald-700 p-6 rounded-3xl space-y-5">
              <div>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase">
                  8 oz • Máximo 4 ingredientes
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2 flex items-center gap-2">
                  🥦 Arma tu Jugo Saludable (8 oz)
                </h3>
                <p className="text-xs text-emerald-300">Selecciona hasta 4 ingredientes frescos para tu bebida verde.</p>
              </div>

              {/* Selector de ingredientes */}
              <div className="flex flex-wrap gap-2">
                {ingredientesSaludables.map((ing) => {
                  const seleccionado = ingredientesJugo.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleIngredienteJugo(ing)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        seleccionado
                          ? "bg-amber-400 text-slate-950 shadow-md"
                          : "bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700"
                      }`}
                    >
                      {seleccionado && <CheckCircle2 className="w-3.5 h-3.5" />} {ing}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-emerald-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-emerald-300">Mínimo 7 unidades para inicio de semana</p>
                  <p className="text-xl font-black text-amber-400">RD$ 130 c/u</p>
                </div>
                <button
                  onClick={agregarJugoPersonalizado}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-md"
                >
                  Agregar Pack (7 Jugos)
                </button>
              </div>
            </div>

            {/* ARMA TU SHOTS SALUDABLES (2 oz) - MÁX 3 INGREDIENTES */}
            <div className="bg-emerald-900/60 border border-emerald-700 p-6 rounded-3xl space-y-5">
              <div>
                <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase">
                  2 oz • Máximo 3 ingredientes
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2 flex items-center gap-2">
                  🫚 Arma tu Shot Concentrado (2 oz)
                </h3>
                <p className="text-xs text-emerald-300">Especial para desinflamar y apoyar la pérdida de peso.</p>
              </div>

              {/* Selector de ingredientes */}
              <div className="flex flex-wrap gap-2">
                {ingredientesSaludables.map((ing) => {
                  const seleccionado = ingredientesShot.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleIngredienteShot(ing)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        seleccionado
                          ? "bg-rose-500 text-white shadow-md"
                          : "bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700"
                      }`}
                    >
                      {seleccionado && <CheckCircle2 className="w-3.5 h-3.5" />} {ing}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-emerald-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-emerald-300">Mínimo 7 unidades para inicio de semana</p>
                  <p className="text-xl font-black text-rose-400">RD$ 85 c/u</p>
                </div>
                <button
                  onClick={agregarShotPersonalizado}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-md"
                >
                  Agregar Pack (7 Shots)
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MODAL DEL CARRITO DE COMPRAS & CHECKOUT */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" /> Tu Carrito
                </h2>
                <button onClick={() => setMostrarCarrito(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Items */}
              {carrito.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-12">Tu carrito está vacío.</p>
              ) : (
                <div className="space-y-4">
                  {carrito.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.nombre}</p>
                        <p className="text-slate-400">{item.tamano} • RD$ {item.precio} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => actualizarCantidad(item.id, -1)} className="p-1 bg-white border rounded-lg text-slate-600">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-slate-900 text-sm">{item.cantidad}</span>
                        <button onClick={() => actualizarCantidad(item.id, 1)} className="p-1 bg-white border rounded-lg text-slate-600">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FORMULARIO DE CHECKOUT Y FECHA */}
              {carrito.length > 0 && (
                <form onSubmit={procesarPedidoWhatsApp} className="space-y-4 border-t pt-4">
                  <h3 className="font-bold text-slate-800 text-sm">Datos de Entrega</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={datosEnvio.nombre}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, nombre: e.target.value })}
                      className="p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Apellido *"
                      value={datosEnvio.apellido}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, apellido: e.target.value })}
                      className="p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Número de Teléfono / WhatsApp *"
                    value={datosEnvio.telefono}
                    onChange={(e) => setDatosEnvio({ ...datosEnvio, telefono: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />

                  <input
                    type="email"
                    placeholder="Correo Electrónico (Opcional)"
                    value={datosEnvio.correo}
                    onChange={(e) => setDatosEnvio({ ...datosEnvio, correo: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />

                  <textarea
                    placeholder="Dirección exacta de entrega (Local / Calle / Sector) *"
                    value={datosEnvio.direccion}
                    onChange={(e) => setDatosEnvio({ ...datosEnvio, direccion: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none h-20 resize-none"
                    required
                  />

                  {/* Calendario de Entrega */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Fecha de Entrega (Mínimo 2 días después de pagado) *
                    </label>
                    <input
                      type="date"
                      min={fechaMinima()}
                      value={datosEnvio.fechaEntrega}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, fechaEntrega: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Resumen de Pago */}
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>RD$ {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Envío Estimado (Ruta):</span>
                      <span>RD$ {costoEnvio.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-base border-t pt-2">
                      <span>Total:</span>
                      <span>RD$ {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    Confirmar Pedido por WhatsApp
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer / Pie de página */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="font-extrabold text-white text-sm">MAXXY JUGOS</p>
            <p className="text-slate-500">Ventas al por mayor de jugos 100% naturales en República Dominicana.</p>
          </div>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/maxxyjugosrd/" target="_blank" rel="noreferrer" className="hover:text-white transition">Instagram</a>
            <a href="https://wa.me/18494040514" target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp</a>
            <a href="mailto:maxxyjugosrd@gmail.com" className="hover:text-white transition">Correo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
