import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Asegúrate de tener db importado

// Nombre de la colección en Firestore
const COLECCION_PEDIDOS = "pedidos";

/**
 * Guarda un nuevo pedido (Web o POS WhatsApp) en Firebase Firestore
 */
export const crearPedido = async (datosPedido) => {
  try {
    const docRef = await addDoc(collection(db, COLECCION_PEDIDOS), {
      ...datosPedido,
      estado: datosPedido.estado || "pendiente", // pendiente, en_preparacion, en_camino, entregado
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
      ...doc.data(), // 1. Ponemos primero los datos guardados
    idDoc: doc.id, // 2. Guardamos una copia clara del ID de Firestore
    id: doc.id,    // 3. Forzamos que 'id' sea el ID real de Firestore (sobreescribe cualquier 'id' dentro de data)
  }));
    callback(pedidos);
  });
};

// Eliminar pedido por su ID de Firestore
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

// Actualizar campos de un pedido
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
