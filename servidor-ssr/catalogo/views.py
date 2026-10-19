from django.shortcuts import render

# "Base de datos" falsa: una lista de diccionarios en memoria con los 15
# productos del menú de Dante Ramen House (los mismos de catalogo.json).
# En un proyecto real vendrían de un modelo (models.py) y una tabla, pero para
# ENTENDER qué es SSR no hace falta: lo importante es que estos datos se
# insertan en el HTML *antes* de enviarlo al navegador.
PRODUCTOS = [
    {"nombre": "Shoyu Clásico", "categoria": "Ramen", "precio": 139, "stock": 20},
    {"nombre": "Miso Picante", "categoria": "Ramen", "precio": 149, "stock": 20},
    {"nombre": "Tonkotsu Dante", "categoria": "Ramen", "precio": 159, "stock": 20},
    {"nombre": "Ramen de Pollo", "categoria": "Ramen", "precio": 135, "stock": 20},
    {"nombre": "Ramen Vegano", "categoria": "Ramen", "precio": 129, "stock": 20},
    {"nombre": "Gyozas (5 pzas)", "categoria": "Entradas", "precio": 89, "stock": 20},
    {"nombre": "Edamames", "categoria": "Entradas", "precio": 65, "stock": 20},
    {"nombre": "Takoyaki (6 pzas)", "categoria": "Entradas", "precio": 95, "stock": 20},
    {"nombre": "Karaage", "categoria": "Entradas", "precio": 99, "stock": 20},
    {"nombre": "Té verde helado", "categoria": "Bebidas", "precio": 45, "stock": 20},
    {"nombre": "Limonada de yuzu", "categoria": "Bebidas", "precio": 55, "stock": 20},
    {"nombre": "Ramune", "categoria": "Bebidas", "precio": 55, "stock": 20},
    {"nombre": "Cerveza japonesa", "categoria": "Bebidas", "precio": 75, "stock": 20},
    {"nombre": "Mochi helado (3 pzas)", "categoria": "Postres", "precio": 75, "stock": 20},
    {"nombre": "Dorayaki", "categoria": "Postres", "precio": 65, "stock": 20},
]


def vista_ssr(request):
    """
    Vista con Renderizado en Servidor (SSR) del menú de Dante Ramen House.

    request: el objeto que representa la petición que hizo el navegador.

    Primero agrupa los productos por categoría (Ramen, Entradas, Bebidas y
    Postres). Después render() hace tres cosas:
      1) toma la plantilla 'catalogo/catalogo_ssr.html'
      2) le inyecta el diccionario de "contexto" (aquí: las categorías)
      3) devuelve el HTML final, YA CON LOS DATOS DENTRO, listo para el navegador.

    Por eso es "servidor": el HTML que llega al navegador ya trae escritos
    los nombres y precios. Si haces clic derecho > "Ver código fuente de la
    página" verás los productos en el HTML, aunque JavaScript esté desactivado.
    Compáralo con el menú CSR (csr.js), donde el HTML llega vacío y es
    JavaScript quien dibuja los productos DESPUÉS, ya en el navegador.
    """
    categorias = {}
    for producto in PRODUCTOS:
        categorias.setdefault(producto["categoria"], []).append(producto)

    contexto = {"categorias": categorias}
    return render(request, "catalogo/catalogo_ssr.html", contexto)