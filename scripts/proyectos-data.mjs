/* Los casos: una página por proyecto, en español y en inglés, con lo que se
   hizo y, sobre todo, por qué. Las genera scripts/servicios.mjs en
   /proyectos/<slug>/ y /en/projects/<slug>/. La foto, los servicios y los
   enlaces salen de assets/js/projects.js (su campo case es el slug).

   slug     La dirección
   year     Como en la tarjeta del proyecto
   ball     La bola que tiñe la página (1 a 6)
   es / en  title, em (la parte del h1 en el acento), seoTitle (el <title>),
            desc (~155), kind (la línea de arriba), line (qué es, en una frase),
            client, tech, start [párrafos], why [[decisión, por qué]],
            did [entregables], result [párrafos]

   Reglas: nada que no esté documentado (sin cifras inventadas), nada privado
   del cliente (vínculos personales, datos de salud, precios), y primero lo
   que la persona vivía; lo técnico, al final. */

export const CASE_WORDS = {
  es: {
    dir:"proyectos", crumb:"Proyectos", seeCase:"Ver el caso",
    indexTitle:"Proyectos: marcas, páginas web, tiendas y sistemas · 16 Ball Creations",
    indexDesc:"Lo que hemos hecho y por qué: PsicoFormando, KaffeePlatz, Rivas Seven, Modularity y nuestra propia marca, contados desde su historia.",
    indexH1:"Cada proyecto, <em>contado desde adentro</em>",
    indexLine:"No te mostramos solo cómo quedó. Te contamos de dónde venía cada marca, qué decidimos y por qué.",
    startK:"El punto de partida", startH:"De dónde <em>venía</em>",
    whyK:"Las decisiones", whyH:"Por qué lo hicimos <em>así</em>",
    didK:"El trabajo", didH:"Lo que <em>hicimos</em>",
    resultK:"Hoy", resultH:"Lo que <em>cambió</em>",
    othersH:"Otros <em>proyectos</em>", services:"Servicios",
    client:"Para quién", year:"Año", tech:"Hecho con"
  },
  en: {
    dir:"projects", crumb:"Work", seeCase:"See the case",
    indexTitle:"Work: brands, websites, online stores and systems · 16 Ball Creations",
    indexDesc:"What we've built and why: PsicoFormando, KaffeePlatz, Rivas Seven, Modularity and our own brand, told from their story.",
    indexH1:"Every project, <em>told from the inside</em>",
    indexLine:"We don't just show you how it turned out. We tell you where each brand came from, what we decided and why.",
    startK:"Where it started", startH:"Where it <em>came from</em>",
    whyK:"The decisions", whyH:"Why we did it <em>this way</em>",
    didK:"The work", didH:"What we <em>did</em>",
    resultK:"Today", resultH:"What <em>changed</em>",
    othersH:"More <em>work</em>", services:"Services",
    client:"Who it's for", year:"Year", tech:"Built with"
  }
};

