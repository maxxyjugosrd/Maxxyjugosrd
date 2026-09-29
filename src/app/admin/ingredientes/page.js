"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, X, Loader2, Sparkles, Zap, Power } from "lucide-react";
import {
  obtenerIngredientesEnVivo,
  crearIngrediente,
  actualizarIngrediente,
  eliminarIngrediente,
} from "@/services/catalogoService";

export default function AdminIngredientesPage() {
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado del formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "verde", // "verde" o "shot"
    disponible: true,
  });

  useEffect(() => {
    const desuscribir = obtenerIngredientesEnVivo((datos) => {
      setIngredientes(datos);
      setCargando(false);
    });
    return () => desuscribir();
  }, []);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    if (editandoId) {
      const res = await actualizarIngrediente(editandoId, form);
      if (!res.exito) alert("Error al actualizar el ingrediente");
    } else {
      const res = await crearIngrediente(form);
      if (!res.exito) alert("Error al crear el ingrediente");
    }

    cerrarModal();
  };

  const handleEditar = (ing) => {
    setForm({
      nombre: ing.nombre,
      tipo: ing.tipo || "verde",
      disponible: ing.disponible !== false,
    });
    setEditandoId(ing.id);
    setMostrarModal(true);
  };

  const handleAlternarDisponibilidad = async (ing) => {
    const nuevoEstado = !(ing.disponible !== false);
    await actualizarIngrediente(ing.id, { disponible: nuevoEstado });
  };

  const handleEliminar = async (id) => {
    if (confirm("¿Estás seguro de eliminar este ingrediente?")) {
      await eliminarIngrediente(id);
    }
  };

  const cerrarModal = () => {
    setForm({ nombre: "", tipo: "verde", disponible: true });
    setEditandoId(null);
    setMostrarModal(false);
  };

  const ingredientesVerdes = ingredientes.filter((i) => i.tipo === "verde");
  const ingredientesShots = ingredientes.filter((i) => i.tipo === "shot");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrar Ingredientes 🌿</h1>
          <p className="text-slate-500 text-sm">Gestiona los componentes para jugos verdes y shots (Sincronizado con la Web y Pedidos).</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo Ingrediente
        </button>
      </div>

      {cargando ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span>Cargando ingredientes...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lista de Jugos Verdes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Sparkles className="w-5 h-5 text-emerald-500" /> Ingredientes para Jugos Verdes ({ingredientesVerdes.length})
            </h2>
            <div className="space-y-2">
              {ingredientesVerdes.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4">No hay ingredientes verdes registrados.</p>
              ) : (
                ingredientesVerdes.map((ing) => (
                  <div key={ing.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{ing.nombre}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        ing.disponible !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {ing.disponible !== false ? "Disponible" : "No disponible"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAlternarDisponibilidad(ing)}
                        className={`p-2 rounded-lg text-xs font-medium transition ${
                          ing.disponible !== false ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Cambiar disponibilidad"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditar(ing)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(ing.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lista de Shots */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Zap className="w-5 h-5 text-amber-500" /> Ingredientes para Shots ({ingredientesShots.length})
            </h2>
            <div className="space-y-2">
              {ingredientesShots.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4">No hay ingredientes de shots registrados.</p>
              ) : (
                ingredientesShots.map((ing) => (
                  <div key={ing.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{ing.nombre}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        ing.disponible !== false ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {ing.disponible !== false ? "Disponible" : "No disponible"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAlternarDisponibilidad(ing)}
                        className={`p-2 rounded-lg text-xs font-medium transition ${
                          ing.disponible !== false ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Cambiar disponibilidad"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditar(ing)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(ing.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear/Editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">
                {editandoId ? "Editar Ingrediente" : "Nuevo Ingrediente"}
              </h3>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nombre del Ingrediente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Espinaca, Jengibre..."
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Categoría / Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="verde">Jugo Verde</option>
                  <option value="shot">Shot Funcional</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="disponible"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="disponible" className="text-sm font-medium text-slate-700">
                  Disponible para la venta
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 py-2 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-medium text-sm shadow-sm"
                >
                  {editandoId ? "Guardar Cambios" : "Agregar Ingrediente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
