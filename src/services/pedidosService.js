import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Nombre de la colección en Firestore
const COLECCION_PEDIDOS = "pedidos";
const COLECCION_CLIENTES = "clientes";

/**
 * Guarda un nuevo pedido (Web o POS WhatsApp) en Firebase Firestore 
 * y gestiona automáticamente el perfil, historial y herencia de vendedor del cliente.
 */
export const crearPedido = async (datosPedido) => {
  try {
    console.log("📥 Datos completos recibidos al crear pedido:", datosPedido);

    // 1. Detectar datos clave del cliente
    const telefonoCliente = 
      datosPedido.cliente?.telefono || 
      datosPedido.telefono || 
      datosPedido.celular || 
      datosPedido.telefonoCliente || "";

    const nombreCliente = 
      datosPedido.cliente?.nombre || 
      datosPedido.nombre || 
      datosPedido.nombreCliente || 
      "Cliente sin nombre";

    console.log("📞 Teléfono detectado para el CRM:", telefonoCliente);
    console.log("👤 Nombre detectado para el CRM:", nombreCliente);

    // 2. HERENCIA AUTOMÁTICA DE VENDEDOR
    // Si el pedido no trae un vendedor explícito, revisamos si el cliente ya tiene uno asignado en el CRM.
    let vendedorHeredado = datosPedido.vendedor || datosPedido.vendedorAsignado || "";

    if (telefonoCliente && telefonoCliente !== "Sin teléfono" && String(telefonoCliente).trim() !== "") {
      const clientesRef = collection(db, COLECCION_CLIENTES);
      const qCliente = query(clientesRef, where("telefono", "==", String(telefonoCliente).trim()));
      const querySnapshotCliente = await getDocs(qCliente);

      if (!querySnapshotCliente.empty) {
        const datosC = querySnapshotCliente.docs[0].data();
        if ((!vendedorHeredado || vendedorHeredado === "Sin Asignar") && datosC.vendedorAsignado && datosC.vendedorAsignado !== "Sin Asignar") {
          vendedorHeredado = datosC.vendedorAsignado;
          console.log("🤝 Vendedor heredado automáticamente del cliente existente:", vendedorHeredado);
        }
      }
    }

    // 3. Guardar el pedido en la colección 'pedidos' con el vendedor asignado/heredado
    const docRef = await addDoc(collection(db, COLECCION_PEDIDOS), {
      ...datosPedido,
      vendedor: vendedorHeredado || "Sin Asignar",
      vendedorAsignado: vendedorHeredado || "Sin Asignar",
      estado: datosPedido.estado || "Pendiente",
      fecha: serverTimestamp(),
    });

    console.log("✅ Pedido guardado en 'pedidos' con ID:", docRef.id);

    // 4. Gestionar automáticamente el cliente en la colección 'clientes'
    if (telefonoCliente && telefonoCliente !== "Sin teléfono" && String(telefonoCliente).trim() !== "") {
      const clientesRef = collection(db, COLECCION_CLIENTES);
      const q = query(clientesRef, where("telefono", "==", String(telefonoCliente).trim()));
      const querySnapshot = await getDocs(q);

      const nuevoHistorialItem = {
        idPedido: docRef.id,
        fecha: Date.now(),
        total: Number(datosPedido.total) || 0,
        productos: datosPedido.productos || [],
        zonaEnvio: datosPedido.zonaEnvio?.nombre || datosPedido.zonaEnvio || "Local / Mostrador"
      };

      if (!querySnapshot.empty) {
        // El cliente ya existe -> Actualizamos su historial, métricas y aseguramos su vendedor
        const docCliente = querySnapshot.docs[0];
        const clienteData = docCliente.data();
        const historialActual = clienteData.historialCompras || [];

        // Mantener el vendedor actual del cliente a menos que tuviera "Sin Asignar" y ahora se le haya asignado uno
        const vendedorFinalCliente = 
          (!clienteData.vendedorAsignado || clienteData.vendedorAsignado === "Sin Asignar") && vendedorHeredado 
            ? vendedorHeredado 
            : (clienteData.vendedorAsignado || "Sin Asignar");

        await updateDoc(doc(db, COLECCION_CLIENTES, docCliente.id), {
          nombre: nombreCliente !== "Cliente sin nombre" ? nombreCliente : clienteData.nombre,
          vendedorAsignado: vendedorFinalCliente,
          ultimaCompra: serverTimestamp(),
          totalGastado: Number(clienteData.totalGastado || 0) + Number(datosPedido.total || 0),
          cantidadPedidos: (clienteData.cantidadPedidos || 0) + 1,
          direccionFrecuente: datosPedido.direccion || clienteData.direccionFrecuente || "",
          historialCompras: [nuevoHistorialItem, ...historialActual]
        });
        console.log("🔄 Cliente existente actualizado en CRM.");
      } else {
        // El cliente es nuevo -> Creamos su ficha automáticamente
        await addDoc(clientesRef, {
          nombre: nombreCliente,
          telefono: String(telefonoCliente).trim(),
          direccionFrecuente: datosPedido.direccion || "",
          vendedorAsignado: vendedorHeredado || "Sin Asignar",
          primeraCompra: serverTimestamp(),
          ultimaCompra: serverTimestamp(),
          totalGastado: Number(datosPedido.total || 0),
          cantidadPedidos: 1,
          historialCompras: [nuevoHistorialItem]
        });
        console.log("✨ Nuevo cliente creado en CRM con éxito.");
      }
    } else {
      console.warn("⚠️ No se pudo registrar en CRM porque no se encontró un teléfono válido en el pedido.");
    }

    return { exito: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Error al guardar el pedido y actualizar el cliente:", error);
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
      ...doc.data(),
      idDoc: doc.id,
      id: doc.id,
    }));
    callback(pedidos);
  });
};

/**
 * Elimina un pedido por su ID de Firestore
 */
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

/**
 * Actualiza los datos de un pedido existente
 */
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
