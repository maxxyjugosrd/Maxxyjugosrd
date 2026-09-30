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
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLECCION_CLIENTES = "clientes";

/**
 * Registra o actualiza un cliente automáticamente cada vez que se realiza un pedido
 */
export const registrarOActualizarClienteDesdePedido = async (datosPedido, idPedido) => {
  try {
    console.log("--- INICIANDO REGISTRO EN CRM ---");
    console.log("Datos del pedido recibidos en CRM:", datosPedido);

    const telefonoCliente = datosPedido.cliente?.telefono || datosPedido.telefono;
    const nombreCliente = datosPedido.cliente?.nombre;

    console.log("Teléfono extraído:", telefonoCliente);
    console.log("Nombre extraído:", nombreCliente);

    if (!telefonoCliente || telefonoCliente === "Sin teléfono" || telefonoCliente.trim() === "") {
      console.warn("⚠️ NO SE REGISTRÓ EN CRM: El teléfono está vacío, es 'Sin teléfono' o no es válido.");
      return;
    }

    const clientesRef = collection(db, COLECCION_CLIENTES);
    const q = query(clientesRef, where("telefono", "==", telefonoCliente.trim()));
    const querySnapshot = await getDocs(q);

    const nuevoHistorialItem = {
      idPedido: idPedido,
      fecha: Date.now(),
      total: datosPedido.total || 0,
      productos: datosPedido.productos || [],
      zonaEnvio: datosPedido.zonaEnvio?.nombre || "Local / Mostrador"
    };

    if (!querySnapshot.empty) {
      // El cliente ya existe -> Actualizamos su historial y métricas
      const docCliente = querySnapshot.docs[0];
      const clienteData = docCliente.data();
      const historialActual = clienteData.historialCompras || [];

      console.log("🔄 Cliente existente encontrado en Firestore (ID:", docCliente.id, "). Actualizando...");

      await updateDoc(doc(db, COLECCION_CLIENTES, docCliente.id), {
        nombre: nombreCliente || clienteData.nombre,
        ultimaCompra: serverTimestamp(),
        totalGastado: Number(clienteData.totalGastado || 0) + Number(datosPedido.total || 0),
        cantidadPedidos: (clienteData.cantidadPedidos || 0) + 1,
        direccionFrecuente: datosPedido.direccion || clienteData.direccionFrecuente || "",
        historialCompras: [nuevoHistorialItem, ...historialActual]
      });
      console.log("✅ Cliente actualizado en CRM exitosamente.");
    } else {
      // El cliente es nuevo -> Creamos su ficha en Firestore
      console.log("✨ Cliente nuevo. Creando ficha en la colección 'clientes'...");
      
      const nuevoClienteData = {
        nombre: nombreCliente || "Cliente sin nombre",
        telefono: telefonoCliente.trim(),
        direccionFrecuente: datosPedido.direccion || "",
        primeraCompra: serverTimestamp(),
        ultimaCompra: serverTimestamp(),
        totalGastado: Number(datosPedido.total || 0),
        cantidadPedidos: 1,
        historialCompras: [nuevoHistorialItem]
      };

      const docRefCliente = await addDoc(clientesRef, nuevoClienteData);
      console.log("✅ Nuevo cliente creado en CRM exitosamente con ID:", docRefCliente.id);
    }
  } catch (error) {
    console.error("❌ ERROR CRÍTICO al registrar/actualizar el cliente en CRM:", error);
  }
};

/**
 * Escucha la lista de clientes en tiempo real para la vista de CRM
 */
export const obtenerClientesEnVivo = (callback) => {
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
  });
};
