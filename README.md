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
- `testimonio/`: el formulario de testimonios, tres preguntas sobre la persona
  (qué cambió en ella, cómo se sintió, satisfacción de 1 a 5) y cómo quiere
  aparecer (con nombre, con iniciales o sin publicar). Se envía al cerrar un
  proyecto con enlace personal: `testimonio/?nombre=Ana&marca=Café%20La%20Esquina`.
  No se indexa. Llega a la tabla `testimonials` y se lee en `/admin`, pestaña Testimonios
- `autorizacion/`: el documento de autorización de uso de imagen para los casos
  de estudio. Se completa escribiendo sobre la página o con un enlace
  (`?cliente=&proyecto=&web=&redes=&fecha=`) y se guarda como PDF. No se indexa
- `marca/`: **guía para agentes de IA** que crean documentos PDF a nombre de la
  marca (`GUIA-DOCUMENTOS-PDF.md`) y su plantilla (`plantilla-documento.html`).
  No se publica. Para convertir: `node scripts/pdf.mjs entrada.html salida.pdf`
- `v1/`: la versión anterior del sitio. Solo en el repositorio, no se publica
- `v2/`: la primera iteración de la mesa (sin vidrio ni esfera). Solo en el
  repositorio como referencia, no se publica
- La House of Demons vive en su propio repositorio: https://github.com/16ballcreations/lhod (se publica en /lhod/)

## Cloudflare: el sitio, los formularios y el panel

Todo vive en un Worker de Cloudflare llamado `page`
(https://page.16ballcreations.workers.dev):

- `scripts/build.mjs` copia el sitio a `dist/`, que es lo único que se publica.
  Si agregas una carpeta nueva al sitio, súmala a la lista de ese archivo.
- `worker/index.js` atiende lo que no es un archivo:
  - `POST /api/mira` y `POST /api/contacto` guardan cada envío en la base D1
    `16bc` (tabla `submissions`, ver `migrations/`).
  - `/admin` es el panel. Pide la clave guardada como secreto `ADMIN_PASSWORD`.
    Tiene un menú lateral con una sección para cada cosa: Inicio (lo pendiente
    de hoy), Ventas (`/admin/prospectos`, `/admin/recursos`), Lo que llega
    (`/admin/contacto`), Clientes (`/admin/mira`, `/admin/autorizaciones`,
    `/admin/testimonios`) y Ajustes (`/admin/firma`). Los enlaces viejos
    `/admin?tipo=…` llevan a la sección nueva.
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
- **Prospectos** (negocios a los que les escribimos, por campaña):
  1. La investigación de cada campaña vive en `prospectos/<campaña>/` (por
     ejemplo `prospectos/belen-2026-10/`), que **no se sube al repositorio**:
     son datos de terceros. Trae el handoff, la verificación en redes, el
     discurso de venta y `base-panel.json`, que es lo que se carga.
  2. `node scripts/prospectos-sql.mjs prospectos/<campaña>` escribe
     `tmp/prospectos-<campaña>.sql` (también fuera del repositorio), y se carga con
     `npx wrangler d1 execute 16bc --remote --file tmp/prospectos-<campaña>.sql`.
     Cargarla otra vez actualiza la investigación sin tocar el seguimiento.
  3. Para el mapa: `node scripts/prospectos-geo.mjs prospectos/<campaña>` ubica
     cada dirección en la cuadrícula de Medellín (el cruce de la calle y la
     carrera, con las calles de OpenStreetMap; las que solo dicen el barrio
     quedan aproximadas) y escribe `tmp/prospectos-geo-<campaña>.sql`, que se
     carga igual. `/admin/mapa` los muestra como sus bolas, con filtros por
     bola y etapa, y "Cómo llegar" en Google Maps. Sin claves ni costos.
  4. **A mano, en el panel:** "+ Nuevo prospecto" (`/admin/prospecto/nuevo`) agrega uno a
     una zona existente o crea una zona nueva (`zona-año-mes`); queda con código `N001`,
     `N002`… En la ficha de cada prospecto, **Jerarquía** cambia su bola (columna `bola`,
     que gana sobre la investigación y no se pierde al recargar la campaña; la 8 lo pasa
     a Descartado) y **Ubicación** lo pone en el mapa buscando la dirección o tocando el punto.
  5. En `/admin/prospectos` se filtran por prioridad, etapa o texto; cada uno
     tiene su dirección, el chat al que escribir, el primer mensaje listo para
     copiar, la etapa, el próximo paso y su historial (tablas `prospects` y
     `prospect_events`). `/admin/recursos` muestra el discurso y las notas
     de cada campaña (tabla `resources`).

Comandos:

```
npm install                 # una vez
npm run dev                 # el sitio con el Worker en http://localhost:8787
npm run deploy              # publica en Cloudflare
npm run db:migrate          # aplica migraciones nuevas a la base de producción (ANTES de deploy)
npx wrangler secret put ADMIN_PASSWORD   # crea o cambia la clave del panel
```

Para probar en local, la clave del panel va en `.dev.vars`
(`ADMIN_PASSWORD="…"`), que no se sube al repositorio.

## Buscadores (SEO)

- `index.html` lleva título y descripción con lo que hacemos y dónde, la imagen
  para compartir (`assets/img/og-16ballcreations.jpg`, 1200x630) y los datos
  estructurados (JSON-LD): el estudio como `ProfessionalService` en Medellín,
  sus servicios, el fundador, las redes y Modularity.
- `robots.txt` deja entrar a todo menos `/admin` y `/api/`, y apunta a
  `sitemap.xml`. Las páginas privadas (`/mira/`, `/testimonio/`,
  `/autorizacion/`) llevan `noindex`.
- Cuando el sitio cambie, avisa a Bing y compañía con IndexNow (la clave es el
  `.txt` de 32 caracteres en la raíz):
  ```
  curl -X POST https://api.indexnow.org/indexnow -H "Content-Type: application/json" -d "{\"host\":\"page.16ballcreations.workers.dev\",\"key\":\"<clave>\",\"urlList\":[\"https://page.16ballcreations.workers.dev/\"]}"
  ```
- Google no usa IndexNow: el sitio se registra en Google Search Console y ahí
  se envía `sitemap.xml`. Si una página nueva se vuelve pública, súmala al
  sitemap y a `scripts/build.mjs`.

## Movimiento reducido

Con `prefers-reduced-motion`, la mesa aparece quieta con las bolas ya
repartidas, la esfera no gira y las entradas animadas se apagan.
