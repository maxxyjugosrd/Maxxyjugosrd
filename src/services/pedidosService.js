import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Nombre de la colección en Firestore
const COLECCION_PEDIDOS = "pedidos";

/**
 * Guarda un nuevo pedido (Web o POS WhatsApp) en Firebase Firestore
 */
export const crearPedido = async (datosPedido) => {
  try {
    const docRef = await addDoc(collection(db, COLECCION_PEDIDOS), {
      ...datosPedido,
      estado: datosPedido.estado || "Pendiente",
      fecha: serverTimestamp(),
    });
    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar el pedido:", error);
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
