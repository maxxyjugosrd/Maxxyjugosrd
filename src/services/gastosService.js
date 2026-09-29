import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLECCION_GASTOS = "gastos";
const COLECCION_RECIBOS = "recibos";

// 1. Guardar o registrar un nuevo gasto en Firestore
export const crearGasto = async (datosGasto) => {
  try {
    const docRef = await addDoc(collection(db, COLECCION_GASTOS), {
      ...datosGasto,
      monto: Number(datosGasto.monto || 0),
      fechaCreacion: serverTimestamp(),
    });
    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar gasto en Firebase:", error);
    return { exito: false, error };
  }
};

// 2. Eliminar un gasto de Firestore
export const eliminarGasto = async (idDoc) => {
  try {
    await deleteDoc(doc(db, COLECCION_GASTOS, idDoc));
    return { exito: true };
  } catch (error) {
    console.error("Error al eliminar gasto de Firebase:", error);
    return { exito: false, error };
  }
};

// 3. Escuchar la lista de gastos en tiempo real
export const obtenerGastosEnVivo = (callback) => {
  const q = query(
    collection(db, COLECCION_GASTOS),
    orderBy("fechaCreacion", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const gastos = snapshot.docs.map((doc) => ({
        id: doc.id,
        idDoc: doc.id,
        ...doc.data(),
      }));
      callback(gastos);
    },
    (error) => {
      console.error("Error escuchando gastos en vivo:", error);
      // Fallback si no existe índice de fecha
      const qSimple = collection(db, COLECCION_GASTOS);
      return onSnapshot(qSimple, (snap) => {
        const gastos = snap.docs.map((doc) => ({
          id: doc.id,
          idDoc: doc.id,
          ...doc.data(),
        }));
        callback(gastos);
      });
    }
  );
};

// 4. Escuchar la lista de recibos/personal en tiempo real
export const obtenerRecibosEnVivo = (callback) => {
  const q = collection(db, COLECCION_RECIBOS);
  return onSnapshot(q, (snapshot) => {
    const recibos = snapshot.docs.map((doc) => ({
      id: doc.id,
      idDoc: doc.id,
      ...doc.data(),
    }));
    callback(recibos);
  });
};
