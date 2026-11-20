# Checklist de SEO para agentes

Versión 0.3 · borrador para revisión · 20 nov 2026

Este checklist es la versión operativa de la [Guía de SEO](guia-seo.md). Cada punto tiene el mismo código que la sección de la guía que lo explica. Si un criterio no queda claro, la guía manda.

---

## Instrucciones para el agente

1. **Entrada:** la URL del sitio y, si hay, acceso a Search Console, Bing Webmaster Tools y GA4. Si no hay acceso, los puntos que lo piden se marcan `SIN ACCESO`, no `FALLA`.
2. **Antes de empezar, el tipo de negocio (LOC-00):** con local, de área de servicio o sin perfil posible. Decide si el perfil de empresa en Google es crítico, importante o no aplica. Si no está claro, preguntar; no se castiga a un negocio por no poder tener algo que Google no le permite.
3. **Solo lectura.** La auditoría no cambia nada del sitio ni de las cuentas. Las correcciones se proponen; las hace quien tenga permiso.
4. **Páginas a revisar:** la portada, la página de contacto, todas las de servicio o producto, y hasta 5 páginas de contenido. Si el sitio tiene más de 50 páginas, hacer además un rastreo completo.
5. **Orden:** primero los puntos **Crítico**. Si `IDX-01` o `IDX-04` fallan, reportarlo de inmediato: lo demás pierde sentido hasta que el sitio sea visible.
6. **Resultado por punto:** `OK`, `FALLA`, `PARCIAL`, `N/A` (no aplica al negocio) o `SIN ACCESO`. Existe además `REVISAR`: en los puntos de spam, cuando hay una sospecha que tiene que confirmar una persona, y en los juicios de lectura (CON, KW, IA, títulos y descripciones), cuando el agente no está seguro. Un `REVISAR` no cuenta en la puntuación hasta que una persona lo convierte en otro resultado. Toda `FALLA` o `PARCIAL` lleva evidencia (URL, fragmento de código, captura o cifra), la corrección propuesta, el esfuerzo y la fuente (ver el [Formato del informe](#formato-del-informe)).
7. **No inventar.** Si no se pudo comprobar, se dice. Si una herramienta no respondió, se anota cuál y cuándo.
8. **Columna «Quién»:** `A` lo comprueba el agente solo; `A+` el agente con acceso a una cuenta; `H` necesita criterio de una persona (el agente propone, la persona decide).
9. **Referencias prácticas, no reglas de Google.** El largo de títulos y descripciones, la cantidad de palabras y el orden de los encabezados son referencias. Nunca se presentan como requisitos de Google, y una página corta no es una falla por sí sola: es una señal para leerla.

### Herramientas

| Herramienta | Para qué | Notas |
|---|---|---|
| `curl -sIL <url>` | Códigos de respuesta, redirecciones, cabeceras | Ver cada salto. |
| `curl -s <url>` | HTML que entrega el servidor (sin JavaScript) | Es lo que ven muchos rastreadores de IA. |
| Navegador | Página renderizada, móvil, prueba de IA | Solo lectura. |
| `site:dominio.com` en Google | Presencia en el índice | Aproximado; para cifras exactas, Search Console. |
| PageSpeed Insights (pagespeed.web.dev o su API) | Core Web Vitals de campo y laboratorio, Lighthouse | Usar los datos de campo móviles. |
| Prueba de resultados enriquecidos (search.google.com/test/rich-results) | Validar datos estructurados | También validator.schema.org. |
| Search Console | Indexación, rendimiento, Core Web Vitals, enlaces | `A+` |
| Bing Webmaster Tools | Indexación en Bing (Copilot) | `A+` |
| Screaming Frog u otro rastreador | Rastreo completo: huérfanas, rotos, profundidad, enlaces a redirecciones, páginas fuera del sitemap, texto repetido entre páginas | Sitios de más de 50 páginas. En sitios pequeños, seguir los enlaces desde la portada con `curl`. |

---

## Puntuación

La puntuación resume en un número de 0 a 100 qué tan bien va el sitio, y dice qué arreglar para subir de nivel. Sirve para comparar el sitio consigo mismo de una auditoría a la siguiente, no para compararlo con otros.

### 1. Puntos por prioridad

| Prioridad | Peso | Por qué |
|---|---|---|
| Crítico | **5 puntos** | Si falla, el sitio no aparece o aparece mal. |
| Importante | **3 puntos** | Afecta cómo se ve el sitio y cuánto lo eligen. |
| Mejora | **1 punto** | Suma, pero no bloquea nada. |

| Resultado | Cuánto del peso se gana |
|---|---|
| `OK` | Todo |
| `PARCIAL` | La mitad |
| `FALLA` | Nada |
| `N/A` | No cuenta: sale de la cuenta |
| `SIN ACCESO` | No cuenta, pero baja la cobertura |
| `REVISAR` | No cuenta hasta que una persona decida |

**Puntos que se revisan página por página** (títulos, descripciones, encabezados, `alt`, canonical, enlaces y similares): el resultado depende de cuántas páginas fallan, para que un descuido en una página no pese lo mismo que un error en todo el sitio. Cada página revisada queda como **cumple**, **a medias** (cumple lo esencial pero le falta algo, o el propio punto dice que ese desvío es `PARCIAL`) o **falla** (no cumple lo esencial).

| Lo que pasa en las páginas | Resultado |
|---|---|
| Todas cumplen | `OK` |
| Alguna queda a medias, o fallan menos de la mitad | `PARCIAL` |
| Falla la mitad o más | `FALLA` |
| Falla la portada en un punto **Crítico** | `FALLA`, aunque sea la única |

Si el punto se midió en menos de tres páginas (Lighthouse, la inspección de URLs), la proporción dice poco: el agente decide entre `PARCIAL` y `FALLA` por la gravedad y explica por qué. La evidencia dice cuántas fallan de cuántas («3 de 12 páginas»).

El checklist completo tiene 99 puntos con peso. El total máximo depende del tipo de negocio, porque LOC-01, LOC-07 y LOC-08 cambian según el tipo:

| Tipo de negocio | Puntos posibles |
|---|---|
| Con local | 285 (LOC-01 crítico; LOC-07 y LOC-08 `N/A`) |
| De área de servicio | 286 (LOC-01 importante, LOC-08 `N/A`) |
| Sin perfil posible | 283 (LOC-01 y LOC-07 `N/A`; LOC-08 importante) |

De todos modos, la cuenta se hace siempre sobre lo evaluado, así que el tipo solo cambia qué entra. Los puntos de spam no suman: funcionan como bloqueo (paso 3). LOC-00 tampoco suma: es la clasificación.

### 2. La cuenta

```
puntos ganados = suma de (peso × 1 si OK, × 0,5 si PARCIAL, × 0 si FALLA)
puntos posibles = suma del peso de todo lo evaluado (sin N/A ni SIN ACCESO)
puntuación     = redondear(100 × puntos ganados ÷ puntos posibles)
cobertura      = puntos posibles ÷ (puntos posibles del tipo de negocio − peso de los demás N/A)
```

Si la **cobertura es menor que 70 %** (por ejemplo, porque no hubo acceso a Search Console), la puntuación se marca como **provisional**.

Se calcula también la puntuación de **cada área** (MED, IDX, EST…) con la misma cuenta, para ver dónde está el problema.

### 3. Topes

La puntuación general no puede pasar de cierto nivel si hay problemas graves, aunque el resto esté perfecto:

| Situación | Tope |
|---|---|
| Algún punto de **spam** en `FALLA` | Nivel **En riesgo**, sin importar el número. |
| Algún punto de spam en `REVISAR` | El nivel se muestra, con la marca «pendiente de revisión». |
| **Dos o más críticos** en `FALLA` | Máximo **39**. |
| **Un crítico** en `FALLA` | Máximo **59**. |

### 4. Niveles

| Puntuación | Nivel | Qué quiere decir |
|---|---|---|
| — | **En riesgo** | Hay una práctica de spam. Puede bajar o desaparecer de Google. Se arregla antes que todo. |
| 0 a 39 | **Fuera del mapa** | Google o las personas tienen problemas para encontrarlo o entenderlo. |
| 40 a 59 | **Primeros pasos** | Lo básico está, pero hay fallas que frenan todo lo demás. |
| 60 a 74 | **En camino** | Funciona. Le falta para competir. |
| 75 a 89 | **Por buen camino** | Bien hecho. Lo que falta son mejoras. |
| 90 a 100 | **Referente** | Ejemplo de cómo se hace. A mantenerlo. |

### 5. Insignias

Cada área que tiene **todos sus críticos e importantes en `OK`** gana su insignia. Las insignias muestran lo que ya está bien hecho, aunque la puntuación general todavía sea baja.

| Insignia | Se gana con |
|---|---|
| **Medido** | MED |
| **Visible** | IDX |
| **Ordenado** | EST y LNK |
| **Claro** | KW y ONP |
| **Útil** | CON |
| **Bien ilustrado** | IMG |
| **Rápido** | RND |
| **Bien descrito** | SCH |
| **Listo para la IA** | IA |
| **Local** | LOC (solo si el negocio atiende en una zona) |
| **Conocido** | AUT |
| **Juego limpio** | Todos los SPAM en `OK`, incluido SPAM-00 (necesita acceso a Search Console) |

### 6. El siguiente nivel

El informe siempre dice:

- **Cuántos puntos faltan** para el siguiente nivel.
- **Los tres arreglos que más suben la puntuación**, en este orden: primero los que quitan un tope (spam, críticos), después los de más peso, y entre iguales, los de menos esfuerzo.
- **Los arreglos rápidos:** los Críticos e Importantes que se resuelven en minutos u horas, aunque no estén entre los tres primeros.
- **Qué insignia está más cerca** (el área con menos puntos pendientes).
- **La diferencia con la auditoría anterior**, si existe: puntos ganados o perdidos, e insignias nuevas.

### Ejemplo

Un sitio con 80 puntos evaluados (240 de peso posible), sin spam. Ganó 186 puntos y tiene un crítico en `FALLA` (IDX-09, el dominio con y sin `www` no redirige).

- Puntuación sin tope: 100 × 186 ÷ 240 = **78**.
- Con el tope de un crítico: **59, Primeros pasos**.
- Arreglar IDX-09 suma 5 puntos y quita el tope: 100 × 191 ÷ 240 = **80, Por buen camino**.

Así se ve por qué ese arreglo va primero.

---

## 1. Medición (MED)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| MED-01 | Search Console verificado | Entrar a la propiedad, o buscar la meta `google-site-verification` / registro DNS | La propiedad existe y tiene datos | Crítico | A+ |
| MED-02 | Bing Webmaster Tools verificado | Entrar, o buscar la meta `msvalidate.01` | La propiedad existe | Importante | A+ |
| MED-03 | Analítica con conversiones | Buscar el código de GA4 (`gtag`, `G-`) en el HTML; en la cuenta, ver eventos clave | Hay analítica y al menos una conversión del negocio | Importante | A / A+ |
| MED-04 | Línea base registrada | Pedir la línea base o buscarla en los documentos del proyecto | Existe con indexadas, clics, impresiones, CWV y prueba de IA | Importante | H |

## 2. Rastreo e indexación (IDX)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| IDX-01 | El sitio está en Google | `site:dominio.com` | Aparecen la portada y las páginas de servicio | Crítico | A |
| IDX-02 | Páginas importantes indexadas | Search Console › Indexación de páginas | Toda página de la lista de revisión está indexada o excluida a propósito | Crítico | A+ |
| IDX-03 | Google ve la página completa | Search Console › Inspección de URLs › Probar URL publicada, en portada y servicios | La captura renderizada muestra el contenido principal | Crítico | A+ |
| IDX-04 | `robots.txt` correcto | `curl -s dominio.com/robots.txt` | Existe (o no existe y no hace falta), no bloquea `/`, CSS ni JS, y no bloquea `Googlebot` ni `Bingbot` | Crítico | A |
| IDX-05 | No se usa `robots.txt` para desindexar | Comparar lo bloqueado en `robots.txt` con lo que se quiere fuera de Google | Lo que debe salir de Google usa `noindex`, no `Disallow` | Crítico | A |
| IDX-06 | `noindex` donde corresponde | Buscar `<meta name="robots"` y la cabecera `X-Robots-Tag` en gracias, búsqueda, filtros, pruebas | Esas páginas tienen `noindex`; ninguna página importante lo tiene | Importante | A |
| IDX-07 | Sitemap XML | `robots.txt` (línea `Sitemap:`) o `dominio.com/sitemap.xml`; en Search Console, ver si está enviado; comparar con las páginas encontradas al rastrear | Existe, está enviado, lista solo URLs indexables con respuesta 200 y no le falta ninguna página indexable encontrada en el rastreo | Importante | A / A+ |
| IDX-08 | Contenido en el HTML del servidor | `curl -s <url>` y buscar el `<h1>` y el primer párrafo | El texto principal está en la respuesta sin JavaScript | Importante | A |
| IDX-09 | Una sola versión del dominio | `curl -sIL` a `http://`, `http://www.`, `https://`, `https://www.` | Las tres variantes no preferidas redirigen con 301 a la preferida en un salto | Crítico | A |
| IDX-10 | HTTPS sin contenido mixto | Certificado válido; buscar `src="http://` y `href="http://` de recursos | Certificado válido y ningún recurso por `http` | Crítico | A |
| IDX-11 | Redirecciones y páginas eliminadas | `curl -sIL` a URLs viejas conocidas | 301 en un salto a la página nueva; eliminadas dan 404 o 410; sin bucles | Importante | A |
| IDX-12 | Sin «soft 404» | Pedir `dominio.com/no-existe-xyz`; revisar páginas vacías | La página inexistente devuelve 404, no 200 | Importante | A |
| IDX-13 | 302 solo temporales | `curl -sIL` a las redirecciones conocidas | Ninguna redirección permanente usa 302 | Mejora | A |
| IDX-14 | IndexNow | Buscar el archivo de clave de IndexNow o la opción en el CMS o CDN; en Bing Webmaster Tools, ver envíos | Está activo. Si no se encuentra, `PARCIAL` con la nota «pendiente» | Mejora | A / A+ |
| IDX-15 | `lastmod` en el sitemap | Leer el sitemap | Las URLs tienen `lastmod` y las fechas son creíbles (no todas iguales a hoy) | Mejora | A |
| IDX-16 | `hreflang` si hay varios idiomas | Buscar `<link rel="alternate" hreflang=` en las páginas con versión en otro idioma | Cada versión lista todas, incluida ella misma, con URL absolutas que responden 200 y códigos válidos; la otra versión devuelve el enlace. `N/A` si el sitio tiene un solo idioma | Importante | A |

## 3. Estructura y URLs (EST)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| EST-01 | URLs legibles | Revisar las URLs del sitemap | Palabras con guiones, sin identificadores ni parámetros innecesarios | Importante | A |
| EST-02 | Una URL por contenido | Buscar el mismo contenido en varias rutas (con y sin `/` final, mayúsculas, parámetros) | Las variantes redirigen o tienen canonical a la preferida | Importante | A |
| EST-03 | Canonical correcto | Leer `<link rel="canonical">` en cada página revisada | Absoluto, con la URL preferida, y la URL de destino responde 200 sin `noindex` | Importante | A |
| EST-05 | Profundidad | Contar clics desde la portada (rastreo) | Páginas de servicio a 3 clics o menos | Importante | A |
| EST-06 | Sin páginas huérfanas | Comparar URLs del sitemap con URLs enlazadas en el rastreo | Toda URL del sitemap recibe al menos un enlace interno | Importante | A |
| EST-07 | Migas de pan marcadas | Si hay migas visibles, buscar `BreadcrumbList` | Hay marcado y coincide con lo visible, o no hay migas (`N/A`) | Mejora | A |

## 4. Intención y palabras clave (KW)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| KW-01 | Búsquedas objetivo definidas | Pedir o armar la lista: qué vende, a quién, dónde | Hay una lista con una búsqueda principal por página | Importante | H |
| KW-03 | Intención clasificada | Revisar la lista | Cada búsqueda dice si es informativa, comercial, transaccional o de navegación | Importante | A / H |
| KW-04 | Tipo de página adecuado | Buscar la consulta en Google y comparar con la página del sitio | El tipo de página coincide con lo que sale arriba | Importante | A |
| KW-05 | Sin canibalización | Listar los pares de páginas cuyo `<title>` y `<h1>` comparten el 40 % de las palabras o más (sin contar artículos, preposiciones ni el nombre del negocio, que va en todos los títulos); leer cada par y decidir si quien busca las vería como intercambiables. Confirmar con Search Console › Rendimiento por consulta | Cada búsqueda principal tiene una sola página | Importante | A / A+ |
| KW-07 | Oportunidades 5-20 | Search Console › Rendimiento, filtrar posición media 5 a 20 | Se listan las consultas con impresiones para trabajarlas | Mejora | A+ |
| KW-08 | Sin relleno ni `meta keywords` | Leer el texto; buscar `<meta name="keywords"` | Lectura natural; si existe `meta keywords`, se anota como inútil (no es falla grave) | Importante | A |
| KW-09 | Foco del sitio | Leer juntos los títulos de todas las páginas | Apuntan a lo que vende el negocio; las páginas fuera de tema están integradas a un tema o no existen | Mejora | A / H |

## 5. Contenido (CON)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| CON-01 | Responde la búsqueda | Leer la página contra su búsqueda principal | Responde lo que alguien buscaría y aporta algo propio | Crítico | H |
| CON-02 | Legible | Leer; revisar ortografía | Párrafos cortos, encabezados, sin errores | Importante | A |
| CON-03 | Contenido propio | Buscar en Google 2 o 3 frases exactas entre comillas | No aparecen copiadas de otros sitios; hay fotos o casos propios | Crítico | A |
| CON-04 | Quién está detrás | Buscar «Quiénes somos», firma, nombre del responsable | Se sabe quién es el negocio o el autor | Importante | A |
| CON-05 | Contacto visible | Revisar encabezado, pie y página de contacto | Hay al menos dos formas de contacto | Importante | A |
| CON-06 | Fuentes citadas | Buscar cifras y afirmaciones externas | Cada cifra externa tiene fuente | Importante | A |
| CON-07 | Nada desactualizado | Buscar años, precios, promociones u ofertas viejas | No hay información vencida a la vista | Importante | A / H |
| CON-08 | Sin interrupciones | Abrir en móvil | Ninguna ventana emergente tapa el contenido al entrar | Importante | A |
| CON-11 | Sin páginas repetidas dentro del sitio | Comparar el texto principal (sin menú ni pie) de las páginas revisadas, sobre todo las de servicio y por ciudad; leer las que tengan muy poco texto | Ninguna página propia dice lo mismo que otra con otro nombre. Una página corta que cumple su función pasa | Importante | A |
| CON-12 | Siguiente paso claro | Leer cada página comercial (servicio, producto, precios) | Dice qué hacer ahora (escribir, cotizar, agendar, comprar) y el botón o enlace se ve sin buscarlo | Importante | A / H |

## 6. Títulos, descripciones y encabezados (ONP)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| ONP-01 | Título único y descriptivo | Leer `<title>` de cada página revisada | Existe una sola vez por página, no se repite entre páginas, no es genérico («Inicio») | Crítico | A |
| ONP-02 | Título con marca y zona | Leer `<title>` | Dice qué es; incluye marca separada y ciudad cuando aplica | Importante | A |
| ONP-03 | Sin relleno en el título | Leer `<title>` | Ninguna palabra repetida sin necesidad | Importante | A |
| ONP-04 | Lo importante al principio | Contar caracteres | Lo clave está en los primeros ~60 caracteres. Más largo es `PARCIAL`, no `FALLA` | Mejora | A |
| ONP-05 | `<h1>` coincide con el título | Comparar `<h1>` y `<title>` | Tratan el mismo tema con palabras parecidas | Importante | A |
| ONP-06 | Meta descripción única | Leer `<meta name="description">` | Existe en las páginas importantes, no se repite y resume la página | Importante | A |
| ONP-07 | Largo de la descripción | Contar caracteres | ~150-160 como referencia. Más larga o más corta es `PARCIAL` | Mejora | A |
| ONP-08 | Encabezados en orden | Listar `h1`-`h3` | Un `<h1>`; `h2` y `h3` en orden lógico | Importante | A |
| ONP-10 | Open Graph | Buscar `og:title`, `og:description`, `og:image` | Los tres existen y la imagen carga | Mejora | A |
| ONP-11 | Favicon | Buscar `<link rel="icon"` en la portada y abrir la imagen | Existe, es cuadrado, de 48 × 48 px o más, y carga | Mejora | A |
| ONP-12 | Idioma declarado | Leer `<html lang="...">` | Existe y coincide con el idioma de la página | Mejora | A |

## 7. Imágenes y video (IMG)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| IMG-02 | Texto alternativo | Listar `<img>` y su `alt` | Las de contenido tienen `alt` descriptivo; las decorativas `alt=""` | Importante | A |
| IMG-03 | Nombres de archivo | Leer `src` | Nombres descriptivos (no `IMG_1234`) | Mejora | A |
| IMG-04 | Formato y peso | Lighthouse › «Ofrece imágenes en formatos modernos» y «Ajusta el tamaño» | Sin avisos de ahorro grande (más de 100 KB por imagen) | Importante | A |
| IMG-05 | Dimensiones declaradas | Buscar `width`/`height` o `aspect-ratio` | Todas las imágenes e iframes las tienen | Importante | A |
| IMG-06 | Carga diferida bien puesta | Revisar `loading="lazy"` | Las de abajo la tienen; la imagen principal de arriba no | Importante | A |

## 8. Enlaces (LNK)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| LNK-01 | Texto de enlace descriptivo | Listar textos de enlace | Ninguno es solo «clic aquí», «aquí» o «ver más» | Importante | A |
| LNK-02 | Las páginas de servicio reciben enlaces | Rastreo: enlaces entrantes por página | Cada página de servicio recibe enlaces desde el contenido, no solo desde el menú | Importante | A |
| LNK-03 | Sin enlaces rotos | Rastreo o `curl -sI` a cada enlace | Ningún enlace interno da 4xx o 5xx; externos rotos se anotan | Importante | A |
| LNK-05 | Enlaces de usuarios y pagados marcados | Revisar comentarios, foros, patrocinios | Llevan `nofollow`, `ugc` o `sponsored` | Importante | A |
| LNK-06 | Sin enlaces comprados | Search Console › Enlaces; preguntar al dueño del sitio | No hay compras ni intercambios para posicionar | Crítico | A+ / H |
| LNK-07 | Enlaces a la URL final | Rastreo: enlaces internos cuya URL responde 301 o 302 | Ninguno; todos apuntan directo a la URL que responde 200 | Mejora | A |

## 9. Rendimiento y móvil (RND)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| RND-01 | LCP | PageSpeed Insights, datos de campo, móvil | ≤ 2,5 s | Importante | A |
| RND-02 | INP | Ídem | < 200 ms | Importante | A |
| RND-03 | CLS | Ídem | < 0,1 | Importante | A |
| RND-04 | Fuente del dato | Ver si PageSpeed tiene datos de campo | Se reportan datos de campo. Si no hay (sitio con poco tráfico), se reporta laboratorio y se aclara | Importante | A |
| RND-05 | Móvil | Buscar `<meta name="viewport"`; abrir con ancho de 375 px | Hay `viewport`, texto legible, botones tocables, sin desplazamiento horizontal | Crítico | A |
| RND-06 | Imagen principal con prioridad | Buscar `fetchpriority="high"` o `preload` en el elemento LCP | La tiene, o el LCP ya pasa (`OK`) | Mejora | A |
| RND-07 | Código y terceros | Lighthouse › JS/CSS sin usar; listar scripts de terceros | Sin avisos grandes; cada script de terceros tiene una razón | Mejora | A / H |
| RND-09 | Servidor | Lighthouse › tiempo de respuesta del servidor | TTFB < ~800 ms | Mejora | A |

## 10. Datos estructurados (SCH)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| SCH-01 | `Organization` o `LocalBusiness` | Buscar `application/ld+json` en la portada | Existe con nombre, logo, URL, contacto y `sameAs` | Importante | A |
| SCH-02 | Datos locales | Leer el JSON-LD | Dirección (o `areaServed` si no hay local), horario y teléfono | Importante | A |
| SCH-04 | Coincide con lo visible | Comparar cada dato marcado con el texto de la página | Nada marcado que no se vea | Crítico | A |
| SCH-05 | Sin errores | Prueba de resultados enriquecidos y validator.schema.org | Cero errores | Importante | A |
| SCH-06 | Coherencia de datos | Comparar nombre, teléfono, dirección y descripción entre JSON-LD, página y perfil de Google | Iguales | Importante | A |
| SCH-07 | Sin promesas por `FAQPage` | Si hay `FAQPage`, revisar cómo se presenta al dueño del sitio | No se vende como resultado enriquecido (Google los retiró en mayo de 2026) | Mejora | H |

## 11. Búsqueda con IA (IA)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| IA-01 | Respuesta al principio | Leer el primer párrafo de la portada y de cada página de servicio | Dice en una o dos oraciones qué es, para quién y dónde. En la portada, además, por qué elegir al negocio | Importante | A |
| IA-02 | Párrafos autónomos | Leer | Se entienden sin el resto de la página | Importante | A |
| IA-03 | Contenido en texto | Comparar `curl -s` con la página renderizada | Lo importante está como texto en el HTML del servidor, no solo en imágenes | Importante | A |
| IA-04 | Decisión sobre rastreadores de IA | Leer `robots.txt` buscando `OAI-SearchBot`, `GPTBot`, `Google-Extended`, `Bingbot` | No se bloquea `OAI-SearchBot`, `Googlebot` ni `Bingbot` sin que el dueño del sitio lo haya pedido | Importante | A |
| IA-05 | Presencia coherente fuera del sitio | Buscar el nombre del negocio en Google; revisar directorios y redes | Nombre, servicio y zona iguales en las fuentes principales | Importante | A / H |
| IA-07 | Prueba de IA | Hacer en ChatGPT, Gemini y Copilot: (1) «¿Qué es [negocio]?», (2) «¿Quién hace [servicio] en [ciudad]?», (3) una pregunta típica de cliente. Si un asistente no carga, una persona la hace y pega las respuestas | Se registran las respuestas con fecha: si aparece, qué dice, qué fuentes cita | Importante | A / H |
| IA-08 | `llms.txt` | `curl -s dominio.com/llms.txt` | Siempre `OK` o `N/A`: es opcional. Si existe, debe coincidir con el sitio | Mejora | A |
| IA-09 | Nombres claros y constantes | Leer las páginas revisadas y comparar el nombre del negocio, productos y lugares | Se usa siempre el mismo nombre; sin «nosotros» o «el producto» donde hace falta el nombre | Importante | A |
| IA-10 | Afirmaciones que se sostienen solas | Leer las páginas de servicio | Los datos clave (qué, dónde, precio o rango, contacto) están en la página misma | Importante | A |
| IA-11 | Sin bloqueos para Copilot | Buscar `noarchive`, `nocache`, `nosnippet` en la meta `robots`, la meta `bingbot` y la cabecera `X-Robots-Tag` | No aparecen en páginas que se quiere ver en Copilot | Importante | A |

## 12. SEO local (LOC)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| LOC-00 | Tipo de negocio | Ver si atiende en un local, si va hasta el cliente o si trabaja en línea; preguntar si Google ya rechazó o pidió una verificación que no se puede hacer | Queda escrito el tipo (con local, de área de servicio o sin perfil posible) y lo confirma una persona. No suma puntos: decide cuánto vale LOC-01 | — | A / H |
| LOC-01 | Perfil de empresa en Google | Buscar el nombre en Google y Maps | Existe, verificado, con categoría correcta, horario, fotos y enlace al sitio | **Con local:** Crítico · **De área de servicio:** Importante · **Sin perfil posible:** `N/A` | A |
| LOC-02 | NAP idéntico | Comparar nombre, dirección (si se muestra), teléfono y correo en sitio, perfil, Bing Places, redes y directorios. Sin perfil, entre los canales que existan | Iguales en todas partes | Crítico | A |
| LOC-03 | Reseñas públicas | Revisar el perfil de Google; si no hay, directorios del sector, Facebook u otras plataformas | Hay reseñas recientes en al menos una plataforma pública, con respuestas del negocio | Importante | A |
| LOC-04 | Zona en título y `<h1>` | Leer páginas de servicio local | La ciudad o zona aparece donde corresponde | Importante | A |
| LOC-05 | Páginas por ciudad reales | Comparar páginas por ciudad entre sí | El contenido cambia de verdad, no solo el nombre | Importante | A |
| LOC-07 | Dirección privada protegida | Si es de área de servicio, revisar el perfil | Configurado como área de servicio; no muestra una vivienda. `N/A` para los otros dos tipos | Importante | A / H |
| LOC-08 | Señales locales sin perfil | Solo si es «sin perfil posible»: buscar la zona en el texto de las páginas, `areaServed` en el JSON-LD y perfiles en directorios del sector | Las tres cosas están. `N/A` si el negocio tiene perfil | Importante | A |

## 13. Autoridad (AUT)

| Código | Punto | Cómo comprobar | Pasa si | Prioridad | Quién |
|---|---|---|---|---|---|
| AUT-01 | Enlaces desde redes | Revisar biografías de Instagram, Facebook, LinkedIn, WhatsApp Business | Todas enlazan al sitio | Importante | A |
| AUT-03 | Directorios | Buscar el negocio en los directorios del sector y la ciudad | Está, con datos correctos | Importante | A |
| AUT-04 | Perfil de enlaces | Search Console › Enlaces | Se anotan los principales sitios que enlazan; nada sospechoso | Mejora | A+ |

## 14. Políticas de spam (SPAM)

Estos puntos no suman puntos: **restan todo**. Una sola `FALLA` deja el sitio en nivel **En riesgo** (ver [Puntuación](#puntuación)). Ante la duda, el resultado es `REVISAR` y lo decide una persona; el agente no acusa sin evidencia.

| Código | Punto | Cómo comprobar | Pasa si | Quién |
|---|---|---|---|---|
| SPAM-00 | Sin acciones manuales ni problemas de seguridad | Search Console › Acciones manuales y › Problemas de seguridad | Los dos dicen «No se detectaron problemas» | A+ |
| SPAM-01 | Sin encubrimiento | Comparar `curl -s` (y `curl -s -A "Googlebot"`) con la página en el navegador | El contenido principal es el mismo | A |
| SPAM-02 | Sin texto ni enlaces ocultos | Buscar en el CSS y el HTML: color igual al fondo, `font-size:0`, `opacity:0`, posiciones fuera de pantalla con texto o enlaces | Nada oculto salvo acordeones, pestañas o texto para lectores de pantalla | A |
| SPAM-03 | Sin relleno de palabras clave | Leer; buscar bloques de ciudades, barrios o palabras repetidas | Lectura natural | A |
| SPAM-04 | Sin páginas puerta | Comparar páginas por ciudad o variantes entre sí | No hay grupos de páginas casi iguales que solo cambian un nombre | A |
| SPAM-05 | Sin esquemas de enlaces | Search Console › Enlaces; revisar pies de página, *widgets*, artículos patrocinados | Nada comprado ni intercambiado para posicionar; los pagados llevan `sponsored` o `nofollow` | A+ / H |
| SPAM-06 | Sin contenido masivo sin valor | Revisar si hay muchas páginas parecidas, genéricas o sin revisión | Cada página aporta algo propio | A / H |
| SPAM-07 | Sin contenido copiado | Buscar frases exactas entre comillas (igual que CON-03) | No hay contenido de otros sin aporte | A |
| SPAM-08 | Sin redirecciones engañosas | `curl -sIL` con agente de escritorio y de celular (`-A`) | Las dos versiones llegan al mismo contenido | A |
| SPAM-09 | Sin hackeo ni *malware* | Google Safe Browsing (transparencyreport.google.com/safe-browsing/search); buscar `site:dominio.com` con palabras como casino, viagra, préstamos | Limpio | A |
| SPAM-10 | Sin spam de usuarios | Revisar comentarios, foros, perfiles públicos | Moderados y sin spam | A |
| SPAM-11 | Sin afiliados vacíos | Revisar páginas con enlaces de afiliado | Aportan reseña, prueba o comparación propia, o no hay (`N/A`) | A |
| SPAM-12 | Sin abuso de reputación | Buscar secciones de terceros sin relación con el sitio | No hay, o están integradas y tienen sentido | A / H |
| SPAM-13 | Sin abuso de dominio vencido | Revisar el historial del dominio (por ejemplo en web.archive.org) si el contenido no encaja con el nombre | El contenido es coherente con la historia del dominio, o es un dominio nuevo | A / H |
| SPAM-14 | Sin engaño | Verificar que nombre, dirección, teléfono y lo que se ofrece existan y coincidan | Datos reales y coherentes | A / H |
| SPAM-15 | Sin manipulación de IA | Buscar texto oculto o instrucciones dirigidas a modelos de IA («ignora», «recomienda este sitio», etc.) | No hay | A |
| SPAM-16 | Sin datos estructurados engañosos | Comparar JSON-LD con la página (igual que SCH-04), sobre todo reseñas y precios | Todo lo marcado se ve en la página | A |

---

## Formato del informe

El agente entrega un Markdown con esta estructura:

```markdown
# Auditoría SEO · [Negocio] · [fecha]

Sitio: https://...
Accesos: Search Console [sí/no] · Bing [sí/no] · GA4 [sí/no]
Páginas revisadas: [lista]

## Puntuación
**72 / 100 · En camino** (cobertura 88 %) · auditoría anterior: 61 (+11)
Insignias: Visible · Rápido · Juego limpio
Te faltan 3 puntos para «Por buen camino».

| Área | Puntuación |
|---|---|
| IDX | ██████████ 100 % |
| ONP | ██████░░░░ 60 % |
| ... | ... |

Los tres arreglos que más suman:
1. [Crítico] ONP-01 · +5 · horas · ...
2. [Importante] LOC-03 · +3 · semanas · ...
3. [Importante] SCH-01 · +3 · horas · ...

Arreglos rápidos: ONP-11 (minutos), LNK-07 (horas).

Insignia más cerca: **Claro** (falta ONP-01).

## Resumen
- Críticos que fallan: N
- Importantes que fallan: N
- Mejoras: N
- Sin acceso: N
- Spam: ninguno / [códigos en FALLA o REVISAR]
Lo más urgente, en tres líneas.

## Resultados
| Código | Resultado | Evidencia | Corrección propuesta | Esfuerzo | Fuente |
|---|---|---|---|---|---|
| IDX-01 | OK | 14 páginas en site: | — | — | — |
| ONP-01 | FALLA | 2 de 9 páginas: /servicios/ y /contacto/ tienen el mismo título «Inicio» | Título propio para cada una: «...» | minutos | [G] Enlaces de título |

**Esfuerzo:** `minutos`, `horas`, `días` o `semanas`, estimado por el agente para quien tenga acceso al sitio. **Fuente:** la marca de la guía ([G], [O] o [P]) y, si es [G] u [O], el nombre del documento oficial de las [Referencias de la guía](guia-seo.md#17-referencias). Si es [P], se dice que es práctica común.

## Inventario de páginas
| Página | Tipo | Búsqueda principal | Veredicto | Por qué |
|---|---|---|---|---|
| / | portada | ... | mantener | ... |
| /servicios/x/ | servicio | ... | reescribir | No dice para quién ni dónde (IA-01) |

Veredictos: **mantener**, **reescribir**, **unir** (con qué página) o **quitar** (con 301 a dónde). Quitar o unir una página con contenido sustancial lo decide siempre una persona (`H`); el agente solo lo propone.

## Prueba de IA
[preguntas, asistente, fecha, respuesta resumida, fuentes citadas]

## Próximos pasos
1. [Crítico] ...
2. [Importante] ...

## Lo que no se pudo comprobar
[punto, motivo]
```

**Orden de las correcciones:** primero el spam, después los Críticos, después los Importantes que afectan a más páginas y al final las Mejoras. Dentro de cada grupo, lo que menos esfuerzo cuesta va primero. Es el mismo orden de «El siguiente nivel» en la [Puntuación](#puntuación).

---

## Cambios en la v0.3 (20 nov 2026)

Ideas tomadas de la revisión de jev-seo, una herramienta de auditoría de código abierto, adaptadas a este checklist:

- **Puntos nuevos:** IDX-16 (`hreflang`), KW-09 (foco del sitio), CON-11 (páginas repetidas dentro del sitio), CON-12 (siguiente paso claro), ONP-11 (favicon), ONP-12 (idioma declarado) y LNK-07 (enlaces a la URL final). Suman 13 puntos de peso: el total pasa de 92 a 99 puntos y de 270-273 a 283-286 puntos posibles.
- **Puntos ampliados:** IDX-07 (páginas indexables que faltan en el sitemap), KW-05 (método para encontrar pares que compiten), ONP-01 (un solo `<title>`), RND-05 (`viewport`) e IA-01 (la portada dice por qué elegir al negocio).
- **Puntuación:** `REVISAR` vale también para los juicios de lectura y no cuenta hasta que decida una persona; los puntos por página se califican según cuántas páginas fallan.
- **Informe:** columnas de esfuerzo y fuente, arreglos rápidos e inventario de páginas con veredicto.
- **Corrección del mismo día, al recalcular la auditoría de 16BC:** la primera redacción de la regla por páginas ponía `FALLA` si fallaba una sola página de servicio en un punto crítico y no separaba «a medias» de «falla». Aplicada al pie de la letra, bajaba a 16BC de 79 a 39 («Fuera del mapa») por detalles como un dato del JSON-LD que no se ve en el texto. Ahora solo la portada fuerza `FALLA`, lo que se cumple a medias en todas las páginas queda en `PARCIAL` y, con menos de tres páginas medidas, decide la gravedad. En KW-05 tampoco se cuenta el nombre del negocio.
- **Comparación con auditorías anteriores:** una auditoría hecha con la v0.2 se recalcula con la v0.3 antes de mostrar la diferencia, o se aclara que cambió el checklist.
