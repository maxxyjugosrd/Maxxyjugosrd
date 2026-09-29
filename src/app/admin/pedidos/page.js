"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Send, User, Phone, MapPin, Bike, Loader2, Sparkles, Check } from "lucide-react";
import { crearPedido } from "@/services/pedidosService";
import { obtenerProductosEnVivo } from "@/services/catalogoService";

export default function PedidosManuales() {
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Datos del cliente y pedido
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [carrito, setCarrito] = useState([]);
  const [deliveryAsignado, setDeliveryAsignado] = useState("Delivery 1");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [guardando, setGuardando] = useState(false);

  // Estado para el Modal de Personalización de Jugo Verde
  const [modalVerdeAbierto, setModalVerdeAbierto] = useState(false);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [tamanoJugoVerde, setTamanoJugoVerde] = useState("12 oz");
  const [precioJugoVerde, setPrecioJugoVerde] = useState(150); // Precio base orientativo

  // Lista de ingredientes disponibles para el Jugo Verde
  const ingredientesDisponibles = [
    { id: "epinaca", nombre: "Espinaca Fresca" },
    { id: "apio", nombre: "Apio Orgánico" },
    { id: "pepino", nombre: "Pepino Verde" },
    { id: "manzana", nombre: "Manzana Verde" },
    { id: "jengibre", nombre: "Jengibre Rayado" },
    { id: "limon", nombre: "Jugo de Limón" },
    { id: "piña", nombre: "Piña Dulce" },
    { id: "perejil", nombre: "Perejil Fresco" }
  ];

  // Cargar catálogo en tiempo real desde catalogoService
  useEffect(() => {
    const desuscribir = obtenerProductosEnVivo((datos) => {
      setProductosDisponibles(datos);
      setCargandoProductos(false);
    });

    return () => desuscribir();
  }, []);

  // Manejar selección de ingredientes para el Jugo Verde personalizado
  const toggleIngrediente = (ing) => {
    if (ingredientesSeleccionados.includes(ing.nombre)) {
      setIngredientesSeleccionados(ingredientesSeleccionados.filter((i) => i !== ing.nombre));
    } else {
      setIngredientesSeleccionados([...ingredientesSeleccionados, ing.nombre]);
    }
  };

  // Agregar el Jugo Verde personalizado al carrito (mínimo 4 ingredientes)
  const agregarJugoVerdePersonalizado = () => {
    if (ingredientesSeleccionados.length < 4) {
      alert("Debes seleccionar al menos 4 ingredientes para personalizar tu jugo verde.");
      return;
    }

    const itemPersonalizado = {
      id: "jugo-verde-personalizado-" + Date.now(),
      nombre: `Jugo Verde Personalizado (${tamanoJugoVerde})`,
      precio: tamanoJugoVerde === "Galón" ? 600 : 180, // Ajusta los precios según tu negocio
      cantidad: 1,
      tamano: tamanoJugoVerde,
      categoria: "Jugo Verde Personalizado",
      detallesPersonalizacion: ingredientesSeleccionados.join(", ")
    };

    setCarrito([...carrito, itemPersonalizado]);
    setIngredientesSeleccionados([]);
    setModalVerdeAbierto(false);
  };

  // Agregar producto normal (jugos, shots, etc.) al carrito
  const agregarAlCarrito = (producto) => {
    const idUnico = producto.id;
    const existe = carrito.find((item) => item.id === idUnico);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === idUnico ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // Cambiar cantidad en el carrito
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

  // Quitar elemento del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  // Cálculos del pedido
  const totalPedido = carrito.reduce((sum, item) => sum + Number(item.precio || 0) * item.cantidad, 0);

  // Enviar pedido a Firestore
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
      productos: carrito,
      total: totalPedido,
      deliveryAsignado,
      metodoPago,
      origen: "WhatsApp / Manual",
      estado: "pendiente",
      fechaCreacion: Date.now()
    };

    const resultado = await crearPedido(objetoPedido);

    setGuardando(false);

    if (resultado.exito) {
      alert(`¡Pedido registrado en Firestore con éxito por RD$ ${totalPedido.toLocaleString()}!`);
      setCliente({ nombre: "", telefono: "", direccion: "" });
      setCarrito([]);
    } else {
      alert("Ocurrió un error al guardar el pedido en la base de datos.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Registrar Pedido (WhatsApp / Teléfono) 🥤</h1>
        <p className="text-slate-500 text-sm">Ingresa las ventas manuales con opciones de personalización, shots y tamaños.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna 1 y 2: Catálogo y Botón de Personalización */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Botón especial para armar Jugo Verde Personalizado */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Armar Jugo Verde Personalizado
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Selecciona tus ingredientes favoritos (Mínimo 4) y el tamaño ideal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalVerdeAbierto(true)}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm shrink-0"
            >
              Personalizar Verde
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Catálogo de Jugos y Shots (Firestore)</h2>

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
                          <h3 className="font-semibold text-slate-800 text-base">{jugo.nombre}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                            {caracteristica}
                          </span>
                        </div>
                        {jugo.descripcion && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{jugo.descripcion}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                        <span className="text-amber-600 font-bold text-base">
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

        {/* Columna 3: Datos del Cliente y Resumen de Orden */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" /> Resumen de la Orden
          </h2>

          {/* Formulario de Cliente */}
          <div className="space-y-3">
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
                <MapPin className="w-3.5 h-3.5" /> Dirección de Envío
              </label>
              <input
                type="text"
                placeholder="Calle, Sector, Nro"
                value={cliente.direccion}
                onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lista de Jugos Seleccionados en el Carrito */}
          <div className="space-y-3 border-t pt-3 max-h-56 overflow-y-auto pr-1">
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

          {/* Asignación y Métodos de Pago */}
          <div className="space-y-3 border-t pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <Bike className="w-3.5 h-3.5" /> Asignar Delivery
              </label>
              <select
                value={deliveryAsignado}
                onChange={(e) => setDeliveryAsignado(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Delivery 1">Delivery 1 (Juan)</option>
                <option value="Delivery 2">Delivery 2 (Carlos)</option>
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

          {/* Total y Botón de Enviar */}
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center text-lg font-extrabold text-slate-800">
              <span>Total:</span>
              <span className="text-amber-600">RD$ {totalPedido.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={guardando}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
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
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Sparkles className="text-emerald-500 w-5 h-5" /> Armar Jugo Verde Personalizado
              </h3>
              <button
                onClick={() => setModalVerdeAbierto(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selección de Tamaño */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Selecciona el Tamaño:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setTamanoJugoVerde("12 oz"); setPrecioJugoVerde(180); }}
                  className={`py-2 px-4 rounded-xl border text-sm font-semibold transition ${
                    tamanoJugoVerde === "12 oz"
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Vaso 12 oz (RD$ 180)
                </button>
                <button
                  type="button"
                  onClick={() => { setTamanoJugoVerde("Galón"); setPrecioJugoVerde(600); }}
                  className={`py-2 px-4 rounded-xl border text-sm font-semibold transition ${
                    tamanoJugoVerde === "Galón"
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Galón (RD$ 600)
                </button>
              </div>
            </div>

            {/* Selección de Ingredientes (Mínimo 4) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600">
                  Selecciona los Ingredientes (Mínimo 4):
                </label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  ingredientesSeleccionados.length >= 4 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {ingredientesSeleccionados.length} / 4 seleccionados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ingredientesDisponibles.map((ing) => {
                  const seleccionado = ingredientesSeleccionados.includes(ing.nombre);
                  return (
                    <button
                      type="button"
                      key={ing.id}
                      onClick={() => toggleIngrediente(ing)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition ${
                        seleccionado
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{ing.nombre}</span>
                      {seleccionado && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {ingredientesSeleccionados.length < 4 && (
                <p className="text-[11px] text-amber-600 italic mt-1">
                  * Faltan {4 - ingredientesSeleccionados.length} ingredientes para cumplir con el mínimo requerido.
                </p>
              )}
            </div>

            {/* Botón Guardar Personalización */}
            <div className="pt-3 border-t flex gap-2">
              <button
                type="button"
                onClick={() => setModalVerdeAbierto(false)}
                className="flex-1 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={agregarJugoVerdePersonalizado}
                disabled={ingredientesSeleccionados.length < 4}
                className="flex-1 py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-medium text-sm shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Agregar al Pedido (RD$ {precioJugoVerde})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
