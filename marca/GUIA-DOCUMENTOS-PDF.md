# Guía para agentes: documentos PDF de 16 Ball Creations

Esta guía es para cualquier agente de IA que corra en este equipo y reciba el
encargo de crear un documento para un cliente de 16 Ball Creations: una
propuesta, una cotización, un resumen de MIRA, un informe, un acuerdo, una
carta. Síguela completa. Si algo del pedido choca con esta guía, pregunta antes
de inventar.

Archivos de referencia (todas las rutas son absolutas en este equipo):

| Qué | Dónde |
|---|---|
| Plantilla lista para copiar | `C:\Dev\16bc-site\marca\plantilla-documento.html` |
| Conversor a PDF con verificación | `C:\Dev\16bc-site\scripts\pdf.mjs` |
| Ejemplo real ya en uso (autorización) | `C:\Dev\16bc-site\autorizacion\index.html` |
| Logo (la bola 16, PNG transparente) | `C:\Dev\16bc-site\assets\img\ball-16.png` |
| Logotipo completo (sobre fondo claro) | `C:\Dev\16bc-site\assets\img\logo.png` |
| El sitio, como referencia de tono | https://page.16ballcreations.workers.dev |

---

## 1. Quién es la marca

- **Nombre:** siempre **16 Ball Creations**, con espacio y mayúsculas así. Nunca
  "16BallCreations", "16 ball creations" ni "16BC" en un documento para un
  cliente ("16BC" es solo abreviatura interna).
- **Lema:** *Si no existe, lo creamos.* Va en el pie de cada hoja.
- **El concepto:** en una mesa de pool hay quince bolas; la 16 no existe, así que
  la creamos. Las bolas son el único color del sistema y aparecen como
  marcadores numerados. La metáfora del pool se usa con medida: un guiño, no un
  disfraz.
- **Quién firma y quién se compromete:** **Renne Castellanos (16 Ball
  Creations)**. 16 Ball Creations no es una marca registrada, así que todo
  compromiso, autorización o acuerdo va a nombre de Renne, con la marca entre
  paréntesis.
- **Contacto:** 16ballcreations@gmail.com · Medellín, Colombia.
- **Trayectoria, si hace falta:** desde 2013; proyectos en Venezuela, Colombia
  y Costa Rica.

## 2. Cómo hablamos

El lector es un cliente sin conocimiento técnico. El documento tiene que
entenderse sin explicaciones.

- **Español, tuteo** ("tu marca", "te proponemos"). Cálido y directo, frases
  cortas.
- **Primero la marca, después lo técnico.** El proceso siempre es: entender de
  dónde viene la marca, por qué nació y a dónde va → su identidad → las
  plataformas donde vive. Los documentos cuentan ese orden.
- **Nuestro nicho es la coherencia**: que la marca cuente una sola historia en
  todas partes. **No prometemos** más ventas, más seguidores ni más
  visibilidad. Se habla de lo que el cliente quiere que su gente *sienta* y de
  que todo se vea y se sienta como una sola marca.
- **Sin jerga.** Nunca nombres de tecnologías (React, Angular, Django, Astro,
  Cloudflare, PHP…), ni "ERP", "BI", "backend", "full-stack", "deploy",
  "producción", "casos límite", "trazabilidad". Di lo que hace: "un sistema
  para administrar tu negocio", "lo revisamos todo antes de entregarlo".
- **Servicios que sí ofrecemos:** marca e identidad visual, páginas web,
  tiendas en línea, sistemas para el negocio (y Modularity, el producto propio),
  video y contenido para redes, asesoría de imagen y de redes.
  **No ofrecemos apps móviles.**
- **MIRA** = Marca, Imagen, Redes y Alineación: el levantamiento que hacemos
  después de la primera llamada. Se escribe en mayúsculas.
- **Precios:** los proyectos van "desde US$200". Nunca inventes cifras: si el
  pedido no trae precios, deja `US$ 000` visible y avísalo al entregar.

