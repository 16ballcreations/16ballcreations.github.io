# La House of Demons — Propuesta 2 · Manifiesto

Segunda propuesta visual para **La House of Demons**, hecha por **16 Ball Creations**
para que el dueño pueda comparar dos direcciones sobre el mismo contenido.

Se publica en `https://16ballcreations.github.io/lhod-v2/`.

## Qué la diferencia de la Propuesta 1

Las dos propuestas responden al mismo encargo —*«impactante, sobria, fácil de leer
y sexy»*— y usan exactamente los mismos datos reales del negocio. Cambia el reparto
entre esas cuatro palabras.

La Propuesta 1 se inclinó a **sobria** y **fácil de leer**: editorial, contenida,
con bandas oscuras para seducir y bandas claras para informar.

La Propuesta 2 se inclina a **impactante**. Es la respuesta a una puerta que la
propia Propuesta 1 dejó abierta por escrito:

> «Si el dueño quiere que la provocación sea el centro, cambia la portada entera.»

Esto es esa portada entera.

| | Propuesta 1 | Propuesta 2 |
|---|---|---|
| Fondo | Bandas oscuras y claras alternadas | Un solo canvas oscuro, sin descanso |
| Titulares | 42–86 px | 64–190 px, interlineado 0,75 |
| El rojo | Un acento, casi siempre ausente | La voz principal |
| Esquinas | Rectas en todo | Pastillas de 15 px |
| Tipografía | Serif para leer, condensada para titular | La condensada carga casi todo |
| Fotografía | Rectangular, en tarjetas | Máscaras irregulares flotando |

## Por qué esta dirección tiene un argumento comercial

La auditoría del proyecto concluyó que el sitio actual *«compite con el mensaje
genérico de "bar de metal" —donde Pub Rock y Dynamite ya llevan años de ventaja—
en lugar de competir con el mensaje que nadie más puede copiar»*.

Este sistema está construido para declarar una posición, no para describirla. El
diferenciador del bar —metal con opción sin alcohol, entrenamiento y bienestar—
pasa de ser un párrafo a ser el titular: `METAL (SIN RESACA)`.

## Sistema visual

Un solo canvas oscuro. El titular grita, la información se lee.

| Token | Valor | Origen |
|---|---|---|
| Hollín | `#110D13` | Muestreado de la oscuridad real del bar |
| Hollín alto | `#1B161D` | Superficie de tarjeta y agenda |
| Sangre | `#D4103C` | Muestreado de las velas rojas del bar |
| Ceniza rosa | `#FFC9CE` | Contrapunto tonal, texto secundario |
| Hueso | `#F2ECE8` | Cuerpo de texto |
| Negro | `#000000` | Barra de navegación y filetes |

**La paleta no se importó de la referencia**: es la misma que se muestreó del local
para la Propuesta 1. Se comprobó que aguanta el sistema agresivo sin degradarse —
el rojo del bar sobre su propio fondo da mejor contraste que el de la referencia
sobre el suyo. El único token nuevo es Ceniza rosa, que cubre el papel de
contrapunto que la paleta original no tenía.

Contraste medido (WCAG):

| Combinación | Ratio | Nivel |
|---|---|---|
| Hueso sobre Hollín | 16,45 | AAA |
| Ceniza rosa sobre Hollín | 13,29 | AAA |
| Blanco sobre botón Sangre | 5,33 | AA |
| Sangre sobre Hollín | 3,61 | Solo display ≥24 px |

Por eso el rojo **nunca** se usa en un párrafo: solo en titulares grandes y acciones.

## Dónde el estilo cede

La referencia prohíbe los fondos claros y pide titulares enormes en todas partes.
Aquí se respeta lo primero y se matiza lo segundo: **la agenda, los precios y los
horarios se leen a 16–18 px sobre superficie elevada**, nunca en display gigante.

El estilo grita en los titulares, no en la tabla de precios. La conversión del sitio
—reservar y comprar el festival— ocurre en esas tablas, y en un móvil de 375 px.

## Fotografía

Igual que la Propuesta 1, esta demo **no usa fotografía del interior del bar, porque
no existe**. Se revisó la mediateca completa del sitio actual: la única fotografía
profesional disponible es la del hotel del festival (diurna, de resort familiar) y
del bar solo hay una foto de móvil.

Los huecos aparecen como máscaras irregulares con la nota «FOTO PENDIENTE» visible.
Las dos propuestas comparten esa carencia a propósito: así se comparan por diseño y
no por el material que cada una tuviera a mano. Es también el mejor argumento para
la sesión fotográfica, que sigue siendo el trabajo que más cambiaría el resultado.

## Contenido

Los datos son los mismos que en la Propuesta 1 y salen de las propias publicaciones
del negocio. No se inventó ningún precio. Lo que no se pudo confirmar sigue marcado
como «por confirmar».

## Desarrollo

No hay build. Se abre `index.html` o se sirve la carpeta:

```bash
python -m http.server 8080
```

Todas las páginas llevan `noindex` para que no compitan con el sitio real del bar.
