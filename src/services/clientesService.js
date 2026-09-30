import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLECCION_CLIENTES = "clientes";

/**
 * Escucha la lista de clientes en tiempo real para la vista de CRM
 */
export const obtenerClientesEnVivo = (callback) => {
  try {
    const q = query(
      collection(db, COLECCION_CLIENTES),
      orderBy("ultimaCompra", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const clientes = snapshot.docs.map((doc) => ({
        ...doc.data(),
        idDoc: doc.id,
        id: doc.id,
      }));
      callback(clientes);
    }, (error) => {
      console.error("Error en el listener de clientes:", error);
      callback([]);
    });
  } catch (error) {
    console.error("Error al configurar obtenerClientesEnVivo:", error);
    callback([]);
  }
};

/**
 * Agrega un cliente manualmente desde el botón "+ Nuevo Cliente"
 */
export const crearClienteManual = async (datosCliente) => {
  try {
    const clientesRef = collection(db, COLECCION_CLIENTES);
    
    if (datosCliente.telefono) {
      const q = query(clientesRef, where("telefono", "==", datosCliente.telefono.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { exito: false, error: "Ya existe un cliente registrado con este número de teléfono." };
      }
    }

    const docRef = await addDoc(clientesRef, {
      nombre: datosCliente.nombre || "Sin nombre",
      telefono: datosCliente.telefono || "",
      email: datosCliente.email || "",
      direccionFrecuente: datosCliente.direccionFrecuente || "",
      vendedorAsignado: datosCliente.vendedorAsignado || "Sin Asignar",
      categoria: datosCliente.categoria || "Regular",
      primeraCompra: serverTimestamp(),
      ultimaCompra: serverTimestamp(),
      totalGastado: Number(datosCliente.totalGastado) || 0,
      cantidadPedidos: Number(datosCliente.cantidadPedidos) || 0,
      historialCompras: []
    });

    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear cliente manual:", error);
    return { exito: false, error };
  }
};

/**
 * Sincroniza o registra automáticamente un cliente cuando se procesa o actualiza un pedido.
 * Captura de forma flexible cualquier formato de nombre, dirección, municipio, zona y camión frío.
 */
export const sincronizarClientePorPedido = async (datosPedido) => {
  try {
    // Capturamos con compatibilidad total para cualquier nombre de propiedad que envíe tu app
    const idPedido = datosPedido.idPedido || datosPedido.id || Date.now().toString();
    
    const nombreCliente = 
      datosPedido.nombreCliente || 
      datosPedido.cliente || 
      datosPedido.nombre || 
      datosPedido.comprador || 
      "Cliente Sin Nombre";

    const telefonoCliente = 
      datosPedido.telefonoCliente || 
      datosPedido.telefono || 
      datosPedido.celular || 
      "";

    const emailCliente = 
      datosPedido.emailCliente || 
      datosPedido.email || 
      datosPedido.correo || 
      "";

    // Unificamos dirección, municipio, zona y tipo de envío (Camión frío, etc.)
    const direccionBase = datosPedido.direccionEnvio || datosPedido.direccion || datosPedido.calle || "";
    const municipio = datosPedido.municipio || datosPedido.ciudad || datosPedido.provincia || "";
    const zona = datosPedido.zonaEnvio || datosPedido.zona || "";
    const transporte = datosPedido.metodoEnvio || datosPedido.transporte || datosPedido.tipoEnvio || "";

    // Construimos una dirección completa y detallada para el CRM
    let direccionCompletaParts = [];
    if (direccionBase) direccionCompletaParts.push(direccionBase);
    if (municipio) direccionCompletaParts.push(municipio);
    if (zona) direccionCompletaParts.push(`Zona: ${zona}`);
    if (transporte) direccionCompletaParts.push(`Transporte: ${transporte}`);

    const direccionFinal = direccionCompletaParts.length > 0 
      ? direccionCompletaParts.join(" - ") 
      : "Dirección no especificada";

    const totalPedido = Number(datosPedido.totalPedido || datosPedido.total || 0);
    const productos = datosPedido.productos || datosPedido.items || [];
    const estadoPedido = datosPedido.estadoPedido || datosPedido.estado || "Pendiente";
    const vendedorAsignado = datosPedido.vendedorAsignado || datosPedido.vendedor || "Sin Asignar";

    if (!nombreCliente && !telefonoCliente) return;

    const clientesRef = collection(db, COLECCION_CLIENTES);
    let q = null;

    if (telefonoCliente && telefonoCliente.trim() !== "") {
      q = query(clientesRef, where("telefono", "==", telefonoCliente.trim()));
    } else {
      q = query(clientesRef, where("nombre", "==", nombreCliente.trim()));
    }

    const querySnapshot = await getDocs(q);

    const nuevoItemHistorial = {
      idPedido: idPedido,
      fecha: new Date().toISOString(),
      total: totalPedido,
      productos: productos,
      direccionEnvio: direccionFinal,
      zonaEnvio: zona || municipio || "Principal",
      transporte: transporte || "Normal",
      estado: estadoPedido
    };

    if (querySnapshot.empty) {
      // Si el cliente no existe, evaluamos si el primer pedido está completado para sumar las finanzas
      const esCompletado = estadoPedido === "Completado" || estadoPedido === "Entregado";
      
      await addDoc(clientesRef, {
        nombre: nombreCliente,
        telefono: telefonoCliente,
        email: emailCliente,
        direccionFrecuente: direccionFinal,
        vendedorAsignado: vendedorAsignado,
        categoria: "Regular",
        primeraCompra: serverTimestamp(),
        ultimaCompra: serverTimestamp(),
        totalGastado: esCompletado ? totalPedido : 0,
        cantidadPedidos: esCompletado ? 1 : 0,
        historialCompras: [nuevoItemHistorial]
      });
    } else {
      // Si el cliente ya existe, actualizamos su expediente
      const clienteDoc = querySnapshot.docs[0];
      const clienteData = clienteDoc.data();
      const clienteRef = doc(db, COLECCION_CLIENTES, clienteDoc.id);

      let historialActual = clienteData.historialCompras || [];

      // Si el pedido ya existe en el historial, lo actualizamos (ej. pasó de Pendiente a Completado)
      const indexExistente = historialActual.findIndex(item => item.idPedido === idPedido);
      if (indexExistente !== -1) {
        historialActual[indexExistente] = nuevoItemHistorial;
      } else {
        historialActual = [nuevoItemHistorial, ...historialActual];
      }

      // RECALCULAMOS FINANZAS: Solo sumamos al total gastado y contador si el estado es "Completado" o "Entregado"
      let nuevoTotalGastado = 0;
      let nuevaCantidadPedidos = 0;

      historialActual.forEach(item => {
        if (item.estado === "Completado" || item.estado === "Entregado") {
          nuevoTotalGastado += Number(item.total) || 0;
          nuevaCantidadPedidos += 1;
        }
      });

      await updateDoc(clienteRef, {
        nombre: nombreCliente !== "Cliente Sin Nombre" ? nombreCliente : (clienteData.nombre || "Cliente Sin Nombre"),
        email: emailCliente || clienteData.email || "",
        direccionFrecuente: direccionFinal !== "Dirección no especificada" ? direccionFinal : (clienteData.direccionFrecuente || ""),
        vendedorAsignado: vendedorAsignado !== "Sin Asignar" ? vendedorAsignado : (clienteData.vendedorAsignado || "Sin Asignar"),
        ultimaCompra: serverTimestamp(),
        totalGastado: nuevoTotalGastado,
        cantidadPedidos: nuevaCantidadPedidos,
        historialCompras: historialActual
      });
    }

    return { exito: true };
  } catch (error) {
    console.error("Error al sincronizar cliente por pedido:", error);
    return { exito: false, error };
  }
};

/**
 * Elimina un cliente del CRM
 */
export const eliminarCliente = async (idDoc) => {
  try {
    await deleteDoc(doc(db, COLECCION_CLIENTES, idDoc));
    return { exito: true };
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
    return { exito: false, error };
  }
};
