"use client";

import { useState } from "react";
import { Users, Plus, FileText, DollarSign, Bike, UserCheck, Download, Trash2, Edit } from "lucide-react";

export default function PersonalPage() {
  const [equipo, setEquipo] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    rol: "Delivery",
    comisionPorcentaje: "",
    sueldoFijo: "",
  });

  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);
  const [metodoPagoRecibo, setMetodoPagoRecibo] = useState("Efectivo");

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setNuevoEmpleado({ nombre: "", rol: "Delivery", comisionPorcentaje: "", sueldoFijo: "" });
    setMostrarModal(true);
  };

  const abrirModalEditar = (colaborador) => {
    setModoEdicion(true);
    setIdEditando(colaborador.id);
    
    // Extraer valores según su tipo de pago guardado
    let porcentaje = "";
    let sueldo = "";
    if (colaborador.rol === "Vendedor") {
      porcentaje = colaborador.valorConfigurado || "";
    } else if (colaborador.rol === "Colaborador / Empleado") {
      sueldo = colaborador.valorConfigurado || "";
    }

    setNuevoEmpleado({
      nombre: colaborador.nombre,
      rol: colaborador.rol,
      comisionPorcentaje: porcentaje,
      sueldoFijo: sueldo,
    });
    setMostrarModal(true);
  };

  const guardarEmpleado = (e) => {
    e.preventDefault();
    if (!nuevoEmpleado.nombre) return;

    let tipoPago = "Por Carrera";
    let valorAsignado = 0;

    if (nuevoEmpleado.rol === "Vendedor") {
      tipoPago = `${nuevoEmpleado.comisionPorcentaje}% sobre Ventas`;
      valorAsignado = Number(nuevoEmpleado.comisionPorcentaje) || 0;
    } else if (nuevoEmpleado.rol === "Colaborador / Empleado") {
      tipoPago = "Sueldo Fijo";
      valorAsignado = Number(nuevoEmpleado.sueldoFijo) || 0;
    }

    if (modoEdicion) {
      // Actualizar colaborador existente
      setEquipo(
        equipo.map((item) =>
          item.id === idEditando
            ? {
                ...item,
                nombre: nuevoEmpleado.nombre,
                rol: nuevoEmpleado.rol,
                tipoPago: tipoPago,
                valorConfigurado: valorAsignado,
              }
            : item
        )
      );
    } else {
      // Agregar nuevo colaborador
      setEquipo([
        ...equipo,
        {
          id: Date.now(),
          nombre: nuevoEmpleado.nombre,
          rol: nuevoEmpleado.rol,
          tipoPago: tipoPago,
          valorConfigurado: valorAsignado,
          comisionAcumulada: 0, 
          historialDetalle: [],
        },
      ]);
    }

    setNuevoEmpleado({ nombre: "", rol: "Delivery", comisionPorcentaje: "", sueldoFijo: "" });
    setMostrarModal(false);
  };

  const eliminarEmpleado = (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este colaborador?")) {
      setEquipo(equipo.filter((item) => item.id !== id));
    }
  };

  const generarRecibo = (empleado) => {
    setReciboSeleccionado(empleado);
  };

  const imprimirRecibo = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Estilos CSS globales para impresión limpia */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #seccion-recibo-impresion, #seccion-recibo-impresion * {
            visibility: visible;
          }
          #seccion-recibo-impresion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
          }
        }
      `}</style>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Personal & Comisiones</h1>
          <p className="text-slate-500 text-sm">Liquidación de pagos a vendedores, deliveries y colaboradores fijos.</p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Agregar Colaborador
        </button>
      </div>

      {/* Lista de Personal */}
      {equipo.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-lg">No hay personal registrado</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Agrega tu primer vendedor, delivery o colaborador fijo para comenzar a registrar comisiones y pagos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {equipo.map((colaborador) => (
            <div key={colaborador.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                      {colaborador.rol === "Delivery" ? (
                        <Bike className="w-6 h-6 text-amber-600" />
                      ) : colaborador.rol === "Vendedor" ? (
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <UserCheck className="w-6 h-6 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{colaborador.nombre}</h3>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                        {colaborador.rol}
                      </span>
                    </div>
                  </div>

                  {/* Botones de Editar y Eliminar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModalEditar(colaborador)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Editar Colaborador"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarEmpleado(colaborador.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar Colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                  Modalidad: <span className="font-bold text-slate-700">{colaborador.tipoPago}</span>
                </div>

                <div className="border-t border-b py-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Acumulado a Pagar:</span>
                  <span className="font-extrabold text-slate-800 text-base">RD$ {colaborador.comisionAcumulada}</span>
                </div>
              </div>

              <button
                onClick={() => generarRecibo(colaborador)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition mt-2"
              >
                <FileText className="w-4 h-4 text-amber-400" /> Generar Recibo de Pago
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Comprobante de Pago Profesional */}
      {reciboSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl border border-slate-200 my-8">
            
            <div id="seccion-recibo-impresion" className="space-y-6 bg-white p-2">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.JPG" alt="Maxi Jugos Logo" className="w-14 h-14 object-cover rounded-2xl border" />
                  <div>
                    <h2 className="text-xl font-black text-slate-900">MAXI JUGOS</h2>
                    <p className="text-xs text-slate-500">Comprobante de Pago de Personal</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p><span className="font-bold">Fecha:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="font-bold">Hora:</span> {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Colaborador:</span>
                  <span className="font-bold text-slate-800">{reciboSeleccionado.nombre}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Rol / Cargo:</span>
                  <span className="font-bold text-slate-800">{reciboSeleccionado.rol}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Modalidad de Pago:</span>
                  <span className="font-bold text-slate-800">{reciboSeleccionado.tipoPago}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Método de Liquidación:</span>
                  <span className="font-bold text-amber-600">{metodoPagoRecibo}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl print:hidden">
                <span className="text-xs font-bold text-amber-800">Seleccionar Método de Pago:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPagoRecibo("Efectivo")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${metodoPagoRecibo === "Efectivo" ? "bg-amber-600 text-white" : "bg-white text-slate-700 border"}`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPagoRecibo("Transferencia")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${metodoPagoRecibo === "Transferencia" ? "bg-amber-600 text-white" : "bg-white text-slate-700 border"}`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Desglose de Actividad</h4>
                <div className="border rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b">
                        <th className="p-3">Detalle / Concepto</th>
                        <th className="p-3 text-right">Monto / Comisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reciboSeleccionado.historialDetalle && reciboSeleccionado.historialDetalle.length > 0 ? (
                        reciboSeleccionado.historialDetalle.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 text-slate-700">{item.concepto}</td>
                            <td className="p-3 text-right font-bold text-slate-900">RD$ {item.monto}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="p-4 text-center text-slate-400 italic">
                            Acumulado general correspondiente al período actual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center">
                <span className="font-medium text-sm">Total Neto a Pagar:</span>
                <span className="text-xl font-black text-amber-400">RD$ {reciboSeleccionado.comisionAcumulada}</span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-600">
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1"></div>
                  <p className="font-bold">Firma del Administrador</p>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1"></div>
                  <p className="font-bold">Recibido Conforme (Colaborador)</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3 print:hidden">
              <button
                onClick={imprimirRecibo}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <Download className="w-4 h-4" /> Imprimir Recibo Oficial
              </button>
              <button
                onClick={() => setReciboSeleccionado(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar / Editar Empleado */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={guardarEmpleado} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              {modoEdicion ? "Editar Colaborador" : "Agregar Colaborador"}
            </h2>
            
            <input
              type="text"
              placeholder="Nombre completo"
              value={nuevoEmpleado.nombre}
              onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
              className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />

            <select
              value={nuevoEmpleado.rol}
              onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, rol: e.target.value })}
              className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Delivery">Delivery</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Colaborador / Empleado">Colaborador / Empleado</option>
            </select>

            {nuevoEmpleado.rol === "Vendedor" && (
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Porcentaje de Comisión por Venta (%)</label>
                <input
                  type="number"
                  placeholder="Ej: 5 (para 5%)"
                  value={nuevoEmpleado.comisionPorcentaje}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, comisionPorcentaje: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            )}

            {nuevoEmpleado.rol === "Colaborador / Empleado" && (
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Sueldo Fijo (RD$)</label>
                <input
                  type="number"
                  placeholder="Ej: 5000"
                  value={nuevoEmpleado.sueldoFijo}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, sueldoFijo: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-amber-500 font-bold py-2.5 rounded-xl text-sm">
                {modoEdicion ? "Guardar Cambios" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="bg-slate-100 font-bold px-4 py-2.5 rounded-xl text-sm"
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
