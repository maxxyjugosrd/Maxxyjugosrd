import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_hq0ilqb";
const TEMPLATE_ID = "template_255rdau";
const PUBLIC_KEY = "17KJ7w9kR8Ej3mZIk";

/**
 * Envía la confirmación del pedido por correo electrónico vía EmailJS
 */
export const enviarCorreoConfirmacion = async (datosOrden) => {
  try {
    // Formatear la lista de productos para la variable {{order_summary}}
    const resumenTexto = datosOrden.items
      .map((item) => `• ${item.cantidad}x ${item.nombre} - RD$ ${item.precio * item.cantidad}`)
      .join("\n");

    const parametrosPlantilla = {
      to_name: datosOrden.cliente.nombre,
      to_email: datosOrden.cliente.email || "", // Si se captura el correo del cliente
      phone: datosOrden.cliente.telefono,
      address: datosOrden.cliente.direccion,
      delivery_date: new Date().toLocaleDateString("es-DO"),
      order_summary: resumenTexto,
      total_price: `RD$ ${datosOrden.total}`,
    };

    const respuesta = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      parametrosPlantilla,
      PUBLIC_KEY
    );

    return { exito: true, respuesta };
  } catch (error) {
    console.error("Error al enviar el correo con EmailJS:", error);
    return { exito: false, error };
  }
};
