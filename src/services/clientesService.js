import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLECCION_CLIENTES = "clientes";

/**
 * Escucha la lista de clientes en tiempo real para la vista de CRM
 */
export const obtenerClientesEnVivo = (callback) => {
  try {
    const q = query(
      collection(db, COLECCION_CLIENTES),
      orderBy("ultimaCompra", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const clientes = snapshot.docs.map((doc) => ({
        ...doc.data(),
        idDoc: doc.id,
        id: doc.id,
      }));
      callback(clientes);
    }, (error) => {
      console.error("Error en el listener de clientes:", error);
      callback([]);
    });
  } catch (error) {
    console.error("Error al configurar obtenerClientesEnVivo:", error);
    callback([]);
  }
};

/**
 * Agrega un cliente manualmente desde el botón "+ Nuevo Cliente"
 */
export const crearClienteManual = async (datosCliente) => {
  try {
    const clientesRef = collection(db, COLECCION_CLIENTES);
    
    // Verificar si ya existe por teléfono
    if (datosCliente.telefono) {
      const q = query(clientesRef, where("telefono", "==", datosCliente.telefono.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { exito: false, error: "Ya existe un cliente registrado con este número de teléfono." };
      }
    }

    const docRef = await addDoc(clientesRef, {
      nombre: datosCliente.nombre || "Sin nombre",
      telefono: datosCliente.telefono || "",
      direccionFrecuente: datosCliente.direccionFrecuente || "",
      primeraCompra: serverTimestamp(),
      ultimaCompra: serverTimestamp(),
      totalGastado: Number(datosCliente.totalGastado) || 0,
      cantidadPedidos: Number(datosCliente.cantidadPedidos) || 0,
      historialCompras: []
    });

    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear cliente manual:", error);
    return { exito: false, error };
  }
};

/**
 * Elimina un cliente del CRM
 */
export const eliminarCliente = async (idDoc) => {
  try {
    await deleteDoc(doc(db, COLECCION_CLIENTES, idDoc));
    return { exito: true };
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
    return { exito: false, error };
  }
};
