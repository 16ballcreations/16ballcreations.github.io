/* Los servicios del estudio: una sola fuente para las páginas de servicio
   (scripts/servicios.mjs las genera) y para la lista de la portada.

   key       La clave que usan los proyectos en assets/js/projects.js (services)
   slug      La dirección: /servicios/<slug>/
   ball      La bola que lo marca (1 a 6)
   name      El nombre corto, para menús y etiquetas
   title     El título de la página (lo que la gente busca en Google)
   em        La parte del título que va en cursiva y en el color de la bola
   line      Una frase: qué es
   intro     Un párrafo: para quién es y qué cambia
   includes  Lo que incluye (entregables concretos)
   steps     El proceso de ese servicio, siempre en el orden de la marca
   faq       Preguntas frecuentes, en el idioma del cliente

   Reglas de tono (marca/GUIA-DOCUMENTOS-PDF.md): tuteo, sin jerga, sin
   apps móviles y sin prometer ventas, seguidores ni visibilidad. */

const MIRA_STEP = {
  t: "Tu MIRA",
  d: "Cinco preguntas sobre tu marca (unos tres minutos, gratis) y una llamada de 30 minutos. Primero entendemos de dónde viene tu marca, por qué nació y a dónde va."
};
const LIVE_STEP = {
  t: "En marcha",
  d: "Lo revisamos todo antes de entregarlo, te enseñamos a usarlo y seguimos a tu lado después."
};

const FAQ_PRICE = {
  q: "¿Cuánto cuesta?",
  a: "Depende de lo que necesites; después de la llamada te enviamos una propuesta por escrito, sin compromiso. La MIRA y la primera llamada no cuestan nada, y si quieres el diagnóstico completo por escrito, la auditoría de marca cuesta $700.000 COP."
};
const FAQ_WHERE = {
  q: "¿Trabajan solo en Medellín?",
  a: "Estamos en Medellín y podemos visitarte si estás cerca, pero trabajamos por videollamada con marcas de cualquier lugar. Hemos hecho proyectos en Colombia, Venezuela y Costa Rica."
};
/* Google, la IA y el precio de una página: preguntas que llegan tal cual
   (plan SEO/AEO del 22 oct, 2.6 y 2.7). Nunca prometemos que Google o la IA
   nos nombren: prometemos que todo diga lo mismo, para que te entiendan. */
export const FAQ_AI = {
  q: "¿Mi negocio puede aparecer cuando alguien le pregunta a ChatGPT?",
  a: "Nadie puede prometer que una IA te nombre. Lo que sí podemos es darle algo claro que entender: tu nombre, lo que haces y dónde estás, dichos igual en tu página, tu ficha de Google y tus redes. Google y la IA recomiendan a los negocios que reconocen como uno solo, y eso es justamente alinear tu marca."
};
export const FAQ_BRAND_GOOGLE = {
  q: "¿Qué tiene que ver mi marca con salir en Google?",
  a: "Mucho. Google no solo lee tu página: compara tu nombre, tu dirección, tus horarios y lo que dices en tu ficha de Google, tus redes y tu web. Cuando todo cuenta la misma historia, te reconoce como un solo negocio; cuando se contradice, duda. Alinear tu marca es lo que le da esa certeza."
};
export const FAQ_MONTHLY = {
  q: "¿Ustedes cobran SEO cada mes?",
  a: "No. Cada proyecto tiene un precio cerrado. Si después quieres que sigamos cuidándolo, hay un plan de cuidado opcional."
};
export const FAQ_WEB_PRICE = {
  q: "¿Cuánto cuesta una página web en Medellín?",
  a: "Depende de lo que necesites. En el mercado hay páginas de plantilla por unos cientos de miles de pesos y páginas diseñadas a la medida que cuestan varias veces más. Las nuestras son a la medida, hechas desde tu marca. Después de tu MIRA y la llamada te enviamos el precio exacto por escrito, sin compromiso."
};
/* the questions on the home page, with their FAQPage data */
export const HOME_FAQ = [FAQ_AI, FAQ_BRAND_GOOGLE, FAQ_MONTHLY, FAQ_WEB_PRICE];

