/* Los servicios del estudio: una sola fuente para las páginas de servicio
   (scripts/servicios.mjs las genera) y para la lista de la portada.

   key       La clave que usan los proyectos en assets/js/projects.js (services)
   slug      La dirección: /servicios/<slug>/
   ball      La bola que lo marca (1 a 6)
   name      El nombre corto, para menús y etiquetas
   title     El título de la página (el h1)
   seo       El <title>: con las palabras que la gente busca (se le suma «desde Medellín»)
   who       Una línea: para quién es (la lista de /servicios/)
   desc      La descripción para Google, si la automática pasa de ~155 caracteres
   examples  Opcional: ejemplos por industria y una demo (sistemas)
   em        La parte del título que va en cursiva y en el color de la bola
   line      Una frase: qué es (la tarjeta de la portada)
   group     La línea del Ecosistema de Marca: "esencia" o "ecosistema" (LINES)
   prices    Sus precios cerrados (tarifario v7, sin «desde»): { n, v, d };
             sin v es «a convenir»
   extras    Los adicionales, con la misma forma
   plans     true en páginas web: muestra los planes (PLANS)
   what      La primera oración de su página: qué, para quién y dónde, en
             tercera persona para que Google y la IA la puedan citar tal cual
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
  a: "Cada cosa tiene su precio cerrado, a la vista en cada servicio: la auditoría de marca cuesta $500.000 COP, el manual de marca va de $1.300.000 a $3.000.000 y las páginas, en tres planes, de $3.200.000 a $8.500.000. La MIRA y la primera llamada no cuestan nada."
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
  a: "No. Cada proyecto tiene un precio cerrado. Si después quieres que sigamos cuidándolo, hay un mantenimiento opcional de $350.000 al mes, sin permanencia."
};
/* our sell point: the client stays in control (Renne, 22 Oct) */
export const FAQ_INDEPENDENCE = {
  q: "¿Voy a depender de ustedes para todo?",
  a: "No, y esa es la idea. Todo lo que hacemos queda a tu nombre: el dominio, las cuentas, los archivos y los textos. Te enseñamos a manejarlo; si prefieres que nos encarguemos de algo, lo hacemos, pero siempre con la información en tus manos, para que tengas el control de tu negocio."
};
export const FAQ_WEB_PRICE = {
  q: "¿Cuánto cuesta una página web en Medellín?",
  a: "En el mercado hay páginas de plantilla por unos cientos de miles de pesos y páginas a la medida que cuestan varias veces más. Las nuestras son a la medida, hechas desde tu marca, en tres planes con precio cerrado: Esencial, $3.200.000; Profesional, $4.500.000, e Integral, $8.500.000 COP. Todos incluyen la auditoría de marca y tu dominio por un año, y quedan listos en una semana."
};
/* the questions on the home page, with their FAQPage data */
export const HOME_FAQ = [FAQ_AI, FAQ_BRAND_GOOGLE, FAQ_MONTHLY, FAQ_INDEPENDENCE, FAQ_WEB_PRICE];

const FAQ_START = {
  q: "¿Por dónde empiezo?",
  a: "Por tu MIRA: cinco preguntas sobre tu marca. Con tus respuestas preparamos la llamada, y en menos de 24 horas te escribimos para agendarla."
};

/* El Ecosistema de Marca: la suma de dos líneas (tarifario v7, 9 nov 2026).
   Cada línea tiene su página (/servicios/<id>/) con sus planes, precios y
   adicionales; la portada y /servicios/ solo muestran las dos tarjetas.
   offers: los planes de la línea (en ecosistema, PLANS). has: lo que se
   nombra en la tarjeta. Los sistemas no llevan precio: Modularity aún no se
   comercializa (Renne, 9 nov). */
