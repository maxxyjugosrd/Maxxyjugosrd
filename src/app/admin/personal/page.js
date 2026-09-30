"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Bike, DollarSign, UserCheck, Trash2, Edit, CreditCard, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function PersonalPage() {
  const [equipo, setEquipo] = useState([]);
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    rol: "Delivery",
    telefono: "",
    cedula: "",
    direccion: "",
    banco: "",
    tipoCuenta: "Ahorros",
    numeroCuenta: "",
    comisionPorcentaje: "",
    sueldoFijo: "",
  });

  useEffect(() => {
    const personalGuardado = localStorage.getItem("maxi_personal");
    if (personalGuardado) {
      try {
        const parsed = JSON.parse(personalGuardado);
        if (Array.isArray(parsed)) {
          setEquipo(parsed);
        }
      } catch (e) {
        setEquipo([]);
      }
    }
  }, []);

  const actualizarYGuardarEquipo = (nuevoEquipo) => {
    setEquipo(nuevoEquipo);
    localStorage.setItem("maxi_personal", JSON.stringify(nuevoEquipo));
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setNuevoEmpleado({
      nombre: "", rol: "Delivery", telefono: "", cedula: "", direccion: "",
      banco: "", tipoCuenta: "Ahorros", numeroCuenta: "", comisionPorcentaje: "", sueldoFijo: "",
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (colaborador) => {
    setModoEdicion(true);
    setIdEditando(colaborador.id);
    let porcentaje = colaborador.rol === "Vendedor" ? colaborador.valorConfigurado || "" : "";
    let sueldo = colaborador.rol === "Colaborador / Empleado" ? colaborador.valorConfigurado || "" : "";

    setNuevoEmpleado({
      nombre: colaborador.nombre || "",
      rol: colaborador.rol || "Delivery",
      telefono: colaborador.telefono || "",
      cedula: colaborador.cedula || "",
      direccion: colaborador.direccion || "",
      banco: colaborador.banco || "",
      tipoCuenta: colaborador.tipoCuenta || "Ahorros",
      numeroCuenta: colaborador.numeroCuenta || "",
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
      tipoPago = "Sueldo Fijo (Quincenal)";
      valorAsignado = Number(nuevoEmpleado.sueldoFijo) || 0;
    }

    if (modoEdicion) {
      const equipoActualizado = equipo.map((item) =>
        item.id === idEditando ? { ...item, ...nuevoEmpleado, tipoPago, valorConfigurado: valorAsignado } : item
      );
      actualizarYGuardarEquipo(equipoActualizado);
    } else {
      const equipoActualizado = [
        ...equipo,
        {
          id: Date.now(),
          ...nuevoEmpleado,
          tipoPago,
          valorConfigurado: valorAsignado,
          comisionAcumulada: 0,
          historialDetalle: [],
        },
      ];
      actualizarYGuardarEquipo(equipoActualizado);
    }
    setMostrarModal(false);
  };

  const eliminarEmpleado = (id) => {
    if (confirm("¿Estás seguro de eliminar este colaborador?")) {
      actualizarYGuardarEquipo(equipo.filter((item) => item.id !== id));
    }
  };

  const formatearTextoSeguro = (valor) => {
    if (!valor) return "N/D";
    if (typeof valor === "object") {
      return valor.nombre || valor.telefono || JSON.stringify(valor);
    }
    return String(valor);
  };

  const equipoFiltrado = equipo.filter((colaborador) => {
    if (filtroRol === "Todos") return true;
    if (filtroRol === "Delivery") return colaborador.rol === "Delivery";
    if (filtroRol === "Vendedor") return colaborador.rol === "Vendedor";
    if (filtroRol === "Empleado") return colaborador.rol === "Colaborador / Empleado";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Personal & Expedientes</h1>
          <p className="text-slate-500 text-sm">Gestiona la información de contacto, cédulas y cuentas bancarias del equipo.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* BOTÓN PARA IR A NÓMINA */}
          <Link
            href="/admin/nomina"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Ir a Módulo de Nómina
          </Link>

          <button
            onClick={abrirModalCrear}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
            <Plus className="w-5 h-5" /> Nuevo Colaborador
          </button>
        </div>
      </div>

      {/* Pestañas de filtrado */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[{ label: "Todos", id: "Todos" }, { label: "Deliveries", id: "Delivery" }, { label: "Vendedores", id: "Vendedor" }, { label: "Empleados Fijos", id: "Empleado" }].map((p) => (
          <button
            key={p.id}
            onClick={() => setFiltroRol(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${filtroRol === p.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cuadrícula de personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipoFiltrado.map((colaborador) => (
          <div key={colaborador.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                    {colaborador.rol === "Delivery" ? <Bike className="w-6 h-6 text-amber-600" /> : colaborador.rol === "Vendedor" ? <DollarSign className="w-6 h-6 text-emerald-600" /> : <UserCheck className="w-6 h-6 text-slate-700" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{formatearTextoSeguro(colaborador.nombre)}</h3>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">{formatearTextoSeguro(colaborador.rol)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirModalEditar(colaborador)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Editar"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => eliminarEmpleado(colaborador.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p><span className="font-semibold text-slate-600">Teléfono:</span> {formatearTextoSeguro(colaborador.telefono)}</p>
                <p><span className="font-semibold text-slate-600">Cédula:</span> {formatearTextoSeguro(colaborador.cedula)}</p>
                <p><span className="font-semibold text-slate-600">Dirección:</span> {formatearTextoSeguro(colaborador.direccion)}</p>
                <p><span className="font-semibold text-slate-600">Banco:</span> {colaborador.banco ? `${formatearTextoSeguro(colaborador.banco)} (${formatearTextoSeguro(colaborador.tipoCuenta)}) - ${formatearTextoSeguro(colaborador.numeroCuenta)}` : "Sin cuenta registrada"}</p>
                <div className="pt-2 border-t mt-2 flex justify-between">
                  <span className="text-slate-400">Modalidad:</span>
                  <span className="font-bold text-slate-700">{formatearTextoSeguro(colaborador.tipoPago)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Crear / Editar Empleado */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={guardarEmpleado} className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-4 my-8 shadow-2xl border">
            <h2 className="text-xl font-bold text-slate-900">{modoEdicion ? "Editar Expediente" : "Nuevo Colaborador"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Nombre Completo</label>
                <input type="text" placeholder="Ej: Juan Pérez" value={nuevoEmpleado.nombre} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })} className="w-full p-3 border rounded-xl text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Teléfono</label>
                  <input type="text" placeholder="809-000-0000" value={nuevoEmpleado.telefono} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Cédula</label>
                  <input type="text" placeholder="001-0000000-0" value={nuevoEmpleado.cedula} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, cedula: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold">Dirección</label>
                <input type="text" placeholder="Calle, Sector" value={nuevoEmpleado.direccion} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, direccion: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold">Rol / Cargo</label>
                <select value={nuevoEmpleado.rol} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, rol: e.target.value })} className="w-full p-3 border rounded-xl text-sm">
                  <option value="Delivery">Delivery</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Colaborador / Empleado">Colaborador / Empleado Fijo</option>
                </select>
              </div>
              {nuevoEmpleado.rol === "Vendedor" && (
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Porcentaje de Comisión (%)</label>
                  <input type="number" placeholder="Ej: 5" value={nuevoEmpleado.comisionPorcentaje} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, comisionPorcentaje: e.target.value })} className="w-full p-3 border rounded-xl text-sm" required />
                </div>
              )}
              {nuevoEmpleado.rol === "Colaborador / Empleado" && (
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Sueldo Fijo Mensual (RD$)</label>
                  <input type="number" placeholder="Ej: 15000" value={nuevoEmpleado.sueldoFijo} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, sueldoFijo: e.target.value })} className="w-full p-3 border rounded-xl text-sm" required />
                </div>
              )}
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-amber-600" /> Datos Bancarios</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold">Banco</label>
                    <input type="text" placeholder="Banreservas" value={nuevoEmpleado.banco} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, banco: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold">Tipo de Cuenta</label>
                    <select value={nuevoEmpleado.tipoCuenta} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, tipoCuenta: e.target.value })} className="w-full p-3 border rounded-xl text-sm">
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold">Número de Cuenta</label>
                  <input type="text" placeholder="Número de cuenta" value={nuevoEmpleado.numeroCuenta} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, numeroCuenta: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm">Guardar</button>
              <button type="button" onClick={() => setMostrarModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