export const CASES = [
  {
    slug:"psicoformando", year:"2020", ball:2,
    es: {
      title:"PsicoFormando", em:"una marca que acompaña a las familias",
      seoTitle:"PsicoFormando: marca, videos y página web para una psicóloga",
      desc:"Cómo convertimos un nombre en una marca de divulgación sobre psicología: identidad, videos, redes y una página web que vende sus programas.",
      kind:"Marca, video, redes y página web",
      line:"Una psicóloga que les habla a mamás, papás y cuidadores, con una marca que se reconoce en cada pieza y una página que ella misma puede cuidar.",
      client:"Una psicóloga que acompaña a familias con hijos pequeños",
      tech:"Astro, Cloudflare, formularios propios, pagos con Hotmart",
      start:[
        "PsicoFormando empezó con nada más que un nombre y unas ganas enormes de acompañar a las familias. Había conocimiento, había una voz cálida, pero no había una forma de que la gente la reconociera.",
        "Con los años llegaron los videos, las redes y una página en WordPress que con el tiempo dejó de cuidarse. La marca había crecido, pero su casa en internet se había quedado atrás."
      ],
      why:[
        ["Las figuras en lugar del logo repetido", "La marca tiene cuatro figuras: círculo, triángulo, cuadrado y una pieza. Las usamos como el lenguaje de todo el sitio, porque cuentan lo mismo que el logo sin repetirlo en cada rincón."],
        ["Colores planos, sin sombras ni degradados", "Una página para familias tiene que sentirse tranquila. Los colores mate y las esquinas amplias bajan el ruido, y las figuras planas se leen bien incluso en tamaño pequeño."],
        ["El mismo mundo de sus fotos", "El azul sale del logo; los tonos pastel, del mural que aparece detrás de ella en sus videos. Así la página y las fotos se sienten como un solo lugar."],
        ["Nada de fotos de stock ni de niños", "Es una marca de confianza. Por eso no hay imágenes de catálogo ni fotos de niños: solo ella, su espacio y su trabajo."],
        ["Educar, nunca prometer", "El contenido es educativo, no terapia, y nunca promete resultados. En los temas sensibles, la página orienta hacia ayuda profesional."],
        ["Que ella pueda cuidarla sola", "Le dejamos una guía para mantener su página con un asistente de IA. En una prueba a ciegas, el asistente rechazó escribir una promesa de resultados y frenó un cambio que rompía el diseño."]
      ],
      did:[
        "Identidad de marca: logo, colores, figuras y estilo visual",
        "Grabación y edición de sus videos",
        "Manejo y orden de sus redes",
        "Página web nueva, con 76 artículos y 16 páginas traídos de la anterior, sin perder ninguna dirección",
        "Inscripción a cada programa con el paso a WhatsApp para coordinar el pago",
        "Formulario de testimonios, encuestas y un panel privado para ver las respuestas"
      ],
      result:[
        "Hoy PsicoFormando es un proyecto de divulgación con más de 18 mil seguidores y una identidad que se reconoce en cada video, cada publicación y cada página.",
        "Su sitio volvió a ser su casa: vende sus programas, recibe testimonios y lo puede mantener ella misma, sin depender de nadie."
      ]
    },
    en: {
      title:"PsicoFormando", em:"a brand that walks with families",
      seoTitle:"PsicoFormando: brand, videos and website for a psychologist",
      desc:"How a name became a psychology outreach brand: identity, videos, social media and a website that sells her programs.",
      kind:"Brand, video, social media and website",
      line:"A psychologist who speaks to moms, dads and caregivers, with a brand people recognize in every piece and a website she can look after herself.",
      client:"A psychologist who supports families with young children",
      tech:"Astro, Cloudflare, custom forms, Hotmart payments",
      start:[
        "PsicoFormando started with nothing but a name and a deep wish to walk alongside families. There was knowledge and a warm voice, but no way for people to recognize her.",
        "Over the years came the videos, the social media and a WordPress site that, in time, stopped being looked after. The brand had grown, but its home online had fallen behind."
      ],
      why:[
        ["The shapes instead of a repeated logo", "The brand has four shapes: a circle, a triangle, a square and a piece. We made them the language of the whole site, because they say what the logo says without repeating it everywhere."],
        ["Flat colors, no shadows or gradients", "A website for families has to feel calm. Matte colors and wide corners lower the noise, and flat shapes stay readable even when small."],
        ["The same world as her photos", "The blue comes from the logo; the pastels, from the mural behind her in her videos. The site and the photos feel like one place."],
        ["No stock photos, no photos of children", "It's a brand built on trust. So there are no catalog images and no photos of children: only her, her space and her work."],
        ["Educate, never promise", "The content is educational, not therapy, and it never promises results. On sensitive topics, the site points to professional help."],
        ["So she can look after it herself", "We left her a guide to maintain the site with an AI assistant. In a blind test, the assistant refused to write a promise of results and stopped a change that broke the design."]
      ],
      did:[
        "Brand identity: logo, colors, shapes and visual style",
        "Recording and editing her videos",
        "Running and organizing her social media",
        "A new website, with 76 articles and 16 pages brought over from the old one without losing a single address",
        "Signup for each program, handing off to WhatsApp to arrange payment",
        "A testimonial form, surveys and a private panel to read the answers"
      ],
      result:[
        "Today PsicoFormando is an outreach project with over 18,000 followers and an identity people recognize in every video, every post and every page.",
        "Her website is her home again: it sells her programs, collects testimonials, and she can maintain it herself, without depending on anyone."
      ]
    }
  },
  {
    slug:"kaffeeplatz", year:"2026", ball:1,
    es: {
      title:"KaffeePlatz", em:"una tienda que se siente como un buen café",
      seoTitle:"KaffeePlatz: tienda en línea de café con pedidos por WhatsApp",
      desc:"La tienda en línea de una marca colombiana de accesorios de café: catálogo, un buscador que recomienda según tu gusto y pedidos por WhatsApp.",
      kind:"Tienda en línea, imagen y redes",
      line:"Una tienda de accesorios de café donde no eliges un aparato: eliges cómo te gusta el café, y la marca te acompaña hasta el pedido.",
      client:"Una marca colombiana de accesorios para preparar café",
      tech:"Astro, Tailwind, Cloudflare",
      start:[
        "KaffeePlatz vendía en una tienda de plantilla. Funcionaba, pero no se parecía a la marca: se veía como cualquier otra, y el material visual no estaba a la altura de lo que la dueña cuida en cada producto.",
        "Además, las ventas no se cerraban en un carrito: se cerraban conversando. Cada cliente terminaba en WhatsApp, preguntando qué le convenía."
      ],
      why:[
        ["Cuatro propuestas con el mismo contenido", "Para que la comparación fuera honesta, armamos cuatro direcciones visuales con la misma estructura y los mismos textos. Así la decisión fue sobre la marca, no sobre quién tenía más contenido."],
        ["Negro, dorado y lino", "La dirección elegida vive sobre papel negro, con dorado y una franja de lino. La textura no es decoración: es parte de la identidad, como el empaque de un buen café."],
        ["Un solo botón que brilla", "En cada pantalla hay una sola pieza dorada rellena: la acción principal. Con un contraste de 10 a 1, se lee bien y guía sin gritar."],
        ["El pedido termina en WhatsApp", "Como la venta ya era una conversación, la respetamos: cada producto abre WhatsApp con un mensaje listo que nombra la variante. Nada se pierde entre la página y el chat."],
        ["Eliges un sabor, no un aparato", "El buscador «¿Cómo te gusta el café?» parte de tu gusto. Cada recomendación cita palabra por palabra el artículo de la marca que la respalda: nada inventado."],
        ["Nada que se rompa al mudarse", "Cada dirección de la tienda anterior lleva a su equivalente en la nueva, para no perder a nadie que llegue desde un enlace viejo o desde Google."]
      ],
      did:[
        "Tienda en línea con catálogo y filtros que se pueden compartir por WhatsApp",
        "El buscador que recomienda según cómo te gusta el café",
        "Pedidos directos por WhatsApp, con el mensaje armado",
        "«Avísame» en los productos agotados",
        "Una guía de marca con colores, tipografías y reglas de contraste verificadas",
        "Asesoría de imagen y de redes para que la tienda y los perfiles cuenten lo mismo"
      ],
      result:[
        "La tienda está en línea desde finales de septiembre de 2026. Hoy KaffeePlatz se ve como lo que es: una marca que sabe de café y que te acompaña a elegir.",
        "La venta sigue siendo una conversación, pero ahora empieza en una página que ya hizo la mitad del trabajo."
      ]
    },
    en: {
      title:"KaffeePlatz", em:"a store that feels like a good cup",
      seoTitle:"KaffeePlatz: coffee gear online store with WhatsApp orders",
      desc:"The online store of a Colombian coffee-gear brand: a catalog, a finder that recommends by taste, and orders through WhatsApp.",
      kind:"Online store, image and social media",
      line:"A coffee-gear store where you don't pick a device: you pick how you like your coffee, and the brand walks you all the way to the order.",
      client:"A Colombian brand of coffee-brewing accessories",
      tech:"Astro, Tailwind, Cloudflare",
      start:[
        "KaffeePlatz sold through a template store. It worked, but it didn't look like the brand: it looked like any other, and the visuals weren't up to the care the owner puts into every product.",
        "And sales didn't close in a cart: they closed in a conversation. Every customer ended up on WhatsApp, asking what was right for them."
      ],
      why:[
        ["Four proposals with the same content", "To make the comparison fair, we built four visual directions with the same structure and the same copy. That way the choice was about the brand, not about which one had more content."],
        ["Black, gold and linen", "The chosen direction lives on black paper, with gold and a strip of linen. The texture isn't decoration: it's part of the identity, like the packaging of good coffee."],
        ["One button that shines", "Each screen has a single filled gold piece: the main action. At 10:1 contrast it reads clearly and guides without shouting."],
        ["The order ends on WhatsApp", "Since the sale was already a conversation, we respected it: every product opens WhatsApp with a ready message naming the variant. Nothing gets lost between the page and the chat."],
        ["You pick a taste, not a device", "The \"How do you like your coffee?\" finder starts from your taste. Each recommendation quotes, word for word, the brand's article behind it: nothing invented."],
        ["Nothing breaks in the move", "Every address of the old store leads to its match in the new one, so nobody arriving from an old link or from Google gets lost."]
      ],
      did:[
        "An online store with a catalog and filters you can share on WhatsApp",
        "The finder that recommends by how you like your coffee",
        "Direct orders on WhatsApp, with the message written for you",
        "\"Notify me\" on sold-out products",
        "A brand guide with colors, typefaces and checked contrast rules",
        "Image and social media advice, so the store and the profiles tell the same story"
      ],
      result:[
        "The store has been live since late September 2026. Today KaffeePlatz looks like what it is: a brand that knows coffee and helps you choose.",
        "The sale is still a conversation, but now it starts on a page that has already done half the work."
      ]
    }
  },
  {
    slug:"rivas-seven", year:"2026", ball:4,
    es: {
      title:"Rivas Seven", em:"del duelo a la luz",
      seoTitle:"Rivas Seven: marca personal y página web para un cantautor",
      desc:"La marca personal de un cantautor de Medellín con raíces chocoanas: identidad, colores, redes y una página que va, como su música, del duelo a la luz.",
      kind:"Marca personal, imagen y página web",
      line:"Un cantautor de Medellín con raíces chocoanas, y una página que hace el mismo viaje que su música: de la noche al amanecer.",
      client:"Un cantautor de Medellín con raíces en el Chocó",
      tech:"HTML, CSS y JavaScript, sin dependencias, en Cloudflare",
      start:[
        "Rivas Seven tenía la música, la historia y la voz. Lo que no tenía era una marca que las contara: en cada plataforma aparecía distinto, y su nombre cambiaba de orden de una red a otra.",
        "Necesitaba una carta de presentación para impulsar su carrera: algo que un productor, un medio o un fan pudiera abrir y entender de inmediato quién es."
      ],
      why:[
        ["Del duelo a la luz", "Su música habla del desamor con la esperanza de superarlo. Por eso la página empieza de noche, en violeta, y amanece en amarillo a medida que bajas: hace el mismo viaje que sus canciones."],
        ["Un cielo que no se mueve", "El fondo es un cielo fijo que cambia de color mientras avanzas. Es lo que sostiene el viaje sin distraer de la historia."],
        ["Una paleta con raíz", "Violeta de noche, amarillo mango y un turquesa que guardamos como guiño a la paleta que ya usaba. Lo nuevo no borra lo que ya era suyo."],
        ["Cualquier foto entra en la historia", "Las fotos pasan a blanco y negro y se tiñen del violeta al mango. Así cualquier imagen, vieja o nueva, cabe en el mismo mundo."],
        ["Referencias de portada de revista", "La disciplina y la tipografía enorme de una portada, y la calidez dorada de los años setenta. De ahí sale la mezcla de fuerza y cercanía."],
        ["Contado en primera persona", "La página habla como él, contando su historia, y está en español, portugués e inglés para llegar más allá de Medellín."]
      ],
      did:[
        "Identidad visual y colores de marca",
        "Orden de sus perfiles para que todas sus redes cuenten la misma historia",
        "Asesoría de imagen, con una guía de luz para su próxima sesión de fotos",
        "Página web en tres idiomas, con su historia, su música y un formulario para contrataciones"
      ],
      result:[
        "Hoy Rivas Seven tiene una casa propia en rivasseven.com: una página que se siente como escuchar sus canciones, de la noche al amanecer.",
        "Y tiene algo más útil que una página bonita: una sola historia para contar en cada red y en cada conversación con quien quiera trabajar con él."
      ]
    },
    en: {
      title:"Rivas Seven", em:"from grief to light",
      seoTitle:"Rivas Seven: personal brand and website for a songwriter",
      desc:"The personal brand of a singer-songwriter from Medellín with roots in Chocó: identity, colors, social media and a site that moves from grief to light.",
      kind:"Personal brand, image and website",
      line:"A singer-songwriter from Medellín with roots in Chocó, and a website that makes the same journey as his music: from night to dawn.",
      client:"A singer-songwriter from Medellín with roots in Chocó",
      tech:"HTML, CSS and JavaScript with no dependencies, on Cloudflare",
      start:[
        "Rivas Seven had the music, the story and the voice. What he didn't have was a brand to tell them: he looked different on every platform, and his name changed order from one network to the next.",
        "He needed a calling card to push his career: something a producer, a journalist or a fan could open and understand at once who he is."
      ],
      why:[
        ["From grief to light", "His music is about heartbreak with the hope of getting over it. So the page starts at night, in violet, and reaches dawn in yellow as you scroll: it makes the same journey as his songs."],
        ["A sky that stays still", "The background is a fixed sky that changes color as you go. It carries the journey without pulling attention away from the story."],
        ["A palette with roots", "Night violet, mango yellow, and a teal we kept as a nod to the palette he already used. The new doesn't erase what was already his."],
        ["Any photo fits the story", "Photos turn black and white and are tinted from violet to mango. That way any image, old or new, fits in the same world."],
        ["Magazine-cover references", "The discipline and huge type of a cover, and the golden warmth of the seventies. That's where the mix of strength and closeness comes from."],
        ["Told in the first person", "The site speaks like him, telling his story, in Spanish, Portuguese and English, to reach beyond Medellín."]
      ],
      did:[
        "Visual identity and brand colors",
        "Tidying up his profiles so every network tells the same story",
        "Image advice, with a lighting guide for his next photo session",
        "A website in three languages, with his story, his music and a booking form"
      ],
      result:[
        "Today Rivas Seven has a home of his own at rivasseven.com: a page that feels like listening to his songs, from night to dawn.",
        "And he has something more useful than a pretty page: one story to tell on every network and in every conversation with whoever wants to work with him."
      ]
    }
  },
  {
    slug:"16-ball-creations", year:"2013", ball:6,
    es: {
      title:"16 Ball Creations", em:"la bola que faltaba",
      seoTitle:"16 Ball Creations: el relanzamiento de nuestra propia marca",
      desc:"Nos aplicamos nuestro propio proceso: volvimos a la historia de la bola que falta y desde ahí ordenamos la marca, el sitio, la MIRA y nuestros documentos.",
      kind:"Nuestra marca: identidad, sitio y sistema propio",
      line:"Antes de pedirle a nadie que ordene su marca, ordenamos la nuestra. Volvimos a nuestro origen y desde ahí lo contamos todo de nuevo.",
      client:"Nosotros",
      tech:"HTML y JavaScript sin dependencias, en Cloudflare, con base de datos propia",
      start:[
        "Durante años, 16 Ball Creations contaba demasiadas cosas a la vez: video, software, tutoriales. Hacíamos de todo, y por eso costaba entender qué hacíamos.",
        "Era justo el problema que les ayudamos a resolver a nuestros clientes: una marca que, según dónde la mires, cuenta una historia distinta."
      ],
      why:[
        ["Volver a la bola dieciséis", "En una mesa de pool hay quince bolas. La dieciséis no existe, así que la inventamos. Ese es el origen del nombre y la promesa: si no existe, lo creamos."],
        ["Una mesa que se puede jugar", "La portada es una mesa de pool de verdad: tiras y la primera bola que golpeas tiñe el sitio. No te contamos que somos creativos: te dejamos jugar."],
        ["Primero mirar, después ofrecer", "Todo empieza con la MIRA: antes de ofrecerte nada, miramos tu marca. Así cada propuesta parte de tu historia y no de un paquete."],
        ["Una sola promesa", "Dejamos de ofrecer de todo para prometer una cosa: que tu negocio cuente una sola historia en el letrero, Instagram, su página, Google y la IA."],
        ["Letras propias, servidas por nosotros", "Las tipografías del sitio viven en el propio sitio: carga más rápido, no depende de nadie y se ve igual en los documentos que enviamos."],
        ["Lo que prometemos, lo usamos", "Cada documento que enviamos sigue la misma guía, y llevamos cada MIRA y cada llamada en un panel propio. Practicamos el orden que vendemos."]
      ],
      did:[
        "El relanzamiento de la marca, desde su historia",
        "El sitio nuevo, en español e inglés, con su mesa de pool",
        "La MIRA, el primer paso para conocer a cada cliente",
        "Una guía para que cada documento se vea y suene igual",
        "Un panel privado para cada MIRA, cada prospecto y cada llamada"
      ],
      result:[
        "El sitio nuevo salió en septiembre de 2026. Hoy 16 Ball Creations cuenta una sola historia: la de la bola que faltaba.",
        "Y cada vez que un cliente nos pregunta si esto funciona, la respuesta es la misma que leíste aquí: lo probamos primero con nosotros."
      ]
    },
    en: {
      title:"16 Ball Creations", em:"the missing ball",
      seoTitle:"16 Ball Creations: relaunching our own brand",
      desc:"We ran our own process on ourselves: back to the story of the missing ball, and from there the brand, the site, the MIRA and our documents.",
      kind:"Our brand: identity, website and own system",
      line:"Before asking anyone to put their brand in order, we put ours in order. We went back to our origin and told everything again from there.",
      client:"Us",
      tech:"Dependency-free HTML and JavaScript on Cloudflare, with our own database",
      start:[
        "For years, 16 Ball Creations told too many stories at once: video, software, tutorials. We did everything, and that's why it was hard to understand what we did.",
        "It was exactly the problem we help our clients solve: a brand that tells a different story depending on where you look."
      ],
      why:[
        ["Back to the sixteenth ball", "A pool table has fifteen balls. The sixteenth doesn't exist, so we invented it. That's where the name and the promise come from: if it doesn't exist, we create it."],
        ["A table you can play", "The home page is a real pool table: you shoot, and the first ball you hit tints the site. We don't tell you we're creative: we let you play."],
        ["Look first, offer later", "Everything starts with the MIRA: before offering you anything, we look at your brand. Every proposal starts from your story, not from a package."],
        ["One promise", "We stopped offering everything to promise one thing: that your business tells a single story on its sign, Instagram, website, Google and AI."],
        ["Our own typefaces, served by us", "The site's fonts live on the site itself: it loads faster, depends on no one, and looks the same in the documents we send."],
        ["We use what we promise", "Every document we send follows the same guide, and we track every MIRA and every call in our own panel. We practice the order we sell."]
      ],
      did:[
        "The brand relaunch, from its story",
        "The new website, in Spanish and English, with its pool table",
        "The MIRA, the first step to get to know each client",
        "A guide so every document looks and sounds the same",
        "A private panel for every MIRA, every prospect and every call"
      ],
      result:[
        "The new site went live in September 2026. Today 16 Ball Creations tells a single story: the one about the missing ball.",
        "And whenever a client asks whether this works, the answer is the one you just read: we tried it on ourselves first."
      ]
    }
  },
  {
    slug:"modularity", year:"2015", ball:5,
    es: {
      title:"Modularity", em:"una idea que volvió más fuerte",
      seoTitle:"Modularity: sistema para administrar tu negocio a la medida",
      desc:"Nuestro sistema propio para administrar negocios: pedidos, citas, inventario y facturas en un solo lugar, con las palabras de cada negocio.",
      kind:"Producto propio · en desarrollo",
      line:"Un sistema para dueños de negocio que no son técnicos: pedidos, citas, inventario y facturas en un solo lugar, hablando el idioma de cada negocio.",
      client:"Cafés, talleres, salones, clínicas y tiendas",
      tech:"Angular, Django y PostgreSQL",
      start:[
        "La idea nació en 2015: un sistema que pusiera en un solo lugar el día de un negocio. La primera versión se construyó con Angular y un servidor en PHP, y se perdió. De ella quedó solo un documento con su estructura.",
        "La idea, en cambio, no se perdió. Muchos negocios siguen llevando su día en cuadernos, hojas de cálculo y chats, y los sistemas que existen hablan el idioma del software, no el del negocio. Por eso hoy la estamos construyendo de nuevo, con una visión más clara."
      ],
      why:[
        ["Empezar de nuevo sin olvidar", "Del primer Modularity quedó el documento de su estructura. Lo usamos como memoria, no como molde: la nueva versión parte de lo que aprendimos en estos años sobre cómo trabaja de verdad un negocio."],
        ["Un solo núcleo para muchos negocios", "Un café, un taller, un salón y una clínica comparten más de lo que parece. Modularity tiene un solo núcleo que se adapta a cada uno, encendiendo solo lo que ese negocio necesita."],
        ["Las palabras de cada negocio", "En un café se habla de mesas; en un taller, de vehículos; en una clínica, de pacientes. El sistema cambia sus palabras para que cada dueño se sienta en su casa."],
        ["Pensado para quien no es técnico", "Está hecho para el dueño que atiende, cobra y decide. Si hay que leer un manual para usarlo, algo falló."],
        ["Las cuentas no se borran", "La facturación guarda el rastro completo de cada movimiento. Lo que pasó con el dinero queda escrito y no se reescribe."],
        ["Probado antes de prometer", "Cada parte del sistema tiene pruebas automáticas, más de 400 en el núcleo, para que lo que funciona hoy siga funcionando mañana."]
      ],
      did:[
        "Pedidos y órdenes de servicio",
        "Agenda y citas",
        "Inventario y producción",
        "Facturación con rastro completo",
        "Clientes y reportes",
        "Una demo con los datos de un taller, para recorrerla sin registrarte"
      ],
      result:[
        "Lo que en 2015 era una idea hoy se puede probar: Modularity está en desarrollo, y la demo muestra cómo se ve el día de un taller cuando todo vive en un solo lugar.",
        "Es también la base de nuestro servicio de sistemas a la medida: cuando un negocio necesita su propio sistema, empezamos desde aquí."
      ],
      links:[{ label:"Conoce Modularity", url:"https://modularity.16ballcreations.com/" }, { label:"Probar la demo", url:"https://modularity.16ballcreations.workers.dev/?demo" }]
    },
    en: {
      title:"Modularity", em:"an idea that came back stronger",
      seoTitle:"Modularity: a system to run your business, built to fit",
      desc:"Our own system to run a business: orders, bookings, stock and invoices in one place, in each business's own words.",
      kind:"Our own product · in development",
      line:"A system for business owners who aren't technical: orders, bookings, stock and invoices in one place, speaking each business's language.",
      client:"Coffee shops, repair shops, salons, clinics and retail",
      tech:"Angular, Django and PostgreSQL",
      start:[
        "The idea was born in 2015: a system that would put a business's whole day in one place. The first version was built with Angular and a PHP backend, and it was lost. All that remained was a document with its structure.",
        "The idea, though, wasn't lost. Many businesses still run their day on notebooks, spreadsheets and chats, and existing systems speak the software's language, not the business's. That's why today we're building it again, with a clearer vision."
      ],
      why:[
        ["Starting over without forgetting", "From the first Modularity, the document of its structure remained. We use it as memory, not as a mold: the new version starts from what we've learned over these years about how a business really works."],
        ["One core for many businesses", "A coffee shop, a repair shop, a salon and a clinic share more than it seems. Modularity has a single core that adapts to each one, turning on only what that business needs."],
        ["Each business's own words", "A coffee shop talks about tables; a repair shop, about vehicles; a clinic, about patients. The system changes its words so every owner feels at home."],
        ["Made for people who aren't technical", "It's built for the owner who serves, charges and decides. If you need to read a manual to use it, something went wrong."],
        ["The books aren't erased", "Billing keeps the full trail of every movement. What happened with the money stays written and isn't rewritten."],
        ["Tested before promised", "Every part of the system has automated tests, over 400 in the core, so what works today keeps working tomorrow."]
      ],
      did:[
        "Orders and service orders",
        "Calendar and bookings",
        "Stock and production",
        "Billing with a full trail",
        "Customers and reports",
        "A demo with a repair shop's data, to explore without signing up"
      ],
      result:[
        "What was an idea in 2015 can now be tried: Modularity is in development, and the demo shows what a repair shop's day looks like when everything lives in one place.",
        "It's also the base of our custom systems service: when a business needs its own system, we start from here."
      ],
      links:[{ label:"Discover Modularity", url:"https://modularity.16ballcreations.com/en/" }, { label:"Try the demo", url:"https://modularity.16ballcreations.workers.dev/?demo" }]
    }
  }
];