export const LINES = {
  esencia: {
    id: "esencia-de-marca", name: "Esencia de marca", em: "quién eres",
    line: "Que tu marca se sienta tuya y diga lo mismo en todas partes: la auditoría y el manual de marca.",
    seo: "Esencia de marca: auditoría y manual de marca",
    desc: "Esencia de marca: la auditoría de marca ($500.000) y el manual de marca, express ($1.300.000) o completo ($3.000.000). Precios cerrados, desde Medellín.",
    intro: "Antes de cualquier página, tu marca tiene que saber quién es. Revisamos cómo se ve hoy en cada lugar donde aparece y la ordenamos en un manual, para que todo lo que hagas después cuente la misma historia.",
    has: ["Auditoría de marca", "Manual de marca express", "Manual de marca completo"],
    offers: [
      { n: "Auditoría de marca", tag: "Qué está fallando y cómo arreglarlo", time: "Lista en 2 días", v: 500000, items: [
        "Tu página, tu perfil de Google, tus redes y tus datos de contacto, revisados uno por uno",
        "Lo que responden ChatGPT y Gemini cuando preguntan por tu negocio",
        "Cada hallazgo con su prioridad y cómo corregirlo, por escrito",
        "Una reunión de entrega de 45 minutos",
        "De contado"
      ] },
      { n: "Manual de marca express", tag: "Lo esencial de tu identidad, por escrito", v: 1300000, items: [
        "Tu logo actual, con sus versiones y sus usos",
        "Tus colores y tu tipografía",
        "Tu tono: cómo habla tu marca",
        "Un documento claro para tu equipo y tus proveedores"
      ] },
      { n: "Manual de marca completo", tag: "Tu identidad completa, para que nadie la desdibuje", v: 3000000, items: [
        "Todo lo del manual express",
        "Tu esencia: historia, propósito y a quién le hablas",
        "Voz de marca: cómo habla y cómo no",
        "Fotografía: el estilo de tus imágenes",
        "Aplicaciones: redes, papelería y espacios",
        "Los archivos listos para usar"
      ] }
    ],
    note: "Si en los 30 días siguientes pasas a algo más completo (de la auditoría a un manual, del express al completo o a un plan de página), lo que pagaste se abona."
  },
  ecosistema: {
    id: "ecosistema-digital", name: "Ecosistema digital", em: "dónde te encuentran",
    line: "El lugar donde tu marca atiende, vende y se organiza: tu página, tu tienda o tu sistema.",
    seo: "Ecosistema digital: tu página web en tres planes y tu tienda en línea",
    desc: "Ecosistema digital: tu página web en tres planes, Esencial ($3.200.000), Profesional ($4.500.000) e Integral ($8.500.000), y La Tienda ($5.500.000). Precios cerrados.",
    intro: "Tu ecosistema es el lugar donde te encuentran: tu página, tus canales y, si vendes productos, tu tienda. Cada plan se construye sobre tu esencia: todos traen la auditoría de marca y quedan listos en una semana.",
    has: ["Páginas web en tres planes", "La Tienda", "Sistemas, con Modularity"],
    note: "Si subes de plan dentro de los 30 días siguientes a la entrega, lo que pagaste se abona."
  }
};
export const UMBRELLA = {
  name: "Ecosistema de Marca",
  line: "Tu esencia de marca y tu ecosistema digital, contando la misma historia."
};
/* the website plans, by name and with their price (Ecosistema digital) */
export const PLANS = [
  { n: "Esencial", tag: "Que te encuentren y te entiendan", time: "Lista en 1 semana", v: 3200000, items: [
    "La auditoría de marca y tu MIRA",
    "Tus canales alineados: Instagram, Facebook, LinkedIn, WhatsApp Business y Google",
    "Tu perfil de Google completo",
    "Una página informativa con galería de hasta 6 trabajos",
    "Contacto por WhatsApp, formulario y mapa",
    "Dominio, alojamiento y un correo con tu dominio por un año"
  ] },
  { n: "Profesional", tag: "Que te elijan", time: "Lista en 1 semana", v: 4500000, items: [
    "Todo lo de Esencial",
    "Tu manual de marca express",
    "Una página para cada proyecto o trabajo, hasta 8",
    "Lista para que los buscadores con IA la entiendan"
  ] },
  { n: "Integral", tag: "Tu ecosistema completo", time: "Lista en 1 semana", v: 8500000, items: [
    "Todo lo de Profesional",
    "Tu manual de marca completo",
    "Una página para cada proyecto, hasta 12",
    "Un asistente para que edites tu página tú mismo, con una sesión de 45 minutos",
    "3 meses de mantenimiento"
  ] }
];

