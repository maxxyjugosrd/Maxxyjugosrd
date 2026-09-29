import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

const COLECCION_PRODUCTOS = "productos";

// Escuchar productos en tiempo real (Usado por la WEB y el PANEL DE CONTROL)
export const obtenerProductosEnVivo = (callback) => {
  const q = query(
    collection(db, COLECCION_PRODUCTOS),
    orderBy("fechaCreacion", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const productos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(productos);
  }, (error) => {
    console.error("Error cargando productos en vivo:", error);
  });
};

// Agregar un producto nuevo
export const agregarProducto = async (producto) => {
  try {
    const docRef = await addDoc(collection(db, COLECCION_PRODUCTOS), {
      ...producto,
      disponible: producto.disponible !== undefined ? producto.disponible : true,
      fechaCreacion: serverTimestamp(),
    });
    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error agregando producto:", error);
    return { exito: false, error };
  }
};

// Alias por si el panel importa 'crearProducto'
export const crearProducto = agregarProducto;

// Actualizar un producto
export const actualizarProducto = async (id, datosActualizados) => {
  try {
    const refDoc = doc(db, COLECCION_PRODUCTOS, id);
    await updateDoc(refDoc, datosActualizados);
    return { exito: true };
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return { exito: false, error };
  }
};

// Eliminar un producto
export const eliminarProducto = async (id) => {
  try {
    const refDoc = doc(db, COLECCION_PRODUCTOS, id);
    await deleteDoc(refDoc);
    return { exito: true };
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return { exito: false, error };
  }
};
