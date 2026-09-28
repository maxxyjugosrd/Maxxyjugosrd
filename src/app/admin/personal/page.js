"use client";

import { useState } from "react";
import { Users, Plus, FileText, DollarSign, Bike, UserCheck, Download } from "lucide-react";

export default function PersonalPage() {
  const [equipo, setEquipo] = useState([
    { id: 1, nombre: "Carlos Gómez", rol: "Delivery", tipoPago: "Comisión por Carrera", comisionAcumulada: 1450, estado: "Pendiente" },
    { id: 2, nombre: "María Rodriguez", rol: "Vendedor", tipoPago: "% sobre Ventas", comisionAcumulada: 3200, estado: "Pendiente" },
    { id: 3, nombre: "Juan Pérez", rol: "Preparador / Empleado", tipoPago: "Sueldo Fijo", comisionAcumulada: 5000, estado: "Pagado" },
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({ nombre: "", rol: "Delivery", tipoPago: "Comisión por Carrera", monto: "" });
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);

  const agregarEmpleado = (e) => {
    e.preventDefault();
    if (!nuevoEmpleado.nombre) return;
    setEquipo([
      ...equipo,
      {
        id: Date.now(),
        nombre: nuevoEmpleado.nombre,
        rol: nuevoEmpleado.rol,
        tipoPago: nuevoEmpleado.tipoPago,
        comisionAcumulada: Number(nuevoEmpleado.monto) || 0,
        estado: "Pendiente",
      },
    ]);
    setNuevoEmpleado({ nombre: "", rol: "Delivery", tipoPago: "Comisión por Carrera", monto: "" });
    setMostrarModal(false);
  };

  const generarRecibo = (empleado) => {
    setReciboSeleccionado(empleado);
  };

  const imprimirRecibo = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Personal & Comisiones</h1>
          <p className="text-slate-500 text-sm">Liquidación de pagos a vendedores, deliveries y colaboradores fijos.</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Agregar Colaborador
        </button>
      </div>

      {/* Lista de Personal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {equipo.map((colaborador) => (
          <div key={colaborador.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                  {colaborador.rol === "Delivery" ? <Bike className="w-6 h-6 text-amber-600" /> : <UserCheck className="w-6 h-6 text-slate-700" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{colaborador.nombre}</h3>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">{colaborador.rol}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-b py-3 flex justify-between items-center text-sm">
              <span className="text-slate-500">Monto / Comisión:</span>
              <span className="font-extrabold text-slate-800 text-base">RD$ {colaborador.comisionAcumulada}</span>
            </div>

            <button
              onClick={() => generarRecibo(colaborador)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-amber-400" /> Generar Recibo de Pago
            </button>
          </div>
        ))}
      </div>

      {/* Modal / Vista de Recibo Imprimible */}
      {reciboSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl border border-slate-200">
            <div className="text-center border-b pb-4">
              <span className="text-4xl">🥤</span>
              <h2 className="text-2xl font-black text-amber-600">MAXI JUGOS</h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Comprobante Oficial de Pago</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <span className="font-bold text-slate-800">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Colaborador:</span>
                <span className="font-bold text-slate-800">{reciboSeleccionado.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cargo / Rol:</span>
                <span className="font-bold text-slate-800">{reciboSeleccionado.rol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad:</span>
                <span className="font-bold text-slate-800">{reciboSeleccionado.tipoPago}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-black text-slate-900">
                <span>Total Liquidado:</span>
                <span className="text-emerald-600">RD$ {reciboSeleccionado.comisionAcumulada}</span>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3">
              <button
                onClick={imprimirRecibo}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <Download className="w-4 h-4" /> Imprimir / PDF
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

      {/* Modal Agregar Empleado */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={agregarEmpleado} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Agregar Colaborador</h2>
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
              <option value="Preparador / Empleado">Preparador / Empleado</option>
            </select>
            <input
              type="number"
              placeholder="Monto acumulado / Pago inicial (RD$)"
              value={nuevoEmpleado.monto}
              onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, monto: e.target.value })}
              className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-amber-500 font-bold py-2.5 rounded-xl text-sm">
                Guardar
              </button>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-slate-100 font-bold px-4 py-2.5 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
