"use client";

import { useState, useEffect } from "react";
import { Package, Plus, DollarSign, Layers, ShoppingBag, Trash2, AlertCircle } from "lucide-react";

export default function InventarioPage() {
  const [inventario, setInventario] = useState({
    potes12oz: { cantidad: 0, inversionTotal: 0 },
    potes8oz: { cantidad: 0, inversionTotal: 0 },
    galones: { cantidad: 0, inversionTotal: 0 },
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoEnvaseSeleccionado, setTipoEnvaseSeleccionado] = useState("potes12oz");
  const [cantidadAgregar, setCantidadAgregar] = useState("");
  const [montoInvertido, setMontoInvertido] = useState("");

  // Cargar inventario y sincronizar/descontar con pedidos guardados
  useEffect(() => {
    const inventarioGuardado = localStorage.getItem("maxi_inventario");
    let stockActual = inventarioGuardado ? JSON.parse(inventarioGuardado) : {
      potes12oz: { cantidad: 0, inversionTotal: 0 },
      potes8oz: { cantidad: 0, inversionTotal: 0 },
      galones: { cantidad: 0, inversionTotal: 0 },
    };

    // Revisar pedidos para descontar automáticamente envases vendidos
    const pedidosGuardados = localStorage.getItem("maxi_pedidos");
    if (pedidosGuardados) {
      try {
        const pedidos = JSON.parse(pedidosGuardados);
        // Creamos una clave en localStorage para llevar el registro de qué pedidos ya se descontaron
        const pedidosProcesadosKey = "maxi_pedidos_procesados_inventario";
        const procesadosGuardados = localStorage.getItem(pedidosProcesadosKey);
        const idsProcesados = procesadosGuardados ? JSON.parse(procesadosGuardados) : [];

        let huboCambios = false;
        pedidos.forEach((pedido) => {
          if (!idsProcesados.includes(pedido.id)) {
            // Analizar los items del pedido para descontar envases
            if (pedido.items && Array.isArray(pedido.items)) {
              pedido.items.forEach((item) => {
                const nombreItem = (item.nombre || "").toLowerCase();
                const cantidadVendida = Number(item.cantidad) || 1;

                if (nombreItem.includes("galon") || nombreItem.includes("galón")) {
                  stockActual.galones.cantidad = Math.max(0, stockActual.galones.cantidad - cantidadVendida);
                  // Reducir la inversión proporcionalmente al stock consumido si hay valor
                  if (stockActual.galones.cantidad > 0 && stockActual.galones.inversionTotal > 0) {
                    // Ajuste proporcional aproximado o se mantiene el costo unitario
                  }
                } else if (nombreItem.includes("verde") || nombreItem.includes("8 oz") || nombreItem.includes("shot")) {
                  stockActual.potes8oz.cantidad = Math.max(0, stockActual.potes8oz.cantidad - cantidadVendida);
                } else {
                  // Por defecto los jugos normales usan potes de 12 oz
                  stockActual.potes12oz.cantidad = Math.max(0, stockActual.potes12oz.cantidad - cantidadVendida);
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
    const monto = Number(montoInvertido) || 0;

    if (cant <= 0) return;

    const stockActualizado = { ...inventario };
    stockActualizado[tipoEnvaseSeleccionado].cantidad += cant;
    stockActualizado[tipoEnvaseSeleccionado].inversionTotal += monto;

    guardarInventarioEnStorage(stockActualizado);
    setCantidadAgregar("");
    setMontoInvertido("");
    setMostrarModal(false);
  };

  const reiniciarInventario = () => {
    if (confirm("¿Estás seguro de reiniciar todo el inventario a cero?")) {
      const stockVacio = {
        potes12oz: { cantidad: 0, inversionTotal: 0 },
        potes8oz: { cantidad: 0, inversionTotal: 0 },
        galones: { cantidad: 0, inversionTotal: 0 },
      };
      guardarInventarioEnStorage(stockVacio);
      localStorage.removeItem("maxi_pedidos_procesados_inventario");
    }
  };

  // Cálculos totales globales
  const totalCantidadEnvases = inventario.potes12oz.cantidad + inventario.potes8oz.cantidad + inventario.galones.cantidad;
  const totalDineroInvertido = inventario.potes12oz.inversionTotal + inventario.potes8oz.inversionTotal + inventario.galones.inversionTotal;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Inventario & Envases</h1>
          <p className="text-slate-500 text-sm">Monitorea tus potes, galones y el capital invertido en stock que se descuenta con cada venta.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={reiniciarInventario}
            className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm border border-slate-200"
          >
            <Trash2 className="w-4 h-4" /> Reiniciar Inventario
          </button>

          <button
            onClick={() => setMostrarModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
            <Plus className="w-5 h-5" /> Registrar Compra / Reabastecer
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capital Total en Inventario (Parado)</p>
            <h2 className="text-3xl font-black text-slate-900">RD$ {totalDineroInvertido.toLocaleString()}</h2>
            <p className="text-xs text-emerald-600 font-semibold">Suma de todas las compras de envases activas</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Envases Disponibles</p>
            <h2 className="text-3xl font-black text-slate-900">{totalCantidadEnvases.toLocaleString()} unidades</h2>
            <p className="text-xs text-slate-500 font-semibold">Potes y galones listos para usar</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-700">
            <Package className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Desglose por Categoría de Envase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Potes 12 oz */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Naturales Regulares</span>
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes de 12 oz</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock Actual:</span>
                <span className="font-bold text-slate-900">{inventario.potes12oz.cantidad} unidades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Inversión Invertida:</span>
                <span className="font-bold text-amber-600">RD$ {inventario.potes12oz.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Se descuenta automáticamente con pedidos de jugos naturales estándar.</p>
        </div>

        {/* Potes 8 oz */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Verdes & Shots</span>
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Potes de 8 oz</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock Actual:</span>
                <span className="font-bold text-slate-900">{inventario.potes8oz.cantidad} unidades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Inversión Invertida:</span>
                <span className="font-bold text-emerald-600">RD$ {inventario.potes8oz.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Se descuenta automáticamente con pedidos de jugos verdes y shots.</p>
        </div>

        {/* Galones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Presentación Grande</span>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Galones</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock Actual:</span>
                <span className="font-bold text-slate-900">{inventario.galones.cantidad} unidades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Inversión Invertida:</span>
                <span className="font-bold text-blue-600">RD$ {inventario.galones.inversionTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Se descuenta automáticamente con pedidos en presentación de galón.</p>
        </div>
      </div>

      {/* Modal para Agregar Inventario / Compras */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={manejarAgregarStock} className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Registrar Compra de Envases</h2>
            <p className="text-xs text-slate-500">Ingresa la cantidad comprada y el monto total pagado para sumarlo al stock y capital invertido.</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Tipo de Envase</label>
                <select 
                  value={tipoEnvaseSeleccionado} 
                  onChange={(e) => setTipoEnvaseSeleccionado(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm bg-white"
                >
                  <option value="potes12oz">Potes de 12 oz (Naturales)</option>
                  <option value="potes8oz">Potes de 8 oz (Verdes / Shots)</option>
                  <option value="galones">Galones</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold">Cantidad de Unidades Compradas</label>
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
                <label className="text-xs text-slate-500 font-semibold">Monto Total Invertido (RD$)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 1500" 
                  value={montoInvertido} 
                  onChange={(e) => setMontoInvertido(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-sm" 
                  required 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm">
                Guardar en Inventario
              </button>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
