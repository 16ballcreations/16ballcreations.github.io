# La House of Demons — dos propuestas de web

Demos navegables de la web propuesta para **La House of Demons**, bar de rock y metal
en Laureles (Medellín). Hechas por **16 Ball Creations** para enseñárselas al dueño.

Se publica en `https://16ballcreations.github.io/lhod/`.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | **Selector**: punto de entrada para presentar, con la comparación entre ambas |
| `v1/` | Propuesta 1 · **Editorial** — bandas oscuras y claras, acento contenido |
| `v2/` | Propuesta 2 · **Manifiesto** — canvas único, display enorme, el rojo como voz |
| `docs/` | Auditoría, plan de ejecución y propuesta de diseño |

Cada versión es autónoma: tiene sus siete páginas, su CSS, su JS y su propio README
con el detalle de su sistema visual.

## Las dos propuestas

Ambas responden al mismo encargo —*«impactante, sobria, fácil de leer y sexy»*— y usan
**exactamente el mismo contenido real** del negocio. Lo que cambia es el reparto entre
esas cuatro palabras.

La Propuesta 1 se inclina a **sobria** y **fácil de leer**. La Propuesta 2 se inclina a
**impactante**, y responde a una puerta que la propia Propuesta 1 dejó abierta por escrito:

> «Si el dueño quiere que la provocación sea el centro, cambia la portada entera.»

| | Propuesta 1 | Propuesta 2 |
|---|---|---|
| Fondo | Bandas oscuras y claras alternadas | Un solo canvas oscuro |
| Titulares | 42–86 px | 64–190 px, interlineado 0,75 |
| El rojo | Un acento, casi siempre ausente | La voz principal |
| Esquinas | Rectas en todo | Pastillas de 15 px |
| Portada dice | «Bar de rock y metal» | «Metal (sin resaca)» |

La paleta es la misma en las dos: se muestreó del propio local (Hollín de su oscuridad,
Sangre de sus velas rojas). La Propuesta 2 solo añade **Ceniza rosa `#FFC9CE`** como
contrapunto tonal. Cambia cómo se usan los colores, no de dónde salen.

## Qué comparten

- **Los datos**: de las publicaciones del propio negocio. No se inventó ningún precio.
  Lo que no se pudo confirmar sigue marcado como «por confirmar».
- **La carencia**: ninguna usa fotografía del interior del bar, porque hoy no existe.
  Los huecos van marcados en ambas a propósito, para que se comparen por diseño y no
  por el material que cada una tuviera a mano.
- **El alcance**: son maquetas en HTML, CSS y JavaScript, sin frameworks ni build. El
  formulario de reservas no envía datos a ningún servidor. Todas las páginas llevan
  `noindex`.

## Desarrollo

```bash
python -m http.server 8080
```

## Documentación

La base de conocimiento vive en [`docs/`](docs/) y **no está enlazada desde las demos**:
la auditoría es un diagnóstico duro del sitio que el cliente ya tiene, y conviene
presentarlo en persona.
