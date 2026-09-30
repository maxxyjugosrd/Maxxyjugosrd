import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  deleteDoc,
  setDoc
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
    
    // Verificar si ya existe por teléfono
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
 * FILTRA LOS ESTADOS: Solo suma al total gastado y métricas si el estado es "Completado" o "Entregado".
 */
export const sincronizarClientePorPedido = async (datosPedido) => {
  try {
    const {
      nombreCliente,
      telefonoCliente,
      emailCliente,
      direccionEnvio,
      zonaEnvio,
      totalPedido,
      productos,
      estadoPedido, // Ej: "Pendiente", "Completado", "Entregado", "Cancelado"
      vendedorAsignado
    } = datosPedido;

    if (!nombreCliente && !telefonoCliente) return;

    const clientesRef = collection(db, COLECCION_CLIENTES);
    let q = null;

    if (telefonoCliente) {
      q = query(clientesRef, where("telefono", "==", telefonoCliente.trim()));
    } else {
      q = query(clientesRef, where("nombre", "==", nombreCliente.trim()));
    }

    const querySnapshot = await getDocs(q);
    const esCompletado = estadoPedido === "Completado" || estadoPedido === "Entregado";

    const nuevoItemHistorial = {
      fecha: new Date().toISOString(),
      total: Number(totalPedido) || 0,
      productos: productos || [],
      direccionEnvio: direccionEnvio || "No especificada",
      zonaEnvio: zonaEnvio || "Principal",
      estado: estadoPedido || "Pendiente"
    };

    if (querySnapshot.empty) {
      // Si el cliente no existe, lo creamos
      await addDoc(clientesRef, {
        nombre: nombreCliente || "Cliente Anónimo",
        telefono: telefonoCliente || "",
        email: emailCliente || "",
        direccionFrecuente: direccionEnvio || "",
        vendedorAsignado: vendedorAsignado || "Sin Asignar",
        categoria: "Regular",
        primeraCompra: serverTimestamp(),
        ultimaCompra: serverTimestamp(),
        totalGastado: esCompletado ? (Number(totalPedido) || 0) : 0,
        cantidadPedidos: esCompletado ? 1 : 0,
        historialCompras: [nuevoItemHistorial]
      });
    } else {
      // Si el cliente ya existe, actualizamos su expediente
      const clienteDoc = querySnapshot.docs[0];
      const clienteData = clienteDoc.data();
      const clienteRef = doc(db, COLECCION_CLIENTES, clienteDoc.id);

      const historialActual = clienteData.historialCompras || [];
      
      // Verificamos si este pedido ya estaba registrado para recalcular de forma segura
      let totalGastadoActual = Number(clienteData.totalGastado) || 0;
      let cantidadPedidosActual = Number(clienteData.cantidadPedidos) || 0;

      if (esCompletado) {
        totalGastadoActual += Number(totalPedido) || 0;
        cantidadPedidosActual += 1;
      }

      await updateDoc(clienteRef, {
        email: emailCliente || clienteData.email || "",
        direccionFrecuente: direccionEnvio || clienteData.direccionFrecuente || "",
        vendedorAsignado: vendedorAsignado || clienteData.vendedorAsignado || "Sin Asignar",
        ultimaCompra: serverTimestamp(),
        totalGastado: totalGastadoActual,
        cantidadPedidos: cantidadPedidosActual,
        historialCompras: [nuevoItemHistorial, ...historialActual] // Añade el nuevo pedido al inicio
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
