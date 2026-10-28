# Guía para agentes: videos de 16 Ball Creations

Esta guía es para cualquier agente de IA que edite un video de 16 Ball Creations: los talking heads de Renne (el
blog en video), casos de cliente, reels de servicio. Síguela completa. Si algo del pedido choca con esta guía,
pregunta antes de inventar. La marca, el tono y el nombre se rigen por `GUIA-DOCUMENTOS-PDF.md` §1; aquí va solo lo
propio del video.

Archivos de referencia (rutas absolutas en este equipo):

| Qué | Dónde |
|---|---|
| Proyectos de video (uno por toma) | `C:\Users\xan21\Videos\16bc\<proyecto>\` (video + wav del micrófono + `edit/`) |
| Herramientas de corte, sincronía y audio | `C:\Users\xan21\Videos\16bc\_herramientas\` |
| Proyecto de Remotion (kit, composiciones) | `C:\Users\xan21\Videos\16bc\_serie\remotion\` |
| Tipografías del video | `C:\Users\xan21\Videos\16bc\_serie\remotion\public\fonts\` |
| Notas de la serie en curso | `C:\Users\xan21\Videos\16bc\_serie\LEEME-SERIE2.md` |
| Logo (la bola 16, PNG transparente) | `C:\Dev\16bc-site\assets\img\ball-16.png` |
| La 16 en boceto (dibujo a mano) | `C:\Dev\16bc-site\assets\js\v4.js` (`sketch16`) · en Remotion: `src/sketch16.tsx` |

---

## 1. Formato

- Vertical 9:16, **1080 × 1920**, 30 fps, H.264. Audio AAC 48 kHz a **-14 LUFS** integrados, pico bajo -1 dBTP.
- **Zonas seguras:** nada de texto en los 250 px de arriba ni en los 350 px de abajo (ahí tapa la interfaz).
  Las portadas, además, llevan todo el texto dentro del 4:5 central (y 285 a 1635), que es lo que se ve en la
  cuadrícula del perfil.
- **La cara de Renne no se tapa nunca.** Antes de poner un apoyo, mide en un cuadro de cada plano dónde están la cara
  y la barba (en los planos cerrados llegan a ~1230 px) y pon los apoyos debajo. Las cortinillas a pantalla completa
  (un sitio en un teléfono, una pantalla del demo) sí pueden cubrir el plano unos segundos, con la voz y los
  subtítulos encima.

## 2. Tipografías

| Rol | Tipografía | Archivo | Uso |
|---|---|---|---|
| **Subtítulos personales** (blog, diario, opinión) | **Caveat Brush** | `CaveatBrush-Regular.ttf` (SIL OFL) | En minúscula normal, como se escribe; nada de MAYÚSCULAS forzadas. |
| **Textos informativos largos** (paneles, listas, datos, pasos) | **Recursive**, la del sitio | `recursive-*.woff2` (SIL OFL) | Sans (MONO 0, peso 300-500) para el texto; en modo mono (`"MONO" 1`) para etiquetas, cifras y rótulos cortos en mayúscula. |
| **Llamar la atención** (una palabra o cifra que tiene que saltar) | **Sekaiwo** | `Sekaiwo-Regular.ttf` (libre, también comercial) | Una o dos palabras, grande, junto a los trazos de lápiz (§4). Nunca para frases ni para subtítulos. |
| **Subtítulos técnicos** (explicar cómo se hace algo) | **Recursive** | `recursive-*.woff2` | Sans, peso 600-700. La misma letra del sitio, para que la imagen quede unificada. |
| **Títulos, cierres y portadas** | **Boska** + **Recursive casual**, como el sitio | `boska-*.woff2`, `recursive-*.woff2` (ITF Free Font License · SIL OFL) | El título en Boska; la parte emocional en Recursive casual inclinado (`"CASL" 1, "slnt" -15, "MONO" 0`, peso 500, al 90 % del tamaño del título y en el color del acento), como «*lo creamos.*» en el sitio. Reemplaza a Instrument Serif; Mr Dafoe se probó y se descartó el 22 oct. |

**Trebuchet MS no se usa en video** (su licencia no permite publicarla); queda solo para los documentos PDF.

**Sekaiwo no tiene ¿ ¡ » – — · …** (los glifos existen pero están vacíos y salen en blanco, sin caer en otra fuente).
En código, esos signos se dibujan con Caveat Brush (el texto se parte y esos caracteres van en un `span` aparte). Revisa la ñ y las tildes en cada palabra
que pongas en Sekaiwo: existen, pero el trazo es muy suelto.

Todas cubren el español completo (ñ, tildes, ¿¡) salvo lo dicho de Sekaiwo.

## 3. Subtítulos

- **Siempre quemados** en el video, en español, de 2 a 5 palabras por pantalla, sacados de la voz real con tiempos por
  palabra (`_serie/palabras.py`); las correcciones a mano van en `_serie/fijar.json`.
- **Posición:** a 2/3 de la altura (bloque centrado alrededor de y ≈ 1280), salvo que la cara llegue ahí; en ese caso
  bajan lo justo. Los apoyos van debajo de los subtítulos, no encima de la cara.
- **Personales (Caveat Brush):** blanco hueso `#ecebe6` con sombra suave para leerse sobre la toma; la palabra que se
  está diciendo pasa a blanco pleno y las que vienen esperan en gris. Sin caja de color.
