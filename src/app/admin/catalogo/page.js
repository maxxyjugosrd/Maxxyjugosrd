"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Upload, Loader2, Sparkles, Zap, Power, Package } from "lucide-react";
import { 
  obtenerProductosEnVivo, 
  crearProducto, 
  actualizarProducto, 
  eliminarProductoBD,
  obtenerIngredientesEnVivo,
  crearIngrediente,
  actualizarIngrediente,
  eliminarIngrediente
} from "@/services/catalogoService";

export default function CatalogoPage() {
  // Pestaña principal: "productos" o "ingredientes"
  const [vistaPrincipal, setVistaPrincipal] = useState("productos");

  // Estados de Productos
  const [categoriaActiva, setCategoriaActiva] = useState("Botella 12 oz");
  const [jugos, setJugos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formJugo, setFormJugo] = useState({
    nombre: "",
    precio: "",
    tamano: "12 oz",
    categoria: "Botella 12 oz",
    imagen: "",
  });

  // Estados de Ingredientes
  const [ingredientes, setIngredientes] = useState([]);
  const [cargandoIng, setCargandoIng] = useState(true);
  const [guardandoIng, setGuardandoIng] = useState(false);
  const [modalIngAbierto, setModalIngAbierto] = useState(false);
  const [editandoIngId, setEditandoIngId] = useState(null);
  const [formIng, setFormIng] = useState({
    nombre: "",
    tipo: "verde", // "verde" o "shot"
    disponible: true,
  });

  // Escuchar productos e ingredientes en tiempo real desde Firestore
  useEffect(() => {
    const desuscribirProd = obtenerProductosEnVivo((datos) => {
      setJugos(datos);
      setCargando(false);
    });

    const desuscribirIng = obtenerIngredientesEnVivo((datos) => {
      setIngredientes(datos);
      setCargandoIng(false);
    });

    return () => {
      desuscribirProd && desuscribirProd();
      desuscribirIng && desuscribirIng();
    };
  }, []);

  // --- MANEJADORES DE PRODUCTOS ---
  const abrirModalNuevo = () => {
    setEditandoId(null);
    setFormJugo({ nombre: "", precio: "", tamano: "12 oz", categoria: categoriaActiva, imagen: "" });
    setMostrarModal(true);
  };

  const abrirModalEditar = (jugo) => {
    setEditandoId(jugo.id);
    setFormJugo({
      nombre: jugo.nombre,
      precio: jugo.precio,
      tamano: jugo.tamano,
      categoria: jugo.categoria,
      imagen: jugo.imagen || "",
    });
    setMostrarModal(true);
  };

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormJugo({ ...formJugo, imagen: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarJugo = async (e) => {
    e.preventDefault();
    if (!formJugo.nombre || !formJugo.precio) return;

    setGuardando(true);

    const datosProducto = {
      ...formJugo,
      precio: Number(formJugo.precio),
      disponible: editandoId ? (jugos.find(j => j.id === editandoId)?.disponible ?? true) : true,
    };

    let resultado;
    if (editandoId) {
      resultado = await actualizarProducto(editandoId, datosProducto);
    } else {
      resultado = await crearProducto(datosProducto);
    }

    setGuardando(false);

    if (resultado.exito) {
      setMostrarModal(false);
    } else {
      alert("Ocurrió un error al guardar el producto.");
    }
  };

  const eliminarJugo = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este producto del catálogo?")) {
      const resultado = await eliminarProductoBD(id);
      if (!resultado.exito) {
        alert("Ocurrió un error al intentar eliminar el producto.");
      }
    }
  };

  const toggleDisponible = async (jugo) => {
    await actualizarProducto(jugo.id, { disponible: !jugo.disponible });
  };

  const jugosFiltrados = jugos.filter((j) => j.categoria === categoriaActiva);

  // --- MANEJADORES DE INGREDIENTES ---
  const abrirModalIngNuevo = () => {
    setEditandoIngId(null);
    setFormIng({ nombre: "", tipo: "verde", disponible: true });
    setModalIngAbierto(true);
  };

  const abrirModalIngEditar = (ing) => {
    setEditandoIngId(ing.id);
    setFormIng({
      nombre: ing.nombre,
      tipo: ing.tipo || "verde",
      disponible: ing.disponible !== false,
    });
    setModalIngAbierto(true);
  };

  const guardarIngrediente = async (e) => {
    e.preventDefault();
    if (!formIng.nombre.trim()) return;

    setGuardandoIng(true);
    let resultado;
    if (editandoIngId) {
      resultado = await actualizarIngrediente(editandoIngId, formIng);
    } else {
      resultado = await crearIngrediente(formIng);
    }
    setGuardandoIng(false);

    if (resultado.exito) {
      setModalIngAbierto(false);
    } else {
      alert("Error al guardar el ingrediente.");
    }
  };

  const toggleDisponibleIng = async (ing) => {
    await actualizarIngrediente(ing.id, { disponible: !(ing.disponible !== false) });
  };

  const eliminarIng = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este ingrediente?")) {
      await eliminarIngrediente(id);
    }
  };

  const verdes = ingredientes.filter((i) => i.tipo === "verde");
  const shots = ingredientes.filter((i) => i.tipo === "shot");

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector de Vista Principal (Productos vs Ingredientes) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrador del Menú & Catálogo</h1>
          <p className="text-slate-500 text-sm">Gestiona tus productos y los ingredientes personalizables en tiempo real.</p>
        </div>

        {/* Pestañas Principales */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setVistaPrincipal("productos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              vistaPrincipal === "productos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package className="w-4 h-4 text-amber-500" /> Productos / Menú
          </button>
          <button
            onClick={() => setVistaPrincipal("ingredientes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              vistaPrincipal === "ingredientes" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" /> Ingredientes (Verdes y Shots)
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: PRODUCTOS / MENÚ                                 */}
      {/* ========================================================= */}
      {vistaPrincipal === "productos" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            {/* Pestañas de Categoría */}
            <div className="flex gap-2 border-b pb-2 overflow-x-auto">
              {["Botella 12 oz", "Galones", "Saludables & Shots"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    categoriaActiva === cat
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "bg-white text-slate-600 border hover:bg-slate-50"
                  }`}
                >
                  {cat === "Saludables & Shots" ? "🥦 " + cat : cat}
                </button>
              ))}
            </div>

            <button
              onClick={abrirModalNuevo}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Agregar Producto
            </button>
          </div>

          {/* Grid de Productos */}
          {cargando ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span>Cargando catálogo en tiempo real...</span>
            </div>
          ) : jugosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No hay productos disponibles en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jugosFiltrados.map((jugo) => (
                <div
                  key={jugo.id}
                  className={`bg-white p-6 rounded-2xl border transition shadow-sm space-y-4 flex flex-col justify-between ${
                    jugo.disponible ? "border-slate-200" : "border-rose-200 bg-rose-50/20"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border">
                        {jugo.imagen ? (
                          <img src={jugo.imagen} alt={jugo.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {jugo.tamano}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-lg mt-3">{jugo.nombre}</h3>
                    <p className="text-amber-600 font-black text-xl mt-1">RD$ {jugo.precio}</p>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Estado Web:</span>
                      <button
                        onClick={() => toggleDisponible(jugo)}
                        className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition ${
                          jugo.disponible
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {jugo.disponible ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {jugo.disponible ? "Disponible" : "Pausado"}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalEditar(jugo)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => eliminarJugo(jugo.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: INGREDIENTES (VERDES Y SHOTS)                    */}
      {/* ========================================================= */}
      {vistaPrincipal === "ingredientes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Ingredientes Personalizables</h2>
              <p className="text-xs text-slate-400">Administra los componentes para los modales de jugos verdes y shots.</p>
            </div>
            <button
              onClick={abrirModalIngNuevo}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-xs"
            >
              <Plus className="w-4 h-4" /> Nuevo Ingrediente
            </button>
          </div>

          {cargandoIng ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              <span>Cargando ingredientes...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jugos Verdes */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                  <Sparkles className="w-5 h-5 text-emerald-500" /> Ingredientes Jugos Verdes ({verdes.length})
                </h3>
                <div className="space-y-2">
                  {verdes.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4">No hay ingredientes verdes registrados.</p>
                  ) : (
                    verdes.map((ing) => (
                      <div key={ing.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{ing.nombre}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            ing.disponible !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            {ing.disponible !== false ? "Disponible" : "No disponible"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleDisponibleIng(ing)}
                            className={`p-2 rounded-xl text-xs transition ${
                              ing.disponible !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}
                            title="Cambiar disponibilidad"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => abrirModalIngEditar(ing)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => eliminarIng(ing.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shots */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                  <Zap className="w-5 h-5 text-amber-500" /> Ingredientes Shots Funcionales ({shots.length})
                </h3>
                <div className="space-y-2">
                  {shots.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4">No hay ingredientes de shots registrados.</p>
                  ) : (
                    shots.map((ing) => (
                      <div key={ing.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{ing.nombre}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            ing.disponible !== false ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            {ing.disponible !== false ? "Disponible" : "No disponible"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleDisponibleIng(ing)}
                            className={`p-2 rounded-xl text-xs transition ${
                              ing.disponible !== false ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                            }`}
                            title="Cambiar disponibilidad"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => abrirModalIngEditar(ing)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => eliminarIng(ing.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl">
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
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CREAR / EDITAR PRODUCTO                             */}
      {/* ========================================================= */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={guardarJugo} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">
              {editandoId ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-600">Categoría</label>
              <select
                value={formJugo.categoria}
                onChange={(e) => setFormJugo({ ...formJugo, categoria: e.target.value })}
                className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white"
              >
                <option value="Botella 12 oz">Botella 12 oz</option>
                <option value="Galones">Galones</option>
                <option value="Saludables & Shots">Saludables & Shots</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Nombre del Producto</label>
              <input
                type="text"
                placeholder="Ej. Jugo Para las Defensas"
                value={formJugo.nombre}
                onChange={(e) => setFormJugo({ ...formJugo, nombre: e.target.value })}
                className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600">Precio (RD$)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={formJugo.precio}
                  onChange={(e) => setFormJugo({ ...formJugo, precio: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Presentación / Detalle</label>
                <input
                  type="text"
                  placeholder="Ej. Pack 7 Unidades (8 oz)"
                  value={formJugo.tamano}
                  onChange={(e) => setFormJugo({ ...formJugo, tamano: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <label className="text-xs font-bold text-slate-600 block">Fotografía del Producto</label>
              
              {formJugo.imagen && (
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border mx-auto relative group">
                  <img src={formJugo.imagen} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormJugo({ ...formJugo, imagen: "" })}
                    className="absolute inset-0 bg-slate-900/60 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    Quitar
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-amber-500" /> Cargar Foto desde Dispositivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSeleccionarArchivo}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  placeholder="O pega enlace de imagen URL..."
                  value={formJugo.imagen}
                  onChange={(e) => setFormJugo({ ...formJugo, imagen: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="bg-slate-100 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CREAR / EDITAR INGREDIENTE                          */}
      {/* ========================================================= */}
      {modalIngAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={guardarIngrediente} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">
              {editandoIngId ? "Editar Ingrediente" : "Nuevo Ingrediente"}
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-600">Nombre del Ingrediente</label>
              <input
                type="text"
                required
                placeholder="Ej. Espinaca, Jengibre..."
                value={formIng.nombre}
                onChange={(e) => setFormIng({ ...formIng, nombre: e.target.value })}
                className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Tipo / Categoría</label>
              <select
                value={formIng.tipo}
                onChange={(e) => setFormIng({ ...formIng, tipo: e.target.value })}
                className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white"
              >
                <option value="verde">Jugo Verde</option>
                <option value="shot">Shot Funcional</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="submit"
                disabled={guardandoIng}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {guardandoIng && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar Ingrediente
              </button>
              <button
                type="button"
                onClick={() => setModalIngAbierto(false)}
                className="bg-slate-100 font-bold px-4 py-2.5 rounded-xl text-xs"
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
