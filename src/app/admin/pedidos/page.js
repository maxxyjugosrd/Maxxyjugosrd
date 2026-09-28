"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Trash2, Send, User, Phone, MapPin, Bike, Loader2 } from "lucide-react";
import { crearPedido } from "../../../services/pedidosService";

export default function PedidosManuales() {
  // Lista de productos (Jugos de Frutas Naturales)
  const productosDisponibles = [
    { id: 1, nombre: "Jugo de Chinola (Maracuyá)", precio: 150 },
    { id: 2, nombre: "Jugo de Fresa Natural", precio: 180 },
    { id: 3, nombre: "Jugo de Zapote", precio: 160 },
    { id: 4, nombre: "Jugo de Mango", precio: 140 },
    { id: 5, nombre: "Morir Soñando (Naranja con Leche)", precio: 200 },
  ];

  // Datos del cliente y pedido
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [carrito, setCarrito] = useState([]);
  const [deliveryAsignado, setDeliveryAsignado] = useState("Delivery 1");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [guardando, setGuardando] = useState(false);

  // Agregar jugo al carrito
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

  // Quitar elemento del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  // Cálculos del pedido
  const totalPedido = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  // Enviar pedido a Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Por favor agrega al menos un jugo al pedido.");
      return;
    }

    if (!cliente.nombre.trim()) {
      alert("Ingresa el nombre del cliente.");
      return;
    }

    setGuardando(true);

    const objetoPedido = {
      cliente,
      items: carrito,
      total: totalPedido,
      deliveryAsignado,
      metodoPago,
      origen: "WhatsApp / Manual",
      estado: "pendiente",
    };

    const resultado = await crearPedido(objetoPedido);

    setGuardando(false);

    if (resultado.exito) {
      alert(`¡Pedido registrado en Firestore con éxito por RD$ ${totalPedido}!`);
      // Limpiar formulario
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
        <p className="text-slate-500 text-sm">Ingresa las ventas manuales para sincronizarlas con la contabilidad.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1 y 2: Catálogo de Jugos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">Seleccionar Jugos de Frutas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productosDisponibles.map((jugo) => (
              <div
                key={jugo.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-amber-400 transition"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{jugo.nombre}</h3>
                  <p className="text-amber-600 font-bold text-sm">RD$ {jugo.precio}</p>
                </div>
                <button
                  onClick={() => agregarAlCarrito(jugo)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-lg flex items-center gap-1 font-medium text-sm transition"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 3: Datos del Cliente y Resumen de Orden */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-3 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" /> Resumen de la Orden
          </h2>

          {/* Formulario de Cliente */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5" /> Nombre del Cliente
              </label>
              <input
                type="text"
                placeholder="Ej. Maria Lopez"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                <Phone className="w-3.5 h-3.5" /> Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Ej. 809-555-0199"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Dirección de Envío
              </label>
              <input
                type="text"
                placeholder="Calle, Sector, Nro"
                value={cliente.direccion}
                onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lista de Jugos Seleccionados */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-slate-500">Detalle del Pedido:</p>
            {carrito.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No has agregado jugos aún.</p>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-700">
                    {item.cantidad}x {item.nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">RD$ {item.precio * item.cantidad}</span>
                    <button
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="text-rose-500 hover:text-rose-700"
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
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                <Bike className="w-3.5 h-3.5" /> Asignar Delivery
              </label>
              <select
                value={deliveryAsignado}
                onChange={(e) => setDeliveryAsignado(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Delivery 1">Delivery 1 (Juan)</option>
                <option value="Delivery 2">Delivery 2 (Carlos)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>
          </div>

          {/* Total y Botón de Enviar */}
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold text-slate-800">
              <span>Total:</span>
              <span className="text-amber-600">RD$ {totalPedido}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={guardando}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
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
    </div>
  );
}
