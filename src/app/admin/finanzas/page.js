"use client";

import { useState, useEffect } from "react";
import { 
  Calculator, 
  Receipt, 
  Truck, 
  Plus, 
  Trash2, 
  Upload, 
  Store,
  Search,
  Calendar,
  Building2,
  User,
  Phone,
  MapPin
} from "lucide-react";

export default function FinanzasYComprasPage() {
  const [pestanaActiva, setPestanaActiva] = useState("presupuesto");
  const [busquedaGlobal, setBusquedaGlobal] = useState("");

  // 1. PROVEEDORES
  const [listaProveedores, setListaProveedores] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("maxxy_proveedores") || "[]");
    }
    return [];
  });
  const [nuevoProveedor, setNuevoProveedor] = useState({ empresa: "", contacto: "", telefono: "", direccion: "" });

  // 2. PRESUPUESTO / LISTA DE COMPRAS
  const [listaCompras, setListaCompras] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("maxxy_presupuesto") || "[]");
    }
    return [];
  });
  const [tipoCalculo, setTipoCalculo] = useState("unidad"); // "unidad" o "libra"
  const [nuevoItem, setNuevoItem] = useState({ 
    concepto: "", 
    tipo: "unidad", 
    cantidad: "", 
    precioUnitario: "", 
    proveedorId: "" 
  });

  // 3. FACTURAS / RECIBOS
  const [listaFacturas, setListaFacturas] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("maxxy_facturas") || "[]");
    }
    return [];
  });
  const [nuevaFactura, setNuevaFactura] = useState({ proveedorId: "", monto: "", fecha: "", imagen: "" });
  const [mesFiltroHistorial, setMesFiltroHistorial] = useState("todos");

  // Guardar en LocalStorage
  useEffect(() => {
    localStorage.setItem("maxxy_proveedores", JSON.stringify(listaProveedores));
  }, [listaProveedores]);

  useEffect(() => {
    localStorage.setItem("maxxy_presupuesto", JSON.stringify(listaCompras));
  }, [listaCompras]);

  useEffect(() => {
    localStorage.setItem("maxxy_facturas", JSON.stringify(listaFacturas));
  }, [listaFacturas]);

  // --- ACCIONES DE PROVEEDORES ---
  const agregarProveedor = (e) => {
    e.preventDefault();
    if (!nuevoProveedor.empresa) return alert("Escribe el nombre de la empresa proveedora.");
    const prov = { id: Date.now().toString(), ...nuevoProveedor };
    setListaProveedores([prov, ...listaProveedores]);
    setNuevoProveedor({ empresa: "", contacto: "", telefono: "", direccion: "" });
  };

  const eliminarProveedor = (id) => {
    setListaProveedores(listaProveedores.filter(p => p.id !== id));
  };

  // --- ACCIONES DE PRESUPUESTO ---
  const agregarItemPresupuesto = (e) => {
    e.preventDefault();
    if (!nuevoItem.concepto || !nuevoItem.cantidad || !nuevoItem.precioUnitario) {
      return alert("Completa el concepto, la cantidad y el precio.");
    }

    const cant = parseFloat(nuevoItem.cantidad) || 0;
    const precio = parseFloat(nuevoItem.precioUnitario) || 0;
    const totalEstimado = cant * precio;

    const item = {
      id: Date.now(),
      concepto: nuevoItem.concepto,
      tipo: tipoCalculo,
      cantidad: cant,
      precioUnitario: precio,
      total: totalEstimado,
      proveedorId: nuevoItem.proveedorId,
      comprado: false
    };

    setListaCompras([item, ...listaCompras]);
    setNuevoItem({ concepto: "", cantidad: "", precioUnitario: "", proveedorId: "" });
  };

  const toggleComprado = (id) => {
    setListaCompras(listaCompras.map(i => i.id === id ? { ...i, comprado: !i.comprado } : i));
  };

  const eliminarItemPresupuesto = (id) => {
    setListaCompras(listaCompras.filter(i => i.id !== id));
  };

  // --- ACCIONES DE FACTURAS ---
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
    if (!nuevaFactura.proveedorId || !nuevaFactura.monto) {
      return alert("Selecciona el proveedor e ingresa el monto de la factura.");
    }
    const factura = {
      id: Date.now(),
      proveedorId: nuevaFactura.proveedorId,
      monto: parseFloat(nuevaFactura.monto) || 0,
      fecha: nuevaFactura.fecha || new Date().toISOString().split("T")[0],
      imagen: nuevaFactura.imagen
    };
    setListaFacturas([factura, ...listaFacturas]);
    setNuevaFactura({ proveedorId: "", monto: "", fecha: "", imagen: "" });
  };

  const eliminarFactura = (id) => {
    setListaFacturas(listaFacturas.filter(f => f.id !== id));
  };

  // Cálculos y totales
  const totalPresupuestado = listaCompras.reduce((acc, i) => acc + i.total, 0);
  const totalGastadoFacturas = listaFacturas.reduce((acc, f) => acc + f.monto, 0);

  // Historial de gastos por proveedor con filtro mensual
  const calcularGastosProveedor = (proveedorId) => {
    let filtradas = listaFacturas.filter(f => f.proveedorId === proveedorId);
    if (mesFiltroHistorial !== "todos") {
      filtradas = filtradas.filter(f => f.fecha.startsWith(mesFiltroHistorial));
    }
    return filtradas.reduce((acc, f) => acc + f.monto, 0);
  };

  // Búsqueda global de insumos o proveedores
  const comprasFiltradas = listaCompras.filter(item => {
    const prov = listaProveedores.find(p => p.id === item.proveedorId);
    const texto = busquedaGlobal.toLowerCase();
    const matchConcepto = item.concepto.toLowerCase().includes(texto);
    const matchProv = prov ? prov.empresa.toLowerCase().includes(texto) : false;
    return matchConcepto || matchProv;
  });

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
            <p className="text-xs text-slate-500">Controla costos de producción, compara proveedores y gestiona facturas.</p>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-50 border p-3 rounded-2xl text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Presupuesto Total</p>
              <p className="text-sm font-black text-slate-900">RD$ {totalPresupuestado.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-right">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Gastos Reales (Facturas)</p>
              <p className="text-sm font-black text-emerald-700">RD$ {totalGastadoFacturas.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Buscador Global Rápido */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar insumo, artículo o proveedor (ej. azúcar, botellas, colmado)..."
            value={busquedaGlobal}
            onChange={(e) => setBusquedaGlobal(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
          {busquedaGlobal && (
            <button onClick={() => setBusquedaGlobal("")} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2">
              Limpiar
            </button>
          )}
        </div>

        {/* Navegación por pestañas */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border overflow-x-auto">
          <button
            onClick={() => setPestanaActiva("presupuesto")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              pestanaActiva === "presupuesto" ? "bg-amber-500 text-slate-950 shadow" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Calculator className="w-4 h-4" /> Presupuesto & Compras ({listaCompras.length})
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

        {/* CONTENIDO 1: PRESUPUESTO Y CÁLCULOS */}
        {pestanaActiva === "presupuesto" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de Presupuesto */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" /> Calcular Costo de Artículo
              </h3>

              {/* Selector de Tipo de Cálculo */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipoCalculo("unidad")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${tipoCalculo === "unidad" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  Por Unidades / Piezas
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCalculo("libra")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${tipoCalculo === "libra" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  Por Libras / Peso
                </button>
              </div>

              <form onSubmit={agregarItemPresupuesto} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Insumo / Producto *</label>
                  <input
                    type="text"
                    placeholder={tipoCalculo === "unidad" ? "Ej. Botellas 12 oz, Tapas..." : "Ej. Azúcar, Chinola, Limón..."}
                    value={nuevoItem.concepto}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, concepto: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      {tipoCalculo === "unidad" ? "Cantidad (Piezas)" : "Cantidad (Libras)"} *
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={tipoCalculo === "unidad" ? "Ej. 10" : "Ej. 50"}
                      value={nuevoItem.cantidad}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      {tipoCalculo === "unidad" ? "Precio por Unidad" : "Precio por Libra"} (RD$) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={nuevoItem.precioUnitario}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, precioUnitario: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                      required
                    />
                  </div>
                </div>

                {/* Selector de Proveedor Registrado */}
                <div>
                  <label className="text-xs font-bold text-slate-600">Seleccionar Proveedor Sugerido</label>
                  <select
                    value={nuevoItem.proveedorId}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, proveedorId: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none bg-white focus:ring-2 focus:ring-amber-500 mt-1"
                  >
                    <option value="">-- Sin proveedor específico --</option>
                    {listaProveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.empresa} {p.contacto ? `(${p.contacto})` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Cálculo en tiempo real preview */}
                {nuevoItem.cantidad && nuevoItem.precioUnitario && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-900">Total calculado:</span>
                    <span className="font-black text-amber-950 text-sm">
                      RD$ {(parseFloat(nuevoItem.cantidad || 0) * parseFloat(nuevoItem.precioUnitario || 0)).toLocaleString()}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md mt-2"
                >
                  Añadir al Presupuesto
                </button>
              </form>
            </div>

            {/* Lista Interactiva de Presupuesto */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Lista de Compras y Comparativa</h3>
              {comprasFiltradas.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-slate-400 text-xs">No hay elementos en el presupuesto o no coinciden con la búsqueda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {comprasFiltradas.map((item) => {
                    const proveedorObj = listaProveedores.find(p => p.id === item.proveedorId);
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs transition ${
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
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              {item.tipo === "libra" ? "⚖️ Libras: " : "📦 Cant: "} **{item.cantidad}** 
                              {" "}× RD$ {item.precioUnitario} {item.tipo === "libra" ? "c/u (libra)" : "c/u"}
                              {proveedorObj && <span className="text-amber-700 font-bold ml-2">🏢 {proveedorObj.empresa}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-900 text-sm">RD$ {item.total.toLocaleString()}</span>
                          <button
                            onClick={() => eliminarItemPresupuesto(item.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                <Upload className="w-4 h-4 text-amber-500" /> Registrar Factura / Recibo
              </h3>
              <form onSubmit={agregarFactura} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Seleccionar Proveedor *</label>
                  <select
                    value={nuevaFactura.proveedorId}
                    onChange={(e) => setNuevaFactura({ ...nuevaFactura, proveedorId: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none bg-white focus:ring-2 focus:ring-amber-500 mt-1"
                    required
                  >
                    <option value="">-- Elige un proveedor --</option>
                    {listaProveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.empresa}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Monto Total (RD$) *</label>
                    <input
                      type="number"
                      step="any"
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
              <h3 className="font-extrabold text-slate-900 text-sm">Historial de Facturas Registradas</h3>
              {listaFacturas.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-slate-400 text-xs">No hay facturas registradas todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listaFacturas.map((fac) => {
                    const prov = listaProveedores.find(p => p.id === fac.proveedorId);
                    return (
                      <div key={fac.id} className="bg-slate-50 p-4 rounded-2xl border flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 text-sm">{prov ? prov.empresa : "Proveedor desconocido"}</h4>
                            <button onClick={() => eliminarFactura(fac.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">Fecha: {fac.fecha}</p>
                          <p className="text-base font-black text-emerald-600 mt-1">RD$ {fac.monto.toLocaleString()}</p>
                        </div>

                        {fac.imagen ? (
                          <div className="w-full h-32 bg-white rounded-xl overflow-hidden border">
                            <a href={fac.imagen} target="_blank" rel="noreferrer">
                              <img src={fac.imagen} alt="Factura" className="w-full h-full object-cover hover:scale-105 transition" title="Click para ver completa" />
                            </a>
                          </div>
                        ) : (
                          <div className="w-full h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-[11px]">
                            Sin imagen adjunta
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENIDO 3: DIRECTORIO DE PROVEEDORES E HISTORIAL MENSUAL */}
        {pestanaActiva === "proveedores" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registrar Proveedor */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" /> Añadir Proveedor
              </h3>
              <form onSubmit={agregarProveedor} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Nombre de la Empresa / Local *</label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuidora de Frutas Juan..."
                    value={nuevoProveedor.empresa}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, empresa: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Nombre de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. Don Juan / Carlos..."
                    value={nuevoProveedor.contacto}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Número de Contacto / Teléfono</label>
                  <input
                    type="text"
                    placeholder="809-000-0000"
                    value={nuevoProveedor.telefono}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Dirección</label>
                  <textarea
                    placeholder="Ej. Mercado Modelo, Local #12..."
                    value={nuevoProveedor.direccion}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, direccion: e.target.value })}
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

            {/* Listado de Proveedores con Historial y Filtro Mensual */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Directorio e Historial de Gastos</h3>
                
                {/* Filtro por mes para el historial */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <select
                    value={mesFiltroHistorial}
                    onChange={(e) => setMesFiltroHistorial(e.target.value)}
                    className="p-2 border rounded-xl text-xs outline-none bg-slate-50 font-bold"
                  >
                    <option value="todos">📅 Todo el tiempo (Histórico)</option>
                    <option value="2026-10">Octubre 2026</option>
                    <option value="2026-09">Septiembre 2026</option>
                    <option value="2026-08">Agosto 2026</option>
                    <option value="2026-07">Julio 2026</option>
                  </select>
                </div>
              </div>

              {listaProveedores.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-slate-400 text-xs">No hay proveedores registrados todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listaProveedores.map((prov) => {
                    const totalGastadoProv = calcularGastosProveedor(prov.id);
                    return (
                      <div key={prov.id} className="bg-slate-50 p-4 rounded-2xl border space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-amber-500" /> {prov.empresa}
                            </h4>
                            <button onClick={() => eliminarProveedor(prov.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {prov.contacto && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" /> Contacto: <span className="font-semibold">{prov.contacto}</span>
                            </p>
                          )}
                          {prov.telefono && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> Tel: <span className="font-semibold">{prov.telefono}</span>
                            </p>
                          )}
                          {prov.direccion && (
                            <p className="text-[11px] text-slate-500 flex items-start gap-1.5 bg-white p-2 rounded-xl border">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> {prov.direccion}
                            </p>
                          )}
                        </div>

                        {/* Historial de gasto calculado */}
                        <div className="bg-white p-3 rounded-xl border flex justify-between items-center">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Gastado:</span>
                          <span className="text-sm font-black text-emerald-600">
                            RD$ {totalGastadoProv.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
