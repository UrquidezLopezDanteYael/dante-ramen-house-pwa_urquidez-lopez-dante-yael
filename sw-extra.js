// sw-extra.js — Respaldo explícito sin conexión (sw.js lo carga con importScripts).
// Si el usuario abre o recarga la página sin internet, se le entrega la copia
// guardada de index.html en vez de la pantalla de error del navegador.

const PAGINA_SIN_CONEXION = "index.html";

self.addEventListener("fetch", (evento) => {
  // Solo las navegaciones (abrir o recargar una página); lo demás lo maneja Workbox
  if (evento.request.mode !== "navigate") return;

  evento.respondWith(
    fetch(evento.request).catch(async () => {
      const copia = await caches.match(PAGINA_SIN_CONEXION, { ignoreSearch: true });
      return copia || Response.error();
    })
  );
});
