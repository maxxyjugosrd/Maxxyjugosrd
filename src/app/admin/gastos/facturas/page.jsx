"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Upload, FileText, Trash2, Calendar, Filter, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Link from "next/link";

export default function AdminFacturasPagadas() {
  const [historialFacturas, setHistorialFacturas] = useState([]);
  const [gastosFijosConfig, setGastosFijosConfig] = useState([]);
  
  // Estados para el formulario de subida
  const [nombreServicio, setNombreServicio] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
  const [imagenFactura, setImagenFactura] = useState("");
  
  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState("todos");
  const [servicioSeleccionado, setServicioSeleccionado] = useState("todos");

  useEffect(() => {
    // Cargar historial de facturas
    const facturasGuardadas = localStorage.getItem("maxxy_facturas_comprobantes");
    if (facturasGuardadas) {
      try {
        setHistorialFacturas(JSON.parse(facturasGuardadas));
      } catch (e) {
        console.error("Error al cargar facturas:", e);
      }
    }

    // Cargar configuración de gastos fijos para sugerir nombres en el select
    const gastosGuardados = localStorage.getItem("maxxy_gastos_fijos");
    if (gastosGuardados) {
      try {
        setGastosFijosConfig(JSON.parse(gastosGuardados));
      } catch (e) {
        console.error("Error al cargar configuración de gastos:", e);
      }
    }
  }, []);

  const guardarFacturasStorage = (nuevasFacturas) => {
    setHistorialFacturas(nuevasFacturas);
    localStorage.setItem("maxxy_facturas_comprobantes", JSON.stringify(nuevasFacturas));
  };

  // Convertir imagen subida a Base64 para almacenamiento local seguro
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen es muy pesada. Por favor selecciona una menor a 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenFactura(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const registrarFactura = (e) => {
    e.preventDefault();
    if (!nombreServicio.trim() || !montoPagado || !fechaPago) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const nuevaFactura = {
      id: "factura-" + Date.now(),
      nombre: nombreServicio.trim(),
      monto: parseFloat(montoPagado),
      fecha: fechaPago, // Formato YYYY-MM-DD para fácil filtrado
      mesAnio: fechaPago.substring(0, 7), // "YYYY-MM"
      imagen: imagenFactura || null
    };

    const actualizado = [nuevaFactura, ...historialFacturas];
    guardarFacturasStorage(actualizado);

    // Limpiar formulario
    setNombreServicio("");
    setMontoPagado("");
    setImagenFactura("");
  };

  const eliminarFactura = (id) => {
    if (confirm("¿Estás seguro de eliminar este comprobante de factura?")) {
      const filtrados = historialFacturas.filter(f => f.id !== id);
      guardarFacturasStorage(filtrados);
    }
  };

  // Filtrar facturas según los selectores de fecha y servicio
  const facturasFiltradas = historialFacturas.filter(f => {
    const coincideMes = mesSeleccionado === "todos" || f.mesAnio === mesSeleccionado;
    const coincideServicio = servicioSeleccionado === "todos" || f.nombre === servicioSeleccionado;
    return coincideMes && coincideServicio;
  });

  // Totalidad mensual de los gastos filtrados actualmente
  const totalGastosFiltrados = facturasFiltradas.reduce((acc, f) => acc + Number(f.monto || 0), 0);

  // Obtener lista única de meses disponibles en el historial para el filtro
  const mesesDisponibles = [...new Set(historialFacturas.map(f => f.mesAnio))].sort().reverse();
  
  // Obtener lista única de nombres de servicios registrados
  const nombresServiciosUnicos = [...new Set(historialFacturas.map(f => f.nombre))];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <Link href="/admin/gastos" className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Gastos Fijos
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" /> Historial y Comprobantes de Facturas Pagadas
          </h1>
          <p className="text-slate-500 text-sm">Sube tus recibos, revisa la totalidad mensual y compara variaciones (luz, agua, alquiler, etc.).</p>
        </div>

        <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm text-right">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Filtrado / Mensual</span>
          <span className="text-xl font-extrabold text-slate-800">RD$ {totalGastosFiltrados.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario para subir factura */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-500" /> Subir Factura Pagada
          </h2>

          <form onSubmit={registrarFactura} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nombre del Servicio *</label>
              <input
                type="text"
                required
                list="lista-servicios"
                placeholder="Ej. Edesur (Luz), Alquiler"
                value={nombreServicio}
                onChange={(e) => setNombreServicio(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <datalist id="lista-servicios">
                {gastosFijosConfig.map(g => (
                  <option key={g.id} value={g.nombre} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Monto Pagado (RD$) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Ej. 4250.00"
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha del Pago *</label>
              <input
                type="date"
                required
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Foto o Comprobante (Opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
              {imagenFactura && (
                <div className="mt-2 relative w-full h-24 border rounded-xl overflow-hidden bg-slate-50">
                  <img src={imagenFactura} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm mt-2 text-sm"
            >
              <Upload className="w-4 h-4" /> Guardar Factura en Historial
            </button>
          </form>
        </div>

        {/* Sección de Filtros e Historial */}
        <div className="lg:col-span-2 space-y-6">
          {/* Panel de Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Filter className="w-4 h-4 text-amber-500" /> Filtrar Registros:
            </div>

            <div className="flex flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Mes</span>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="todos">Todos los meses</option>
                  {mesesDisponibles.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Servicio</span>
                <select
                  value={servicioSeleccionado}
                  onChange={(e) => setServicioSeleccionado(e.target.value)}
                  className="px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="todos">Todos los servicios</option>
                  {nombresServiciosUnicos.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listado de Facturas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center justify-between">
              <span>Historial de Comprobantes ({facturasFiltradas.length})</span>
            </h3>

            {facturasFiltradas.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2 border border-dashed rounded-2xl">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium text-slate-600">No hay facturas que coincidan con los filtros.</p>
                <p className="text-xs">Sube tu primer comprobante usando el formulario lateral.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {facturasFiltradas.map((factura) => (
                  <div key={factura.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {factura.mesAnio}
                          </span>
                          <h4 className="font-bold text-slate-800 text-base mt-1">{factura.nombre}</h4>
                        </div>
                        <button
                          onClick={() => eliminarFactura(factura.id)}
                          className="text-slate-300 hover:text-rose-500 transition p-1"
                          title="Eliminar factura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-extrabold text-slate-900">
                          RD$ {Number(factura.monto).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" /> {factura.fecha}
                        </span>
                      </div>
                    </div>

                    {factura.imagen && (
                      <div className="mt-2 border rounded-xl overflow-hidden bg-slate-50 h-32">
                        <a href={factura.imagen} target="_blank" rel="noopener noreferrer" title="Ver imagen completa">
                          <img src={factura.imagen} alt="Comprobante" className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