## 3. El sistema visual

### Colores

Fondo negro, líneas finas y un solo color de acento por documento.

| Token | Hex | Uso |
|---|---|---|
| `--felt` | `#060707` | Fondo de la hoja |
| `--hairline` | `#2a2e31` | Líneas de 1 px, bordes |
| `--white` | `#ffffff` | Títulos y datos |
| `--bone` | `#ecebe6` | Texto principal sobre negro |
| `--ash` | `#a1a4a5` | Texto secundario, introducciones |
| `--iron` | `#71757c` | Etiquetas pequeñas |
| `--paper` | `#f7f6f2` | Zona de papel (firmas) |
| `--ink` | `#111111` | Texto sobre papel |

Las bolas (el único color):

| Bola | Hex | | Bola | Hex |
|---|---|---|---|---|
| 1 | `#f4c20d` | | 5 | `#ff9d3d` |
| 2 | `#4d7dff` | | 6 | `#3ad389` |
| 3 | `#ff5c6e` | | 7 | `#e0765f` |
| 4 | `#a375d8` | | 8 | negra, número blanco |

- **Un acento por documento** (`--accent`), elegido entre las bolas. Por
  defecto la 6 (verde). Se usa en: la parte en cursiva del título, la segunda
  línea del encabezado, el borde de la frase destacada y nada más.
- Los bloques numerados pueden usar varias bolas (1, 2, 3…), cada una con su
  color, porque son bolas, no acentos.
- **Nada de** degradados de colores, fondos de color, sombras marcadas, fotos de
  banco ni emojis.

### Tipografías

Se cargan de Google Fonts (ya están en la plantilla):

| Fuente | Para qué | Notas |
|---|---|---|
| **Instrument Serif** | Títulos, frases destacadas, nombres de bloques | Peso 400. La parte emocional va en *cursiva* y en el acento |
| **Inter** | Texto corrido, datos | 300–500. Cuerpo 9,5 pt; listas 8,6 pt |
| **JetBrains Mono** | Etiquetas, encabezado, pie, cifras | Mayúsculas con espaciado amplio (0,1–0,12 em), 6,5–8,5 pt |

Escala en A4: título 34 pt · subtítulo 20 pt · bloque 15 pt · frase destacada
13 pt · cuerpo 9,5 pt · etiquetas 6,5–7 pt.

### La hoja

- **A4 vertical**, márgenes de 15 mm arriba, 16 mm a los lados y 12 mm abajo.
- Cuadrícula tenue de 10 mm arriba, que se desvanece hacia la mitad.
- Líneas de 1 px; tarjetas con radio de 4 mm y fondo apenas más claro.
- **La zona de papel** (fondo `#f7f6f2`, texto oscuro) va **al pie**, solo
  cuando hay firmas o algo que el cliente vaya a escribir a mano, porque las
  firmas son en tinta oscura. El paso del negro al papel es un degradado de
  ~11 mm, nunca un corte seco.

## 4. Estructura de cada hoja

En este orden (la plantilla ya lo trae):

1. **Encabezado:** a la izquierda la bola 16 + "16 Ball Creations" en mono; a
   la derecha, en mono y mayúsculas, la categoría y debajo, en acento, el tipo
   de documento o el cliente.
2. **Título:** una frase corta, con la parte emocional en cursiva y acento.
   Ej.: "Tu marca, *en orden.*", "Tu marca, contada *con tu permiso.*"
3. **Introducción:** dos o tres líneas en gris claro que digan para qué es el
   documento.
4. **Datos:** cuadrícula de líneas finas con cliente, proyecto, fecha y quién
   lo prepara.
5. **Contenido:** bloques numerados con bolas (máximo tres por fila), tablas
   de líneas finas para cifras y cronogramas, texto corrido.