- **Técnicos (Recursive):** la palabra activa puede marcarse con el color del acento del video (una bola, §5).
- Nombres que se escriben siempre igual: **16 Ball Creations**, **KaffeePlatz**, **PsicoFormando**, **Rivas Seven**,
  **Modularity**, **ERP**, **Cloudflare**, **Shopify**.

## 4. Trazos de lápiz

Para señalar algo se dibuja a mano, como en la 16 en boceto del sitio: **rayitas, circulitos, subrayados, flechas
cortas, tachones y equis**. Nunca recuadros perfectos ni flechas de presentación.

- Se dibujan solos, trazo a trazo (`stroke-dasharray`), en 0,3 a 0,7 s, en el momento en que Renne dice la palabra.
- Línea de 4 a 7 px a 1080 de ancho, puntas redondeadas, un poco irregular: el trazo «hierve» cambiando la semilla del
  ruido unas 6 veces por segundo (`feTurbulence` + `feDisplacementMap`, como `sketch16.tsx`).
- Un círculo no cierra perfecto: se pasa un poco del inicio. Un subrayado va con una ligera curva.
- Color: **el acento del video** (la bola del video o el color del cliente). Uno o dos trazos por idea; si todo está marcado, nada salta.
- Van con Sekaiwo cuando hace falta una palabra: el circulito rodea la cifra, la flecha apunta a la palabra en Sekaiwo.
- La **16 en boceto** («la que falta», «lo que aún no existe») es el acento para hablar de lo que todavía no existe.

## 5. Color

- Fondo y paneles: negro `#060707` y vidrio oscuro; líneas finas `#2a2e31`.
- **Las bolas son el único color**, y **un acento por video**: 1 `#f4c20d` · 2 `#4d7dff` · 3 `#ff5c6e` · 4 `#a375d8`
  · 5 `#ff9d3d` · 6 `#3ad389` · 7 `#e0765f`. Para un cliente puede usarse el color de su marca (KaffeePlatz: oro
  `#DEC185`), con su logo real.
- **Colorimetría de la toma:** natural, con contraste vivo aunque el tema sea pesado; nunca lavada ni desaturada para
  «dar sobriedad». Las tomas 4K del teléfono son **HDR10**: se convierten a SDR (tonemap) antes de colorear, o salen
  planas y verdes. Las tomas del trípode con seguimiento corren ~2,7 % lentas y se sincronizan con escala. Ver
  `LEEME-SERIE2.md`.

## 6. Estructura y movimiento

- **Gancho (0-3 s):** el mensaje en voz y en texto desde el primer cuadro. Sin intros ni negro al inicio.
- **Cortes:** se quitan tomas fallidas y arranques en falso; las pausas largas se acortan. En piezas personales se
  respetan más las pausas (máx. 1,6 s). Cada corte alterna un acercamiento leve del 5 % para que no salte.
- **Apoyos:** pocos y a tiempo con la palabra que los nombra; entran con un `pop` corto y salen con fundido.
- **Lo real antes que lo ilustrado:** el sitio del cliente en un teléfono, el demo, el logo verdadero. No se inventan
  cifras: solo las que Renne dice en el video o las que están medidas.
- **Cierre:** en piezas de servicio, la 16 de partículas con una frase y el logotipo; en piezas personales, un fundido a
  negro con el logotipo y **crea@16ballcreations.com**, sin efectos de sonido.

## 7. Audio

- La voz es la del micrófono externo (Reaper, `OneDrive\Documentos\REAPER Media\`), sincronizada con la cámara; el
  audio del teléfono solo sirve para sincronizar.
- Paso alto 80 Hz, compresión suave, limitador y -14 LUFS en dos pasadas (`cortar.py`, `nivelar.py`).
- Efectos de sonido bajos (`public/sfx/`), solo en piezas de servicio o técnicas.

## 8. Portada

Un cuadro real del video (un gesto que cuente el tema: resignación, sorpresa, duda), con colorimetría, más el título y
como mucho dos datos. Texto dentro del 4:5 central, logotipo abajo. Siempre dos versiones para elegir.

## 9. Antes de entregar

- [ ] La cara no queda tapada en ningún plano (revisar cuadros de cada apoyo).
- [ ] Subtítulos a 2/3 y en la tipografía del tipo de contenido.
- [ ] Sincronía medida: ±25 ms en la base y 0 ms en el final (`verificar.py`, `final.py`).
- [ ] -14 LUFS y pico bajo -1 dB.
- [ ] Nombres propios bien escritos; sin cifras inventadas.
- [ ] Color natural, con contraste; nada verde ni lavado.
