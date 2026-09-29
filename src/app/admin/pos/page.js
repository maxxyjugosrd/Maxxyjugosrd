"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingBag, CheckCircle2, Loader2 } from "lucide-react";
import { crearPedido } from "@/services/pedidosService";
import { obtenerProductosEnVivo } from "@/services/catalogoService";

export default function PosPage() {
  const [menuJugos, setMenuJugos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState({ nombre: "Cliente Mostrador", telefono: "", direccion: "Local / Mostrador" });
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

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const registrarVenta = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("Agrega al menos un producto al carrito.");
      return;
    }

    setProcesando(true);
    try {
      await crearPedido({
        cliente,
        items: carrito,
        total,
        origen: "POS Manual",
        estado: "completado",
      });

      setMensajeExito(true);
      setCarrito([]);
      setCliente({ nombre: "Cliente Mostrador", telefono: "", direccion: "Local / Mostrador" });

      setTimeout(() => setMensajeExito(false), 3000);
    } catch (error) {
      console.error("Error al registrar venta POS:", error);
      alert("Hubo un error al registrar la venta.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Punto de Venta (POS)</h1>
        <p className="text-slate-500 text-sm">Registra ventas presenciales o pedidos por teléfono manualmente.</p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-sm">¡Venta registrada exitosamente en la contabilidad!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Catálogo de productos rápidos */}
        <div className="lg:col-span-2">
          {cargandoProductos ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span>Cargando productos en tiempo real...</span>
            </div>
          ) : menuJugos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No hay productos registrados en el catálogo aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuJugos.map((jugo) => (
                <button
                  key={jugo.id}
                  onClick={() => agregarAlCarrito(jugo)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 text-left hover:border-amber-500 hover:shadow-md transition group"
                >
                  <h3 className="font-bold text-slate-800 group-hover:text-amber-600">{jugo.nombre}</h3>
                  <p className="text-amber-600 font-extrabold text-lg mt-1">RD$ {jugo.precio}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 mt-3 group-hover:text-slate-700">
                    <Plus className="w-3.5 h-3.5" /> Agregar a la orden
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resumen y cobro */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 h-fit">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" /> Venta Actual
          </h2>

          <div className="space-y-3">
            {carrito.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay productos seleccionados.</p>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{item.nombre}</p>
                    <p className="text-xs text-amber-600 font-bold">RD$ {item.precio * item.cantidad}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => cambiarCantidad(item.id, -1)} className="p-1 hover:bg-slate-200 rounded">
                      <Minus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span className="font-bold text-xs px-1">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, 1)} className="p-1 hover:bg-slate-200 rounded">
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={registrarVenta} className="space-y-3 border-t pt-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Cliente / Referencia</label>
              <input
                type="text"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
              />
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-xl font-extrabold text-slate-800">
              <span>Total:</span>
              <span className="text-amber-600">RD$ {total}</span>
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
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