/* Los sitios de ejemplo: propuestas que convertimos en piezas de muestra, con
   marca inventada y fotos de stock (cada repo lleva sus créditos). No son
   casos de clientes: salen en su propia sección de /proyectos/, con la
   etiqueta "Ejemplo · marca ficticia", y no cuentan en la portada.

   slug   El repo en github.io/16ballcreations (ejemplo-<slug>) y la imagen de
          la tarjeta, assets/img/ejemplos/<slug>.jpg (captura de 1200x750)
   title  El nombre de la marca ficticia
   es/en  rubro (para quién sirve de muestra), short (la tarjeta), alt */
export const EXAMPLE_WORDS = {
  es: {
    kicker:"Sitios de ejemplo", h:"Para ver antes de <em>imaginar el tuyo</em>",
    lead:"Sitios completos hechos por nosotros para marcas inventadas, con fotos de stock. Recórrelos como si fueran de verdad: así se vería el de tu negocio.",
    see:"Ver el ejemplo", status:"Ejemplo · marca ficticia", home:"Ver sitios de ejemplo"
  },
  en: {
    kicker:"Example sites", h:"See one before <em>you picture yours</em>",
    lead:"Complete websites we built for made-up brands, with stock photos. Browse them as if they were real: this is how yours could look.",
    see:"See the example", status:"Example · fictional brand", home:"See example sites"
  }
};

