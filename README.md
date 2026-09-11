# 16 Ball Creations

*Si no existe, lo creamos.*

Sitio del estudio: https://16ballcreations.github.io

HTML, CSS y JavaScript sin frameworks ni build, publicado con GitHub Pages.

## La idea

En el pool hay quince bolas; la 16 no existe, así que la creamos. El sitio es
una mesa de pool:

- Cada sección es una bola del 1 al 8, con su color, y el menú superior es el
  rack.
- En cada visita se saca una bola al azar y la página toma su color de acento
  (`data-ball` en `<html>`). El botón "Tirar otra vez" saca otra.

## Estructura

- `index.html` — la página
- `assets/css/styles.css` — estilos; colores de las bolas en `--b1` … `--b8`
- `assets/js/main.js` — sorteo de la bola, rack activo y animaciones
- `assets/img/` — logo, bola 16 y capturas
