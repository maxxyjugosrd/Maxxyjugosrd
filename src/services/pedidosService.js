import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

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
      id: doc.id,
      ...doc.data(),
    }));
    callback(pedidos);
  });
};
