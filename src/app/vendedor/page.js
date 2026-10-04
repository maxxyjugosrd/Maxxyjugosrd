"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Phone,
  MapPin,
  Loader2,
  Calendar,
  LogOut,
  TrendingUp,
  Package,
  Lock,
  Search,
  KeyRound,
} from "lucide-react";

// Importación de servicios de Firebase y pedidos
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { obtenerPedidosEnVivo } from "../../services/pedidosService";

// Catálogo predeterminado de Maxxy Jugos
const PRODUCTOS_CATALOGO = [
  { id: 1, nombre: "Jugo de Limón Natural", presentacion: "16 oz", precio: 65 },
  { id: 2, nombre: "Jugo de Naranja Agria", presentacion: "16 oz", precio: 70 },
  { id: 3, nombre: "Jugo de Chinola", presentacion: "16 oz", precio: 75 },
  { id: 4, nombre: "Jugo de Tamarindo", presentacion: "16 oz", precio: 75 },
  { id: 5, nombre: "Jugo de Cereza", presentacion: "16 oz", precio: 80 },
  { id: 6, nombre: "Jugo de Limón con Avena", presentacion: "16 oz", precio: 85 },
  { id: 7, nombre: "Jugo de Chinola con Avena", presentacion: "16 oz", precio: 90 },
  { id: 8, nombre: "Jugo Verde", presentacion: "16 oz", precio: 95 },
  { id: 9, nombre: "Shot de Cúrcuma y Jengibre", presentacion: "2 oz", precio: 50 },
  { id: 10, nombre: "Galón de Limón Natural", presentacion: "Galón", precio: 350 },
  { id: 11, nombre: "Galón de Chinola", presentacion: "Galón", precio: 400 },
];

