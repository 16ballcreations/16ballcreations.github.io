# Guía de SEO

Versión 0.3 · borrador para revisión · 20 nov 2026

Esta guía sirve para dos cosas: que una persona revise o construya un sitio con buen SEO, y que un agente lo audite con el mismo criterio. Cada recomendación se contrastó con la documentación oficial de Google (ver [Referencias](#17-referencias)). Donde una práctica común choca con lo que dice Google, manda Google, y la corrección queda en la sección [Lo que no funciona](#15-lo-que-no-funciona-mitos-y-correcciones).

El checklist operativo para agentes está en [checklist-seo-agente.md](checklist-seo-agente.md). Cada punto del checklist tiene el mismo código que la sección de esta guía que lo explica.

---

## 0. Cómo leer esta guía

Cada recomendación lleva una marca de evidencia:

| Marca | Qué significa | Cómo tratarla |
|---|---|---|
| **[G]** | Lo dice Google en su documentación oficial (Search Central). | Obligatoria. |
| **[P]** | Práctica común de la industria que Google no exige, pero que no contradice. | Recomendada. Se puede saltar con una razón. |
| **[O]** | Lo dice la documentación oficial de otro buscador o sistema de IA (Bing, OpenAI). | Obligatoria si se quiere aparecer ahí. |

Y cada punto tiene una prioridad:

- **Crítico:** si falla, el sitio no aparece o aparece mal. Se arregla antes que todo.
- **Importante:** afecta cómo se ve y cuánto se elige el sitio.
- **Mejora:** suma, pero no bloquea nada.

Las prácticas de spam (sección 14) no tienen prioridad: están prohibidas. El [checklist](checklist-seo-agente.md) convierte estas prioridades en una **puntuación de 0 a 100** con niveles e insignias, para saber qué tan bien va un sitio y qué arreglar primero.

### Cinco principios

1. **Primero para personas.** Google premia el contenido que ayuda a quien lo lee, no el que se escribe para el buscador. Si una técnica empeora la lectura, no se usa. [G]
2. **Que Google pueda ver la página.** Si no la rastrea ni la indexa, nada más importa. [G]
3. **Una página, un tema, una dirección.** Cada página responde a una intención de búsqueda y tiene una sola URL. [G]
4. **Lo mismo en todas partes.** Nombre, servicio, zona y datos de contacto iguales en el sitio, el perfil de Google, las redes y los directorios. Esto también es lo que lee la IA. [G][P]
5. **Medir antes y después.** Sin línea base no se puede decir si algo funcionó, y los cambios tardan semanas en verse. [G]

---

## 1. Medición y herramientas (MED)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| MED-01 | Verificar el sitio en **Google Search Console**. Es la fuente principal de datos de búsqueda y de errores. | [G] | Crítico |
| MED-02 | Verificar el sitio en **Bing Webmaster Tools**. Copilot y otros asistentes usan el índice de Bing. | [O] | Importante |
| MED-03 | Instalar **Google Analytics 4** (o equivalente) con las conversiones que le importan al negocio: formulario, WhatsApp, llamada. | [G] | Importante |
| MED-04 | Registrar la **línea base** antes de cambiar nada: páginas indexadas, clics e impresiones de los últimos 3 meses, Core Web Vitals y la prueba de IA (sección 11). | [P] | Importante |
| MED-05 | Tener paciencia: Google dice que los cambios pueden tardar de horas a meses en reflejarse. Esperar unas semanas antes de juzgar un cambio. | [G] | — |

**Nota:** la «Prueba de optimización para móviles» de Google ya no existe (se retiró en diciembre de 2023), aunque muchas guías todavía la recomiendan. Para revisar móvil se usa **Lighthouse** (en Chrome) o **PageSpeed Insights**.

---

## 2. Rastreo e indexación (IDX)

Si Google no puede rastrear o indexar una página, no aparece. Es lo primero que se revisa.

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| IDX-01 | Buscar `site:dominio.com` en Google para ver si el sitio está en el índice y cuántas páginas aparecen. | [G] | Crítico |
| IDX-02 | Revisar el informe **«Indexación de páginas»** de Search Console (antes se llamaba «Cobertura»). Toda página importante debe estar indexada, o tener una razón clara para no estarlo. | [G] | Crítico |
| IDX-03 | Usar la **Inspección de URLs** de Search Console en las páginas clave para ver la página como la ve Google. | [G] | Crítico |
| IDX-04 | `robots.txt` existe, no bloquea CSS ni JavaScript necesarios para mostrar la página, y apunta al sitemap. | [G] | Crítico |
| IDX-05 | **`robots.txt` no sirve para sacar páginas de Google.** Controla el rastreo, no la indexación. Para que una página no aparezca se usa `noindex`. | [G] | Crítico |
| IDX-06 | Llevan `noindex` las páginas que no deben aparecer: gracias, búsqueda interna, filtros, pruebas. | [P] | Importante |
| IDX-07 | Hay un **sitemap XML** con todas las páginas indexables y solo ellas (ni falta ninguna ni sobra ninguna), enviado en Search Console. Google dice que es opcional en sitios pequeños bien enlazados, pero ayuda y no cuesta. | [G] | Importante |
| IDX-08 | El contenido importante está en el HTML que entrega el servidor, no solo después de ejecutar JavaScript. Google renderiza JavaScript, pero muchos rastreadores de IA no. | [G][P] | Importante |
| IDX-09 | **Una sola versión del dominio.** `http`, `https`, con `www` y sin `www` redirigen con 301 a la misma. | [G] | Crítico |
| IDX-10 | **HTTPS** en todo el sitio, certificado válido y sin contenido mixto (imágenes o scripts por `http`). | [P] | Crítico |
| IDX-11 | Las páginas que se movieron redirigen con **301**. Las que se eliminaron devuelven **404** o **410**. Sin cadenas de más de un salto ni bucles. | [G][P] | Importante |
| IDX-12 | No hay **«soft 404»**: páginas vacías o de error que responden 200. | [G] | Importante |
| IDX-13 | Las redirecciones temporales (**302**) son solo para cambios muy cortos. Bing pide usarlas para menos de 2 días; para todo lo demás, 301. | [O] | Mejora |
| IDX-14 | Avisar a Bing con **IndexNow** cuando se agrega, cambia o elimina una página. Muchos CMS y CDN lo traen como opción. Google no usa IndexNow. | [O] | Mejora |
| IDX-15 | El sitemap incluye `lastmod` con la fecha real del último cambio. Bing lo usa para saber qué volver a rastrear. | [O] | Mejora |
| IDX-16 | Si el sitio tiene **versiones en otros idiomas** (por ejemplo los casos de estudio en español e inglés), cada versión se anuncia con `hreflang`: cada página lista todas sus versiones, incluida ella misma, con URL absolutas y códigos válidos (`es`, `en`, `es-CO`); la otra versión devuelve el enlace. `x-default` es opcional. | [G] | Importante |

---

## 3. Estructura y URLs (EST)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| EST-01 | URLs **descriptivas y legibles**, con palabras y guiones: `/servicios/paginas-web/`, no `/p?id=4821`. Pueden aparecer como ruta en el resultado. | [G] | Importante |
| EST-02 | **Una URL por contenido.** Si el mismo contenido existe en varias direcciones, redirigir con 301 a la preferida. Si no se puede, usar `rel="canonical"`. | [G] | Importante |
| EST-03 | El `canonical` es absoluto y nunca apunta a una página con 404, redirección o `noindex`. Que cada página apunte a sí misma es práctica común. | [P] | Importante |
| EST-04 | En sitios grandes (miles de URLs), agrupar en carpetas por tema. | [G] | Mejora |
| EST-05 | Las páginas importantes están a **tres clics o menos** de la portada. | [P] | Importante |
| EST-06 | No hay **páginas huérfanas**: toda página indexable recibe al menos un enlace interno. | [P] | Importante |
| EST-07 | Si hay migas de pan, se marcan con `BreadcrumbList`. | [P] | Mejora |

**No importa:** poner la palabra clave en el dominio o en la ruta casi no tiene efecto. El TLD (`.com`, `.co`) solo cuenta si se apunta a un país, y aun así poco. Subdominio o subcarpeta, lo que le sirva al negocio. [G]

---

## 4. Intención de búsqueda y palabras clave (KW)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| KW-01 | Partir del negocio: qué vende, a quién, dónde. Después confirmar con herramientas (Search Console, Planificador de palabras clave de Google, Google Trends). | [P] | Importante |
| KW-02 | Pensar cómo busca un principiante y cómo busca alguien que sabe. Google da el ejemplo de «charcuterie» y «cheese board». | [G] | Importante |
| KW-03 | Clasificar la intención de cada búsqueda: **informativa** (quiere aprender), **comercial** (compara), **transaccional** (quiere comprar o contratar), **de navegación** (busca una marca). | [P] | Importante |
| KW-04 | Mirar qué tipo de página sale arriba para esa búsqueda (guía, servicio, lista, mapa) y hacer ese tipo de página. | [P] | Importante |
| KW-05 | **Mapa de palabras clave:** una búsqueda principal por página. Dos páginas no compiten por la misma búsqueda. | [P] | Importante |
| KW-06 | Incluir búsquedas largas: preguntas, comparaciones, «cerca de mí», nombre del barrio o la ciudad. | [P] | Mejora |
| KW-07 | En Search Console, buscar consultas en **posiciones 5 a 20**: son las más fáciles de subir. | [P] | Mejora |
| KW-08 | Escribir natural, con sinónimos y términos relacionados. Sin relleno de palabras clave ni `meta keywords`. | [G] | Importante |
| KW-09 | **Foco del sitio.** Leídos juntos, los títulos de las páginas apuntan a lo que vende el negocio. Las páginas que no tienen que ver se integran a un tema o se quitan. | [P] | Mejora |

**No funciona:** repetir la palabra clave (va contra las políticas de spam de Google), la «densidad de palabra clave», las «palabras LSI» o la etiqueta `meta keywords`, que Google no usa. [G]

---

## 5. Contenido útil (CON)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| CON-01 | Cada página importante es un intento honesto de ser la mejor respuesta a su búsqueda: información original, completa y con algo que no tengan los demás. | [G] | Crítico |
| CON-02 | Texto claro, sin errores de ortografía, en párrafos cortos y con encabezados. | [G] | Importante |
| CON-03 | **Contenido propio.** Nada copiado de otros sitios. Material de primera mano: casos, datos, fotos reales del negocio. | [G] | Crítico |
| CON-04 | **Quién, cómo y por qué.** Que se sepa quién escribió o quién está detrás (firma, página «Quiénes somos»), cómo se hizo (si se usó IA, decirlo cuando el lector se lo preguntaría) y que el propósito sea ayudar, no atraer tráfico. | [G] | Importante |
| CON-05 | Página de contacto y datos del negocio visibles. Es la base de la confianza, que es lo más importante de E-E-A-T. | [G] | Importante |
| CON-06 | Citar la fuente de cifras y afirmaciones externas. | [G] | Importante |
| CON-07 | Actualizar lo desactualizado y quitar lo que ya no sirve. El contenido flojo se mejora, se une a otro o se elimina con 301. En la auditoría, cada página revisada recibe un veredicto: **mantener, reescribir, unir o quitar** (ver el inventario en el [checklist](checklist-seo-agente.md#formato-del-informe)). | [G] | Importante |
| CON-08 | Sin anuncios ni ventanas emergentes que tapen el contenido. | [G] | Importante |
| CON-09 | Organizar por temas: una página principal del tema enlazada con páginas que lo desarrollan. | [P] | Mejora |
| CON-10 | Revisar las páginas que más importan cada 3 a 6 meses. | [P] | Mejora |
| CON-11 | **Sin páginas repetidas dentro del sitio.** Dos páginas propias no dicen lo mismo con otro nombre (por ejemplo, páginas de servicio armadas con la misma plantilla de texto). Si se parecen, se unen o se diferencian de verdad. La cantidad de palabras no es la falla; una página muy corta solo es una señal para leerla. | [G] | Importante |
| CON-12 | **Un siguiente paso claro** en cada página comercial (servicio, producto, precios): qué hacer ahora (escribir, cotizar, agendar, comprar) y cómo, sin tener que buscarlo. | [P] | Importante |

**No importa:** la cantidad de palabras. Google dice que no tiene un número mínimo ni máximo, y que escribir para llegar a un número es mala señal. E-E-A-T no es un factor de posicionamiento en sí; es un marco para juzgar calidad. [G]

**Sobre contenido hecho con IA:** Google no lo prohíbe. Lo que va contra sus políticas es generar mucho texto sin revisión, solo para posicionar. [G]

---

## 6. Títulos, descripciones y encabezados (ONP)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| ONP-01 | Cada página tiene su propio `<title>`: **único, descriptivo, conciso y exacto**. Nada de «Inicio» ni títulos repetidos. | [G] | Crítico |
| ONP-02 | El título dice qué es la página, y cuando aplica, el nombre del negocio y la ciudad. La marca va al principio o al final, separada (por ejemplo con `·` o `|`). | [G] | Importante |
| ONP-03 | Sin relleno de palabras clave en el título. | [G] | Importante |
| ONP-04 | Lo importante va al principio del título. **Referencia práctica: unos 50 a 60 caracteres**, porque Google corta según el ancho de la pantalla. No es una regla de Google. | [P] | Mejora |
| ONP-05 | El título principal es el texto más visible de la página (normalmente el primer `<h1>`) y coincide con el `<title>`. Si no coinciden, Google puede reescribir el título. | [G] | Importante |
| ONP-06 | Cada página importante tiene una **meta descripción única**: una o dos oraciones que resumen la página entera y dan una razón para hacer clic. Puede incluir precio, zona o fecha. | [G] | Importante |
| ONP-07 | **Referencia práctica: unos 150 a 160 caracteres.** Google no pone límite y casi siempre arma el fragmento con el texto de la página, así que el cuerpo también tiene que ser claro. | [P] | Mejora |
| ONP-08 | Un `<h1>` por página con el tema principal, y `<h2>`/`<h3>` en orden lógico. Google no depende del orden ni de la cantidad, pero el orden ayuda a los lectores de pantalla y a la IA. | [P] | Importante |
| ONP-09 | Encabezados en forma de pregunta donde la página responde preguntas. | [P] | Mejora |
| ONP-10 | Etiquetas **Open Graph** (`og:title`, `og:description`, `og:image`) para que el enlace se vea bien en WhatsApp y redes. | [P] | Mejora |
| ONP-11 | **Favicon** declarado (`<link rel="icon">`), cuadrado, de al menos 48 × 48 px y en una URL estable. Google lo muestra junto al resultado. | [G] | Mejora |
| ONP-12 | El idioma declarado en `<html lang="es">` (o el que corresponda). Google detecta el idioma por el texto y no lo usa, pero Bing sí lo tiene en cuenta y los lectores de pantalla lo necesitan. | [O][P] | Mejora |

---

## 7. Imágenes y video (IMG)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| IMG-01 | Imágenes nítidas, cerca del texto con el que tienen que ver. | [G] | Importante |
| IMG-02 | Todas las imágenes con contenido tienen **`alt` descriptivo** que explica qué muestra y cómo se relaciona con la página. Las decorativas llevan `alt=""`. | [G] | Importante |
| IMG-03 | Nombres de archivo descriptivos: `cafe-de-especialidad.webp`, no `IMG_4821.jpg`. | [P] | Mejora |
| IMG-04 | Formato moderno (**WebP o AVIF**), tamaño acorde a cómo se muestra y comprimidas. | [P] | Importante |
| IMG-05 | `width` y `height` (o `aspect-ratio`) en imágenes, videos e iframes, para que la página no salte al cargar. | [P] | Importante |
| IMG-06 | Carga diferida (`loading="lazy"`) en las imágenes que no se ven al abrir la página. **La imagen principal de arriba no se difiere.** | [P] | Importante |
| IMG-07 | Los videos van en su propia página, cerca de texto relacionado, con título y descripción propios. | [G] | Mejora |

---

## 8. Enlaces (LNK)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| LNK-01 | **Texto de enlace descriptivo**: dice qué hay al otro lado. Nunca «clic aquí» ni «ver más» solo. | [G] | Importante |
| LNK-02 | Las páginas de servicio (las que venden) reciben enlaces internos desde las páginas de contenido. | [G][P] | Importante |
| LNK-03 | Sin enlaces internos rotos. Los enlaces externos apuntan a sitios que existen. | [P] | Importante |
| LNK-04 | Enlazar a fuentes útiles cuando sirve al lector. A sitios en los que no se confía, `rel="nofollow"`. | [G] | Mejora |
| LNK-05 | Los enlaces que dejan los usuarios (comentarios, foros) llevan `nofollow` o `ugc` automáticamente. Los pagados, `sponsored`. | [G] | Importante |
| LNK-06 | **No comprar enlaces** ni hacer intercambios para posicionar. Va contra las políticas de spam de Google. | [G] | Crítico |
| LNK-07 | Los enlaces internos apuntan a la **URL final**, no a una que redirige (por ejemplo, sin `/` final cuando el sitio lo agrega, o a la versión `http`). | [P] | Mejora |

---

## 9. Rendimiento y móvil (RND)

Google recomienda tener buenos Core Web Vitals, pero no garantiza que eso suba posiciones. Lo que sí es seguro: una página lenta pierde clientes. [G]

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| RND-01 | **LCP** (lo que tarda en verse el contenido principal): **2,5 s o menos.** | [G] | Importante |
| RND-02 | **INP** (lo que tarda en responder cuando se toca algo): **menos de 200 ms.** Reemplazó a FID en 2024. | [G] | Importante |
| RND-03 | **CLS** (cuánto se mueve la página al cargar): **menos de 0,1.** | [G] | Importante |
| RND-04 | Medir con **datos de campo** (usuarios reales, en Search Console o PageSpeed Insights), en **móvil**. Los datos de laboratorio orientan, pero no son los que cuentan. | [G][P] | Importante |
| RND-05 | El diseño se adapta al celular: texto legible sin zoom, botones que se pueden tocar, sin desplazamiento horizontal. Google indexa la versión móvil. | [G] | Crítico |
| RND-06 | La imagen principal (el elemento LCP) se carga con prioridad (`fetchpriority="high"` o `preload`). | [P] | Mejora |
| RND-07 | HTML, CSS y JS minificados, sin código que no se usa. Scripts de terceros inventariados; los que no son necesarios, fuera. | [P] | Mejora |
| RND-08 | Fuentes precargadas con `font-display: swap`, mejor si están en el mismo servidor. | [P] | Mejora |
| RND-09 | Caché del navegador y CDN. Referencia: tiempo de respuesta del servidor (TTFB) por debajo de unos 800 ms. Google no publica un umbral oficial. | [P] | Mejora |

---

## 10. Datos estructurados (SCH)

Los datos estructurados (en JSON-LD) le dicen a Google qué es cada cosa: el negocio, un artículo, un producto. Hacen que una página **pueda** tener resultados enriquecidos, pero no los garantizan. [G]

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| SCH-01 | `Organization` (o `LocalBusiness` si atiende público) con nombre, logo, URL, contacto y `sameAs` con los perfiles oficiales (Google, Instagram, LinkedIn). | [G] | Importante |
| SCH-02 | `LocalBusiness` con dirección, horario, zona de servicio (`areaServed`) y coordenadas si hay local físico. | [G] | Importante |
| SCH-03 | `Article` o `BlogPosting` con autor y fechas en artículos. `Product` y `Offer` en productos. `BreadcrumbList` en migas de pan. | [G] | Mejora |
| SCH-04 | **Solo se marca lo que se ve en la página.** Los datos estructurados tienen que coincidir con el texto visible. | [G] | Crítico |
| SCH-05 | Cero errores en la **Prueba de resultados enriquecidos** y en el validador de schema.org. | [G] | Importante |
| SCH-06 | Nombre, dirección, teléfono y descripción iguales en los datos estructurados, la página y el perfil de Google. | [P] | Importante |
| SCH-07 | Si hay `FAQPage`, no venderlo como resultado enriquecido (ver la corrección de abajo). | [G] | Mejora |

**Corrección importante:** muchas guías todavía recomiendan `FAQPage` para tener resultados enriquecidos. **Google dejó de mostrar los resultados de preguntas frecuentes el 7 de mayo de 2026** y retiró esa documentación en junio. La sección de preguntas frecuentes sigue siendo útil para las personas y para la IA, y el marcado no hace daño, pero ya no da estrellas ni desplegables en Google. No hay que venderlo como mejora de SEO.

---

## 11. Búsqueda con IA, o AEO (IA)

AEO es que los asistentes (ChatGPT, Gemini, Copilot, las respuestas con IA de Google) entiendan el negocio y lo recomienden.

Lo primero: **Google dice que para aparecer en AI Overviews y AI Mode no hay requisitos extra, ni archivos especiales, ni un schema especial.** La página tiene que estar indexada y poder mostrarse con fragmento. Bing dice lo mismo para Copilot: las respuestas con IA se apoyan en el mismo rastreo, la misma indexación y la misma clasificación que la búsqueda de siempre. Es decir, el buen SEO de las secciones anteriores ya es la base del AEO. [G][O]

Bing agrega dos cosas útiles. La primera: una página puede aparecer citada en una respuesta de IA sin que nadie haga clic, así que **menos clics no siempre es menos visibilidad**; hay que mirar también las impresiones. La segunda: el SEO no garantiza posiciones, y optimizar para IA no garantiza citas. [O]

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| IA-01 | La página responde la pregunta principal **al principio**, en una o dos oraciones claras. En la **portada**, el primer párrafo dice qué es el negocio, para quién, dónde y por qué elegirlo. | [P] | Importante |
| IA-02 | Párrafos que se entienden solos, aunque se citen fuera de contexto. | [P] | Importante |
| IA-03 | El contenido importante está en texto (no solo en imágenes) y en el HTML del servidor. | [G] | Importante |
| IA-04 | `robots.txt` tiene una decisión tomada sobre los rastreadores de IA. Lo que dice cada uno (ver tabla abajo). | [O][G] | Importante |
| IA-05 | El negocio aparece igual en directorios, prensa, reseñas y redes. Los asistentes cruzan fuentes. | [P] | Importante |
| IA-06 | Perfil de empresa en Google (si el negocio puede tenerlo, ver sección 12) y Merchant Center (si vende productos) al día. | [G] | Importante |
| IA-07 | **Prueba de IA** mensual: hacer en ChatGPT, Gemini y Copilot las preguntas que haría un cliente («¿quién hace [servicio] en [ciudad]?») y preguntar por el negocio por su nombre. Anotar si aparece, qué dice y qué fuentes cita. | [P] | Importante |
| IA-08 | `llms.txt` es opcional. Es una propuesta, no un estándar, y Google dice que no hacen falta archivos especiales. No hace daño tenerlo, pero no se vende como mejora. | [G][P] | Mejora |
| IA-09 | **Nombres claros y constantes** para el negocio, las personas, los productos y los lugares. Sin referencias ambiguas («nosotros», «el producto») donde hace falta el nombre. | [O] | Importante |
| IA-10 | **Cada afirmación se sostiene en la página misma:** datos y definiciones explícitos, sin depender de otra página para entenderse. | [O] | Importante |
| IA-11 | Si se quiere aparecer en Copilot, **no usar `noarchive` ni `nocache`**: Bing dice que `noarchive` saca el contenido de las respuestas de Copilot y que `nocache` las limita al título y el fragmento. `nosnippet` y `data-nosnippet` también limitan lo que se puede citar. | [O] | Importante |

### Rastreadores de IA en `robots.txt`

| Agente | De quién | Para qué | Si se bloquea |
|---|---|---|---|
| `OAI-SearchBot` | OpenAI | Búsqueda de ChatGPT | El sitio deja de salir en las respuestas de búsqueda de ChatGPT. |
| `GPTBot` | OpenAI | Entrenar modelos | No afecta la búsqueda de ChatGPT. |
| `ChatGPT-User` | OpenAI | Cuando un usuario pide visitar una página | Puede no respetar `robots.txt`. |
| `Google-Extended` | Google | Entrenar Gemini y darle contexto | No afecta Google Search ni el posicionamiento. |
| `Googlebot` | Google | Buscador, AI Overviews y AI Mode | Bloquearlo saca el sitio de Google. **Nunca.** |
| `Bingbot` | Microsoft | Bing y Copilot | Bloquearlo saca el sitio de Bing y Copilot. |

**Recomendación por defecto para negocios pequeños:** permitir todo. Quieren que los encuentren. Bloquear solo el entrenamiento (`GPTBot`, `Google-Extended`) si el dueño del sitio lo pide.

---

## 12. SEO local (LOC)

Para negocios que buscan clientes en una ciudad o zona. Es donde más rinde el trabajo en negocios pequeños.

### Primero: ¿el negocio puede tener perfil de empresa en Google?

No todos pueden, y eso no es una falla del sitio. Google exige **contacto en persona con los clientes**: un local que se puede visitar, o un negocio que va hasta donde está el cliente. Una oficina virtual, una dirección de correo o un *coworking* sin atención al público no sirven. Un negocio que trabaja solo en línea tampoco cumple, y aunque cumpla, Google puede pedir una verificación (por ejemplo, un video del lugar o del negocio funcionando) que no todos pueden hacer. [G]

Por eso, antes de revisar esta sección se clasifica el negocio:

| Tipo | Cómo es | El perfil de Google es |
|---|---|---|
| **Con local** | Atiende al público en un lugar con horario: tienda, consultorio, restaurante. | **Crítico.** Es la principal vía para aparecer en el mapa. |
| **De área de servicio** | No recibe en un local, pero va hasta el cliente: plomero, fotógrafo, peluquera a domicilio. | **Importante.** Se crea como área de servicio, sin mostrar la dirección. |
| **Sin perfil posible** | Trabaja en línea o por videollamada, o Google no lo pudo verificar. | **No aplica.** No resta puntos. Se trabaja con las señales de LOC-08. |

Si el negocio está en el tercer tipo pero en el futuro puede verificarse, el perfil queda como oportunidad, no como falla.

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| LOC-00 | Clasificar el negocio en uno de los tres tipos de arriba. Lo confirma una persona. | [G] | — |
| LOC-01 | **Perfil de empresa en Google** reclamado, verificado y completo, con la categoría principal correcta, horario, fotos, servicios y enlace al sitio. | [G] | Según el tipo |
| LOC-02 | **Nombre, dirección (si se muestra) y teléfono** idénticos en el sitio, el perfil de Google, Bing Places, redes y directorios. Sin perfil, se comparan los canales que existan. | [P] | Crítico |
| LOC-03 | Tener reseñas públicas y responderlas todas. Van en el perfil de Google si existe; si no, en directorios del sector, Facebook u otras plataformas donde el cliente las pueda ver. | [P] | Importante |
| LOC-04 | La ciudad o la zona en el título y el `<h1>` de las páginas que la necesitan. | [P] | Importante |
| LOC-05 | Páginas por ciudad solo si tienen contenido local real. Copiar la misma página cambiando el nombre de la ciudad es contenido repetido. | [G][P] | Importante |
| LOC-06 | Página de contacto con mapa, dirección (o zona de servicio) y formas de contacto claras. | [P] | Mejora |
| LOC-07 | Si es un negocio de área de servicio, configurar el perfil como **área de servicio** y no mostrar una dirección de vivienda. | [G] | Importante |
| LOC-08 | **Sin perfil de Google**, reforzar lo demás: la ciudad o zona escrita en el texto de las páginas, `Organization` con `areaServed` en los datos estructurados, perfiles completos en directorios del sector y reseñas en ellos. Es lo que usan el buscador y la IA para saber dónde trabaja el negocio. | [G][P] | Importante (solo sin perfil) |

---

## 13. Autoridad, promoción y mantenimiento (AUT, MNT)

| Código | Qué hacer | Evidencia | Prioridad |
|---|---|---|---|
| AUT-01 | Promover el sitio en redes, comunidad, publicidad y de boca en boca. La URL en tarjetas, empaques y avisos. Sin excesos: la sobrepromoción cansa y puede verse como manipulación. | [G] | Importante |
| AUT-02 | Al menos un contenido que valga la pena enlazar: una guía, datos propios, una herramienta. | [P] | Mejora |
| AUT-03 | Perfiles actualizados en los directorios del sector y de la ciudad. | [P] | Importante |
| AUT-04 | Revisar quién enlaza al sitio (informe «Enlaces» de Search Console). | [G] | Mejora |
| MNT-01 | **Cada semana:** revisar Search Console (errores nuevos, caídas). | [P] | — |
| MNT-02 | **Cada mes:** posiciones, Core Web Vitals, prueba de IA, contenido nuevo o actualizado. | [P] | — |
| MNT-03 | **Cada trimestre:** rastreo técnico completo (por ejemplo con Screaming Frog), revisión de contenido y de enlaces. | [P] | — |
| MNT-04 | **Cada año:** auditoría completa con el checklist. | [P] | — |

---


## 14. Lo que nunca se hace: políticas de spam (SPAM)

Google y Bing castigan las prácticas que buscan engañar al buscador o a las personas. Google llama spam a las técnicas que se usan para engañar a los usuarios o manipular sus sistemas de búsqueda, **incluidas las respuestas generadas con IA**. La mayoría se detecta de forma automática. Algunas terminan en una **acción manual**: una persona de Google revisa el sitio, y este puede bajar de posición o desaparecer de los resultados. [G]

En esta guía, estas prácticas no se miden por grados: con una sola, el sitio está en riesgo (ver la puntuación en el [checklist](checklist-seo-agente.md)).

| Código | Práctica prohibida | Qué es y cómo se ve | Lo que sí está bien | Evidencia |
|---|---|---|---|---|
| SPAM-01 | **Encubrimiento** (*cloaking*) | Mostrarle al buscador un contenido distinto del que ve la persona. | Contenido de pago que Google puede ver completo. | [G][O] |
| SPAM-02 | **Texto y enlaces ocultos** | Texto del mismo color que el fondo, detrás de una imagen, fuera de la pantalla, con tamaño u opacidad en 0, o enlaces en un solo carácter. | Acordeones, pestañas, carruseles, descripciones emergentes y texto solo para lectores de pantalla. | [G] |
| SPAM-03 | **Relleno de palabras clave** | Repetir frases sin naturalidad, listas de teléfonos sin valor, **bloques de nombres de ciudades o barrios**. | Mencionar la zona de servicio donde tiene sentido. | [G][O] |
| SPAM-04 | **Páginas puerta** (*doorway*) | Muchas páginas casi iguales para posicionar búsquedas parecidas, como **páginas por ciudad que solo cambian el nombre** y llevan todas al mismo sitio. | Páginas por ciudad con contenido local real (LOC-05). | [G] |
| SPAM-05 | **Esquemas de enlaces** | Comprar o vender enlaces para posicionar (con dinero, productos o servicios), intercambios excesivos, enlaces automáticos, artículos de invitado pagados con enlaces optimizados, directorios de baja calidad, enlaces repetidos en pies de página o *widgets*, firmas de foro con enlaces, redes privadas de blogs, promoción social artificial. | Enlaces pagados o de patrocinio marcados con `rel="sponsored"` o `rel="nofollow"`. | [G][O] |
| SPAM-06 | **Contenido masivo sin valor** | Generar muchas páginas para posicionar, con IA o sin ella, sin revisión ni aporte: textos unidos de otras fuentes, páginas llenas de palabras clave. | Contenido hecho con IA que se revisa, aporta algo y se escribe para las personas. | [G][O] |
| SPAM-07 | **Contenido copiado** (*scraping*) | Publicar contenido de otros sin aportar nada, o reescribirlo apenas (por ejemplo, cambiando sinónimos). | Citar con fuente y aportar análisis propio. | [G][O] |
| SPAM-08 | **Redirecciones engañosas** | Mandar a la persona a una URL distinta de la que pidió para engañar; por ejemplo, redirigir solo en celular a otro dominio. | Mudanzas de sitio, unir páginas, redirigir a usuarios registrados. | [G] |
| SPAM-09 | **Sitio hackeado o malicioso** | Código, páginas o enlaces insertados por terceros; *malware*; software no deseado; secuestrar el botón «atrás». | Mantener el CMS, los *plugins* y los accesos al día. | [G][O] |
| SPAM-10 | **Spam de usuarios** | Comentarios, perfiles o foros llenos de spam que nadie modera. | Moderar y marcar los enlaces de usuarios con `ugc` o `nofollow` (LNK-05). | [G] |
| SPAM-11 | **Afiliados sin valor** | Páginas con enlaces de afiliado que copian la descripción del vendedor sin aportar nada. | Reseñas propias, pruebas, comparaciones, precios. | [G][O] |
| SPAM-12 | **Abuso de reputación del sitio** | Alojar contenido de terceros que no tiene que ver con el sitio, solo para aprovechar su posicionamiento (por ejemplo, un sitio de salud con un «mejores casinos» pagado). | Columnas, notas de prensa, contenido de usuarios, publicidad normal. | [G] |
| SPAM-13 | **Abuso de dominios vencidos** | Comprar un dominio vencido con historia y usarlo para posicionar contenido que no tiene que ver. | Comprar un dominio y construir algo coherente con él. | [G] |
| SPAM-14 | **Engaño y fraude** | Hacerse pasar por otro negocio, datos de contacto falsos, prometer una herramienta o servicio que no existe. | Datos reales y verificables. | [G] |
| SPAM-15 | **Manipular a la IA** | Agregar contenido pensado para manipular a los modelos de lenguaje (instrucciones ocultas para la IA, *prompt injection*). | Escribir con claridad para que la IA entienda. | [O] |
| SPAM-16 | **Datos estructurados engañosos** | Marcar reseñas, precios o datos que no están en la página. | Marcar solo lo visible (SCH-04). | [G][O] |
| SPAM-17 | **Esquivar las políticas** | Seguir con las mismas prácticas en un subdominio, una carpeta o un sitio nuevo. | Corregir de verdad. | [G] |
| SPAM-18 | **Tráfico automático** | Enviar consultas automáticas a Google, por ejemplo con programas que revisan posiciones raspando los resultados. | Usar Search Console o herramientas con datos autorizados. | [G] |

**Si ya hay un problema:** revisar el informe **«Acciones manuales»** y el de **«Problemas de seguridad»** de Search Console. Si hay una acción manual, se corrige todo lo señalado y se envía una **solicitud de reconsideración** desde el mismo informe. En Bing, se contacta al soporte desde Bing Webmaster Tools. [G][O]

---

## 15. Lo que no funciona: mitos y correcciones

Prácticas que circulan en guías y herramientas de SEO, y lo que dice Google.

| Lo que se suele decir | Lo que dice Google | Qué hacer |
|---|---|---|
| El título debe tener entre 50 y 60 caracteres. | No hay límite. Se corta según el ancho de la pantalla. | Lo importante al principio. 50-60 como referencia, no como regla. |
| La meta descripción debe tener 155-160 caracteres. | No hay límite. Casi siempre arma el fragmento con el texto de la página. | Una o dos oraciones, única por página. |
| Usar la Prueba de optimización para móviles. | Se retiró en diciembre de 2023. | Lighthouse o PageSpeed Insights. |
| Revisar el informe «Cobertura» de Search Console. | Ahora se llama «Indexación de páginas». | Usar el nombre actual. |
| Intercambiar enlaces con otros sitios. | Los intercambios para posicionar van contra las políticas de spam. | No hacerlo. |
| Poner la palabra clave en las primeras 100 palabras, con cierta densidad. | No existe esa regla. Repetir palabras clave es spam. | Escribir natural. |
| El contenido largo posiciona mejor. | No hay número mínimo ni máximo de palabras. | La extensión que necesite la respuesta. |
| Usar «palabras clave LSI». | Google no usa ese concepto. | Sinónimos y términos relacionados, de forma natural. |
| `robots.txt` evita que una página se indexe. | Controla el rastreo, no la indexación. | `noindex` para sacar páginas. |
| El rebote y el tiempo en página son factores de posicionamiento. | Google no los documenta como factores. | Medirlos para mejorar la página, no para posicionar. |
| El servidor debe responder en menos de 600 ms. | No hay umbral oficial. | Referencia práctica de unos 800 ms. |
| Los datos estructurados suben los clics un porcentaje fijo. | Solo hacen a la página elegible; no garantizan nada. | No prometer cifras. |
| `FAQPage` da resultados enriquecidos. | Se dejaron de mostrar el 7 de mayo de 2026. | Se puede mantener; no venderlo como mejora. |
| E-E-A-T es un factor de posicionamiento. | No lo es. Es un marco de calidad; la confianza es lo que más pesa. | Cuidar autoría, contacto y fuentes. |
| Los Core Web Vitals son un factor que sube posiciones. | Google los recomienda, pero no garantiza mejor posición. | Cumplirlos igual: afectan las ventas. |
| Hace falta `llms.txt` u otro archivo especial para la IA. | No hacen falta archivos especiales ni schema especial. | Opcional. |

**Mitos que Google desmiente en su guía de inicio:** la etiqueta `meta keywords`, el relleno de palabras clave, las palabras clave en el dominio, el TLD, la cantidad de palabras, subdominio contra subcarpeta, PageRank como lo único que importa, la «penalización» por contenido duplicado (es ineficiente, pero no castiga; copiar de otros sí es un problema), el orden y la cantidad de encabezados, y E-E-A-T como factor.

---

## 16. Qué se puede prometer

- **Sí:** que Google y los asistentes puedan ver, entender y mostrar bien el sitio; que el negocio diga lo mismo en todas partes; que la página cargue rápido y se lea bien en el celular; medir antes y después.
- **No:** una posición, un plazo exacto, resultados enriquecidos, ni que la IA recomiende el negocio. Google dice que los cambios pueden tardar meses en verse.

---

## 17. Referencias

Documentación oficial con la que se validó esta guía:

- Google Search Central. *Guía de optimización en buscadores (SEO) para principiantes.* Actualizada el 10 dic 2025. https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google. *Enlaces de título.* Actualizada el 10 dic 2025. https://developers.google.com/search/docs/appearance/title-link
- Google. *Fragmentos y meta descripciones.* Actualizada el 20 abr 2026. https://developers.google.com/search/docs/appearance/snippet
- Google. *Core Web Vitals.* Actualizada el 10 dic 2025. https://developers.google.com/search/docs/appearance/core-web-vitals
- Google. *Contenido útil, fiable y centrado en las personas.* Actualizada el 5 oct 2026. https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google. *Funciones de IA y tu sitio web.* Actualizada el 10 dic 2025. https://developers.google.com/search/docs/appearance/ai-features
- Google. *Datos estructurados de FAQ* (aviso de retiro, mayo y junio de 2026). https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Google. *Rastreadores comunes (Google-Extended).* Actualizada el 15 oct 2026. https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- Google. *Políticas de spam de la Búsqueda de Google.* Actualizada el 28 ago 2026. https://developers.google.com/search/docs/essentials/spam-policies
- Google. *Directrices para representar tu empresa en Google* (perfil de empresa). https://support.google.com/business/answer/3038177
- Google. *Versiones localizadas de tu página (hreflang).* https://developers.google.com/search/docs/specialty/international/localized-versions
- Google. *Definir un favicon para que aparezca en los resultados de búsqueda.* https://developers.google.com/search/docs/appearance/favicon-in-search
- Google. *Consolidar URLs duplicadas.* https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Microsoft. *Bing Webmaster Guidelines.* https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- OpenAI. *Overview of OpenAI crawlers.* https://developers.openai.com/api/docs/bots