6. **Frase destacada** (opcional): una sola idea, con borde de acento.
7. **Zona de papel con firmas** (solo si aplica).
8. **Pie:** "Contacto: 16ballcreations@gmail.com" a la izquierda y "Si no
   existe, lo creamos." a la derecha, en mono pequeño.

Cada `<article class="sheet">` es una hoja. Para más páginas, copia la hoja
entera; el encabezado y el pie se repiten en cada una.

## 5. Reglas que no se rompen

- **Nunca pongas una firma.** Las líneas de firma van vacías. La firma de Renne
  vive solo en el panel privado (`/admin/firma`) y se aplica únicamente en las
  autorizaciones que se firman en línea. No la busques, no la copies, no la
  dibujes, no la recrees.
- **Nunca inventes datos del cliente** (documentos de identidad, redes, cifras,
  fechas de entrega). Lo que falte se deja con un marcador visible
  (`Documento:` vacío, `US$ 000`, `@usuario`) y se reporta.
- **Los documentos de clientes no van al repositorio.** `C:\Dev\16bc-site` se
  publica en GitHub de forma pública. Guarda el HTML y el PDF fuera del
  repositorio, donde el usuario indique; si no lo dice, pregunta.
- Un documento que comprometa a alguien (acuerdo, autorización, contrato) se
  redacta a nombre de **Renne Castellanos (16 Ball Creations)** y se le
  recuerda al usuario que no es asesoría legal.

## 6. Cómo producirlo

1. Copia `marca\plantilla-documento.html` a la carpeta de trabajo del cliente
   (fuera del repositorio). Si la mueves, corrige la ruta del logo
   (`src` de `.brand img`) para que apunte a
   `C:/Dev/16bc-site/assets/img/ball-16.png` (en HTML:
   `file:///C:/Dev/16bc-site/assets/img/ball-16.png`).
2. Cambia el `<title>` a "Tipo de documento — Cliente". El nombre del PDF sigue
   el mismo patrón, sin tildes ni espacios: `propuesta-cafe-la-esquina.pdf`.
3. Llena el contenido siguiendo las secciones 2 a 5. Elige el acento
   (`--accent`) si el pedido lo amerita; si no, deja la bola 6.
4. Convierte a PDF desde `C:\Dev\16bc-site`:
   ```
   node scripts/pdf.mjs "C:\ruta\documento.html" "C:\ruta\documento.pdf"
   ```
   En PowerShell, si `node` funciona pero `npx` no, usa `npx.cmd`. El script
   usa el Microsoft Edge instalado, espera las fuentes, imprime los fondos y
   **mide cada hoja**: si alguna pasa de 297 mm lo dice y termina con error.
   Necesita internet para las fuentes; si avisa que una fuente no cargó, el PDF
   saldrá con fuentes de reemplazo y hay que repetirlo con conexión.
5. **Revisa el PDF antes de entregarlo** (ábrelo o léelo) con la lista de abajo.

Si una hoja no cabe: acorta el texto primero; después reduce márgenes entre
secciones (de 7 mm a 5 mm); nunca bajes el cuerpo de 8,5 pt ni dejes contenido
cortado. Si de verdad no cabe, pasa a dos hojas.

## 7. Lista de verificación

- [ ] "16 Ball Creations" escrito bien en el encabezado; lema en el pie.
- [ ] Un solo acento; bolas con su número en los bloques.
- [ ] Título con una parte en cursiva; introducción que dice para qué es.
- [ ] Datos del cliente correctos; nada inventado; faltantes marcados.
- [ ] Sin jerga técnica, sin apps móviles, sin promesas de ventas o alcance.
- [ ] Compromisos a nombre de Renne Castellanos (16 Ball Creations).
- [ ] Firmas vacías, sobre la zona de papel, al pie.
- [ ] `pdf.mjs` dice ✓ en todas las hojas y no avisa fuentes faltantes.
- [ ] Archivos guardados fuera del repositorio.
