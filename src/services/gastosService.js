import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Escuchar gastos de la colección 'gastos' (Contabilidad)
export const obtenerGastosEnVivo = (callback) => {
  const q = query(collection(db, "gastos"));
  return onSnapshot(q, (snapshot) => {
    const gastos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(gastos);
  });
};

// Escuchar pagos/recibos de la colección 'recibos' o 'personal'
export const obtenerRecibosEnVivo = (callback) => {
  const q = query(collection(db, "recibos")); // O "personal" según tu colección
  return onSnapshot(q, (snapshot) => {
    const recibos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(recibos);
  });
};
