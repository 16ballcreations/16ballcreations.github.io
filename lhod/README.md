# La House of Demons — demo de propuesta

Demo navegable de la web propuesta para **La House of Demons**, bar de rock y metal en
Laureles (Medellín). Hecha por **16 Ball Creations** para enseñársela al dueño.

Se publica en `https://16ballcreations.github.io/lhod/`.

## Qué es y qué no es

- **Es** una maqueta funcional en HTML, CSS y JavaScript, sin frameworks ni build.
- **No es** el sitio real ni está conectado a nada: el formulario de reservas no
  envía datos a ningún servidor. Todas las páginas llevan `noindex` para que no
  compitan en buscadores con el sitio real del bar.

## Páginas

| Archivo | Qué resuelve |
|---|---|
| `index.html` | Portada: qué es la casa, qué pasa esta semana, festival, reseñas, horario |
| `agenda.html` | Todos los eventos con nombre, fecha, hora y precio **en texto**, con filtros |
| `la-casa.html` | El concepto de pub sobrio híbrido y lo que se sabe de la carta |
| `entrenamiento.html` | Roll Fuckk3r Roll, Run Fuckk3r Run, Metal Cycling y Diabolus in Training |
| `finca-metalera.html` | El festival: paquetes, precios reales y qué incluye |
| `reservas.html` | Propuesta de reserva en cuatro pasos + comparación con el bot actual |
| `visitanos.html` | Dirección, horario completo, mapa y preguntas frecuentes |

## Sistema visual

Bandas oscuras de cine para seducir, bandas claras de lectura para informar.
Un solo acento. Esquinas rectas, sin sombras.

| Token | Valor | Origen |
|---|---|---|
| Hollín | `#110D13` | Muestreado de la única foto interior del bar |
| Ceniza | `#E7E3E4` | Banda de lectura |
| Hueso | `#F2ECE8` | Texto sobre oscuro |
| Sangre | `#D4103C` | Muestreado de las velas rojas del bar |
| Sangre seca | `#9E0B2C` | Rojo legible sobre fondo claro |

Tipografías (Google Fonts): **Saira Condensed** para titulares en mayúsculas espaciadas,
**Newsreader** para lectura, **JetBrains Mono** para fechas y precios, y
**UnifrakturMaguntia** solo para numerales de edición.

El rojo puro del sello (`#F80000`) queda reservado al sello y nunca se usa en la interfaz.

## De dónde sale el contenido

Todo lo que se ve son datos reales del negocio, recogidos el 15 de septiembre de 2026:

- **Eventos**: leídos de los flyers publicados en sus redes y en la mediateca de
  `lahouseofdemons.com` (enero a agosto de 2026), más los cuatro que ofrece su bot de reservas.
- **Precios del festival**: de su tienda WooCommerce.
- **Reseñas**: 4,7 con 517 reseñas en Google.
- **Horario, dirección y teléfono**: de directorios de terceros y de sus propios flyers.
  **Faltan por confirmar con el dueño.**

Lo que no se pudo confirmar aparece marcado como «por confirmar» en la propia página.
No se inventó ningún precio.

## Pendientes conocidos

- No existe fotografía profesional del interior del bar. La portada usa un degradado
  con una nota visible donde iría la foto. Es el trabajo que más cambiaría el resultado.
- La carta completa con precios.
- El calendario real de los próximos meses: los eventos mostrados son los publicados
  entre enero y agosto.
- Decidir el nombre: los flyers dicen «La House of Forks» y el dominio dice
  «La House of Demons».

## Sobre el bot de reservas actual

Las reservas del bar salen hoy hacia `typebot.co/reservas-lhod`. Revisado el 15 de
septiembre de 2026: la primera pregunta es «¿Estás listo para salir de la Matrix?» y
ofrece cuatro eventos de julio y agosto, todos pasados. No hay opción de reservar
una mesa normal. `reservas.html` propone el reemplazo y explica por qué.

## Desarrollo

No hay build. Se abre `index.html` en el navegador o se sirve la carpeta con
cualquier servidor estático:

```bash
python -m http.server 8080
```

Las imágenes se cargan desde el CDN del propio sitio del bar (`i0.wp.com`), así que
la demo necesita conexión.
