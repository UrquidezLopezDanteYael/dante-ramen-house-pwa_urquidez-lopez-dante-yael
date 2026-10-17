// Renderizado en el Cliente (CSR): lee catalogo.json y dibuja el menú
// agrupado por categoría, con botones para filtrar.
const catalogoEl = document.getElementById("catalogo");
const filtrosEl = document.getElementById("filtros");

function crearTarjeta(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "producto";
  tarjeta.dataset.categoria = producto.categoria;

  const foto = new Image(300, 300);
  foto.className = "producto__foto";
  foto.alt = producto.nombre;
  foto.loading = "lazy";
  foto.src = producto.imagen;
  // Si la imagen no existe, se queda el recuadro de fondo en vez del ícono roto
  foto.addEventListener("error", () => {
    foto.alt = "";
    foto.removeAttribute("src");
  });

  const nombre = document.createElement("strong");
  nombre.textContent = producto.nombre;

  const precio = document.createElement("span");
  precio.className = "precio";
  precio.textContent = `$${producto.precio} MXN`;

  const boton = document.createElement("button");
  boton.type = "button";
  boton.dataset.id = producto.id;
  boton.textContent = producto.stock > 0 ? "Agregar al carrito" : "Agotado";
  boton.disabled = producto.stock <= 0;
  // carrito.js puede escuchar este evento para agregar el producto
  boton.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("producto:agregar", { detail: producto }));
  });

  tarjeta.append(foto, nombre, precio, boton);
  return tarjeta;
}

function filtrar(categoria) {
  const todos = categoria === "Todos";

  filtrosEl.querySelectorAll(".filtro").forEach((boton) => {
    boton.setAttribute("aria-pressed", boton.dataset.categoria === categoria);
  });

  catalogoEl.querySelectorAll("[data-categoria]").forEach((elemento) => {
    const esTitulo = elemento.classList.contains("categoria-titulo");
    elemento.hidden = esTitulo ? !todos : !(todos || elemento.dataset.categoria === categoria);
  });
}

function crearFiltros(categorias) {
  const botones = ["Todos", ...categorias].map((categoria) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "filtro";
    boton.dataset.categoria = categoria;
    boton.textContent = categoria;
    boton.setAttribute("aria-pressed", categoria === "Todos");
    return boton;
  });
  filtrosEl.replaceChildren(...botones);
}

function dibujarCatalogo(productos) {
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  const fragmento = document.createDocumentFragment();

  categorias.forEach((categoria) => {
    const titulo = document.createElement("h3");
    titulo.className = "categoria-titulo";
    titulo.dataset.categoria = categoria;
    titulo.textContent = categoria;
    fragmento.append(titulo);

    productos
      .filter((p) => p.categoria === categoria)
      .forEach((p) => fragmento.append(crearTarjeta(p)));
  });

  crearFiltros(categorias);
  catalogoEl.replaceChildren(fragmento);
  catalogoEl.removeAttribute("aria-busy");
  catalogoEl.setAttribute("aria-label", "Menú");
}

filtrosEl.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".filtro");
  if (boton) filtrar(boton.dataset.categoria);
});

fetch("catalogo.json")
  .then((respuesta) => {
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return respuesta.json();
  })
  .then(dibujarCatalogo)
  .catch(() => {
    catalogoEl.removeAttribute("aria-busy");
    catalogoEl.innerHTML = '<p class="mensaje">No se pudo cargar el menú. Revisa tu conexión.</p>';
  });