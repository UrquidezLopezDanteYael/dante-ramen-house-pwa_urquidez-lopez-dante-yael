// animaciones.js — efectos al hacer scroll: encabezado compacto y elementos que aparecen
// Si el usuario pidió "reducir movimiento" en su sistema, todo se muestra sin animar.

const reducirMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1) El encabezado se hace más delgado al bajar
const encabezado = document.querySelector(".appbar");

function alHacerScroll() {
  encabezado?.classList.toggle("compacto", window.scrollY > 24);
}

window.addEventListener("scroll", alHacerScroll, { passive: true });
alHacerScroll();

// 2) Los elementos con data-aparece entran con una animación cuando se ven en pantalla
const observador =
  "IntersectionObserver" in window && !reducirMovimiento
    ? new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            entrada.target.classList.add("visible");
            observador.unobserve(entrada.target);
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
      )
    : null;

function preparar(elemento) {
  if (!observador) {
    elemento.classList.add("visible");
    return;
  }

  // Retraso escalonado entre hermanos para que no aparezcan todos a la vez
  const hermanos = [...elemento.parentElement.children].filter((h) => h.hasAttribute("data-aparece"));
  elemento.style.setProperty("--retraso", `${(hermanos.indexOf(elemento) % 4) * 70}ms`);
  observador.observe(elemento);
}

document.querySelectorAll("[data-aparece]").forEach(preparar);

// Las tarjetas del menú las dibuja csr.js después de cargar: también las observamos
const catalogo = document.getElementById("catalogo");

if (catalogo) {
  new MutationObserver((cambios) => {
    cambios.forEach((cambio) =>
      cambio.addedNodes.forEach((nodo) => {
        if (nodo.nodeType !== 1) return;
        if (nodo.matches("[data-aparece]")) preparar(nodo);
        nodo.querySelectorAll("[data-aparece]").forEach(preparar);
      })
    );
  }).observe(catalogo, { childList: true });
}
