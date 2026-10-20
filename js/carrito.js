// carrito.js — Carrito de Dante Ramen House: almacenamiento local y "sincronización" offline/online
// Usamos localStorage: una caja de guardado que vive DENTRO del navegador
// y sobrevive aunque cierres la pestaña o se vaya el internet.

const CLAVE_CARRITO = "dante-ramen-carrito";

// Evita que un nombre con símbolos raros rompa el HTML al insertarlo con innerHTML
function escapar(texto) {
  const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texto).replace(/[&<>"']/g, (c) => reemplazos[c]);
}

function itemValido(item) {
  return (
    item &&
    Number.isFinite(item.id) &&
    typeof item.nombre === "string" &&
    Number.isFinite(item.precio) &&
    Number.isInteger(item.cantidad) &&
    item.cantidad > 0
  );
}

// Lee el carrito guardado en localStorage (si no hay nada o está dañado, regresa un array vacío)
function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO)); // localStorage solo guarda texto
    return Array.isArray(datos) ? datos.filter(itemValido) : [];
  } catch {
    return [];
  }
}

// Guarda el array del carrito en localStorage (JSON.stringify lo convierte a texto)
function guardarCarrito(carrito) {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch {
    // Almacenamiento lleno o bloqueado: el carrito sigue funcionando mientras la página esté abierta
  }
}

// Cuántas unidades hay disponibles de un producto (catalogo.json trae el "stock")
function limiteDe(item) {
  return Number.isFinite(item.stock) ? item.stock : Infinity;
}

function mostrarMensaje(texto = "") {
  document.getElementById("carrito-mensaje").textContent = texto;
}

// Agrega un producto al carrito (o le sube la cantidad si ya estaba)
function agregarAlCarrito(producto) {
  const carrito = leerCarrito();
  const existente = carrito.find((item) => item.id === producto.id);

  if (existente) {
    if (existente.cantidad >= limiteDe(existente)) {
      mostrarMensaje(`Solo hay ${limiteDe(existente)} de ${existente.nombre}.`);
      return;
    }
    existente.cantidad += 1;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      cantidad: 1,
    });
  }

  mostrarMensaje(`${producto.nombre} agregado al carrito.`);
  guardarCarrito(carrito);
  pintarCarrito();
}

// Sube o baja la cantidad de un producto ya en el carrito con los botones +/-;
// si la cantidad llega a 0, el producto se quita solo.
function cambiarCantidad(id, delta) {
  const carrito = leerCarrito();
  const item = carrito.find((item) => item.id === id);
  if (!item) return;

  if (delta > 0 && item.cantidad >= limiteDe(item)) {
    mostrarMensaje(`Solo hay ${limiteDe(item)} de ${item.nombre}.`);
    return;
  }

  item.cantidad += delta;
  const actualizado = item.cantidad <= 0 ? carrito.filter((item) => item.id !== id) : carrito;

  mostrarMensaje();
  guardarCarrito(actualizado);
  pintarCarrito();
}

// Quita un producto del carrito sin importar su cantidad
function quitarDelCarrito(id) {
  const carrito = leerCarrito().filter((item) => item.id !== id);
  mostrarMensaje();
  guardarCarrito(carrito);
  pintarCarrito();
}

// Dibuja el carrito en pantalla a partir de lo que hay en localStorage.
// La cantidad va en su propia columna (con botones - / +), separada del
// nombre y del precio.
function pintarCarrito() {
  const carrito = leerCarrito();
  const lista = document.getElementById("carrito-lista");
  const total = document.getElementById("carrito-total");

  lista.innerHTML = "";
  let suma = 0;

  if (carrito.length === 0) {
    lista.innerHTML = '<li class="carrito-vacio">Tu carrito está vacío.</li>';
  }

  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    suma += subtotal;
    const nombre = escapar(item.nombre);

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="carrito-nombre">${nombre}</span>
      <span class="carrito-cantidad">
        <button type="button" data-accion="restar" data-id="${item.id}" aria-label="Quitar una unidad de ${nombre}">−</button>
        <span class="carrito-cantidad__valor">${item.cantidad}</span>
        <button type="button" data-accion="sumar" data-id="${item.id}" aria-label="Agregar una unidad de ${nombre}"${item.cantidad >= limiteDe(item) ? " disabled" : ""}>+</button>
      </span>
      <span class="carrito-precio">$${subtotal.toLocaleString("es-MX")}</span>
      <button type="button" class="carrito-quitar" data-accion="quitar" data-id="${item.id}" aria-label="Quitar ${nombre} del carrito">Quitar</button>
    `;
    lista.appendChild(li);
  });

  total.textContent = suma.toLocaleString("es-MX");
}

// Un solo listener en <ul id="carrito-lista"> atiende los clics de TODOS los
// botones +/-/Quitar (delegación de eventos), incluso los que se crean después
// dinámicamente cada vez que pintarCarrito() vuelve a dibujar la lista.
function manejarClicCarrito(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "sumar") cambiarCantidad(id, 1);
  if (boton.dataset.accion === "restar") cambiarCantidad(id, -1);
  if (boton.dataset.accion === "quitar") quitarDelCarrito(id);
}

// "Sincronizar": en una app real esto haría un fetch() con method: "POST" al
// servidor. Aquí lo simulamos para enseñar el patrón offline -> online.
function sincronizarCarrito() {
  if (!navigator.onLine) {
    // navigator.onLine: propiedad del navegador que dice si hay conexión
    mostrarMensaje("Sin conexión: tu pedido se sincronizará cuando vuelva el internet.");
    return;
  }

  // Aquí iría: fetch("https://mi-api.com/pedidos", { method: "POST", body: ... })
  mostrarMensaje("Carrito sincronizado con Dante Ramen House (simulado). ✓");
}

document.addEventListener("DOMContentLoaded", () => {
  pintarCarrito();
  document.getElementById("carrito-lista").addEventListener("click", manejarClicCarrito);
  document.getElementById("btn-sincronizar")?.addEventListener("click", sincronizarCarrito);

  // Los botones "Agregar al carrito" de csr.js avisan con este evento
  document.addEventListener("producto:agregar", (evento) => agregarAlCarrito(evento.detail));

  // Estos eventos del navegador avisan cuando se pierde o regresa la conexión
  window.addEventListener("online", sincronizarCarrito);
  window.addEventListener("offline", () => mostrarMensaje("Se perdió la conexión."));

  // Si el carrito cambia en otra pestaña, se refleja aquí
  window.addEventListener("storage", (evento) => {
    if (evento.key === CLAVE_CARRITO) pintarCarrito();
  });
});