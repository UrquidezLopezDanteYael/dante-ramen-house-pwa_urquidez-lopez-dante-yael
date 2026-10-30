<img width="350" height="26" alt="image" src="https://github.com/user-attachments/assets/1bf549a6-659d-43ad-97a1-caa5fea42620" /># Nombre de tu negocio — PWA de ventas

| Dato | Valor |
|---|---|
| **Alumno** | URQUIDEZ LOPEZ DANTE YAEL |
| **Grupo** | ING10-1 |
| **Negocio · giro** | DANTE RAMEN HOUSE · casa de ramen japones |
| **URL del repositorio** | https://github.com/UrquidezLopezDanteYael/dante-ramen-house-pwa_urquidez-lopez-dante-yael |
| **URL de GitHub Pages** | https://urquidezlopezdanteyael.github.io/dante-ramen-house-pwa_urquidez-lopez-dante-yael/ |

## Historial de avances

| Avance | Hash del commit entregado | Fecha |
|---|---|---|
| 1 | 69dfaa1 | 11/10/2026 |
| 2 | c03ccc4  | 18/10/2026 |
| 3 | e263f75 | 25/10/2026 |
| 4 | (se escribe en el reporte PDF) | 01/11/2026 |


## SSR vs CSR

**SSR (Django):** los productos ya vienen escritos en el HTML.

![Código fuente SSR](docs/captura-ssr.png)

**CSR (index.html + csr.js):** el div del catálogo llega vacío y JavaScript lo llena después.

![Código fuente CSR](docs/captura-csr.png)

## Funciones PWA (avance 3)

### index.html: manifest y registro del Service Worker activos
![Código fuente index.html](docs/captura-index-pwa.png)

### sw.js: Workbox precachea el catálogo y las fotos
![Código fuente sw.js](docs/captura-sw.png)
