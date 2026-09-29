"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingBag, CheckCircle2, Loader2, User, Phone } from "lucide-react";
import { crearPedido } from "@/services/pedidosService";
import { obtenerProductosEnVivo } from "@/services/catalogoService";

export default function PosPage() {
  const [menuJugos, setMenuJugos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "Local / Mostrador" });
  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);

  // Escuchar productos de Firestore en tiempo real
  useEffect(() => {
    const desuscribir = obtenerProductosEnVivo((datos) => {
      setMenuJugos(datos);
      setCargandoProductos(false);
    });

    return () => desuscribir();
  }, []);

  const agregarAlCarrito = (jugo) => {
    // Identificamos el ítem único basado en su ID
    const existe = carrito.find((item) => item.id === jugo.id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === jugo.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setCarrito([...carrito, { ...jugo, cantidad: 1 }]);
    }
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(
      carrito
        .map((item) => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const total = carrito.reduce((sum, item) => sum + Number(item.precio || 0) * item.cantidad, 0);

  const registrarVenta = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Agrega al menos un producto al carrito.");
      return;
    }

    setProcesando(true);
    try {
      await crearPedido({
        cliente: {
          nombre: cliente.nombre.trim() || "Cliente Mostrador",
          telefono: cliente.telefono.trim() || "Sin teléfono",
        },
        telefono: cliente.telefono.trim(),
        productos: carrito,
        total,
        origen: "POS Manual",
        estado: "completado",
      });

      setMensajeExito(true);
      setCarrito([]);
      setCliente({ nombre: "", telefono: "", direccion: "Local / Mostrador" });

      setTimeout(() => setMensajeExito(false), 4000);
    } catch (error) {
      console.error("Error al registrar venta POS:", error);
      alert("Hubo un error al registrar la venta.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Punto de Venta (POS) 🥤</h1>
        <p className="text-slate-500 text-sm">Registra ventas presenciales o pedidos por teléfono manualmente.</p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">¡Venta registrada exitosamente y reflejada en la contabilidad!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Catálogo de productos con características visibles */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Menú Disponible</h2>
          {cargandoProductos ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span>Cargando productos en tiempo real...</span>
            </div>
          ) : menuJugos.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
              No hay productos registrados en el catálogo aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuJugos.map((jugo) => {
                // Capturamos las características disponibles del producto en Firestore
                const caracteristica = jugo.tamano || jugo.presentacion || jugo.categoria || "Jugo Natural";
                return (
                  <button
                    key={jugo.id}
                    type="button"
                    onClick={() => agregarAlCarrito(jugo)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 text-left hover:border-amber-500 hover:shadow-md transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-800 group-hover:text-amber-600 text-base">
                          {jugo.nombre}
                        </h3>
                        <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-100 shrink-0">
                          {caracteristica}
                        </span>
                      </div>
                      {jugo.descripcion && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{jugo.descripcion}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                      <span className="text-amber-600 font-extrabold text-lg">
                        RD$ {Number(jugo.precio || 0).toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-amber-600 bg-slate-50 group-hover:bg-amber-50 px-2.5 py-1 rounded-xl transition">
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen y cobro de la Venta */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 h-fit shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" /> Venta Actual
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {carrito.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay productos seleccionados.</p>
            ) : (
              carrito.map((item) => {
                const caracteristicaItem = item.tamano || item.presentacion || item.categoria || "";
                return (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b pb-3 gap-2">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800 text-sm">{item.nombre}</p>
                      {caracteristicaItem && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {caracteristicaItem}
                        </span>
                      )}
                      <p className="text-xs text-amber-600 font-bold">
                        RD$ {(Number(item.precio || 0) * item.cantidad).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, -1)}
                          className="p-1 hover:bg-slate-200 rounded-lg transition"
                        >
                          <Minus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <span className="font-bold text-xs px-1.5">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, 1)}
                          className="p-1 hover:bg-slate-200 rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarDelCarrito(item.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={registrarVenta} className="space-y-4 border-t pt-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" /> Nombre del Cliente
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-500" /> Teléfono (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: 809-555-5555"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-xl font-extrabold text-slate-800">
              <span>Total:</span>
              <span className="text-amber-600">RD$ {total.toLocaleString()}</span>
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                </>
              ) : (
                "Completar Venta"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
