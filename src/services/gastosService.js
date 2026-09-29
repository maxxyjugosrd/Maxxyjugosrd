import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Escuchar gastos de la colección de Contabilidad
export const obtenerGastosEnVivo = (callback) => {
  // Probar con "gastos", "movimientos" o "contabilidad"
  const q = query(collection(db, "gastos")); 
  return onSnapshot(q, (snapshot) => {
    const gastos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("Gastos traídos de Firestore:", gastos); // Inspección en Consola (F12)
    callback(gastos);
  });
};

export const obtenerRecibosEnVivo = (callback) => {
  const q = query(collection(db, "recibos"));
  return onSnapshot(q, (snapshot) => {
    const recibos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("Recibos traídos de Firestore:", recibos);
    callback(recibos);
  });
};
