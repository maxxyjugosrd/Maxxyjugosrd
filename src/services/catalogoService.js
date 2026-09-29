import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";

const COLECCION_NOMBRE = "productos";

// Escuchar los productos en tiempo real
export const obtenerProductosEnVivo = (callback) => {
  const refColeccion = collection(db, COLECCION_NOMBRE);
  return onSnapshot(refColeccion, (snapshot) => {
    const productos = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));
    callback(productos);
  });
};

// Crear un nuevo producto
export const crearProducto = async (producto) => {
  try {
    const refColeccion = collection(db, COLECCION_NOMBRE);
    const docRef = await addDoc(refColeccion, producto);
    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear producto:", error);
    return { exito: false, error };
  }
};

// Actualizar un producto existente
export const actualizarProducto = async (id, datosActualizados) => {
  try {
    const refDoc = doc(db, COLECCION_NOMBRE, id);
    await updateDoc(refDoc, datosActualizados);
    return { exito: true };
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return { exito: false, error };
  }
};

// Eliminar un producto
export const eliminarProductoBD = async (id) => {
  try {
    const refDoc = doc(db, COLECCION_NOMBRE, id);
    await deleteDoc(refDoc);
    return { exito: true };
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return { exito: false, error };
  }
};
