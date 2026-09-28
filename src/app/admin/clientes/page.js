"use client";

import { useState } from "react";
import { Search, UserPlus, Phone, MapPin, ShoppingBag, Heart, MessageCircle } from "lucide-react";

export default function ClientesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: "Ana Lucía Martínez",
      telefono: "809-555-0123",
      direccion: "Av. Winston Churchill #45, Apt 3B",
      jugoFavorito: "Jugo de Chinola (16oz)",
      totalPedidos: 14,
      totalGastado: 2100,
      ultimoPedido: "2026-09-27",
    },
    {
      id: 2,
      nombre: "Roberto Castillo",
      telefono: "829-555-9876",
      direccion: "Calle Las Mercedes #12, Zona Colonial",
      jugoFavorito: "Morir Soñando",
      totalPedidos: 8,
      totalGastado: 1600,
      ultimoPedido: "2026-09-25",
    },
    {
      id: 3,
      nombre: "Laura Fernández",
      telefono: "849-555-4321",
      direccion: "Ensanche Naco, Edif. Torres del Sol",
      jugoFavorito: "Jugo de Fresa Natural",
      totalPedidos: 19,
      totalGastado: 3420,
      ultimoPedido: "2026-09-28",
    },
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", direccion: "", jugoFavorito: "" });

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono.includes(busqueda)
  );

  const agregarCliente = (e) => {
    e.preventDefault();
    if (!nuevoCliente.nombre || !nuevoCliente.telefono) return;

    setClientes([
      ...clientes,
      {
        id: Date.now(),
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono,
        direccion: nuevoCliente.direccion || "Dirección no especificada",
        jugoFavorito: nuevoCliente.jugoFavorito || "Sin registrar",
        totalPedidos: 1,
        totalGastado: 0,
        ultimoPedido: new Date().toISOString().split("T")[0],
      },
    ]);

    setNuevoCliente({ nombre: "", telefono: "", direccion: "", jugoFavorito: "" });
    setMostrarModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Clientes (CRM)</h1>
          <p className="text-slate-500 text-sm">Historial de compras, contactos de WhatsApp y direcciones frecuentes.</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <UserPlus className="w-5 h-5" /> Agregar Cliente
        </button>
      </div>

      {/* Buscador de Clientes */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o WhatsApp..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Tarjetas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientesFiltrados.map((cliente) => (
          <div key={cliente.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{cliente.nombre}</h3>
                <a
                  href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline mt-0.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {cliente.telefono}
                </a>
              </div>
              <span className="bg-amber-100 text-amber-800 font-black text-xs px-2.5 py-1 rounded-full">
                {cliente.totalPedidos} pedidos
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-b py-3">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{cliente.direccion}</span>
              </p>
              <p className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Favorito: <strong>{cliente.jugoFavorito}</strong></span>
              </p>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-400">Total gastado:</span>
              <span className="font-extrabold text-slate-900 text-sm">RD$ {cliente.totalGastado.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Agregar Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={agregarCliente} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Cliente</h2>
            <div>
              <label className="text-xs font-bold text-slate-600">Nombre completo</label>
              <input
                type="text"
                placeholder="Ej. María López"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Teléfono / WhatsApp</label>
              <input
                type="text"
                placeholder="Ej. 809-555-0000"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Dirección habitual de envío</label>
              <input
                type="text"
                placeholder="Calle, Sector, Edificio, Apto..."
                value={nuevoCliente.direccion}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Jugo Favorito</label>
              <input
                type="text"
                placeholder="Ej. Morir Soñando"
                value={nuevoCliente.jugoFavorito}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, jugoFavorito: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
              />
            </div>
            <div className="flex gap-2 pt-3">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 font-bold py-2.5 rounded-xl text-sm transition">
                Guardar Cliente
              </button>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="bg-slate-100 hover:bg-slate-200 font-bold px-4 py-2.5 rounded-xl text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