export const SERVICES = [
  /* the entrance tier (rate card v5, 21 Oct): the full MIRA sold on its own,
     with no corrections; it has a public price */
  {
    key: "auditoria",
    slug: "auditoria-de-marca",
    ball: 1,
    group: "esencia",
    prices: [{ n: "Auditoría de marca", v: 500000, d: "De contado. Lista en 2 días, con la reunión de entrega." }],
    name: "Auditoría de marca",
    title: "Auditoría de marca",
    seo: "Auditoría de marca: web, Google y redes",
    who: "Para negocios que ya tienen página y redes, y sienten que algo no cuadra.",
    desc: "Auditoría de marca desde Medellín: revisamos tu web, tu ficha de Google y tus redes, y te entregamos por escrito qué corregir. $500.000 COP.",
    em: "canal por canal",
    line: "Revisamos tu marca en cada lugar donde aparece y te entregamos, por escrito, qué está fallando y cómo corregirlo.",
    what: "16 Ball Creations revisa la marca de negocios y marcas personales en cada lugar donde aparece y entrega por escrito qué corregir, desde Medellín.",
    intro: "Es la MIRA completa, a fondo. Revisamos cómo se ve y qué dice tu marca en tu página, tu ficha de Google, tus redes, tus datos de contacto y en lo que responde la IA cuando alguien pregunta por tu negocio. Te entregamos un documento con cada hallazgo, su prioridad y cómo corregirlo, y lo repasamos contigo. Las correcciones las puedes hacer tú, o hacerlas con nosotros.",
    includes: [
      "Revisión canal por canal: tu página, tu ficha de Google, tus redes y tus datos de contacto",
      "La prueba de la IA: qué responden ChatGPT y Gemini cuando preguntan por tu negocio",
      "Cada hallazgo con su prioridad y la forma de corregirlo",
      "Un documento por escrito, tuyo para siempre",
      "Una reunión de entrega de 45 minutos por videollamada",
      "Si en 30 días contratas un manual de marca o un plan, lo que pagaste se abona"
    ],
    steps: [
      MIRA_STEP,
      { t: "La investigación", d: "Buscamos tu marca como lo haría un cliente: en Google, en Maps, en tus redes, en otros sitios y en la IA." },
      { t: "El documento", d: "Escribimos cada hallazgo canal por canal, con su prioridad y la forma exacta de corregirlo." },
      { t: "La entrega", d: "Lo repasamos contigo en 45 minutos por videollamada y respondemos tus dudas." }
    ],
    faq: [
      { q: "¿Cuánto cuesta la auditoría?", a: "$500.000 COP, de contado. Si en los 30 días siguientes contratas un manual de marca o uno de los planes de página, lo que pagaste se abona." },
      { q: "¿La auditoría incluye las correcciones?", a: "No. Te entregamos qué corregir y cómo, para que lo hagas tú o tu equipo. Si prefieres que lo hagamos nosotros, eso va en los planes de página, que ya incluyen la auditoría, y lo que pagaste se abona." },
      { q: "¿En qué se diferencia de la MIRA?", a: "La MIRA es gratis: cinco preguntas sobre tu marca, una llamada y un primer vistazo. La auditoría es el detalle completo, por escrito: qué falla, en qué canal y cómo corregirlo." },
      FAQ_AI
    ]
  },
  {
    key: "marca",
    group: "esencia",
    prices: [
      { n: "Manual de marca express", v: 1300000, d: "Lo esencial de tu identidad por escrito: tu logo, colores, tipografía y tono. Si en 30 días pasas al completo o a un plan, se abona." },
      { n: "Manual de marca completo", v: 3000000, d: "Tu identidad completa: esencia, voz, logo y sus usos, colores, tipografías, fotografía y aplicaciones." }
    ],
    extras: [
      { n: "Logo nuevo", v: 1500000, d: "Si tu logo necesita un rediseño: tres propuestas y la versión final, dentro de tu manual." },
      { n: "Fotografía profesional", d: "A convenir. Solo en Medellín, con nuestros fotógrafos aliados." }
    ],
    slug: "identidad-de-marca",
    ball: 2,
    name: "Identidad de marca",
    title: "Identidad de marca",
    seo: "Diseño de identidad de marca y logo",
    who: "Para marcas que nacen, o que crecieron sin una identidad que las cuente.",
    em: "que se reconoce",
    line: "Tu logo, tus colores, tu tipografía y tu voz, ordenados en un manual de marca que cuenta tu historia.",
    what: "16 Ball Creations ordena la identidad de negocios y marcas personales, logo, colores, tipografía y voz, en un manual de marca hecho desde su historia, desde Medellín.",
    intro: "Una marca no empieza en el logo: empieza en por qué existe. Partimos de tu historia, de a quién le hablas y de lo que quieres que sientan, y desde ahí le damos forma a todo lo que se ve. El resultado es una marca que se reconoce en cada pieza, del letrero a la última publicación.",
    includes: [
      "Tu historia escrita: origen, propósito y a quién le hablas",
      "Tu logo ordenado, con sus versiones y sus usos",
      "Colores y tipografías",
      "Voz de marca: cómo habla y cómo no",
      "El manual de marca: cómo usarla bien, para que cualquiera la aplique sin desdibujarla",
      "Si tu logo necesita un rediseño, lo hacemos aparte con nuestro diseñador aliado"
    ],
    steps: [
      MIRA_STEP,
      { t: "Tu historia", d: "Escribimos juntos de dónde viene la marca y qué quiere que sientan quienes la conocen. Esa historia guía cada decisión." },
      { t: "Tu identidad", d: "Ordenamos tu logo, los colores y la voz, y los ajustamos contigo hasta que se sientan tuyos." },
      { t: "Tu manual", d: "Te entregamos los archivos y el manual de marca, para que cualquiera pueda usarla sin desdibujarla." }
    ],
    faq: [
      { q: "Ya tengo logo, ¿tengo que cambiarlo?", a: "No necesariamente. Muchas veces el logo está bien y lo que falta es orden: colores que no se repiten, redes que cuentan otra historia. La MIRA nos dice si conviene actualizarlo o solo ordenarlo." },
      { q: "¿Qué recibo al final?", a: "Tu manual de marca, express o completo, con los archivos del logo en todos sus formatos, la paleta de colores, las tipografías y la voz, listos para usar." },
      { q: "¿Sirve para una marca personal?", a: "Sí. Lo hemos hecho con artistas y con proyectos de divulgación: ordenar la imagen y la voz para que la persona y la marca cuenten lo mismo." },
      FAQ_PRICE,
      FAQ_START
    ]
  },
  {
    key: "web",
    group: "ecosistema",
    plans: true,
    extras: [
      { n: "Mantenimiento mensual", v: 350000, d: "Al mes, sin permanencia: 2 cambios al mes y la revisión técnica y de tu perfil de Google." },
      { n: "Página de proyecto adicional", v: 250000, d: "Con el mismo diseño de las demás." },
      { n: "Validación SEO y para buscadores con IA", v: 1500000, d: "Para una página que no hicimos nosotros, con el informe completo." }
    ],
    slug: "paginas-web",
    ball: 3,
    name: "Páginas web",
    title: "Diseño de páginas web",
    seo: "Diseño de páginas web a la medida",
    who: "Para negocios y marcas personales que necesitan una página que hable por ellos.",
    em: "que cuentan quién eres",
    line: "Un sitio hecho a la medida de tu marca, que se ve bien en el celular y hace fácil que te escriban.",
    what: "16 Ball Creations diseña páginas web a la medida para negocios y marcas personales, desde Medellín: se ven bien en el celular y hacen fácil que te escriban.",
    intro: "Tu página es el lugar donde tu marca habla sin interrupciones. La diseñamos a partir de tu historia, sin plantillas, para que se sienta como el resto de tu marca: tus redes, tu local, tus documentos. Y la dejamos lista para que Google la entienda.",
    includes: [
      "Estructura y textos pensados desde tu marca",
      "Diseño a la medida, sin plantillas",
      "Se ve bien en celular, tableta y computador",
      "Formulario de contacto y botón de WhatsApp",
      "Preparada para que Google y la IA la entiendan: tu nombre, tu ubicación y tus servicios dichos igual que en tu ficha de Google y tus redes",
      "Tu dominio, alojamiento y un correo con tu dominio para recibir, por un año",
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
      FAQ_INDEPENDENCE,
      FAQ_WEB_PRICE
    ]
  },
  {
    key: "tienda",
    group: "ecosistema",
    prices: [{ n: "La Tienda", v: 5500000, d: "Tu catálogo en línea con hasta 25 productos, pedidos por la página o por WhatsApp, pagos y envíos." }],
    slug: "tiendas-en-linea",
    ball: 4,
    name: "Tiendas en línea",
    title: "Tiendas en línea",
    seo: "Tiendas en línea con pedidos por WhatsApp",
    who: "Para negocios que venden productos y hoy toman los pedidos a mano.",
    em: "con tu marca de punta a punta",
    line: "Tu catálogo en internet, con pedidos por la página o por WhatsApp, y que se sienta como tu marca.",
    what: "16 Ball Creations hace tiendas en línea para negocios que venden productos, con pedidos por la página o por WhatsApp, desde Medellín.",
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
      { q: "¿Quién sube los productos?", a: "Dejamos cargado tu catálogo inicial, de hasta 25 productos, y te enseñamos a agregar, cambiar y quitar productos." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  },
  {
    key: "sistemas",
    group: "ecosistema",
    slug: "sistemas-para-tu-negocio",
    ball: 5,
    name: "Sistemas para tu negocio",
    title: "Sistemas para administrar tu negocio",
    seo: "Sistema de pedidos, inventario y citas",
    who: "Para negocios que llevan pedidos, citas o inventario en cuadernos y hojas de cálculo.",
    examples: {
      "kicker": "Para qué sirve",
      "h": "Un sistema que habla <em>como tu negocio</em>",
      "lead": "Cada negocio cuenta su día con sus propias palabras. El sistema se arma con ellas: lo que pides, lo que vendes, lo que agendas.",
      "items": [
        [
          "Cafés y restaurantes",
          "Pedidos en mesa y para llevar, domicilios, inventario de insumos que avisa antes de que se acabe y el cierre de caja del día."
        ],
        [
          "Talleres",
          "Órdenes de trabajo con fotos del antes y el después, repuestos usados, el estado de cada vehículo y la factura al entregar."
        ],
        [
          "Salones y barberías",
          "Agenda por profesional, recordatorios de cita, historial de cada cliente y lo que se vendió en productos."
        ],
        [
          "Clínicas y consultorios",
          "Citas, la ficha de cada paciente, los servicios que se le hicieron y lo que falta por cobrar."
        ]
      ],
      "demo": {
        "label": "Probar la demo de Modularity",
        "note": "Modularity es nuestro sistema propio: con datos de ejemplo de un taller, puedes recorrer pedidos, inventario, citas y facturas.",
        "url": "https://modularity.16ballcreations.workers.dev/?demo"
      }
    },
    em: "en un solo lugar",
    line: "Pedidos, inventario, citas y facturas en un solo lugar, en vez de cuadernos y hojas de cálculo.",
    what: "16 Ball Creations hace sistemas a la medida para que negocios pequeños lleven pedidos, inventario, citas y facturas en un solo lugar, desde Medellín.",
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
      { q: "¿Cuánto cuesta un sistema?", a: "Todavía no tiene un precio público: Modularity, nuestro sistema, está en desarrollo y aún no lo comercializamos. Si te interesa para tu negocio, escríbenos y lo conversamos; mientras tanto puedes recorrer la demo." },
      FAQ_START
    ]
  }
];
