// notificaciones.js — Notification API
// Esta es la API del NAVEGADOR (no del sistema push completo, que necesitaría
// un servidor con claves VAPID). Sirve para mostrar avisos del lado del cliente
// y para entender el permiso que el usuario debe conceder.

const TITULO_NOTIFICACION = "Dante Ramen House";
const OPCIONES_NOTIFICACION = {
  body: "¡Listo! Te avisaremos cuando haya nuevas ofertas de ramen.",
  icon: "icons/icon-192.png",
};

// En celulares (Android) new Notification() no funciona; ahí hay que usar el
// Service Worker. Si ya hay uno registrado lo usamos, y si no, la forma directa.
async function mostrarNotificacion() {
  const registro = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;

  if (registro) {
    await registro.showNotification(TITULO_NOTIFICACION, OPCIONES_NOTIFICACION);
  } else {
    new Notification(TITULO_NOTIFICACION, OPCIONES_NOTIFICACION);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("btn-notificar");
  const mensaje = document.getElementById("notificaciones-mensaje");
  if (!boton || !mensaje) {
    console.warn("notificaciones.js: falta #btn-notificar o #notificaciones-mensaje en el HTML.");
    return;
  }

  boton.addEventListener("click", async () => {
    // "Notification" no existe en todos los navegadores/contextos; lo comprobamos primero
    if (!("Notification" in window)) {
      mensaje.textContent = "Este navegador no soporta notificaciones.";
      return;
    }

    // Si el usuario ya las bloqueó, el navegador no vuelve a preguntar
    if (Notification.permission === "denied") {
      mensaje.textContent = "Las notificaciones están bloqueadas. Actívalas desde el candado junto a la dirección del sitio.";
      return;
    }

    // Notification.requestPermission() abre el diálogo del navegador
    // ("bloquear" / "permitir"). Devuelve una promesa con la respuesta del usuario.
    // Chrome a veces solo muestra un ícono de campana en la barra de direcciones,
    // así que avisamos de inmediato para que el botón nunca parezca muerto.
    if (Notification.permission !== "granted") {
      mensaje.textContent = "Responde en el cuadro del navegador (o en la campana de la barra de direcciones)…";
    }
    const permiso = await Notification.requestPermission();

    if (permiso !== "granted") {
      mensaje.textContent = "No diste permiso para notificaciones.";
      return;
    }

    try {
      await mostrarNotificacion();
      mensaje.textContent = "Notificaciones activadas.";
    } catch (error) {
      console.error("Notificación:", error);
      mensaje.textContent = "No se pudo mostrar la notificación en este dispositivo.";
    }
  });
});