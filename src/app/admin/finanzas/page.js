"use client";

import { useState, useEffect } from "react";
import { 
  Calculator, 
  Receipt, 
  Truck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Upload, 
  DollarSign,
  Store,
  FileText
} from "lucide-react";

export default function FinanzasYComprasPage() {
  // Pestaña activa: "presupuesto", "facturas", "proveedores"
  const [pestanaActiva, setPestanaActiva] = useState("presupuesto");

  // 1. ESTADOS PARA PRESUPUESTO / LISTA DE COMPRAS
  const [listaCompras, setListaCompras] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("maxxy_presupuesto") || "[]");
    }
    return [];
  });
  const [nuevoItem, setNuevoItem] = useState({ concepto: "", cantidad: "", estimado: "", proveedor: "" });

  // 2. ESTADOS PARA FACTURAS
  const [listaFacturas, setListaFacturas] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("maxxy_facturas") || "[]");
    }
    return [];
  });
  const [nuevaFactura, setNuevaFactura] = useState({ proveedor: "", monto: "", fecha: "", imagen: "" });

  // 3. ESTADOS PARA PROVEEDORES
  const [listaProveedores, setListaProveedores] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("maxxy_proveedores") || "[]");
    }
    return [];
  });
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: "", insumos: "", telefono: "", notas: "" });

  // Guardar en LocalStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem("maxxy_presupuesto", JSON.stringify(listaCompras));
  }, [listaCompras]);

  useEffect(() => {
    localStorage.setItem("maxxy_facturas", JSON.stringify(listaFacturas));
  }, [listaFacturas]);

  useEffect(() => {
    localStorage.setItem("maxxy_proveedores", JSON.stringify(listaProveedores));
  }, [listaProveedores]);

  // --- ACCIONES DE PRESUPUESTO ---
  const agregarItemPresupuesto = (e) => {
    e.preventDefault();
    if (!nuevoItem.concepto || !nuevoItem.estimado) return alert("Completa al menos el concepto y el precio estimado.");
    const item = {
      id: Date.now(),
      ...nuevoItem,
      comprado: false
    };
    setListaCompras([item, ...listaCompras]);
    setNuevoItem({ concepto: "", cantidad: "", estimado: "", proveedor: "" });
  };

  const toggleComprado = (id) => {
    setListaCompras(listaCompras.map(i => i.id === id ? { ...i, comprado: !i.comprado } : i));
  };

  const eliminarItemPresupuesto = (id) => {
    setListaCompras(listaCompras.filter(i => i.id !== id));
  };

  // --- ACCIONES DE FACTURAS (Conversión de imagen a Base64 para guardarla) ---
  const manejarImagenFactura = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onloadend = () => {
        setNuevaFactura({ ...nuevaFactura, imagen: lector.result });
      };
      lector.readAsDataURL(archivo);
    }
  };

  const agregarFactura = (e) => {
    e.preventDefault();
    if (!nuevaFactura.proveedor || !nuevaFactura.monto) return alert("Indica el proveedor y el monto de la factura.");
    const factura = {
      id: Date.now(),
      ...nuevaFactura,
      fecha: nuevaFactura.fecha || new Date().toISOString().split("T")[0]
    };
    setListaFacturas([factura, ...listaFacturas]);
    setNuevaFactura({ proveedor: "", monto: "", fecha: "", imagen: "" });
  };

  const eliminarFactura = (id) => {
    setListaFacturas(listaFacturas.filter(f => f.id !== id));
  };

  // --- ACCIONES DE PROVEEDORES ---
  const agregarProveedor = (e) => {
    e.preventDefault();
    if (!nuevoProveedor.nombre) return alert("Escribe el nombre del proveedor.");
    const prov = {
      id: Date.now(),
      ...nuevoProveedor
    };
    setListaProveedores([prov, ...listaProveedores]);
    setNuevoProveedor({ nombre: "", insumos: "", telefono: "", notas: "" });
  };

  const eliminarProveedor = (id) => {
    setListaProveedores(listaProveedores.filter(p => p.id !== id));
  };

  // Cálculos rápidos
  const totalPresupuestado = listaCompras.reduce((acc, i) => acc + (parseFloat(i.estimado) || 0), 0);
  const totalGastadoFacturas = listaFacturas.reduce((acc, f) => acc + (parseFloat(f.monto) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border gap-4">
          <div>
            <span className="bg-amber-100 text-amber-800 text-xs font-black uppercase px-3 py-1 rounded-full">
              Panel de Control Financiero
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Presupuestos, Facturas & Proveedores</h1>
            <p className="text-xs text-slate-500">Gestiona tus costos de producción y controla las compras de Maxxy Jugos.</p>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-50 border p-3 rounded-2xl text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Presupuesto Estimado</p>
              <p className="text-sm font-black text-slate-900">RD$ {totalPresupuestado.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-right">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Gastos en Facturas</p>
              <p className="text-sm font-black text-emerald-700">RD$ {totalGastadoFacturas.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border overflow-x-auto">
          <button
            onClick={() => setPestanaActiva("presupuesto")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              pestanaActiva === "presupuesto" ? "bg-amber-500 text-slate-950 shadow" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Calculator className="w-4 h-4" /> Presupuesto & Lista de Compras
          </button>
          <button
            onClick={() => setPestanaActiva("facturas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              pestanaActiva === "facturas" ? "bg-amber-500 text-slate-950 shadow" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Receipt className="w-4 h-4" /> Archivo de Facturas ({listaFacturas.length})
          </button>
          <button
            onClick={() => setPestanaActiva("proveedores")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              pestanaActiva === "proveedores" ? "bg-amber-500 text-slate-950 shadow" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Truck className="w-4 h-4" /> Directorio de Proveedores ({listaProveedores.length})
          </button>
        </div>

        {/* CONTENIDO 1: PRESUPUESTO Y LISTA DE COMPRAS */}
        {pestanaActiva === "presupuesto" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" /> Añadir Insumo a Comprar
              </h3>
              <form onSubmit={agregarItemPresupuesto} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Concepto / Producto *</label>
                  <input
                    type="text"
                    placeholder="Ej. Botellas 12 oz, Azúcar, Maracuyá..."
                    value={nuevoItem.concepto}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, concepto: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Cantidad</label>
                    <input
                      type="text"
                      placeholder="Ej. 2 cajas / 50 lbs"
                      value={nuevoItem.cantidad}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Costo Estimado (RD$) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={nuevoItem.estimado}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, estimado: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Proveedor Sugerido</label>
                  <input
                    type="text"
                    placeholder="Ej. Mercado Modelo / Ferretería..."
                    value={nuevoItem.proveedor}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, proveedor: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md mt-2"
                >
                  Guardar en Presupuesto
                </button>
              </form>
            </div>

            {/* Lista Interactiva */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Lista de Compras Actual</h3>
              {listaCompras.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-slate-400 text-xs">No hay elementos en el presupuesto todavía.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {listaCompras.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition ${
                        item.comprado ? "bg-emerald-50/50 border-emerald-200 opacity-75 line-through" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.comprado}
                          onChange={() => toggleComprado(item.id)}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.concepto}</p>
                          <p className="text-slate-400 text-[11px]">
                            Cant: {item.cantidad || "N/D"} {item.proveedor ? `· Proveedor: ${item.proveedor}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-900 text-sm">RD$ {parseFloat(item.estimado).toLocaleString()}</span>
                        <button
                          onClick={() => eliminarItemPresupuesto(item.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENIDO 2: ARCHIVO DE FACTURAS */}
        {pestanaActiva === "facturas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subir Factura */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" /> Registrar Gasto / Factura
              </h3>
              <form onSubmit={agregarFactura} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Proveedor *</label>
                  <input
                    type="text"
                    placeholder="Nombre del establecimiento..."
                    value={nuevaFactura.proveedor}
                    onChange={(e) => setNuevaFactura({ ...nuevaFactura, proveedor: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Monto Total (RD$) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={nuevaFactura.monto}
                      onChange={(e) => setNuevaFactura({ ...nuevaFactura, monto: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Fecha</label>
                    <input
                      type="date"
                      value={nuevaFactura.fecha}
                      onChange={(e) => setNuevaFactura({ ...nuevaFactura, fecha: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Foto o Recibo de la Factura</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarImagenFactura}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {nuevaFactura.imagen && (
                    <div className="mt-2 relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border">
                      <img src={nuevaFactura.imagen} alt="Vista previa" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md mt-2"
                >
                  Guardar Factura
                </button>
              </form>
            </div>

            {/* Galería de Facturas */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Historial de Facturas Subidas</h3>
              {listaFacturas.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-slate-400 text-xs">No hay facturas registradas todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listaFacturas.map((fac) => (
                    <div key={fac.id} className="bg-slate-50 p-4 rounded-2xl border flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-sm">{fac.proveedor}</h4>
                          <button onClick={() => eliminarFactura(fac.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">Fecha: {fac.fecha}</p>
                        <p className="text-base font-black text-emerald-600 mt-1">RD$ {parseFloat(fac.monto).toLocaleString()}</p>
                      </div>

                      {fac.imagen ? (
                        <div className="w-full h-32 bg-white rounded-xl overflow-hidden border">
                          <a href={fac.imagen} target="_blank" rel="noreferrer">
                            <img src={fac.imagen} alt={fac.proveedor} className="w-full h-full object-cover hover:scale-105 transition" title="Click para ver completa" />
                          </a>
                        </div>
                      ) : (
                        <div className="w-full h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-[11px]">
                          Sin foto de factura
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENIDO 3: PROVEEDORES */}
        {pestanaActiva === "proveedores" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registrar Proveedor */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" /> Nuevo Proveedor
              </h3>
              <form onSubmit={agregarProveedor} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Nombre del Local / Proveedor *</label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuidora de Frutas Juan..."
                    value={nuevoProveedor.nombre}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">¿Qué le compras?</label>
                  <input
                    type="text"
                    placeholder="Ej. Chinola, Limón, Envases plásticos..."
                    value={nuevoProveedor.insumos}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, insumos: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Teléfono / Contacto</label>
                  <input
                    type="text"
                    placeholder="809-000-0000"
                    value={nuevoProveedor.telefono}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Notas / Dirección</label>
                  <textarea
                    placeholder="Ej. Abren de lunes a sábado, ubicado en el mercado..."
                    value={nuevoProveedor.notas}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, notas: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none h-16 resize-none focus:ring-2 focus:ring-amber-500 mt-1"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md mt-2"
                >
                  Guardar Proveedor
                </button>
              </form>
            </div>

            {/* Listado de Proveedores */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Directorio de Proveedores Registrados</h3>
              {listaProveedores.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-slate-400 text-xs">No hay proveedores registrados todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listaProveedores.map((prov) => (
                    <div key={prov.id} className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm">{prov.nombre}</h4>
                        <button onClick={() => eliminarProveedor(prov.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-amber-700 font-bold">🛒 {prov.insumos || "Insumos generales"}</p>
                      <p className="text-xs text-slate-600">📞 {prov.telefono || "Sin teléfono"}</p>
                      {prov.notas && (
                        <p className="text-[11px] text-slate-400 bg-white p-2 rounded-xl border mt-1">
                          {prov.notas}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
