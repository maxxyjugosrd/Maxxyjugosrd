"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, Mail, MapPin, Tag, UserCheck, Trash2, Edit } from "lucide-react";
import { obtenerClientesEnVivo, crearClienteManual, eliminarCliente } from "@/services/clientesService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState([]);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    vendedorAsignado: "Sin Asignar",
    categoria: "Regular",
  });

  // 1. Cargar clientes en tiempo real desde Firebase Firestore
  useEffect(() => {
    const unsubscribe = obtenerClientesEnVivo((data) => {
      setClientes(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // 2. Cargar vendedores desde localStorage
  useEffect(() => {
    const personalGuardado = localStorage.getItem("maxi_personal");
    if (personalGuardado) {
      try {
        const parsed = JSON.parse(personalGuardado);
        const soloVendedores = parsed.filter(p => p.rol === "Vendedor");
        setVendedoresDisponibles(soloVendedores);
      } catch (e) {
        console.error("Error al leer personal:", e);
      }
    } else {
      setVendedoresDisponibles([
        { id: 1, nombre: "Juan Pérez", rol: "Vendedor" },
        { id: 2, nombre: "Ana Gómez", rol: "Vendedor" }
      ]);
    }
  }, []);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setNuevoCliente({ nombre: "", telefono: "", email: "", direccion: "", vendedorAsignado: "Sin Asignar", categoria: "Regular" });
    setMostrarModal(true);
  };

  const abrirModalEditar = (cliente) => {
    setModoEdicion(true);
    setIdEditando(cliente.idDoc || cliente.id);
    setNuevoCliente({
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      direccion: cliente.direccionFrecuente || cliente.direccion || "",
      vendedorAsignado: cliente.vendedorAsignado || "Sin Asignar",
      categoria: cliente.categoria || "Regular",
    });
    setMostrarModal(true);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!nuevoCliente.nombre) return;

    if (modoEdicion) {
      try {
        const clienteRef = doc(db, "clientes", idEditando);
        await updateDoc(clienteRef, {
          nombre: nuevoCliente.nombre,
          telefono: nuevoCliente.telefono,
          email: nuevoCliente.email,
          direccionFrecuente: nuevoCliente.direccion,
          vendedorAsignado: nuevoCliente.vendedorAsignado,
          categoria: nuevoCliente.categoria,
        });
      } catch (error) {
        console.error("Error al actualizar cliente:", error);
        alert("Hubo un error al actualizar el cliente.");
      }
    } else {
      const resultado = await crearClienteManual({
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono,
        email: nuevoCliente.email,
        direccionFrecuente: nuevoCliente.direccion,
        vendedorAsignado: nuevoCliente.vendedorAsignado,
        categoria: nuevoCliente.categoria,
      });

      if (!resultado.exito) {
        alert(resultado.error || "No se pudo registrar el cliente.");
        return;
      }
    }

    setMostrarModal(false);
    setNuevoCliente({ nombre: "", telefono: "", email: "", direccion: "", vendedorAsignado: "Sin Asignar", categoria: "Regular" });
  };

  const handleDelete = async (idDoc) => {
    if (confirm("¿Estás seguro de eliminar este cliente del CRM?")) {
      const res = await eliminarCliente(idDoc);
      if (!res.exito) {
        alert("Error al eliminar el cliente.");
      }
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.nombre && c.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (c.telefono && c.telefono.includes(busqueda)) ||
    (c.vendedorAsignado && c.vendedorAsignado.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CRM / Gestión de Clientes</h1>
          <p className="text-slate-500 text-sm">Administra tu cartera de clientes y asocia sus pedidos en tiempo real.</p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Nuevo Cliente
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o vendedor asignado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-sm focus:outline-none text-slate-700"
        />
      </div>

      {/* Listado de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-lg">No hay clientes registrados</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Comienza agregando clientes o realizando pedidos para que aparezcan aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.idDoc || cliente.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{cliente.nombre}</h3>
                    <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                      {cliente.categoria || "Regular"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => abrirModalEditar(cliente)} className="p-2 text-slate-400 hover:text-amber-600 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cliente.idDoc || cliente.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{cliente.telefono || "Sin teléfono"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{cliente.email || "Sin correo"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{cliente.direccionFrecuente || cliente.direccion || "Sin dirección"}</span>
                  </div>
                  {cliente.cantidadPedidos && (
                    <div className="text-slate-500 font-medium pt-1">
                      📦 Pedidos realizados: <span className="text-slate-800 font-bold">{cliente.cantidadPedidos}</span> | Total: <span className="text-emerald-600 font-bold">RD$ {Number(cliente.totalGastado || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs mt-4 border">
                <span className="text-slate-500 font-medium">Vendedor Asignado:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {cliente.vendedorAsignado || "Sin Asignar"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={guardarCliente} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">
              {modoEdicion ? "Editar Cliente" : "Registrar Nuevo Cliente"}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Nombre del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Supermercado Central"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Teléfono</label>
                  <input
                    type="text"
                    placeholder="809-000-0000"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Categoría</label>
                  <select
                    value={nuevoCliente.categoria}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, categoria: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Mayorista">Mayorista</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="cliente@correo.com"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle Principal #123"
                  value={nuevoCliente.direccion}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Asignar Vendedor Responsable</label>
                <select
                  value={nuevoCliente.vendedorAsignado}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, vendedorAsignado: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                >
                  <option value="Sin Asignar">Sin Asignar</option>
                  {vendedoresDisponibles.map((v) => (
                    <option key={v.id} value={v.nombre}>{v.nombre} (Vendedor)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 font-bold py-2.5 rounded-xl text-sm transition">
                {modoEdicion ? "Guardar Cambios" : "Guardar Cliente"}
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
