"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Upload } from "lucide-react";

export default function CatalogoPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Botella 12 oz");

  const productosIniciales = [
    // Botellas 12 oz
    { id: 1, nombre: "Jugo de Chinola Natural", precio: 100, tamano: "12 oz", categoria: "Botella 12 oz", imagen: "", disponible: true },
    { id: 2, nombre: "Morir Soñando Tradicional", precio: 120, tamano: "12 oz", categoria: "Botella 12 oz", imagen: "", disponible: true },
    { id: 3, nombre: "Jugo de Fresa Natural", precio: 110, tamano: "12 oz", categoria: "Botella 12 oz", imagen: "", disponible: true },
    { id: 4, nombre: "Jugo de Zapote Concentrado", precio: 110, tamano: "12 oz", categoria: "Botella 12 oz", imagen: "", disponible: true },
    { id: 5, nombre: "Jugo de Mango Natural", precio: 100, tamano: "12 oz", categoria: "Botella 12 oz", imagen: "", disponible: true },

    // Galones
    { id: 101, nombre: "Jugo de Chinola en Galón", precio: 650, tamano: "1 Galón", categoria: "Galones", imagen: "", disponible: true },
    { id: 102, nombre: "Morir Soñando en Galón", precio: 750, tamano: "1 Galón", categoria: "Galones", imagen: "", disponible: true },
    { id: 103, nombre: "Jugo de Fresa en Galón", precio: 700, tamano: "1 Galón", categoria: "Galones", imagen: "", disponible: true },

    // Línea Saludable
    { id: 201, nombre: "Jugo Para las Defensas", precio: 910, tamano: "Pack 7 Unidades (8 oz)", categoria: "Saludables & Shots", imagen: "", disponible: true },
    { id: 202, nombre: "Jugo Para Desinflamar", precio: 910, tamano: "Pack 7 Unidades (8 oz)", categoria: "Saludables & Shots", imagen: "", disponible: true },
    { id: 203, nombre: "Jugo Para Quemar Grasa", precio: 910, tamano: "Pack 7 Unidades (8 oz)", categoria: "Saludables & Shots", imagen: "", disponible: true },
    { id: 204, nombre: "Shot Para la Piel & Glow", precio: 595, tamano: "Pack 7 Unidades (2 oz)", categoria: "Saludables & Shots", imagen: "", disponible: true },
    { id: 205, nombre: "Shot Desinflamante Digestivo", precio: 595, tamano: "Pack 7 Unidades (2 oz)", categoria: "Saludables & Shots", imagen: "", disponible: true },
    { id: 206, nombre: "Shot Quemador Energizante", precio: 595, tamano: "Pack 7 Unidades (2 oz)", categoria: "Saludables & Shots", imagen: "", disponible: true },
  ];

  const [jugos, setJugos] = useState([]);

  // Cargar productos al iniciar
  useEffect(() => {
    const guardados = localStorage.getItem("maxxy_catalogo");
    if (guardados) {
      setJugos(JSON.parse(guardados));
    } else {
      setJugos(productosIniciales);
      localStorage.setItem("maxxy_catalogo", JSON.stringify(productosIniciales));
    }
  }, []);

  // Función para guardar en localStorage
  const actualizarYGuardar = (nuevaLista) => {
    setJugos(nuevaLista);
    localStorage.setItem("maxxy_catalogo", JSON.stringify(nuevaLista));
  };

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formJugo, setFormJugo] = useState({
    nombre: "",
    precio: "",
    tamano: "12 oz",
    categoria: "Botella 12 oz",
    imagen: "",
  });

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

  const guardarJugo = (e) => {
    e.preventDefault();
    if (!formJugo.nombre || !formJugo.precio) return;

    let nuevaLista;
    if (editandoId) {
      nuevaLista = jugos.map((j) =>
        j.id === editandoId ? { ...j, ...formJugo, precio: Number(formJugo.precio) } : j
      );
    } else {
      nuevaLista = [
        ...jugos,
        {
          id: Date.now(),
          ...formJugo,
          precio: Number(formJugo.precio),
          disponible: true,
        },
      ];
    }

    actualizarYGuardar(nuevaLista);
    setMostrarModal(false);
  };

  const eliminarJugo = (id) => {
    if (confirm("¿Seguro que deseas eliminar este producto del catálogo?")) {
      const nuevaLista = jugos.filter((j) => j.id !== id);
      actualizarYGuardar(nuevaLista);
    }
  };

  const toggleDisponible = (id) => {
    const nuevaLista = jugos.map((j) => (j.id === id ? { ...j, disponible: !j.disponible } : j));
    actualizarYGuardar(nuevaLista);
  };

  const jugosFiltrados = jugos.filter((j) => j.categoria === categoriaActiva);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrador del Menú & Catálogo</h1>
          <p className="text-slate-500 text-sm">Todo cambio realizado aquí se sincroniza en vivo con la tienda web.</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Agregar Producto
        </button>
      </div>

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

      {/* Grid de Productos */}
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
                  onClick={() => toggleDisponible(jugo.id)}
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

      {/* MODAL CREAR / EDITAR */}
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
                className="w-full p-2.5 border rounded-xl text-xs mt-1 outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
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
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition">
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
    </div>
  );
}