export const EXAMPLES = [
  {
    slug:"arquitectura-interiorismo", title:"Lumbre", services:["marca", "web"],
    es: {
      rubro:"Estudio de arquitectura e interiorismo",
      short:"Un estudio que diseña, construye y amuebla casas. La portada se enciende como una casa al caer la tarde, con recorrido por los proyectos, showroom y cita en línea.",
      alt:"Portada del ejemplo Lumbre: una casa de tres pisos al atardecer bajo el nombre del estudio"
    },
    en: {
      rubro:"Architecture and interior design studio",
      short:"A studio that designs, builds and furnishes homes. The home page lights up like a house at dusk, with a walk through the projects, a showroom and online booking.",
      alt:"Home page of the Lumbre example: a three-storey house at dusk below the studio's name"
    }
  },
  {
    slug:"constructora-remodelacion", title:"Plomada Remodelaciones", services:["marca", "web"],
    es: {
      rubro:"Constructora de remodelaciones",
      short:"Remodelación de apartamentos y casas contada de la obra a la entrega: paquetes claros, proyectos con su antes y después, y WhatsApp a un toque.",
      alt:"Portada del ejemplo Plomada Remodelaciones: una cocina abierta con barra recién remodelada"
    },
    en: {
      rubro:"Renovation contractor",
      short:"Apartment and home renovations told from the work site to the handover: clear packages, projects with their before and after, and WhatsApp one tap away.",
      alt:"Home page of the Plomada Remodelaciones example: a newly renovated open kitchen with a bar"
    }
  },
  {
    slug:"interiorismo-renders", title:"Vano Estudio", services:["marca", "web"],
    es: {
      rubro:"Estudio de interiorismo y render",
      short:"Primero lo ves, después lo construimos: un estudio que vende con renders, con comparador de boceto a render, proyectos, ideas y su propio manual de marca.",
      alt:"Portada del ejemplo Vano Estudio: el nombre en serif sobre el render de una sala en tonos de lino"
    },
    en: {
      rubro:"Interior design and rendering studio",
      short:"First you see it, then we build it: a studio that sells with renders, with a sketch-to-render slider, projects, ideas and its own brand guide.",
      alt:"Home page of the Vano Estudio example: the name in serif over a render of a linen-toned living room"
    }
  },
  {
    slug:"ingenieria-estructural", title:"Dovela Ingeniería Estructural", services:["marca", "web"],
    es: {
      rubro:"Firma de ingeniería estructural",
      short:"Lo que calculamos se queda en pie: puentes, edificios y contención dibujados a escala, con las cifras calculadas de los datos de cada obra.",
      alt:"Portada del ejemplo Dovela: el titular «Lo que calculamos se queda en pie» junto al dibujo de un puente de 180 m"
    },
    en: {
      rubro:"Structural engineering firm",
      short:"What we calculate stays standing: bridges, buildings and retaining works drawn to scale, with figures worked out from each project's data.",
      alt:"Home page of the Dovela example: the headline «What we calculate stays standing» next to a drawing of a 180 m bridge"
    }
  }
];
export const exampleUrl = slug => `https://16ballcreations.github.io/ejemplo-${slug}/`;
