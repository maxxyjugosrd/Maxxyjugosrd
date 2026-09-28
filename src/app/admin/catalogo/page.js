"use client";

import { useState } from "react";
import { Plus, Edit2, Check, X, Flame } from "lucide-react";

export default function CatalogoPage() {
  const [jugos, setJugos] = useState([
    { id: 1, nombre: "Jugo de Chinola (Maracuyá)", precio: 150, desc: "100% pulpa natural de chinola refrescante", popular: true, disponible: true },
    { id: 2, nombre: "Jugo de Fresa Natural", precio: 180, desc: "Fresas frescas licuadas al instante", popular: true, disponible: true },
    { id: 3, nombre: "Jugo de Zapote", precio: 160, desc: "Textura cremosa y dulce natural", popular: false, disponible: true },
    { id: 4, nombre: "Jugo de Mango", precio: 140, desc: "Sabor tropical rico en vitamina C", popular: false, disponible: true },
    { id: 5, nombre: "Morir Soñando", precio: 200, desc: "Tradicional jugo de naranja con leche y hielo", popular: true, disponible: true },
  ]);

  const toggleDisponible = (id) => {
    setJugos(
      jugos.map((j) => (j.id === id ? { ...j, disponible: !j.disponible } : j))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
          <p className="text-slate-500 text-sm">Gestiona los jugos visibles en tu tienda y sus precios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jugos.map((jugo) => (
          <div
            key={jugo.id}
            className={`bg-white p-6 rounded-2xl border transition shadow-sm ${
              jugo.disponible ? "border-slate-200" : "border-rose-200 bg-rose-50/30"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{jugo.nombre}</h3>
                <p className="text-amber-600 font-extrabold text-lg mt-1">RD$ {jugo.precio}</p>
              </div>
              {jugo.popular && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" /> Popular
                </span>
              )}
            </div>

            <p className="text-slate-500 text-xs mb-6">{jugo.desc}</p>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs font-semibold text-slate-600">Estado en Tienda:</span>
              <button
                onClick={() => toggleDisponible(jugo.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  jugo.disponible
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`}
              >
                {jugo.disponible ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Disponible
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" /> Pausado
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
