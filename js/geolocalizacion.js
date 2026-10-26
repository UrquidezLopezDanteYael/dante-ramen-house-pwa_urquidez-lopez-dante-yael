// geolocalizacion.js — Acceso a una característica del dispositivo: el GPS/ubicación,
// más un mapa (librería Leaflet) que dibuja la ruta real desde el usuario
// hasta el restaurante, usando el servicio público de ruteo OSRM.
// El navegador SIEMPRE pide permiso antes de compartir la ubicación.
// Nota: por seguridad, esta API solo funciona en https:// o en localhost.

// Coordenadas de la única sucursal de Dante Ramen House.
// OJO: son APROXIMADAS (centro de Hermosillo, cerca de la Plaza Zaragoza).
// Para poner las exactas: en Google Maps haz clic derecho sobre tu local y
// copia los dos números que aparecen arriba (latitud, longitud).
const SUCURSAL = {
  nombre: "Dante Ramen House",
  direccion: "Av. Reforma 1234, Hermosillo, Sonora",
  lat: 29.0729,
  lon: -110.9559,
};

// Fórmula de Haversine: distancia en línea recta (km) entre dos puntos.
// Se usa solo como respaldo si no se puede calcular la ruta real por calles
// (sin internet, o si el servicio de ruteo no responde).
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const radioTierraKm = 6371;
  const aRadianes = (grados) => (grados * Math.PI) / 180;

  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierraKm * c;
}

// Le pide al servicio público OSRM la ruta real por calles entre el usuario y
// el restaurante. OSRM es gratuito y no necesita API key, pero su servidor de
// demostración no está pensado para producción (límite de peticiones);
// en un proyecto real conviene un servidor propio o un proveedor de pago.
// Devuelve { coords, distanciaKm, duracionMin } listo para dibujar, o null si falla.
async function obtenerRuta(origenLat, origenLon) {
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${origenLon},${origenLat};${SUCURSAL.lon},${SUCURSAL.lat}` +
    "?overview=full&geometry=geojson";

  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    if (datos.code !== "Ok") return null;

    const ruta = datos.routes[0];
    return {
      // GeoJSON trae las coordenadas como [lon, lat]; Leaflet las quiere [lat, lon]
      coords: ruta.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distanciaKm: ruta.distance / 1000,
      duracionMin: ruta.duration / 60,
    };
  } catch (error) {
    console.error("No se pudo calcular la ruta:", error);
    return null;
  }
}

let mapa; // instancia de Leaflet: se crea una sola vez y luego se reutiliza

// Dibuja el mapa con dos marcadores (tú y el restaurante) y la ruta entre ambos.
// "coordsRuta" es un array de [lat, lon] devuelto por OSRM, o null si no se
// pudo obtener: en ese caso se traza una línea recta punteada como respaldo.
function dibujarMapa(origenLat, origenLon, coordsRuta) {
  const contenedor = document.getElementById("mapa-ruta");
  contenedor.hidden = false;

  if (!mapa) {
    // "L" es el objeto global que crea la librería Leaflet (cargada en index.html)
    mapa = L.map(contenedor);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; colaboradores de OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapa);
  } else {
    // si ya existía un mapa de una búsqueda anterior, quita los marcadores/línea viejos
    mapa.eachLayer((capa) => {
      if (capa instanceof L.Marker || capa instanceof L.Polyline) mapa.removeLayer(capa);
    });
  }

  const puntoUsuario = [origenLat, origenLon];
  const puntoSucursal = [SUCURSAL.lat, SUCURSAL.lon];

  // El restaurante se marca con la mascota del logo (estilo en estilos.css)
  const iconoDante = L.icon({
    iconUrl: "icons/icon-192.png",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -26],
    className: "marcador-dante",
  });

  L.marker(puntoUsuario).addTo(mapa).bindPopup("Tú estás aquí").openPopup();
  L.marker(puntoSucursal, { icon: iconoDante }).addTo(mapa).bindPopup(`<strong>${SUCURSAL.nombre}</strong><br>${SUCURSAL.direccion}`);

  const hayRuta = Array.isArray(coordsRuta) && coordsRuta.length > 0;
  const linea = hayRuta ? coordsRuta : [puntoUsuario, puntoSucursal];
  const estiloLinea = hayRuta
    ? { color: "#28309F", weight: 5 }
    : { color: "#F46255", weight: 3, dashArray: "6 6" }; // punteada = "línea recta", no ruta real

  L.polyline(linea, estiloLinea).addTo(mapa);
  mapa.fitBounds(L.latLngBounds([puntoUsuario, puntoSucursal]), { padding: [30, 30] });

  // Bug común de Leaflet: si el contenedor estaba oculto (hidden) al crear el
  // mapa, no calcula bien su tamaño hasta que se le avisa explícitamente.
  setTimeout(() => mapa.invalidateSize(), 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("btn-ubicacion");
  const mensaje = document.getElementById("ubicacion-mensaje");
  if (!boton || !mensaje) return;

  boton.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      mensaje.textContent = "Este dispositivo no reporta ubicación.";
      return;
    }

    mensaje.textContent = "Buscando tu ubicación…";

    navigator.geolocation.getCurrentPosition(
      // función que se ejecuta SI el usuario acepta compartir su ubicación
      async (posicion) => {
        const { latitude, longitude } = posicion.coords;
        const mapaUrl = `https://www.openstreetmap.org/directions?from=${latitude}%2C${longitude}&to=${SUCURSAL.lat}%2C${SUCURSAL.lon}`;

        mensaje.textContent = "Calculando la ruta hasta el restaurante…";
        const ruta = await obtenerRuta(latitude, longitude);
        dibujarMapa(latitude, longitude, ruta ? ruta.coords : null);

        if (ruta) {
          mensaje.innerHTML =
            `Ruta hasta ${SUCURSAL.nombre}: <strong>${ruta.distanciaKm.toFixed(1)} km</strong> · ` +
            `~${Math.round(ruta.duracionMin)} min en auto. ` +
            `<a href="${mapaUrl}" target="_blank" rel="noopener">Abrir en el mapa</a>`;
        } else {
          const distanciaKm = calcularDistanciaKm(latitude, longitude, SUCURSAL.lat, SUCURSAL.lon);
          mensaje.innerHTML =
            `No se pudo calcular la ruta por calles; línea recta de ` +
            `<strong>${distanciaKm.toFixed(1)} km</strong> hasta ${SUCURSAL.nombre}. ` +
            `<a href="${mapaUrl}" target="_blank" rel="noopener">Abrir en el mapa</a>`;
        }
      },
      // función que se ejecuta SI el usuario rechaza o hay un error
      (error) => {
        mensaje.textContent = "No se pudo obtener tu ubicación: " + error.message;
      }
    );
  });
});