const FAQ_START = {
  q: "¿Por dónde empiezo?",
  a: "Por tu MIRA: cinco preguntas sobre tu marca. Con tus respuestas preparamos la llamada, y en menos de 24 horas te escribimos para agendarla."
};

export const SERVICES = [
  /* the entrance tier (rate card v5, 21 Oct): the full MIRA sold on its own,
     with no corrections; it has a public price */
  {
    key: "auditoria",
    slug: "auditoria-de-marca",
    ball: 5,
    price: 700000,
    name: "Auditoría de marca",
    title: "Auditoría de marca",
    em: "canal por canal",
    line: "Revisamos tu marca en cada lugar donde aparece y te entregamos, por escrito, qué está fallando y cómo corregirlo.",
    intro: "Es la MIRA completa, a fondo. Revisamos cómo se ve y qué dice tu marca en tu página, tu ficha de Google, tus redes, tus datos de contacto y en lo que responde la IA cuando alguien pregunta por tu negocio. Te entregamos un documento con cada hallazgo, su prioridad y cómo corregirlo, y lo repasamos contigo. Las correcciones las puedes hacer tú, o hacerlas con nosotros.",
    includes: [
      "Revisión canal por canal: tu página, tu ficha de Google, tus redes y tus datos de contacto",
      "La prueba de la IA: qué responden ChatGPT y Gemini cuando preguntan por tu negocio",
      "Cada hallazgo con su prioridad y la forma de corregirlo",
      "Un documento por escrito, tuyo para siempre",
      "Una reunión de entrega de 45 minutos por videollamada",
      "Si en 30 días haces las correcciones con nosotros, lo que pagaste se abona"
    ],
    steps: [
      MIRA_STEP,
      { t: "La investigación", d: "Buscamos tu marca como lo haría un cliente: en Google, en Maps, en tus redes, en otros sitios y en la IA." },
      { t: "El documento", d: "Escribimos cada hallazgo canal por canal, con su prioridad y la forma exacta de corregirlo." },
      { t: "La entrega", d: "Lo repasamos contigo en 45 minutos por videollamada y respondemos tus dudas." }
    ],
    faq: [
      { q: "¿Cuánto cuesta la auditoría?", a: "$700.000 COP, de contado. Si en los 30 días siguientes decides que hagamos las correcciones y tu página, lo que pagaste se abona al proyecto." },
      { q: "¿La auditoría incluye las correcciones?", a: "No. Te entregamos qué corregir y cómo, para que lo hagas tú o tu equipo. Si prefieres que lo hagamos nosotros, lo cotizamos aparte y la auditoría se abona." },
      { q: "¿En qué se diferencia de la MIRA?", a: "La MIRA es gratis: cinco preguntas sobre tu marca, una llamada y un primer vistazo. La auditoría es el detalle completo, por escrito: qué falla, en qué canal y cómo corregirlo." },
      FAQ_AI
    ]
  },
  {
    key: "marca",
    slug: "identidad-de-marca",
    ball: 1,
    name: "Identidad de marca",
    title: "Identidad de marca",
    em: "que se reconoce",
    line: "Logo, colores, tipografía y una voz propia, construidos desde la historia de tu marca.",
    intro: "Una marca no empieza en el logo: empieza en por qué existe. Partimos de tu historia, de a quién le hablas y de lo que quieres que sientan, y desde ahí le damos forma a todo lo que se ve. El resultado es una marca que se reconoce en cada pieza, del letrero a la última publicación.",
    includes: [
      "Tu historia escrita: origen, propósito y a quién le hablas",
      "Logo y sus variantes (horizontal, vertical, ícono)",
      "Colores y tipografías",
      "Manual de marca: cómo usarla bien",
      "Voz de marca: cómo habla y cómo no",
      "Piezas básicas: tarjetas, plantillas para redes, papelería"
    ],
    steps: [
      MIRA_STEP,
      { t: "Tu historia", d: "Escribimos juntos de dónde viene la marca y qué quiere que sientan quienes la conocen. Esa historia guía cada decisión." },
      { t: "Tu identidad", d: "Proponemos el logo, los colores y la voz, y los ajustamos contigo hasta que se sientan tuyos." },
      { t: "Tu manual", d: "Te entregamos los archivos y el manual de marca, para que cualquiera pueda usarla sin desdibujarla." }
    ],
    faq: [
      { q: "Ya tengo logo, ¿tengo que cambiarlo?", a: "No necesariamente. Muchas veces el logo está bien y lo que falta es orden: colores que no se repiten, redes que cuentan otra historia. La MIRA nos dice si conviene actualizarlo o solo ordenarlo." },
      { q: "¿Qué recibo al final?", a: "Los archivos del logo en todos sus formatos, la paleta de colores, las tipografías, el manual de marca y las piezas acordadas, listas para usar." },
      FAQ_PRICE,
      FAQ_START
    ]
  },
  {
    key: "web",
    slug: "paginas-web",
    ball: 2,
    name: "Páginas web",
    title: "Diseño de páginas web",
    em: "que cuentan quién eres",
    line: "Un sitio hecho a la medida de tu marca, que se ve bien en el celular y hace fácil que te escriban.",
    intro: "Tu página es el lugar donde tu marca habla sin interrupciones. La diseñamos a partir de tu historia, sin plantillas, para que se sienta como el resto de tu marca: tus redes, tu local, tus documentos. Y la dejamos lista para que Google la entienda.",
    includes: [
      "Estructura y textos pensados desde tu marca",
      "Diseño a la medida, sin plantillas",
      "Se ve bien en celular, tableta y computador",
      "Formulario de contacto y botón de WhatsApp",
      "Preparada para que Google y la IA la entiendan: tu nombre, tu ubicación y tus servicios dichos igual que en tu ficha de Google y tus redes",
      "Tu dominio configurado (el correo con tu dominio va aparte)",
      "Te enseñamos a actualizar lo que cambia seguido"
    ],
    steps: [
      MIRA_STEP,
      { t: "Lo que va a contar", d: "Definimos qué secciones necesita tu página y qué dice cada una, con las palabras de tu marca." },
      { t: "Diseño y construcción", d: "Te mostramos cómo va a quedar y la construimos. Puedes verla avanzar desde la primera semana." },
      LIVE_STEP
    ],
    faq: [
      { q: "¿Necesito tener la marca lista antes?", a: "Ayuda, pero no es obligatorio. Si tu marca todavía no está clara, la MIRA lo muestra y podemos empezar por ahí, o hacer las dos cosas juntas." },
      { q: "¿Podré cambiar los textos yo mismo?", a: "Sí. Te enseñamos a actualizar lo que cambia seguido, y si algo se sale de eso, nos escribes." },
      { q: "¿Mi página va a salir primera en Google?", a: "No te lo vamos a prometer, ni en Google ni en ChatGPT, porque nadie puede garantizarlo. Lo que sí hacemos es que todo diga lo mismo (tu página, tu ficha de Google y tus redes) y dejarla bien hecha: títulos, descripciones, velocidad y un mapa del sitio. Así Google y la IA te entienden." },
      FAQ_AI,
      FAQ_MONTHLY,
      FAQ_WEB_PRICE
    ]
  },
  {
    key: "tienda",
    slug: "tiendas-en-linea",
    ball: 3,
    name: "Tiendas en línea",
    title: "Tiendas en línea",
    em: "con tu marca de punta a punta",
    line: "Tu catálogo en internet, con pedidos por la página o por WhatsApp, y que se sienta como tu marca.",
    intro: "Una tienda en línea es tu marca atendiendo a alguien que no puede entrar a tu local. Por eso la hacemos con tu voz y tu estilo, no con la cara de una plantilla: un catálogo fácil de recorrer y una forma sencilla de pedir.",
    includes: [
      "Catálogo con fotos, precios y filtros",
      "Pedidos por la página o directo a tu WhatsApp",
      "Fichas de producto con las palabras de tu marca",
      "Se ve bien en el celular, donde compra la mayoría",
      "Un lugar sencillo para actualizar productos y precios",
      "Preparada para que Google y la IA la entiendan: tu nombre, tu ubicación y tus productos dichos igual que en tu ficha de Google y tus redes"
    ],
    steps: [
      MIRA_STEP,
      { t: "Tu catálogo", d: "Ordenamos tus productos: categorías, fotos, descripciones y cómo los va a recorrer tu cliente." },
      { t: "Diseño y construcción", d: "Te mostramos cómo va a quedar, la construimos y probamos cada pedido de principio a fin." },
      LIVE_STEP
    ],
    faq: [
      { q: "¿Puedo recibir los pedidos por WhatsApp?", a: "Sí. Es la forma más común en nuestros proyectos: el cliente arma su pedido en la tienda y te llega listo a tu WhatsApp." },
      { q: "¿Quién sube los productos?", a: "Dejamos cargado el catálogo inicial y te enseñamos a agregar, cambiar y quitar productos." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  },
  {
    key: "sistemas",
    slug: "sistemas-para-tu-negocio",
    ball: 4,
    name: "Sistemas para tu negocio",
    title: "Sistemas para administrar tu negocio",
    em: "en un solo lugar",
    line: "Pedidos, inventario, citas y facturas en un solo lugar, en vez de cuadernos y hojas de cálculo.",
    intro: "Cuando el negocio crece, los cuadernos y las hojas de cálculo empiezan a contar historias distintas. Hacemos sistemas a la medida para que todo viva en un solo lugar, con las palabras de tu negocio, y cada persona vea solo lo que le toca.",
    includes: [
      "Pedidos y órdenes de trabajo",
      "Inventario que avisa cuando algo se acaba",
      "Agenda y citas",
      "Facturas y registro de ventas",
      "Clientes y su historial",
      "Permisos: cada empleado ve solo lo suyo"
    ],
    steps: [
      MIRA_STEP,
      { t: "Cómo trabajas hoy", d: "Recorremos contigo cómo funciona tu negocio: qué se anota, dónde se pierde, qué quieres ver de un vistazo." },
      { t: "Construcción por partes", d: "Lo construimos por módulos, empezando por lo que más te duele, y lo pruebas desde temprano." },
      LIVE_STEP
    ],
    faq: [
      { q: "¿Qué es Modularity?", a: "Es nuestro producto propio para administrar negocios, hoy en desarrollo. Puedes probar la demo con datos de ejemplo; si se ajusta a tu negocio, puede ser un punto de partida más rápido que un sistema desde cero." },
      { q: "¿Necesito saber de tecnología?", a: "No. El sistema usa las palabras de tu negocio y te enseñamos a usarlo a ti y a tu equipo." },
      FAQ_PRICE,
      FAQ_START
    ]
  },
  {
    key: "asesoria",
    slug: "asesoria-de-imagen-y-redes",
    ball: 6,
    name: "Asesoría de imagen y redes",
    title: "Asesoría de imagen y redes",
    em: "para que todo cuente lo mismo",
    line: "Revisamos tus perfiles, tu imagen y tus piezas para que todo cuente la misma historia.",
    intro: "A veces no hace falta construir nada nuevo: hace falta ordenar. Revisamos cómo se ve y cómo habla tu marca en cada lugar donde aparece, y te decimos qué cambiar para que todo se sienta como una sola marca. Sirve para negocios y para marcas personales.",
    includes: [
      "Revisión de tus perfiles: foto, nombre, descripción, destacados",
      "Qué cuenta tu marca hoy y qué debería contar",
      "Guía de imagen: colores, fotos y estilo para tus publicaciones",
      "Recomendaciones de imagen personal, si eres tú la marca",
      "Un plan por escrito con lo que conviene cambiar primero"
    ],
    steps: [
      MIRA_STEP,
      { t: "La revisión", d: "Recorremos tus redes, tu página y tus piezas, y anotamos dónde la historia se rompe." },
      { t: "Tu plan", d: "Te entregamos por escrito qué cambiar, en qué orden y cómo, con ejemplos." },
      { t: "Acompañamiento", d: "Si quieres, lo aplicamos contigo o lo hacemos por ti." }
    ],
    faq: [
      { q: "¿En qué se diferencia de la MIRA?", a: "La MIRA es el primer vistazo, gratis, para saber por dónde empezar. La asesoría es el trabajo completo: revisión a fondo, plan por escrito y acompañamiento." },
      { q: "¿Sirve para una marca personal?", a: "Sí. Lo hemos hecho con artistas y con proyectos de divulgación: ordenar perfiles, imagen y voz para que la persona y la marca cuenten lo mismo." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  }
];
