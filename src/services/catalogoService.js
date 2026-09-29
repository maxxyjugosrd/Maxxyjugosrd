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
const COLECCION_INGREDIENTES = "ingredientes";

// ==========================================
// SECCIÓN DE PRODUCTOS (CATÁLOGO)
// ==========================================

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


// ==========================================
// SECCIÓN DE INGREDIENTES (VERDES Y SHOTS)
// ==========================================

// Escuchar ingredientes en tiempo real
export const obtenerIngredientesEnVivo = (callback) => {
  const q = query(
    collection(db, COLECCION_INGREDIENTES),
    orderBy("fechaCreacion", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const ingredientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(ingredientes);
  }, (error) => {
    console.error("Error cargando ingredientes en vivo:", error);
    // Fallback por si no existe el índice de fechaCreacion aún
    const qSimple = collection(db, COLECCION_INGREDIENTES);
    return onSnapshot(qSimple, (snap) => {
      const ingredientes = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(ingredientes);
    });
  });
};

// Agregar un nuevo ingrediente
export const crearIngrediente = async (ingrediente) => {
  try {
    const docRef = await addDoc(collection(db, COLECCION_INGREDIENTES), {
      ...ingrediente,
      disponible: ingrediente.disponible !== undefined ? ingrediente.disponible : true,
      fechaCreacion: serverTimestamp(),
    });
    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error agregando ingrediente:", error);
    return { exito: false, error };
  }
};

// Actualizar un ingrediente (ej. cambiar nombre, tipo o marcar disponible/no disponible)
export const actualizarIngrediente = async (id, datosActualizados) => {
  try {
    const refDoc = doc(db, COLECCION_INGREDIENTES, id);
    await updateDoc(refDoc, datosActualizados);
    return { exito: true };
  } catch (error) {
    console.error("Error actualizando ingrediente:", error);
    return { exito: false, error };
  }
};

// Eliminar un ingrediente
export const eliminarIngrediente = async (id) => {
  try {
    const refDoc = doc(db, COLECCION_INGREDIENTES, id);
    await deleteDoc(refDoc);
    return { exito: true };
  } catch (error) {
    console.error("Error eliminando ingrediente:", error);
    return { exito: false, error };
  }
};