export default function PanelVendedor() {
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState([
    "Vendedor General",
    "Juan Pérez",
    "María Gómez",
    "Carlos Ruiz",
  ]);

  const [vendedorSeleccionadoPrevia, setVendedorSeleccionadoPrevia] = useState("");
  const [pinIngresado, setPinIngresado] = useState("");
  const [requiereCrearPin, setRequiereCrearPin] = useState(false);
  const [nuevoPinInput, setNuevoPinInput] = useState("");

  const [vendedorActual, setVendedorActual] = useState("");
  const [pedidosGlobales, setPedidosGlobales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [exitoMensaje, setExitoMensaje] = useState("");

  // Lista de Clientes del CRM
  const [clientesCRM, setClientesCRM] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarSugerenciasCRM, setMostrarSugerenciasCRM] = useState(false);

  // Formulario del nuevo pedido
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [clienteSeleccionadoObj, setClienteSeleccionadoObj] = useState(null);
  const [carrito, setCarrito] = useState([]);

  // Estado para modal de contraseña de supervisora (para reasignar clientes de otro vendedor)
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordSupervisorInput, setPasswordSupervisorInput] = useState("");
  const [pedidoPendienteGuardar, setPedidoPendienteGuardar] = useState(null);

  // Cargar personal y clientes del CRM desde localStorage al iniciar
  useEffect(() => {
    const personalGuardado = localStorage.getItem("maxi_personal");
    if (personalGuardado) {
      try {
        const parsed = JSON.parse(personalGuardado);
        const soloVendedores = parsed
          .filter((p) => p.rol === "Vendedor")
          .map((p) => p.nombre);
        if (soloVendedores.length > 0) {
          setVendedoresDisponibles(soloVendedores);
        }
      } catch (e) {
        console.error("Error al cargar personal:", e);
      }
    }

    const crmGuardado = localStorage.getItem("maxi_crm_clientes");
    if (crmGuardado) {
      try {
        setClientesCRM(JSON.parse(crmGuardado));
      } catch (e) {
        console.error("Error al cargar CRM:", e);
      }
    } else {
      const ejemploClientes = [
        { id: 1, nombre: "Colmado El Pana", telefono: "809-555-1234", direccion: "Calle 1, Ensanche Ozama", vendedorAsignado: "Juan Pérez" },
        { id: 2, nombre: "Colmado Doña Rosa", telefono: "829-444-5678", direccion: "Av. Central #45", vendedorAsignado: "María Gómez" },
      ];
      setClientesCRM(ejemploClientes);
      localStorage.setItem("maxi_crm_clientes", JSON.stringify(ejemploClientes));
    }

    const desuscribir = obtenerPedidosEnVivo((datos) => {
      setPedidosGlobales(datos);
      setCargando(false);
    });

    return () => desuscribir && desuscribir();
  }, []);

  // Manejar selección inicial del vendedor en el selector
  const handleSeleccionarNombreDropdown = (nombre) => {
    setVendedorSeleccionadoPrevia(nombre);
    setPinIngresado("");
    setNuevoPinInput("");

    if (!nombre) {
      setRequiereCrearPin(false);
      return;
    }

    // Revisar si este vendedor ya tiene un PIN guardado en localStorage
    const pinesGuardados = JSON.parse(localStorage.getItem("maxi_vendedores_pines") || "{}");
    if (!pinesGuardados[nombre]) {
      // Si no tiene PIN, le exigimos crear uno nuevo
      setRequiereCrearPin(true);
    } else {
      setRequiereCrearPin(false);
    }
  };

  // Validar PIN de acceso del vendedor
  const handleLoginVendedor = (e) => {
    e.preventDefault();
    if (!vendedorSeleccionadoPrevia) return;

    const pinesGuardados = JSON.parse(localStorage.getItem("maxi_vendedores_pines") || "{}");

    if (requiereCrearPin) {
      if (nuevoPinInput.length < 4) {
        alert("El PIN debe tener al menos 4 dígitos.");
        return;
      }
      // Guardar el nuevo PIN
      pinesGuardados[vendedorSeleccionadoPrevia] = nuevoPinInput;
      localStorage.setItem("maxi_vendedores_pines", JSON.stringify(pinesGuardados));
      setVendedorActual(vendedorSeleccionadoPrevia);
    } else {
      const pinCorrecto = pinesGuardados[vendedorSeleccionadoPrevia];
      if (pinIngresado === pinCorrecto) {
        setVendedorActual(vendedorSeleccionadoPrevia);
      } else {
        alert("PIN incorrecto. Inténtalo de nuevo.");
      }
    }
  };

  // Seleccionar un cliente desde el CRM
  const seleccionarClienteCRM = (cliente) => {
    setNombreCliente(cliente.nombre);
    setTelefonoCliente(cliente.telefono || "");
    setDireccionCliente(cliente.direccion || "");
    setClienteSeleccionadoObj(cliente);
    setBusquedaCliente(cliente.nombre);
    setMostrarSugerenciasCRM(false);
  };

  const agregarAlCarrito = (producto) => {
    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.id === producto.id);
      if (existe) {
        return prevCarrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prevCarrito, { ...producto, cantidad: 1 }];
      }
    });
  };

  const cambiarCantidadCarrito = (id, delta) => {
    setCarrito((prevCarrito) =>
      prevCarrito
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

  const calcularTotalCarrito = () => {
    return carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  };

  const ejecutarGuardadoPedido = async (vendedorFinalAsignado) => {
    setEnviando(true);
    try {
      const nuevoPedidoData = {
        cliente: nombreCliente,
        telefono: telefonoCliente,
        direccion: direccionCliente,
        productos: carrito,
        total: calcularTotalCarrito(),
        subtotal: calcularTotalCarrito(),
        vendedor: vendedorFinalAsignado,
        estado: "Pendiente",
        origen: "Panel de Vendedor",
        fechaCreacion: serverTimestamp(),
      };

      await addDoc(collection(db, "pedidos"), nuevoPedidoData);

      if (clienteSeleccionadoObj && !clienteSeleccionadoObj.vendedorAsignado) {
        const crmActualizado = clientesCRM.map((c) =>
          c.id === clienteSeleccionadoObj.id
            ? { ...c, vendedorAsignado: vendedorFinalAsignado }
            : c
        );
        setClientesCRM(crmActualizado);
        localStorage.setItem("maxi_crm_clientes", JSON.stringify(crmActualizado));
      }

      setCarrito([]);
      setNombreCliente("");
      setTelefonoCliente("");
      setDireccionCliente("");
      setBusquedaCliente("");
      setClienteSeleccionadoObj(null);
      setExitoMensaje("¡Pedido registrado con éxito! Quedó en estado Pendiente.");
      setTimeout(() => setExitoMensaje(""), 5000);
    } catch (error) {
      console.error("Error al registrar el pedido:", error);
      alert("Hubo un error al guardar el pedido.");
    } finally {
      setEnviando(false);
      setModalPasswordAbierto(false);
      setPasswordSupervisorInput("");
    }
  };

  const handleSubmitPedido = (e) => {
    e.preventDefault();
    if (!vendedorActual) return;
    if (carrito.length === 0) {
      alert("El pedido debe contener al menos un producto.");
      return;
    }
    if (!nombreCliente.trim()) {
      alert("Debes indicar el nombre del cliente.");
      return;
    }

    const clienteEnCRM = clientesCRM.find(
      (c) => c.nombre.toLowerCase() === nombreCliente.toLowerCase()
    );

    if (
      clienteEnCRM &&
      clienteEnCRM.vendedorAsignado &&
      clienteEnCRM.vendedorAsignado !== vendedorActual
    ) {
      setPedidoPendienteGuardar({
        vendedorOriginalDelCliente: clienteEnCRM.vendedorAsignado,
      });
      setModalPasswordAbierto(true);
      return;
    }

    ejecutarGuardadoPedido(vendedorActual);
  };

  const handleVerificarPasswordSupervisor = (e) => {
    e.preventDefault();
    const PASSWORD_SUPERVISORA_CORRECTA = "maxxy2026";
    const passwordGuardadaLocal = localStorage.getItem("maxi_admin_pass") || PASSWORD_SUPERVISORA_CORRECTA;

    if (passwordSupervisorInput === passwordGuardadaLocal) {
      alert("Contraseña correcta. Autorizado por supervisión.");
      ejecutarGuardadoPedido(vendedorActual);
    } else {
      alert("Contraseña incorrecta.");
    }
  };

  const misPedidos = pedidosGlobales.filter(
    (p) => (p.vendedor || p.vendedorAsignado || p.Asignado) === vendedorActual
  );

  const obtenerDatosVendedorLocal = () => {
    const personalGuardado = localStorage.getItem("maxi_personal");
    if (!personalGuardado) return { porcentaje: 0, comisionAcumulada: 0 };
    try {
      const parsed = JSON.parse(personalGuardado);
      const vendedorInfo = parsed.find(
        (p) => p.nombre === vendedorActual && p.rol === "Vendedor"
      );
      if (vendedorInfo) {
        const porcentaje = Number(vendedorInfo.valorConfigurado || 0);
        const comisionAcumulada = Number(vendedorInfo.comisionesAcumuladas || 0);
        return { porcentaje, comisionAcumulada };
      }
    } catch (e) {
      console.error(e);
    }
    return { porcentaje: 0, comisionAcumulada: 0 };
  };

  const { porcentaje, comisionAcumulada } = obtenerDatosVendedorLocal();
  const clientesFiltradosCRM = clientesCRM.filter((c) =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  // Pantalla de Inicio / Autenticación por PIN del Vendedor
  if (!vendedorActual) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-3">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Maxxy Jugos</h1>
            <p className="text-sm text-slate-500 mt-1">Acceso Seguro de Vendedores</p>
          </div>

          <form onSubmit={handleLoginVendedor} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1">
                Selecciona tu Nombre:
              </label>
              <select
                value={vendedorSeleccionadoPrevia}
                onChange={(e) => handleSeleccionarNombreDropdown(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium outline-none focus:border-amber-500"
              >
                <option value="">-- Selecciona quién eres --</option>
                {vendedoresDisponibles.map((v, idx) => (
                  <option key={idx} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {vendedorSeleccionadoPrevia && requiereCrearPin && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 animate-fade-in">
                <p className="text-xs font-bold text-amber-900">
                  Es tu primera vez ingresando. Crea tu PIN de 4 dígitos o contraseña:
                </p>
                <input
                  type="password"
                  required
                  placeholder="Ej. 1234"
                  value={nuevoPinInput}
                  onChange={(e) => setNuevoPinInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-300 text-sm bg-white outline-none font-mono"
                />
              </div>
            )}

            {vendedorSeleccionadoPrevia && !requiereCrearPin && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Ingresa tu PIN o Contraseña:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••"
                  value={pinIngresado}
                  onChange={(e) => setPinIngresado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-amber-500 font-mono tracking-widest text-center text-lg"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!vendedorSeleccionadoPrevia}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-sm transition shadow-md"
            >
              {requiereCrearPin ? "Crear PIN y Entrar" : "Entrar al Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black">
            MJ
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base">Panel de Ventas Seguro</h1>
            <p className="text-xs text-slate-500">
              Vendedor autenticado: <strong className="text-amber-600">{vendedorActual}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setVendedorActual("");
            setVendedorSeleccionadoPrevia("");
          }}
          className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-2 rounded-xl font-semibold transition"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {exitoMensaje && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{exitoMensaje}</span>
            </div>
          )}

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider opacity-90 font-semibold">Tus Comisiones Acumuladas</span>
              <div className="text-3xl font-black">
                RD$ {comisionAcumulada.toLocaleString()}
              </div>
              <p className="text-xs opacity-80">
                Porcentaje de comisión asignado: <strong>{porcentaje}%</strong>
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" /> Registrar Pedido (Selecciona del CRM)
            </h2>

            <form onSubmit={handleSubmitPedido} className="space-y-4">
              <div className="relative">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Buscar Cliente o Colmado en el CRM *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre del colmado..."
                    value={busquedaCliente}
                    onChange={(e) => {
                      setBusquedaCliente(e.target.value);
                      setNombreCliente(e.target.value);
                      setMostrarSugerenciasCRM(true);
                    }}
                    onFocus={() => setMostrarSugerenciasCRM(true)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500 bg-slate-50"
                  />
                </div>

                {mostrarSugerenciasCRM && clientesFiltradosCRM.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {clientesFiltradosCRM.map((cli) => (
                      <div
                        key={cli.id}
                        onClick={() => seleccionarClienteCRM(cli)}
                        className="p-3 hover:bg-amber-50 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-800">{cli.nombre}</p>
                          <p className="text-[11px] text-slate-400">
                            {cli.telefono || "Sin teléfono"} • {cli.direccion || "Sin dirección"}
                          </p>
                        </div>
                        {cli.vendedorAsignado && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Asignado a: {cli.vendedorAsignado}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Teléfono de Contacto
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="809-000-0000"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Dirección de Entrega
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Sector / Calle"
                      value={direccionCliente}
                      onChange={(e) => setDireccionCliente(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Selecciona los Productos:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 border border-slate-100 p-2 rounded-2xl bg-slate-50">
                  {PRODUCTOS_CATALOGO.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => agregarAlCarrito(prod)}
                      className="bg-white p-3 rounded-xl border border-slate-200 hover:border-amber-500 cursor-pointer transition flex justify-between items-center shadow-xs group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                          {prod.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {prod.presentacion} • RD$ {prod.precio}
                        </p>
                      </div>
                      <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-white transition">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {carrito.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Productos en este Pedido:
                  </h3>
                  <div className="divide-y divide-slate-200 text-xs">
                    {carrito.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800">{item.nombre}</p>
                          <p className="text-slate-400">RD$ {item.precio} c/u</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => cambiarCantidadCarrito(item.id, -1)}
                            className="w-6 h-6 bg-slate-200 rounded-md font-bold flex items-center justify-center text-slate-700 hover:bg-slate-300"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-800 w-4 text-center">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => cambiarCantidadCarrito(item.id, 1)}
                            className="w-6 h-6 bg-slate-200 rounded-md font-bold flex items-center justify-center text-slate-700 hover:bg-slate-300"
                          >
                            +
                          </button>
                          <span className="font-bold text-slate-900 ml-3 w-16 text-right">
                            RD$ {item.precio * item.cantidad}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center font-extrabold text-sm text-slate-800">
                    <span>Total del Pedido:</span>
                    <span className="text-amber-600 text-base">
                      RD$ {calcularTotalCarrito().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || carrito.length === 0}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
              >
                {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar Pedido a Supervisión
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Tu Historial de Pedidos
              </h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
                {misPedidos.length}
              </span>
            </div>

            {cargando ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span>Cargando tus pedidos...</span>
              </div>
            ) : misPedidos.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Aún no has registrado ningún pedido.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {misPedidos.map((pedido) => {
                  const idDoc = pedido.idDoc || pedido.id;
                  const estado = pedido.estado || "Pendiente";
                  
                  let estiloEstatus = "bg-amber-100 text-amber-800 border-amber-300";
                  if (estado.toLowerCase() === "completado") {
                    estiloEstatus = "bg-emerald-100 text-emerald-800 border-emerald-300";
                  } else if (estado.toLowerCase() === "en proceso") {
                    estiloEstatus = "bg-blue-100 text-blue-800 border-blue-300";
                  } else if (estado.toLowerCase() === "cancelado") {
                    estiloEstatus = "bg-rose-100 text-rose-800 border-rose-300";
                  }

                  return (
                    <div
                      key={idDoc}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2 shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {pedido.cliente || "Cliente sin nombre"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {pedido.telefono || "Sin teléfono"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border capitalize ${estiloEstatus}`}>
                          {estado}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 flex justify-between items-center">
                        <span className="font-bold text-slate-900">
                          RD$ {(pedido.total || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {pedido.productos?.length || 0} producto(s)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {modalPasswordAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl">
              <Lock className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Cliente Asignado a Otro Vendedor</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Este cliente pertenece a <strong className="text-rose-700">{pedidoPendienteGuardar?.vendedorOriginalDelCliente}</strong>. Ingresa tu contraseña de supervisora para autorizar.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerificarPasswordSupervisor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contraseña de Supervisora
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={passwordSupervisorInput}
                  onChange={(e) => setPasswordSupervisorInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500 bg-slate-50 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPasswordAbierto(false)}
                  className="flex-1 py-3 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition shadow-md"
                >
                  Autorizar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
