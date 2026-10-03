# 16 Ball Creations

*Si no existe, lo creamos.*

Sitio del estudio: https://page.16ballcreations.workers.dev

HTML, CSS y JavaScript sin frameworks, publicado en un Worker de Cloudflare
(ver "Cloudflare" más abajo). Se publica con `npm run deploy`: subir a `main`
guarda el código, pero ya no publica nada.

`16ballcreations.github.io` solo redirige: GitHub Pages publica la rama
`redirect`, que manda cada ruta a la misma ruta en Cloudflare. `/lhod/` y
`/rivas-seven/` siguen en GitHub, servidas desde sus propios repositorios.

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
- `mira/`: **MIRA** (Marca, Imagen, Redes y Alineación), el cuestionario de cinco
  preguntas para entender al cliente antes de proponerle nada. Estilos en
  `assets/css/mira.css`, lógica en `assets/js/mira.js`; las respuestas se envían
  por correo, como el formulario de contacto. No está enlazado desde el inicio ni
  se indexa: se envía después de la primera llamada, a quien sabemos que podemos
  ayudar. El enlace personal saluda y rellena: `mira/?nombre=Ana&marca=Café%20La%20Esquina`
- `autorizacion/`: el documento de autorización de uso de imagen para los casos
  de estudio. Se completa escribiendo sobre la página o con un enlace
  (`?cliente=&proyecto=&web=&redes=&fecha=`) y se guarda como PDF. No se indexa
- `marca/`: **guía para agentes de IA** que crean documentos PDF a nombre de la
  marca (`GUIA-DOCUMENTOS-PDF.md`) y su plantilla (`plantilla-documento.html`).
  No se publica. Para convertir: `node scripts/pdf.mjs entrada.html salida.pdf`
- `v1/`: la versión anterior del sitio, publicada en /v1/
- `v2/`: la primera iteración de la mesa (sin vidrio ni esfera), guardada como referencia en /v2/
- La House of Demons vive en su propio repositorio: https://github.com/16ballcreations/lhod (se publica en /lhod/)

## Cloudflare: el sitio, los formularios y el panel

Todo vive en un Worker de Cloudflare llamado `page`
(https://page.16ballcreations.workers.dev):

- `scripts/build.mjs` copia el sitio a `dist/`, que es lo único que se publica.
  Si agregas una carpeta nueva al sitio, súmala a la lista de ese archivo.
- `worker/index.js` atiende lo que no es un archivo:
  - `POST /api/mira` y `POST /api/contacto` guardan cada envío en la base D1
    `16bc` (tabla `submissions`, ver `migrations/`).
  - `/admin` es el panel para leer los envíos y marcarlos como revisados. Pide
    la clave guardada como secreto `ADMIN_PASSWORD`.
- Si el envío falla, los formularios abren el correo del visitante con todo
  armado, así que nada se pierde.
- **Autorizaciones de uso de imagen** (casos de estudio):
  1. En `/admin/firma` Renne registra su firma una vez (se le quita el fondo en
     el navegador y se guarda en la tabla privada `settings`, nunca en el repo).
  2. En `/admin/autorizacion` se crean con los datos del cliente; salen ya
     firmadas por Renne y dan un enlace `/autorizacion/?t=…` para el cliente.
  3. El cliente firma en la zona blanca, pone su documento y acepta. La firma es
     definitiva; queda con fecha, IP y navegador en la tabla `authorizations`.
     Cualquiera con el enlace puede volver a abrirla y guardarla en PDF.
  Sin `?t=`, `/autorizacion/` sigue siendo la plantilla editable a mano.

Comandos:

```
npm install                 # una vez
npm run dev                 # el sitio con el Worker en http://localhost:8787
npm run deploy              # publica en Cloudflare
npm run db:migrate          # aplica migraciones nuevas a la base de producción
npx wrangler secret put ADMIN_PASSWORD   # crea o cambia la clave del panel
```

Para probar en local, la clave del panel va en `.dev.vars`
(`ADMIN_PASSWORD="…"`), que no se sube al repositorio.

## Movimiento reducido

Con `prefers-reduced-motion`, la mesa aparece quieta con las bolas ya
repartidas, la esfera no gira y las entradas animadas se apagan.
