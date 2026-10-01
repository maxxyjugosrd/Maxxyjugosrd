"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Minus, DollarSign, Layers, ShoppingBag, Trash2, Tag, Box, Edit3 } from "lucide-react";

export default function InventarioPage() {
  const [inventario, setInventario] = useState({
    potes12oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
    potes2oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
    potes8oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
    galones: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
    otros: {}, 
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalDescontar, setMostrarModalDescontar] = useState(false); // Modal para descontar
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false); 
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false); 

  const [tipoEnvaseSeleccionado, setTipoEnvaseSeleccionado] = useState("potes12oz");
  const [cantidadAgregar, setCantidadAgregar] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");

  // Estados para modal de descontar
  const [cantidadDescontar, setCantidadDescontar] = useState("");

  // Estados para crear un nuevo producto personalizado
  const [nombreNuevoProducto, setNombreNuevoProducto] = useState("");
  const [cantidadNuevoProducto, setCantidadNuevoProducto] = useState("");
  const [costoNuevoProducto, setCostoNuevoProducto] = useState("");

  // Estados para editar un producto existente
  const [itemEditandoKey, setItemEditandoKey] = useState(""); 
  const [cantidadEditada, setCantidadEditada] = useState("");
  const [inversionEditada, setInversionEditada] = useState("");

  useEffect(() => {
    const inventarioGuardado = localStorage.getItem("maxi_inventario");
    let stockActual = {
      potes12oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
      potes2oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
      potes8oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
      galones: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
      otros: {},
    };

    if (inventarioGuardado) {
      try {
        const parsed = JSON.parse(inventarioGuardado);
        stockActual = {
          potes12oz: { stockAnterior: 0, ultimoAgregado: 0, ...parsed.potes12oz },
          potes2oz: { stockAnterior: 0, ultimoAgregado: 0, ...parsed.potes2oz },
          potes8oz: { stockAnterior: 0, ultimoAgregado: 0, ...parsed.potes8oz },
          galones: { stockAnterior: 0, ultimoAgregado: 0, ...parsed.galones },
          otros: parsed.otros || {},
        };
      } catch (e) {
        console.error("Error leyendo inventario anterior", e);
      }
    }

    // Sincronizar y descontar con pedidos guardados automáticamente
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
            if (pedido.items && Array.isArray(pedido.items)) {
              pedido.items.forEach((item) => {
                const nombreItem = (item.nombre || "").toLowerCase();
                const cantidadVendida = Number(item.cantidad) || 1;

                let categoriaKey = "potes12oz";
                if (nombreItem.includes("galon") || nombreItem.includes("galón")) {
                  categoriaKey = "galones";
                } else if (nombreItem.includes("shot") || nombreItem.includes("2 oz") || nombreItem.includes("4 oz")) {
                  categoriaKey = "potes2oz";
                } else if (nombreItem.includes("verde") || nombreItem.includes("8 oz")) {
                  categoriaKey = "potes8oz";
                }

                const actualObj = stockActual[categoriaKey];
                const stockAnteriorVal = actualObj.cantidad;
                const nuevoStock = Math.max(0, actualObj.cantidad - cantidadVendida);
                stockActual[categoriaKey] = {
                  ...actualObj,
                  stockAnterior: stockAnteriorVal,
                  cantidad: nuevoStock,
                };
              });
            }

            if (pedido.otrosItems && Array.isArray(pedido.otrosItems)) {
              pedido.otrosItems.forEach((otro) => {
                const nombreOtro = otro.nombre;
                const cantUsada = Number(otro.cantidad) || 1;
                if (stockActual.otros[nombreOtro]) {
                  const ant = stockActual.otros[nombreOtro].cantidad;
                  stockActual.otros[nombreOtro].stockAnterior = ant;
                  stockActual.otros[nombreOtro].cantidad = Math.max(0, ant - cantUsada);
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

  // Función para Reabastecer / Agregar Stock
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
        const stockActualVal = stockActualizado.otros[nombreReal].cantidad;
        stockActualizado.otros[nombreReal].stockAnterior = stockActualVal;
        stockActualizado.otros[nombreReal].ultimoAgregado = cant;
        stockActualizado.otros[nombreReal].cantidad = stockActualVal + cant;
        stockActualizado.otros[nombreReal].inversionTotal += montoTotalCompra;
      }
    } else {
      const itemActual = stockActualizado[tipoEnvaseSeleccionado] || { cantidad: 0, inversionTotal: 0 };
      const stockActualVal = itemActual.cantidad;
      
      stockActualizado[tipoEnvaseSeleccionado] = {
        ...itemActual,
        stockAnterior: stockActualVal,
        ultimoAgregado: cant,
        cantidad: stockActualVal + cant,
        inversionTotal: itemActual.inversionTotal + montoTotalCompra,
      };
    }

    guardarInventarioEnStorage(stockActualizado);
    setCantidadAgregar("");
    setCostoUnitario("");
    setMostrarModal(false);
  };

  // Función para Descontar Stock Manualmente
  const manejarDescontarStock = (e) => {
    e.preventDefault();
    const cant = Number(cantidadDescontar) || 0;
    if (cant <= 0) return;

    const stockActualizado = { ...inventario };

    if (tipoEnvaseSeleccionado.startsWith("otro_")) {
      const nombreReal = tipoEnvaseSeleccionado.replace("otro_", "");
      if (stockActualizado.otros[nombreReal]) {
        const stockActualVal = stockActualizado.otros[nombreReal].cantidad;
        stockActualizado.otros[nombreReal].stockAnterior = stockActualVal;
        stockActualizado.otros[nombreReal].cantidad = Math.max(0, stockActualVal - cant);
      }
    } else {
      const itemActual = stockActualizado[tipoEnvaseSeleccionado] || { cantidad: 0, inversionTotal: 0 };
      const stockActualVal = itemActual.cantidad;

      stockActualizado[tipoEnvaseSeleccionado] = {
        ...itemActual,
        stockAnterior: stockActualVal,
        cantidad: Math.max(0, stockActualVal - cant),
      };
    }

    guardarInventarioEnStorage(stockActualizado);
    setCantidadDescontar("");
    setMostrarModalDescontar(false);
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

    const existente = stockActualizado.otros[nombre] || { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 };
    stockActualizado.otros[nombre] = {
      cantidad: existente.cantidad + cant,
      inversionTotal: existente.inversionTotal + (cant * costoU),
      stockAnterior: existente.cantidad,
      ultimoAgregado: cant,
    };

    guardarInventarioEnStorage(stockActualizado);
    setNombreNuevoProducto("");
    setCantidadNuevoProducto("");
    setCostoNuevoProducto("");
    setMostrarModalNuevo(false);
  };

  const abrirModalEditar = (key, datos) => {
    setItemEditandoKey(key);
    setCantidadEditada(datos.cantidad.toString());
    setInversionEditada(datos.inversionTotal.toString());
    setMostrarModalEditar(true);
  };

  const manejarGuardarEdicion = (e) => {
    e.preventDefault();
    const nuevaCant = Number(cantidadEditada) || 0;
    const nuevaInv = Number(inversionEditada) || 0;
    const stockActualizado = { ...inventario };

    if (["potes12oz", "potes2oz", "potes8oz", "galones"].includes(itemEditandoKey)) {
      const ant = stockActualizado[itemEditandoKey].cantidad;
      stockActualizado[itemEditandoKey] = {
        ...stockActualizado[itemEditandoKey],
        stockAnterior: ant,
        cantidad: nuevaCant,
        inversionTotal: nuevaInv,
      };
    } else {
      if (stockActualizado.otros[itemEditandoKey]) {
        const ant = stockActualizado.otros[itemEditandoKey].cantidad;
        stockActualizado.otros[itemEditandoKey] = {
          ...stockActualizado.otros[itemEditandoKey],
          stockAnterior: ant,
          cantidad: nuevaCant,
          inversionTotal: nuevaInv,
        };
      }
    }

    guardarInventarioEnStorage(stockActualizado);
    setMostrarModalEditar(false);
    setItemEditandoKey("");
    setCantidadEditada("");
    setInversionEditada("");
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
        potes12oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
        potes2oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
        potes8oz: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
        galones: { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 },
        otros: {},
      };
      guardarInventarioEnStorage(stockVacio);
      localStorage.removeItem("maxi_pedidos_procesados_inventario");
    }
  };

  // Valores generales
  const p12 = inventario.potes12oz || { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 };
  const p2 = inventario.potes2oz || { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 };
  const p8 = inventario.potes8oz || { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 };
  const gal = inventario.galones || { cantidad: 0, inversionTotal: 0, stockAnterior: 0, ultimoAgregado: 0 };
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
          <p className="text-slate-500 text-sm">Monitorea tus potes, galones y existencias con trazabilidad de compras y ventas.</p>
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
            <Tag className="w-4 h-4" /> Registrar Nuevo Insumo
          </button>

          <button
            onClick={() => setMostrarModalDescontar(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
            <Minus className="w-5 h-5" /> Descontar Stock
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
              <div className="flex items-center gap-2">
                <button onClick={() => abrirModalEditar("potes12oz", p12)} className="text-slate-400 hover:text-indigo-600 transition p-1" title="Editar stock">
                  <Edit3 className="w-4 h-4" />
                </button>
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes de 12 oz</h3>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Quedan (Stock):</span>
                <span className="text-amber-600">{p12.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Habían (Compra anterior):</span>
                <span className="font-semibold text-slate-700">{p12.stockAnterior || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Último agregado:</span>
                <span className="font-semibold text-emerald-600">+{p12.ultimoAgregado || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                <span>Costo U / Total:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedio12oz.toFixed(2)} (RD$ {p12.inversionTotal.toLocaleString()})</span>
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
              <div className="flex items-center gap-2">
                <button onClick={() => abrirModalEditar("potes2oz", p2)} className="text-slate-400 hover:text-indigo-600 transition p-1" title="Editar stock">
                  <Edit3 className="w-4 h-4" />
                </button>
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes 2-4 oz</h3>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Quedan (Stock):</span>
                <span className="text-purple-600">{p2.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Habían (Compra anterior):</span>
                <span className="font-semibold text-slate-700">{p2.stockAnterior || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Último agregado:</span>
                <span className="font-semibold text-emerald-600">+{p2.ultimoAgregado || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                <span>Costo U / Total:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedio2oz.toFixed(2)} (RD$ {p2.inversionTotal.toLocaleString()})</span>
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
              <div className="flex items-center gap-2">
                <button onClick={() => abrirModalEditar("potes8oz", p8)} className="text-slate-400 hover:text-indigo-600 transition p-1" title="Editar stock">
                  <Edit3 className="w-4 h-4" />
                </button>
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes de 8 oz</h3>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Quedan (Stock):</span>
                <span className="text-emerald-600">{p8.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Habían (Compra anterior):</span>
                <span className="font-semibold text-slate-700">{p8.stockAnterior || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Último agregado:</span>
                <span className="font-semibold text-emerald-600">+{p8.ultimoAgregado || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                <span>Costo U / Total:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedio8oz.toFixed(2)} (RD$ {p8.inversionTotal.toLocaleString()})</span>
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
              <div className="flex items-center gap-2">
                <button onClick={() => abrirModalEditar("galones", gal)} className="text-slate-400 hover:text-indigo-600 transition p-1" title="Editar stock">
                  <Edit3 className="w-4 h-4" />
                </button>
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Galones</h3>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Quedan (Stock):</span>
                <span className="text-blue-600">{gal.cantidad} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Habían (Compra anterior):</span>
                <span className="font-semibold text-slate-700">{gal.stockAnterior || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Último agregado:</span>
                <span className="font-semibold text-emerald-600">+{gal.ultimoAgregado || 0} un.</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                <span>Costo U / Total:</span>
                <span className="font-semibold text-slate-700">RD$ {costoPromedioGalon.toFixed(2)} (RD$ {gal.inversionTotal.toLocaleString()})</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Presentación en galón.</p>
        </div>
      </div>

      {/* Sección de Otros Productos / Insumos Personalizados */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Otros Insumos y Productos Personalizados</h2>
            <p className="text-xs text-slate-500">Artículos adicionales agregados manualmente.</p>
          </div>
        </div>

        {Object.keys(otrosObj).length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
            <Box className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No hay otros productos registrados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(otrosObj).map(([nombre, datos]) => {
              const costoU = datos.cantidad > 0 ? (datos.inversionTotal / datos.cantidad) : 0;
              return (
                <div key={nombre} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full truncate max-w-[150px]">{nombre}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirModalEditar(nombre, datos)} className="text-slate-400 hover:text-indigo-600 transition p-1" title="Editar">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarOtroProducto(nombre)} className="text-slate-400 hover:text-rose-600 transition p-1" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 truncate">{nombre}</h3>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-900 text-sm">
                        <span>Quedan (Stock):</span>
                        <span className="text-indigo-600">{datos.cantidad} un.</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Habían (Compra anterior):</span>
                        <span className="font-semibold text-slate-700">{datos.stockAnterior || 0} un.</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Último agregado:</span>
                        <span className="font-semibold text-emerald-600">+{datos.ultimoAgregado || 0} un.</span>
                      </div>
                      <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                        <span>Costo U / Total:</span>
                        <span className="font-semibold text-slate-700">RD$ {costoU.toFixed(2)} (RD$ {datos.inversionTotal.toLocaleString()})</span>
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
            <p className="text-xs text-slate-500">Selecciona el artículo y la cantidad comprada.</p>
            
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
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm">
                Guardar Abastecimiento
              </button>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para Descontar Stock */}
      {mostrarModalDescontar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={manejarDescontarStock} className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Descontar Stock Manualmente</h2>
            <p className="text-xs text-slate-500">Registra ventas directas o salidas por mermas.</p>
            
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
                <label className="text-xs text-slate-500 font-semibold">Cantidad a Descontar (Unidades)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 12" 
                  value={cantidadDescontar} 
                  onChange={(e) => setCantidadDescontar(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm">
                Confirmar Descuento
              </button>
              <button type="button" onClick={() => setMostrarModalDescontar(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">
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
            <p className="text-xs text-slate-500">Crea un nombre personalizado.</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Nombre del Producto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cajas medianas" 
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
                <label className="text-xs text-slate-500 font-semibold">Inversión Total (RD$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ej: 450" 
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

      {/* Modal para Editar Stock o Inversión Directamente */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={manejarGuardarEdicion} className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Corregir / Editar Artículo</h2>
            <p className="text-xs text-slate-500">
              Modifica directamente el stock de <span className="font-bold text-slate-800">{itemEditandoKey}</span>.
            </p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Cantidad Actual Real (Unidades)</label>
                <input 
                  type="number" 
                  value={cantidadEditada} 
                  onChange={(e) => setCantidadEditada(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm font-bold text-slate-900" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Inversión Total Acumulada (RD$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={inversionEditada} 
                  onChange={(e) => setInversionEditada(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm font-bold text-slate-900" 
                  required 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm">
                Guardar Cambios
              </button>
              <button type="button" onClick={() => setMostrarModalEditar(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
