# 16 Ball Creations

*Si no existe, lo creamos.*

Sitio del estudio: https://16ballcreations.github.io

HTML, CSS y JavaScript sin frameworks ni build, publicado con GitHub Pages.

## La idea

En el pool hay quince bolas; la 16 no existe, así que la creamos. El sitio
usa negro puro, líneas de 1px en vez de sombras y tipografía editorial. El
único color viene de las bolas: en cada visita se saca una al azar y tiñe
los detalles (`data-ball` en `<html>`).

## Estructura

- `index.html` — la página
- `assets/css/styles.css` — estilos y tokens de color
- `assets/js/projects.js` — **los proyectos**; para agregar uno, copia un
  bloque y guarda su imagen en `assets/img/projects/` (1200x750, JPG)
- `assets/js/main.js` — grilla de proyectos, filtros, sorteo de bola y menú
- `assets/js/ball.js` — la bola 16 en 3D del banner (Three.js)
- `lhod/` — propuesta La House of Demons (proyecto aparte)

## La bola del banner

Es una esfera real con Three.js, girando sobre su eje vertical, con un
entorno de estudio para los reflejos. La textura (`assets/img/ball-texture.png`)
es un mapa equirectangular de 1600x800: base blanca, franja negra en el
ecuador y el círculo del número centrado en la franja, a un cuarto y a tres
cuartos del ancho. Si no hay WebGL, queda el PNG plano girando por CSS.
