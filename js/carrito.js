// Carrito de compras: agregar, sumar/restar, quitar y total.
// Se guarda en localStorage para que siga ahí al recargar la página.
const CLAVE = "carrito-dante";

const listaEl = document.getElementById("carrito-lista");
const totalEl = document.getElementById("carrito-total");
const mensajeEl = document.getElementById("carrito-mensaje");

let carrito = cargar();

function esItemValido(item) {
  return (
    item &&
    Number.isFinite(item.id) &&
    typeof item.nombre === "string" &&
    Number.isFinite(item.precio) &&
    Number.isInteger(item.cantidad) &&
    item.cantidad > 0
  );
}

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(datos) ? datos.filter(esItemValido) : [];
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(carrito));
  } catch {
    // Almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria
  }
}

function limiteDe(item) {
  return Number.isFinite(item.stock) ? item.stock : Infinity;
}

function avisar(texto = "") {
  mensajeEl.textContent = texto;
}

function agregar(producto) {
  const item = carrito.find((i) => i.id === producto.id);

  if (item) {
    if (item.cantidad >= limiteDe(item)) {
      avisar(`Solo hay ${limiteDe(item)} de ${item.nombre}.`);
      return;
    }
    item.cantidad++;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      cantidad: 1,
    });
  }

  avisar(`${producto.nombre} agregado al carrito.`);
  actualizar();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find((i) => i.id === id);
  if (!item) return;

  const nueva = item.cantidad + delta;
  if (nueva < 1) return;
  if (nueva > limiteDe(item)) {
    avisar(`Solo hay ${limiteDe(item)} de ${item.nombre}.`);
    return;
  }

  item.cantidad = nueva;
  avisar();
  actualizar();
}

function quitar(id) {
  carrito = carrito.filter((i) => i.id !== id);
  avisar();
  actualizar();
}

function actualizar() {
  guardar();
  render();
}

function crearBoton(texto, accion, item, etiqueta, clase = "") {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = texto;
  boton.dataset.accion = accion;
  boton.dataset.id = item.id;
  boton.setAttribute("aria-label", `${etiqueta} ${item.nombre}`);
  if (clase) boton.className = clase;
  return boton;
}

function crearFila(item) {
  const fila = document.createElement("li");

  const nombre = document.createElement("span");
  nombre.className = "carrito-nombre";
  nombre.textContent = item.nombre;

  const cantidad = document.createElement("div");
  cantidad.className = "carrito-cantidad";
  const menos = crearBoton("−", "restar", item, "Restar una unidad de");
  menos.disabled = item.cantidad <= 1;
  const valor = document.createElement("span");
  valor.className = "carrito-cantidad__valor";
  valor.textContent = item.cantidad;
  const mas = crearBoton("+", "sumar", item, "Sumar una unidad de");
  mas.disabled = item.cantidad >= limiteDe(item);
  cantidad.append(menos, valor, mas);

  const precio = document.createElement("span");
  precio.className = "carrito-precio";
  precio.textContent = `$${(item.precio * item.cantidad).toLocaleString("es-MX")}`;

  const quitarBtn = crearBoton("Quitar", "quitar", item, "Quitar del carrito", "carrito-quitar");

  fila.append(nombre, cantidad, precio, quitarBtn);
  return fila;
}

function render() {
  if (carrito.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "carrito-vacio";
    vacio.textContent = "Tu carrito está vacío.";
    listaEl.replaceChildren(vacio);
  } else {
    listaEl.replaceChildren(...carrito.map(crearFila));
  }

  const total = carrito.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  totalEl.textContent = total.toLocaleString("es-MX");
}

// Los botones "Agregar al carrito" (csr.js) avisan con este evento
document.addEventListener("producto:agregar", (evento) => agregar(evento.detail));

listaEl.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "sumar") cambiarCantidad(id, 1);
  else if (boton.dataset.accion === "restar") cambiarCantidad(id, -1);
  else if (boton.dataset.accion === "quitar") quitar(id);
});

// Si el carrito cambia en otra pestaña, se refleja aquí
window.addEventListener("storage", (evento) => {
  if (evento.key !== CLAVE) return;
  carrito = cargar();
  render();
});

render();