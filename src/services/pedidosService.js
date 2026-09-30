import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Nombre de la colección en Firestore
const COLECCION_PEDIDOS = "pedidos";
const COLECCION_CLIENTES = "clientes";

/**
 * Guarda un nuevo pedido (Web o POS WhatsApp) en Firebase Firestore 
 * y gestiona automáticamente el perfil e historial del cliente.
 */
export const crearPedido = async (datosPedido) => {
  try {
    // 1. Guardar el pedido en la colección 'pedidos'
    const docRef = await addDoc(collection(db, COLECCION_PEDIDOS), {
      ...datosPedido,
      estado: datosPedido.estado || "Pendiente",
      fecha: serverTimestamp(),
    });

    // 2. Gestionar automáticamente el cliente en la colección 'clientes'
    const telefonoCliente = datosPedido.cliente?.telefono || datosPedido.telefono;
    const nombreCliente = datosPedido.cliente?.nombre;

    if (telefonoCliente && telefonoCliente !== "Sin teléfono" && telefonoCliente.trim() !== "") {
      const clientesRef = collection(db, COLECCION_CLIENTES);
      const q = query(clientesRef, where("telefono", "==", telefonoCliente.trim()));
      const querySnapshot = await getDocs(q);

      const nuevoHistorialItem = {
        idPedido: docRef.id,
        fecha: Date.now(),
        total: datosPedido.total || 0,
        productos: datosPedido.productos || [],
        zonaEnvio: datosPedido.zonaEnvio?.nombre || "Local / Mostrador"
      };

      if (!querySnapshot.empty) {
        // El cliente ya existe -> Actualizamos su historial y métricas
        const docCliente = querySnapshot.docs[0];
        const clienteData = docCliente.data();
        const historialActual = clienteData.historialCompras || [];

        await updateDoc(doc(db, COLECCION_CLIENTES, docCliente.id), {
          nombre: nombreCliente || clienteData.nombre,
          ultimaCompra: serverTimestamp(),
          totalGastado: Number(clienteData.totalGastado || 0) + Number(datosPedido.total || 0),
          cantidadPedidos: (clienteData.cantidadPedidos || 0) + 1,
          direccionFrecuente: datosPedido.direccion || clienteData.direccionFrecuente || "",
          historialCompras: [nuevoHistorialItem, ...historialActual]
        });
      } else {
        // El cliente es nuevo -> Creamos su ficha automáticamente
        await addDoc(clientesRef, {
          nombre: nombreCliente || "Cliente sin nombre",
          telefono: telefonoCliente.trim(),
          direccionFrecuente: datosPedido.direccion || "",
          primeraCompra: serverTimestamp(),
          ultimaCompra: serverTimestamp(),
          totalGastado: Number(datosPedido.total || 0),
          cantidadPedidos: 1,
          historialCompras: [nuevoHistorialItem]
        });
      }
    }

    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar el pedido y actualizar el cliente:", error);
    return { exito: false, error };
  }
};

/**
 * Escucha la lista de pedidos en tiempo real
 */
export const obtenerPedidosEnVivo = (callback) => {
  const q = query(
    collection(db, COLECCION_PEDIDOS),
    orderBy("fecha", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const pedidos = snapshot.docs.map((doc) => ({
      ...doc.data(),
      idDoc: doc.id,
      id: doc.id,
    }));
    callback(pedidos);
  });
};

/**
 * Elimina un pedido por su ID de Firestore
 */
export const eliminarPedido = async (idDoc) => {
  try {
    const pedidoRef = doc(db, COLECCION_PEDIDOS, idDoc);
    await deleteDoc(pedidoRef);
    return { exito: true };
  } catch (error) {
    console.error("Error al eliminar el pedido:", error);
    return { exito: false, error };
  }
};

/**
 * Actualiza los datos de un pedido existente
 */
export const actualizarPedido = async (idDoc, datosActualizados) => {
  try {
    const pedidoRef = doc(db, COLECCION_PEDIDOS, idDoc);
    await updateDoc(pedidoRef, datosActualizados);
    return { exito: true };
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    return { exito: false, error };
  }
};
