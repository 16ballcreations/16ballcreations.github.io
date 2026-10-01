# 16 Ball Creations

*Si no existe, lo creamos.*

Sitio del estudio: https://16ballcreations.github.io

HTML, CSS y JavaScript sin frameworks ni build, publicado con GitHub Pages.

## La idea

En el pool hay quince bolas; la 16 no existe, así que la creamos. El banner
es una mesa de pool jugable: las quince bolas rompen solas, y la 16 se arma
con partículas que se desprenden de una esfera gigante, también de
partículas, que flota detrás de toda la página. El visitante tira arrastrando
(o tocando, en el teléfono), y la primera bola que golpea tiñe el sitio: el
paño, las superficies y los acentos toman su color.

El resto es negro, vidrio esmerilado y tipografía editorial (Instrument Serif,
Inter y JetBrains Mono).

## Estructura

- `index.html`: la página
- `assets/css/site.css`: estilos; los colores de las bolas y la pila de
  superficies teñidas están en `:root`
- `assets/js/projects.js`: **los proyectos**; para agregar uno, copia un
  bloque y guarda su imagen en `assets/img/projects/` (1200x750, JPG)
  Los que no tienen portada propia llevan `archived: true` y salen en
  "Del archivo", en una línea y sin imagen
- `assets/js/site.js`: índice de proyectos, filtros, manifiesto, cinta,
  riel del proceso, formulario de contacto y menú
- `assets/js/table.js`: la mesa: física, bolas sombreadas por píxel y la
  formación de la 16
- `assets/js/orb.js`: la esfera de partículas del fondo y su recorrido por
  las secciones
- `v1/`: la versión anterior del sitio, publicada en /v1/
- `v2/`: la primera iteración de la mesa (sin vidrio ni esfera), guardada como referencia en /v2/
- La House of Demons vive en su propio repositorio: https://github.com/16ballcreations/lhod (se publica en /lhod/)

## El formulario de contacto

GitHub Pages no tiene servidor, así que el formulario no envía nada: arma el
correo (asunto y cuerpo) y lo abre en la aplicación de correo del visitante.

## Movimiento reducido

Con `prefers-reduced-motion`, la mesa aparece quieta con las bolas ya
repartidas, la esfera no gira y las entradas animadas se apagan.
