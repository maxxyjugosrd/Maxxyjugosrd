"use client";

import { useState, useEffect } from "react";
import { Package, Plus, DollarSign, Layers, ShoppingBag, Trash2, Tag, Box } from "lucide-react";

export default function InventarioPage() {
  const [inventario, setInventario] = useState({
    potes12oz: { cantidad: 0, inversionTotal: 0 },
    potes2oz: { cantidad: 0, inversionTotal: 0 },
    potes8oz: { cantidad: 0, inversionTotal: 0 },
    galones: { cantidad: 0, inversionTotal: 0 },
    otros: {}, // Aquí guardaremos dinámicamente los productos personalizados ej: { "Cajas de Cartón Grandes": { cantidad: 20, inversionTotal: 3000 } }
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false); // Para crear un "Otro" producto nuevo
  const [tipoEnvaseSeleccionado, setTipoEnvaseSeleccionado] = useState("potes12oz");
  const [cantidadAgregar, setCantidadAgregar] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");

  // Estados para crear un nuevo producto personalizado
  const [nombreNuevoProducto, setNombreNuevoProducto] = useState("");
  const [cantidadNuevoProducto, setCantidadNuevoProducto] = useState("");
  const [costoNuevoProducto, setCostoNuevoProducto] = useState("");

  useEffect(() => {
    const inventarioGuardado = localStorage.getItem("maxi_inventario");
    let stockActual = {
      potes12oz: { cantidad: 0, inversionTotal: 0 },
      potes2oz: { cantidad: 0, inversionTotal: 0 },
      potes8oz: { cantidad: 0, inversionTotal: 0 },
      galones: { cantidad: 0, inversionTotal: 0 },
      otros: {},
    };

    if (inventarioGuardado) {
      try {
        const parsed = JSON.parse(inventarioGuardado);
        stockActual = {
          potes12oz: parsed.potes12oz || { cantidad: 0, inversionTotal: 0 },
          potes2oz: parsed.potes2oz || { cantidad: 0, inversionTotal: 0 },
          potes8oz: parsed.potes8oz || { cantidad: 0, inversionTotal: 0 },
          galones: parsed.galones || { cantidad: 0, inversionTotal: 0 },
          otros: parsed.otros || {},
        };
      } catch (e) {
        console.error("Error leyendo inventario anterior", e);
      }
    }

    // Sincronizar y descontar con pedidos guardados
    const pedidosGuardados = localStorage.getItem("maxi_pedidos");
    if (pedidosGuardados) {
      try {
        const pedidos = JSON.parse(pedidosGuardados);
        const pedidosProcesadosKey = "maxi_pedidos_procesados_inventario";
        const procesadosGuardados = localStorage.getItem(pedidosProcesadosKey);
        const idsProcesados = procesadosGuardados ? JSON.parse(procesadosGuardados) : [];

        let huboCambios = false;
        pedidos.forEach((pedido) => {
          if (!idsProcesados.includes(pedido.id)) {
            // 1. Revisar items principales del pedido (potes, galones)
            if (pedido.items && Array.isArray(pedido.items)) {
              pedido.items.forEach((item) => {
                const nombreItem = (item.nombre || "").toLowerCase();
                const cantidadVendida = Number(item.cantidad) || 1;

                if (nombreItem.includes("galon") || nombreItem.includes("galón")) {
                  stockActual.galones.cantidad = Math.max(0, stockActual.galones.cantidad - cantidadVendida);
                } else if (nombreItem.includes("shot") || nombreItem.includes("2 oz") || nombreItem.includes("4 oz")) {
                  stockActual.potes2oz.cantidad = Math.max(0, stockActual.potes2oz.cantidad - cantidadVendida);
                } else if (nombreItem.includes("verde") || nombreItem.includes("8 oz")) {
                  stockActual.potes8oz.cantidad = Math.max(0, stockActual.potes8oz.cantidad - cantidadVendida);
                } else {
                  stockActual.potes12oz.cantidad = Math.max(0, stockActual.potes12oz.cantidad - cantidadVendida);
                }
              });
            }

            // 2. Revisar si el pedido seleccionó insumos o "otros" productos adicionales
            if (pedido.otrosItems && Array.isArray(pedido.otrosItems)) {
              pedido.otrosItems.forEach((otro) => {
                const nombreOtro = otro.nombre;
                const cantUsada = Number(otro.cantidad) || 1;
                if (stockActual.otros[nombreOtro]) {
                  stockActual.otros[nombreOtro].cantidad = Math.max(0, stockActual.otros[nombreOtro].cantidad - cantUsada);
                }
              });
            }

            idsProcesados.push(pedido.id);
            huboCambios = true;
          }
        });

        if (huboCambios) {
          localStorage.setItem(pedidosProcesadosKey, JSON.stringify(idsProcesados));
        }
      } catch (e) {
        console.error("Error procesando inventario desde pedidos", e);
      }
    }

    setInventario(stockActual);
    localStorage.setItem("maxi_inventario", JSON.stringify(stockActual));
  }, []);

  const guardarInventarioEnStorage = (nuevoStock) => {
    setInventario(nuevoStock);
    localStorage.setItem("maxi_inventario", JSON.stringify(nuevoStock));
  };

  const manejarAgregarStock = (e) => {
    e.preventDefault();
    const cant = Number(cantidadAgregar) || 0;
    const costoU = Number(costoUnitario) || 0;

    if (cant <= 0) return;
    const montoTotalCompra = cant * costoU;

    const stockActualizado = { ...inventario };

    if (tipoEnvaseSeleccionado.startsWith("otro_")) {
      const nombreReal = tipoEnvaseSeleccionado.replace("otro_", "");
      if (stockActualizado.otros[nombreReal]) {
        stockActualizado.otros[nombreReal].cantidad += cant;
        stockActualizado.otros[nombreReal].inversionTotal += montoTotalCompra;
      }
    } else {
      if (!stockActualizado[tipoEnvaseSeleccionado]) {
        stockActualizado[tipoEnvaseSeleccionado] = { cantidad: 0, inversionTotal: 0 };
      }
      stockActualizado[tipoEnvaseSeleccionado].cantidad += cant;
      stockActualizado[tipoEnvaseSeleccionado].inversionTotal += montoTotalCompra;
    }

    guardarInventarioEnStorage(stockActualizado);
    setCantidadAgregar("");
    setCostoUnitario("");
    setMostrarModal(false);
  };

  const manejarCrearNuevoProducto = (e) => {
    e.preventDefault();
    const nombre = nombreNuevoProducto.trim();
    const cant = Number(cantidadNuevoProducto) || 0;
    const costoU = Number(costoNuevoProducto) || 0;

    if (!nombre || cant <= 0) return;

    const stockActualizado = { ...inventario };
    if (!stockActualizado.otros) {
      stockActualizado.otros = {};
    }

    // Si ya existe, acumulamos, si no, lo creamos
    const existente = stockActualizado.otros[nombre] || { cantidad: 0, inversionTotal: 0 };
    stockActualizado.otros[nombre] = {
      cantidad: existente.cantidad + cant,
      inversionTotal: existente.inversionTotal + (cant * costoU)
    };

    guardarInventarioEnStorage(stockActualizado);
    setNombreNuevoProducto("");
    setCantidadNuevoProducto("");
    setCostoNuevoProducto("");
    setMostrarModalNuevo(false);
  };

  const eliminarOtroProducto = (nombre) => {
    if (confirm(`¿Estás seguro de eliminar "${nombre}" del inventario?`)) {
      const stockActualizado = { ...inventario };
      delete stockActualizado.otros[nombre];
      guardarInventarioEnStorage(stockActualizado);
    }
  };

  const reiniciarInventario = () => {
    if (confirm("¿Estás seguro de reiniciar todo el inventario a cero?")) {
      const stockVacio = {
        potes12oz: { cantidad: 0, inversionTotal: 0 },
        potes2oz: { cantidad: 0, inversionTotal: 0 },
        potes8oz: { cantidad: 0, inversionTotal: 0 },
        galones: { cantidad: 0, inversionTotal: 0 },
        otros: {},
      };
      guardarInventarioEnStorage(stockVacio);
      localStorage.removeItem("maxi_pedidos_procesados_inventario");
    }
  };

  // Cálculos seguros
  const p12 = inventario.potes12oz || { cantidad: 0, inversionTotal: 0 };
  const p2 = inventario.potes2oz || { cantidad: 0, inversionTotal: 0 };
  const p8 = inventario.potes8oz || { cantidad: 0, inversionTotal: 0 };
  const gal = inventario.galones || { cantidad: 0, inversionTotal: 0 };
  const otrosObj = inventario.otros || {};

  let totalCantidadOtros = 0;
  let totalInversionOtros = 0;
  Object.values(otrosObj).forEach((item) => {
    totalCantidadOtros += item.cantidad || 0;
    totalInversionOtros += item.inversionTotal || 0;
  });

  const totalCantidadEnvases = p12.cantidad + p2.cantidad + p8.cantidad + gal.cantidad + totalCantidadOtros;
  const totalDineroInvertido = p12.inversionTotal + p2.inversionTotal + p8.inversionTotal + gal.inversionTotal + totalInversionOtros;

  const costoPromedio12oz = p12.cantidad > 0 ? (p12.inversionTotal / p12.cantidad) : 0;
  const costoPromedio2oz = p2.cantidad > 0 ? (p2.inversionTotal / p2.cantidad) : 0;
  const costoPromedio8oz = p8.cantidad > 0 ? (p8.inversionTotal / p8.cantidad) : 0;
  const costoPromedioGalon = gal.cantidad > 0 ? (gal.inversionTotal / gal.cantidad) : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Inventario & Envases</h1>
          <p className="text-slate-500 text-sm">Monitorea tus potes, galones, cajas y otros insumos personalizados de tu negocio.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={reiniciarInventario}
            className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm border border-slate-200"
          >
            <Trash2 className="w-4 h-4" /> Reiniciar
          </button>

          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
            <Tag className="w-4 h-4" /> Registrar Nuevo Insumo / Producto
          </button>

          <button
            onClick={() => setMostrarModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
            <Plus className="w-5 h-5" /> Reabastecer Stock
          </button>
        </div>
      </div>

      {/* Tarjetas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capital Total en Inventario</p>
            <h2 className="text-3xl font-black text-slate-900">RD$ {totalDineroInvertido.toLocaleString()}</h2>
            <p className="text-xs text-emerald-600 font-semibold">Suma de envases e insumos activos</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Unidades en Stock</p>
            <h2 className="text-3xl font-black text-slate-900">{totalCantidadEnvases.toLocaleString()} unidades</h2>
            <p className="text-xs text-slate-500 font-semibold">Potes, galones y cajas disponibles</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-700">
            <Package className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Categorías Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Potes 12 oz */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Naturales</span>
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes de 12 oz</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock:</span>
                <span className="font-bold text-slate-900">{p12.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Costo U:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedio12oz.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-amber-600">RD$ {p12.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Jugos naturales estándar.</p>
        </div>

        {/* Potes 2 oz (Shots) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">Shots</span>
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes 2-4 oz</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock:</span>
                <span className="font-bold text-slate-900">{p2.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Costo U:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedio2oz.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-purple-600">RD$ {p2.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Shots energéticos.</p>
        </div>

        {/* Potes 8 oz */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Verdes</span>
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes de 8 oz</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock:</span>
                <span className="font-bold text-slate-900">{p8.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Costo U:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedio8oz.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-emerald-600">RD$ {p8.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Jugos verdes y especiales.</p>
        </div>

        {/* Galones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Grandes</span>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Galones</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock:</span>
                <span className="font-bold text-slate-900">{gal.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Costo U:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedioGalon.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-blue-600">RD$ {gal.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Presentación en galón.</p>
        </div>
      </div>

      {/* Sección de Otros Productos / Insumos Personalizados (Cajas, etc.) */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Otros Insumos y Productos Personalizados</h2>
            <p className="text-xs text-slate-500">Cajas de exportación, etiquetas o cualquier artículo que agregues manualmente.</p>
          </div>
        </div>

        {Object.keys(otrosObj).length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
            <Box className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No hay otros productos registrados aún.</p>
            <p className="text-xs text-slate-400">Haz clic en &quot;Registrar Nuevo Insumo / Producto&quot; arriba para crear el primero (ej: Cajas para exportar).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(otrosObj).map(([nombre, datos]) => {
              const costoU = datos.cantidad > 0 ? (datos.inversionTotal / datos.cantidad) : 0;
              return (
                <div key={nombre} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full truncate max-w-[180px]">{nombre}</span>
                      <button 
                        onClick={() => eliminarOtroProducto(nombre)} 
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 truncate">{nombre}</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Stock:</span>
                        <span className="font-bold text-slate-900">{datos.cantidad} un.</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Costo U:</span>
                        <span className="font-semibold text-slate-700">RD$ {costoU.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Total:</span>
                        <span className="font-bold text-indigo-600">RD$ {datos.inversionTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Reabastecer Stock */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={manejarAgregarStock} className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Reabastecer Inventario</h2>
            <p className="text-xs text-slate-500">Selecciona el artículo, la cantidad comprada y el costo unitario.</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Artículo / Envase</label>
                <select 
                  value={tipoEnvaseSeleccionado} 
                  onChange={(e) => setTipoEnvaseSeleccionado(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm bg-white"
                >
                  <option value="potes12oz">Potes de 12 oz (Naturales)</option>
                  <option value="potes2oz">Potes de 2-4 oz (Shots)</option>
                  <option value="potes8oz">Potes de 8 oz (Verdes)</option>
                  <option value="galones">Galones</option>
                  {Object.keys(otrosObj).length > 0 && (
                    <optgroup label="Otros Insumos Personalizados">
                      {Object.keys(otrosObj).map((nombre) => (
                        <option key={nombre} value={`otro_${nombre}`}>{nombre}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Cantidad Comprada (Unidades)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 50" 
                  value={cantidadAgregar} 
                  onChange={(e) => setCantidadAgregar(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Costo por Unidad (RD$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ej: 15.50" 
                  value={costoUnitario} 
                  onChange={(e) => setCostoUnitario(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>

              {cantidadAgregar && costoUnitario && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs flex justify-between items-center text-amber-900 font-bold">
                  <span>Total inversión:</span>
                  <span>RD$ {(Number(cantidadAgregar) * Number(costoUnitario)).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm">
                Actualizar Stock
              </button>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para Crear Nuevo Insumo / Producto Personalizado */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={manejarCrearNuevoProducto} className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Registrar Nuevo Insumo</h2>
            <p className="text-xs text-slate-500">Crea un nombre personalizado (ej. &quot;Cajas de Cartón para Exportación&quot;).</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Nombre / Descripción del Producto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cajas de cartón medianas" 
                  value={nombreNuevoProducto} 
                  onChange={(e) => setNombreNuevoProducto(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Cantidad Inicial (Unidades)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 30" 
                  value={cantidadNuevoProducto} 
                  onChange={(e) => setCantidadNuevoProducto(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Costo Total o por Unidad (RD$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ej: 45.00" 
                  value={costoNuevoProducto} 
                  onChange={(e) => setCostoNuevoProducto(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm">
                Crear e Inventariar
              </button>
              <button type="button" onClick={() => setMostrarModalNuevo(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
