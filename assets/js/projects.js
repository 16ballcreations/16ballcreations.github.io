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
   --------------------------------------------------------------- */

window.PROJECTS = [
  {
    title: "Modularity ERP",
    year: "2015 a hoy",
    types: ["Producto", "Web"],
    summary: "Nuestro producto propio: un ERP multi-empresa que se adapta a cafés, talleres, salones y clínicas activando módulos.",
    tags: ["Angular 20", "Django", "PostgreSQL", "Playwright"],
    image: "assets/img/projects/modularity.jpg",
    alt: "Panel principal de Modularity para un café de demostración",
    links: [{ label: "Ver detalle", url: "#modularity" }],
    note: "Demo en línea muy pronto"
  },
  {
    title: "PsicoFormando",
    year: "Desde 2020",
    types: ["Audiovisual", "Marca", "Web"],
    summary: "Proyecto de divulgación sobre psicología: sitio web, producción y edición de video, diseño gráfico y estrategia de contenido.",
    tags: ["WordPress", "Identidad", "Video", "Redes"],
    image: "assets/img/projects/psicoformando.jpg",
    alt: "Portada del sitio de PsicoFormando",
    links: [
      { label: "psicoformando.com", url: "https://psicoformando.com" },
      { label: "YouTube", url: "https://www.youtube.com/psicoformando" },
      { label: "Instagram", url: "https://www.instagram.com/psico.formando/" }
    ]
  },
  {
    title: "Es De Todos",
    year: "2020",
    types: ["Web", "Móvil"],
    summary: "Plataforma en WordPress con una app en Ionic 5, ambas sobre un backend propio en Yii2.",
    tags: ["WordPress", "Ionic 5", "Angular", "Yii2"],
    image: "assets/img/projects/es-de-todos.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Es De Todos",
    links: [],
    note: "El sitio ya no está en línea"
  },
  {
    title: "Socialgrafo",
    year: "2019",
    types: ["Web"],
    summary: "Plataforma de inteligencia de negocios y gestión de datos en Vue.js para Corprefer S.A.S.",
    tags: ["Vue.js", "BI", "Datos"],
    image: "assets/img/projects/socialgrafo.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Socialgrafo",
    links: [],
    note: "Proyecto privado del cliente"
  },
  {
    title: "Emprende Fácil Mujer",
    year: "2020 a 2021",
    types: ["Web"],
    summary: "Aplicación web en React para una iniciativa de emprendimiento femenino, construida durante la pandemia.",
    tags: ["React"],
    image: "assets/img/projects/emprende.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Emprende Fácil Mujer",
    links: [{ label: "Instagram", url: "https://www.instagram.com/emprendefacilmujer/" }]
  },
  {
    title: "HorusInvestmenth",
    year: "2020 a 2021",
    types: ["Web"],
    summary: "Aplicación web en React para una plataforma de inversión.",
    tags: ["React"],
    image: "assets/img/projects/horus.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto HorusInvestmenth",
    links: [],
    note: "El sitio ya no está en línea"
  },
  {
    title: "TradingCore",
    year: "2020 a 2021",
    types: ["Web"],
    summary: "Plataforma educativa desarrollada para TradingCore S.A.S.",
    tags: ["Plataforma web", "E-learning"],
    image: "assets/img/projects/tradingcore.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto TradingCore",
    links: [],
    note: "Proyecto privado del cliente"
  },
  {
    title: "Puto King Tattoo Art",
    year: "2020",
    types: ["Web", "Marca"],
    summary: "El paquete completo para un estudio de tatuajes: logo, sitio en WordPress y la fotografía que lo acompaña.",
    tags: ["WordPress", "Identidad", "Fotografía"],
    image: "assets/img/projects/puto-king.jpg",
    alt: "Mosaico de 16 Ball Creations para el proyecto Puto King Tattoo Art",
    links: [],
    note: "El sitio ya no está en línea"
  },
  {
    title: "Los Javelin, AGEVEN y Promofactory",
    year: "2015",
    types: ["Web"],
    summary: "Desarrollos a medida para tres empresas venezolanas: Los Javelin, Agendas Empresariales E.S. de Venezuela y Promofactory de Venezuela.",
    tags: ["Desarrollo a medida", "PHP"],
    image: "assets/img/projects/venezuela-2015.jpg",
    alt: "Mosaico de 16 Ball Creations para los proyectos de 2015 en Venezuela",
    links: [],
    note: "Los sitios ya no están en línea"
  }
];
