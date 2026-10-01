/* Los proyectos del estudio.
   ---------------------------------------------------------------
   Para agregar uno nuevo: copia un bloque, ponlo al principio de la
   lista y guarda su imagen en assets/img/projects/ (1200x750 px, JPG).

   title    Nombre del proyecto
   year     Texto libre: "2020", "2020 a 2021", "2015 a hoy"
   types    Categorías para los filtros: Producto, Web, Móvil, Marca, Audiovisual
   summary  Una o dos frases sobre qué se hizo
   tags     Tecnologías o disciplinas
   image    Ruta de la imagen
   alt      Descripción de la imagen para lectores de pantalla
   links    Enlaces visibles: [{ label: "Ver sitio", url: "https://..." }]
   note     Texto pequeño cuando no hay enlace (opcional)
   archived true para los proyectos sin portada propia: salen en el bloque
            "Del archivo", en una línea y sin imagen (opcional)
   --------------------------------------------------------------- */

window.PROJECTS = [
  {
    title: "Rivas Seven",
    year: "2026",
    types: ["Marca", "Web"],
    summary: "Acompañamos a Rivas Seven, cantautor de Medellín con raíces chocoanas, a darle forma a su marca personal. Definimos su identidad visual y sus colores, renovamos sus redes para que todas cuenten la misma historia, ordenamos sus perfiles y lo asesoramos en su imagen. El sitio cierra el recorrido: como su música, va del duelo a la luz, de la noche en violeta al amanecer en amarillo.",
    tags: ["Marca personal", "Identidad visual", "Colores de marca", "Redes sociales", "Asesoría de imagen", "Sitio web"],
    image: "assets/img/projects/rivas-seven.jpg",
    alt: "Portada del sitio de Rivas Seven: el artista de noche, en tonos violeta, junto a su nombre en letras grandes",
    links: [],
    note: "Muy pronto en línea"
  },
  {
    title: "KaffeePlatz",
    year: "2026",
    types: ["Marca", "Web"],
    summary: "Nueva tienda en línea para una marca colombiana de accesorios de café: catálogo con filtros, un buscador que recomienda según cómo te gusta el café y pedidos directos por WhatsApp. También los asesoramos en sus redes y en su imagen, para que la tienda y sus perfiles se vean y se sientan como una sola marca.",
    tags: ["Tienda en línea", "Catálogo", "Pedidos por WhatsApp", "Asesoría de redes", "Asesoría de imagen"],
    image: "assets/img/projects/kaffeeplatz.jpg?v=2",
    alt: "Portada del sitio de KaffeePlatz: una AeroPress sobre fondo crema, junto al titular «Eleva tu experiencia cafetera»",
    links: [{ label: "kaffeeplatz.co", url: "https://kaffeeplatz.co" }]
  },
  {
    title: "Modularity",
    year: "2015 a hoy",
    types: ["Producto", "Web"],
    summary: "Nuestro producto estrella: un sistema para administrar negocios, con pedidos, inventario, citas y facturas en un solo lugar. Se adapta a cafés, talleres, salones y clínicas.",
    tags: ["Sistema de gestión", "Producto propio"],
    image: "assets/img/projects/modularity.jpg?v=2",
    alt: "Panel principal de Modularity para un taller de demostración",
    links: [{ label: "Ver detalle", url: "#modularity" }],
    note: "Demo en línea muy pronto"
  },
  {
    title: "PsicoFormando",
    year: "Desde 2020",
    types: ["Audiovisual", "Marca", "Web"],
    summary: "PsicoFormando empezó con nada más que un nombre. Desde ahí lo construimos todo: su identidad de marca, el logo, los colores y el estilo visual; la grabación y edición de sus videos; el manejo de sus redes y su sitio web. Hoy es un proyecto de divulgación sobre psicología con más de 18 mil seguidores y una identidad que se reconoce en cada pieza.",
    tags: ["Identidad de marca", "Logo", "Colores y estilo visual", "Producción de video", "Edición de video", "Manejo de redes", "Sitio web"],
    image: "assets/img/projects/psicoformando.jpg?v=2",
    alt: "Portada del sitio de PsicoFormando",
    links: [
      { label: "psicoformando.com", url: "https://psicoformando.com" },
      { label: "YouTube", url: "https://www.youtube.com/psicoformando" },
      { label: "Instagram", url: "https://www.instagram.com/psico.formando/" }
    ]
  },
  {
    title: "Es De Todos",
    archived: true,
    year: "2020",
    types: ["Web", "Móvil"],
    summary: "Sitio web y aplicación para sus usuarios, conectados a un sistema propio.",
    tags: ["WordPress", "Ionic 5", "Angular", "Yii2"],
    image: "assets/img/projects/es-de-todos.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Es De Todos",
    links: [],
    note: "El sitio ya no está en línea"
  },
  {
    title: "Socialgrafo",
    archived: true,
    year: "2019",
    types: ["Web"],
    summary: "Plataforma para analizar y organizar los datos de negocio de Corprefer S.A.S.",
    tags: ["Vue.js", "BI", "Datos"],
    image: "assets/img/projects/socialgrafo.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Socialgrafo",
    links: [],
    note: "Proyecto privado del cliente"
  },
  {
    title: "Emprende Fácil Mujer",
    archived: true,
    year: "2020 a 2021",
    types: ["Web"],
    summary: "Plataforma web para una iniciativa de emprendimiento femenino, construida durante la pandemia.",
    tags: ["React"],
    image: "assets/img/projects/emprende.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Emprende Fácil Mujer",
    links: [{ label: "Instagram", url: "https://www.instagram.com/emprendefacilmujer/" }]
  },
  {
    title: "HorusInvestmenth",
    archived: true,
    year: "2020 a 2021",
    types: ["Web"],
    summary: "Plataforma web para una empresa de inversión.",
    tags: ["React"],
    image: "assets/img/projects/horus.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto HorusInvestmenth",
    links: [],
    note: "El sitio ya no está en línea"
  },
  {
    title: "TradingCore",
    archived: true,
    year: "2020 a 2021",
    types: ["Web"],
    summary: "Plataforma de cursos en línea para TradingCore S.A.S.",
    tags: ["Plataforma web", "E-learning"],
    image: "assets/img/projects/tradingcore.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto TradingCore",
    links: [],
    note: "Proyecto privado del cliente"
  },
  {
    title: "Puto King Tattoo Art",
    archived: true,
    year: "2020",
    types: ["Web", "Marca"],
    summary: "El paquete completo para un estudio de tatuajes: logo, sitio web y la fotografía que lo acompaña.",
    tags: ["WordPress", "Identidad", "Fotografía"],
    image: "assets/img/projects/puto-king.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Puto King Tattoo Art",
    links: [],
    note: "El sitio ya no está en línea"
  },
  {
    title: "Los Javelin, AGEVEN y Promofactory",
    archived: true,
    year: "2015",
    types: ["Web"],
    summary: "Sitios y sistemas a medida para tres empresas venezolanas: Los Javelin, Agendas Empresariales E.S. de Venezuela y Promofactory de Venezuela.",
    tags: ["Sitios web", "Sistemas a medida"],
    image: "assets/img/projects/venezuela-2015.jpg",
    alt: "Mosaico de 16 Ball Creations para los proyectos de 2015 en Venezuela",
    links: [],
    note: "Los sitios ya no están en línea"
  }
];
