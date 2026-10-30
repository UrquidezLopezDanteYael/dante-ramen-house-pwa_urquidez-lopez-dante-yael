// geolocalizacion.js — Acceso a la ubicación GPS y renderizado de ruta en Leaflet mediante OSRM.

const SUCURSAL = {
  nombre: "Dante Ramen House",
  direccion: "Av. Reforma 1234, Hermosillo, Sonora",
  lat: 29.0729,
  lon: -110.9559,
};

// Fórmula de Haversine (respaldo en caso de fallo de red)
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

// Obtiene la ruta por calles desde el servidor OSRM
async function obtenerRuta(origenLat, origenLon) {
  // Aseguramos que las coordenadas estén formatedas estrictamente como números sin espacios
  const origen = `${Number(origenLon)},${Number(origenLat)}`;
  const destino = `${Number(SUCURSAL.lon)},${Number(SUCURSAL.lat)}`;

  // Parámetros correctos: geometries=geojson (en plural) y sin espacios
  const url = `https://router.project-osrm.org/route/v1/driving/${origen};${destino}?overview=full&geometries=geojson`;

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    if (datos.code !== "Ok" || !datos.routes || datos.routes.length === 0) return null;

    const ruta = datos.routes[0];
    return {
      // OSRM devuelve [lon, lat]; Leaflet requiere [lat, lon]
      coords: ruta.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distanciaKm: ruta.distance / 1000,
      duracionMin: ruta.duration / 60,
    };
  } catch (error) {
    console.error("No se pudo calcular la ruta:", error);
    return null;
  }
}

let mapa;

function dibujarMapa(origenLat, origenLon, coordsRuta) {
  const contenedor = document.getElementById("mapa-ruta");
  if (!contenedor) return;
  contenedor.hidden = false;

  if (!mapa) {
    mapa = L.map(contenedor);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; colaboradores de OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapa);
  } else {
    mapa.eachLayer((capa) => {
      if (capa instanceof L.Marker || capa instanceof L.Polyline) mapa.removeLayer(capa);
    });
  }

  const puntoUsuario = [origenLat, origenLon];
  const puntoSucursal = [SUCURSAL.lat, SUCURSAL.lon];

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
    : { color: "#F46255", weight: 3, dashArray: "6 6" };

  L.polyline(linea, estiloLinea).addTo(mapa);
  mapa.fitBounds(L.latLngBounds([puntoUsuario, puntoSucursal]), { padding: [30, 30] });

  setTimeout(() => mapa.invalidateSize(), 100);
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
      (error) => {
        mensaje.textContent = "No se pudo obtener tu ubicación: " + error.message;
      }
    );
  });
});