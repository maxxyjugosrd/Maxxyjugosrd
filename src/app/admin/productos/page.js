"use client";

import { useState } from "react";
import { PlusCircle, Edit, Trash2, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

export default function ProductosPage() {
  // Lista inicial de jugos
  const [productos, setProductos] = useState([
    { id: 1, nombre: "Jugo de Chinola (Maracuyá)", precio: 150, disponible: true, categoria: "Jugos Naturales" },
    { id: 2, nombre: "Jugo de Fresa Natural", precio: 180, disponible: true, categoria: "Jugos Naturales" },
    { id: 3, nombre: "Jugo de Zapote", precio: 160, disponible: false, categoria: "Jugos Naturales" },
    { id: 4, nombre: "Morir Soñando", precio: 200, disponible: true, categoria: "Especiales" },
  ]);

  const [nuevoJugo, setNuevoJugo] = useState({ nombre: "", precio: "", categoria: "Jugos Naturales" });

  // Cambiar disponibilidad (Activo / Pausado por falta de fruta)
  const toggleDisponible = (id) => {
    setProductos(
      productos.map((prod) =>
        prod.id === id ? { ...prod, disponible: !prod.disponible } : prod
      )
    );
  };

  // Agregar nuevo jugo
  const agregarJugo = (e) => {
    e.preventDefault();
    if (!nuevoJugo.nombre || !nuevoJugo.precio) return;

    const creado = {
      id: Date.now(),
      nombre: nuevoJugo.nombre,
      precio: parseFloat(nuevoJugo.precio),
      disponible: true,
      categoria: nuevoJugo.categoria,
    };

    setProductos([...productos, creado]);
    setNuevoJugo({ nombre: "", precio: "", categoria: "Jugos Naturales" });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Administrador de Jugos y Catálogo 🍹</h1>
        <p className="text-slate-500 text-sm">Sube productos, cambia precios y activa o pausa la disponibilidad según las frutas del día.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario para nuevo jugo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-3">
            <PlusCircle className="w-5 h-5 text-amber-500" /> Agregar Nuevo Jugo
          </h2>

          <form onSubmit={agregarJugo} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre del Jugo</label>
              <input
                type="text"
                placeholder="Ej. Jugo de Mango Natural"
                value={nuevoJugo.nombre}
                onChange={(e) => setNuevoJugo({ ...nuevoJugo, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Precio (RD$)</label>
              <input
                type="number"
                placeholder="Ej. 160"
                value={nuevoJugo.precio}
                onChange={(e) => setNuevoJugo({ ...nuevoJugo, precio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Foto del Jugo</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 transition">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block">Haz clic para subir la imagen</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold transition shadow-sm"
            >
              Guardar Jugo
            </button>
          </form>
        </div>

        {/* Lista del Menú */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Menú Actual ({productos.length})</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {productos.map((producto) => (
                <div key={producto.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{producto.nombre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        producto.disponible ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {producto.disponible ? "Disponible" : "Agotado"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-amber-600">RD$ {producto.precio}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDisponible(producto.id)}
                      className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                        producto.disponible
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {producto.disponible ? (
                        <>
                          <XCircle className="w-4 h-4 text-rose-500" /> Pausar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-500" /> Activar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
