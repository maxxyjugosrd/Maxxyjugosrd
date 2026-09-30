"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, Mail, MapPin, UserCheck, Trash2, Edit, Eye, ShoppingBag, Calendar, X } from "lucide-react";
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

  // Estado para el modal de Historial Detallado ("Ojito")
  const [clienteSeleccionadoHistorial, setClienteSeleccionadoHistorial] = useState(null);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    vendedorAsignado: "Sin Asignar",
    categoria: "Regular",
  });

  useEffect(() => {
    const unsubscribe = obtenerClientesEnVivo((data) => {
      setClientes(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

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
  };

  const handleDelete = async (idDoc) => {
    if (confirm("¿Estás seguro de eliminar este cliente del CRM?")) {
      await eliminarCliente(idDoc);
    }
  };

  const calcularPromedioGasto = (cliente) => {
    const total = Number(cliente.totalGastado) || 0;
    const cantidad = Number(cliente.cantidadPedidos) || 0;
    if (cantidad === 0) return 0;
    return Math.round(total / cantidad);
  };

  const calcularTiempoSinComprar = (ultimaCompraTimestamp) => {
    if (!ultimaCompraTimestamp) return "Sin registro";
    const fechaCompra = ultimaCompraTimestamp.seconds ? new Date(ultimaCompraTimestamp.seconds * 1000) : new Date(ultimaCompraTimestamp);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy - fechaCompra) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias === 0) return "Hoy mismo";
    if (diferenciaDias === 1) return "Hace 1 día";
    if (diferenciaDias < 30) return `Hace ${diferenciaDias} días`;
    const meses = Math.floor(diferenciaDias / 30);
    return `Hace aprox. ${meses} mes(es)`;
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
          <p className="text-slate-500 text-sm">Administra tu cartera de clientes, historial de compras y vendedores asignados.</p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm"
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
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setClienteSeleccionadoHistorial(cliente)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Ver Historial Detallado"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => abrirModalEditar(cliente)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Editar">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cliente.idDoc || cliente.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
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

                  <div className="bg-slate-50 p-2.5 rounded-xl border mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pedidos completados:</span>
                      <span className="font-bold text-slate-800">{cliente.cantidadPedidos || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total gastado:</span>
                      <span className="font-bold text-emerald-600">RD$ {Number(cliente.totalGastado || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-slate-500">Promedio por pedido:</span>
                      <span className="font-bold text-slate-900">RD$ {calcularPromedioGasto(cliente).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Inactividad:</span>
                      <span className="font-semibold text-amber-600">{calcularTiempoSinComprar(cliente.ultimaCompra)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs mt-2 border">
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

      {/* Modal / Vista de Expediente Completo del Cliente (Ojito) */}
      {clienteSeleccionadoHistorial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl border my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Expediente Completo del Cliente
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{clienteSeleccionadoHistorial.nombre}</h2>
                <div className="text-xs text-slate-600 space-y-1 mt-1">
                  <p>📞 <strong>Teléfono:</strong> {clienteSeleccionadoHistorial.telefono || "No registrado"}</p>
                  <p>📧 <strong>Correo:</strong> {clienteSeleccionadoHistorial.email || "No registrado"}</p>
                  <p>📍 <strong>Dirección Principal:</strong> {clienteSeleccionadoHistorial.direccionFrecuente || clienteSeleccionadoHistorial.direccion || "No registrada"}</p>
                  <p>👤 <strong>Vendedor Asignado:</strong> <span className="font-bold text-slate-800">{clienteSeleccionadoHistorial.vendedorAsignado || "Sin Asignar"}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setClienteSeleccionadoHistorial(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de métricas */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Total Gastado</span>
                <span className="text-base font-black text-emerald-600">RD$ {Number(clienteSeleccionadoHistorial.totalGastado || 0).toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Promedio x Orden</span>
                <span className="text-base font-black text-slate-900">RD$ {calcularPromedioGasto(clienteSeleccionadoHistorial).toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Pedidos Completados</span>
                <span className="text-base font-black text-amber-600">{clienteSeleccionadoHistorial.cantidadPedidos || 0}</span>
              </div>
            </div>

            {/* Listado de compras anteriores */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" /> Historial de Órdenes y Zonas de Envío
              </h3>
              
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {clienteSeleccionadoHistorial.historialCompras && clienteSeleccionadoHistorial.historialCompras.length > 0 ? (
                  clienteSeleccionadoHistorial.historialCompras.map((compra, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-2xl border space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-500 border-b pb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" /> 
                          {compra.fecha ? new Date(compra.fecha).toLocaleDateString() + " " + new Date(compra.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Fecha no registrada"}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">RD$ {Number(compra.total || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 block">Productos adquiridos:</span>
                        {compra.productos && compra.productos.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {compra.productos.map((prod, pIdx) => (
                              <span key={pIdx} className="bg-white px-2.5 py-1 rounded-lg border font-medium text-slate-700">
                                {prod.cantidad || prod.qty || 1}x {prod.nombre || prod.titulo || "Producto"} (RD$ {prod.precio || 0})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Detalle de productos no especificado en esta orden.</p>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 pt-1 border-t flex flex-col gap-0.5">
                        <span>🚚 <strong>Zona de envío / Dirección de entrega:</strong> {compra.zonaEnvio || compra.direccionEnvio || clienteSeleccionadoHistorial.direccionFrecuente || "Local"}</span>
                        <span>📋 <strong>Estado de la orden:</strong> <span className="font-semibold text-amber-600">{compra.estado || "Completado"}</span></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border">
                    <p className="text-sm italic">No hay registros detallados en el historial de compras de este cliente.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setClienteSeleccionadoHistorial(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={guardarCliente} className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">
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
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 font-bold py-3 rounded-xl text-sm transition">
                {modoEdicion ? "Guardar Cambios" : "Guardar Cliente"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="bg-slate-100 hover:bg-slate-200 font-bold px-4 py-3 rounded-xl text-sm transition"
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
