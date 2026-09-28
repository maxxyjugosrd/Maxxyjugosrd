"use client";

import { useState } from "react";
import { ShoppingBag, Plus, Minus, Trash2, Send, CheckCircle, Flame } from "lucide-react";
import { crearPedido } from "../services/pedidosService";
import { enviarCorreoConfirmacion } from "../services/emailService";

export default function TiendaCliente() {
  // Lista de jugos naturales disponibles en el menú
  const menuJugos = [
    { id: 1, nombre: "Jugo de Chinola (Maracuyá)", precio: 150, desc: "100% pulpa natural de chinola refrescante", popular: true },
    { id: 2, nombre: "Jugo de Fresa Natural", precio: 180, desc: "Fresas frescas licuadas al instante", popular: true },
    { id: 3, nombre: "Jugo de Zapote", precio: 160, desc: "Textura cremosa y dulce natural", popular: false },
    { id: 4, nombre: "Jugo de Mango", precio: 140, desc: "Sabor tropical rico en vitamina C", popular: false },
    { id: 5, nombre: "Morir Soñando", precio: 200, desc: "Tradicional jugo de naranja con leche y hielo", popular: true },
  ];

  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [enviando, setEnviando] = useState(false);

  // Agregar al carrito
  const agregarAlCarrito = (jugo) => {
    const existe = carrito.find((item) => item.id === jugo.id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === jugo.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setCarrito([...carrito, { ...jugo, cantidad: 1 }]);
    }
  };

  // Modificar cantidad
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

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  // Enviar pedido por WhatsApp y guardar en Firestore + Email
  const enviarPedidoWhatsApp = (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Por favor agrega al menos un jugo a tu carrito.");
      return;
    }
    if (!cliente.nombre || !cliente.telefono || !cliente.direccion) {
      alert("Por favor completa tu nombre, teléfono y dirección.");
      return;
    }

    // 1. Formatear mensaje para WhatsApp
    let mensaje = `*¡Nuevo Pedido en Maxi Jugos! 🥤*\n\n`;
    mensaje += `*Cliente:* ${cliente.nombre}\n`;
    mensaje += `*Teléfono:* ${cliente.telefono}\n`;
    mensaje += `*Dirección:* ${cliente.direccion}\n\n`;
    mensaje += `*Detalle de la Orden:*\n`;

    carrito.forEach((item) => {
      mensaje += `• ${item.cantidad}x ${item.nombre} - RD$ ${item.precio * item.cantidad}\n`;
    });

    mensaje += `\n*Total a pagar:* RD$ ${total}\n`;
    mensaje += `\n¡Quedo a la espera de la confirmación!`;

    // Número de teléfono de Maxi Jugos
    const numeroWhatsApp = "8494040514"; 
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    // 2. Abrir WhatsApp inmediatamente sin bloquear la UI
    window.open(urlWhatsApp, "_blank");

    // 3. Guardar en Firestore y enviar email en segundo plano (sin await)
    crearPedido({
      cliente,
      items: carrito,
      total,
      origen: "Web Cliente",
      estado: "pendiente",
    }).catch((err) => console.error("Error al guardar en Firestore:", err));

    enviarCorreoConfirmacion({ cliente, items: carrito, total })
      .catch((err) => console.error("Error al enviar email:", err));

    // 4. Limpiar formulario
    setCarrito([]);
    setCliente({ nombre: "", telefono: "", direccion: "" });
  };
  
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar de la Tienda */}
      <header className="bg-amber-500 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥤</span>
            <h1 className="text-xl font-black tracking-wide">MAXI JUGOS</h1>
          </div>
          <div className="flex items-center gap-2 bg-amber-600 px-3 py-1.5 rounded-full text-sm font-semibold">
            <ShoppingBag className="w-4 h-4" />
            <span>{carrito.reduce((acc, item) => acc + item.cantidad, 0)} items</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-amber-500 to-amber-400 text-white py-10 px-4 text-center space-y-2 shadow-inner">
        <h2 className="text-3xl sm:text-4xl font-extrabold">Jugos 100% Naturales & Frescos</h2>
        <p className="text-amber-100 max-w-md mx-auto text-sm sm:text-base">
          Pide tus jugos favoritos de frutas naturales directos a tu puerta.
        </p>
      </section>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Catálogo de Jugos */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Menú de Jugos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menuJugos.map((jugo) => (
              <div
                key={jugo.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition relative overflow-hidden"
              >
                {jugo.popular && (
                  <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" /> Popular
                  </span>
                )}
                <div className="space-y-1 mb-4">
                  <h4 className="font-bold text-slate-800 text-lg">{jugo.nombre}</h4>
                  <p className="text-slate-500 text-xs">{jugo.desc}</p>
                  <p className="text-amber-600 font-extrabold text-base pt-1">RD$ {jugo.precio}</p>
                </div>
                <button
                  onClick={() => agregarAlCarrito(jugo)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" /> Agregar al Carrito
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito de Compra y Datos de Envío */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit sticky top-20">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <ShoppingBag className="w-5 h-5 text-amber-500" /> Tu Pedido
          </h3>

          {/* Lista de Carrito */}
          <div className="space-y-3">
            {carrito.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Tu carrito está vacío.</p>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{item.nombre}</p>
                    <p className="text-xs text-amber-600 font-bold">RD$ {item.precio * item.cantidad}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => cambiarCantidad(item.id, -1)} className="p-1 text-slate-600 hover:bg-slate-200 rounded">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs px-1">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, 1)} className="p-1 text-slate-600 hover:bg-slate-200 rounded">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulario del Cliente */}
          <form onSubmit={enviarPedidoWhatsApp} className="space-y-3 border-t pt-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Datos para el Delivery</p>
            <div>
              <input
                type="text"
                placeholder="Tu Nombre Completo"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Teléfono / WhatsApp"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Dirección Exacta de Entrega"
                value={cliente.direccion}
                onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-lg font-extrabold text-slate-800">
              <span>Total:</span>
              <span className="text-amber-600">RD$ {total}</span>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Enviar Pedido por WhatsApp
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
