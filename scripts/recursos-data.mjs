/* Recursos gratis (/recursos/ y /en/resources/): lo que usamos en el estudio,
   para que cualquiera lo use, sin registro (Renne, 20 nov 2026). El primero es
   la skill de auditoría SEO y AEO; sus archivos se copian a mano desde
   Docs/Marketing/estrategia/seo/ (auditoria-seo.zip, guia-seo.md y
   checklist-seo-agente.md) a recursos/auditoria-seo/ cuando cambie la versión.
   La genera scripts/servicios.mjs. */
export const SEO_FILES = { zip: "auditoria-seo.zip", guide: "guia-seo.md", checklist: "checklist-seo-agente.md", version: "v0.3", date: { es: "20 nov 2026", en: "Nov 20, 2026" }, kb: 47 };

export const RESOURCES = {
  es: {
    dir: "recursos",
    title: "Recursos gratis para tu marca y tu página",
    desc: "Lo que usamos en 16 Ball Creations, gratis y sin registro: empezando por la auditoría SEO y AEO, para saber si Google y la IA entienden tu página.",
    crumb: "Recursos",
    kicker: "Gratis, sin registro",
    h1: "Recursos <em>gratis</em>",
    lead: "Lo que usamos en el estudio, para que lo uses tú: sin registro, sin correo y sin letra pequeña.",
    listK: "Para descargar",
    seeIt: "Ver el recurso",
    items: [{
      slug: "auditoria-seo",
      name: "Auditoría SEO y AEO",
      line: "Descubre qué está frenando tu página en Google y en los asistentes de IA, con los mismos 99 puntos que revisamos con nuestros clientes.",
      tag: "Skill para Claude · checklist · guía"
    }],
    seo: {
      title: "Auditoría SEO y AEO gratis: la skill y el checklist de 16 Ball Creations",
      desc: "Descarga gratis la auditoría SEO y AEO de 16 Ball Creations: 99 puntos en 14 áreas, puntuación de 0 a 100 y qué arreglar primero, para Google, ChatGPT, Gemini y Copilot.",
      crumb: "Auditoría SEO y AEO",
      kicker: "Recurso gratis",
      h1: "Auditoría <em>SEO y AEO</em>",
      lead: "Tu página puede estar bien hecha y aun así no aparecer. Esta auditoría te dice por qué, con el mismo método que usamos en el estudio.",
      download: "Descargar la skill",
      readGuide: "Leer la guía",
      meta: (v, d, kb) => `${v} · ${d} · zip de ${kb} KB · en español`,
      whatK: "Qué hace",
      whatH: "Mira tu página <em>como la ven los demás</em>",
      what: [
        ["Como la ve Google", "Revisa si Google puede encontrar, leer y entender cada página: lo que bloquea, lo que sobra y lo que falta."],
        ["Como la ve la IA", "Pregunta por tu negocio en ChatGPT, Gemini y Copilot, y revisa qué necesita tu página para que te nombren cuando alguien busca lo que haces."],
        ["Qué arreglar primero", "Te da una puntuación de 0 a 100, la prueba de cada punto y las correcciones en orden, empezando por las que más suman."]
      ],
      insideK: "Qué trae",
      inside: [
        ["La skill", "Las instrucciones para que Claude haga la auditoría completa y escriba el informe para el dueño del negocio, no para un técnico."],
        ["El checklist", "99 puntos en 14 áreas, más las señales de spam, cada uno con cómo comprobarlo y cuánto pesa."],
        ["La guía", "El porqué de cada punto, los mitos más repetidos y lo que se puede prometer, y lo que no."],
        ["Un ejemplo real", "La auditoría de nuestro propio sitio: 80 de 100, con todo lo que nos falta a la vista."],
        ["La calculadora", "Un script de Python que lee el informe y saca la puntuación, para que nadie la haga a mano."]
      ],
      howK: "Cómo usarla",
      how: [
        ["Descárgala", "Es un zip con una carpeta, auditoria-seo."],
        ["Instálala en Claude", "En claude.ai, súbela tal cual en la sección de skills de la configuración. En Claude Code, descomprímela en la carpeta .claude/skills."],
        ["Pídele la auditoría", "Escribe, por ejemplo: «Haz una auditoría SEO de https://tusitio.com». Claude te preguntará qué tipo de negocio es y a qué cuentas tienes acceso."]
      ],
      howNote: "Funciona mejor con un agente que pueda navegar y ejecutar comandos, como Claude Code. Sin agente, el checklist y la guía también se pueden seguir a mano.",
      honestH: "Sin promesas que nadie puede cumplir",
      honest: "Nadie puede prometerte el primer lugar en Google, ni más ventas. Esta auditoría no lo hace: te dice, con evidencia, qué está bien, qué frena tu página y en qué orden arreglarlo.",
      license: "Es gratis y puedes compartirla. Licencia CC BY 4.0: úsala, adáptala y compártela, mencionando a 16 Ball Creations.",
      ctaH: "¿Prefieres que la hagamos nosotros?",
      ctaP: "Revisamos tu página con este mismo método y te entregamos el informe con las correcciones. Si tu página la hicimos nosotros, ya viene revisada.",
      ctaBtn: "Ver Ecosistema digital"
    }
  },
  en: {
    dir: "resources",
    title: "Free resources for your brand and your website",
    desc: "What we use at 16 Ball Creations, free and with no sign-up: starting with the SEO and AEO audit, to see whether Google and AI understand your website.",
    crumb: "Resources",
    kicker: "Free, no sign-up",
    h1: "Free <em>resources</em>",
    lead: "What we use in the studio, for you to use: no sign-up, no email and no fine print.",
    listK: "To download",
    seeIt: "See the resource",
    items: [{
      slug: "seo-audit",
      name: "SEO and AEO audit",
      line: "Find out what's holding your website back on Google and in AI assistants, with the same 99 points we check for our clients.",
      tag: "Claude skill · checklist · guide (in Spanish)"
    }],
    seo: {
      title: "Free SEO and AEO audit: the 16 Ball Creations skill and checklist",
      desc: "Download the 16 Ball Creations SEO and AEO audit for free: 99 points in 14 areas, a 0 to 100 score and what to fix first, for Google, ChatGPT, Gemini and Copilot. In Spanish.",
      crumb: "SEO and AEO audit",
      kicker: "Free resource",
      h1: "SEO and <em>AEO audit</em>",
      lead: "Your website can be well made and still not show up. This audit tells you why, with the same method we use in the studio. The files are in Spanish; Claude can write the report in English.",
      download: "Download the skill",
      readGuide: "Read the guide",
      meta: (v, d, kb) => `${v} · ${d} · ${kb} KB zip · in Spanish`,
      whatK: "What it does",
      whatH: "It sees your website <em>the way others do</em>",
      what: [
        ["The way Google sees it", "It checks whether Google can find, read and understand every page: what blocks it, what's too much and what's missing."],
        ["The way AI sees it", "It asks ChatGPT, Gemini and Copilot about your business, and checks what your website needs so they name you when someone looks for what you do."],
        ["What to fix first", "It gives you a 0 to 100 score, the evidence for every point and the fixes in order, starting with the ones that add the most."]
      ],
      insideK: "What's inside",
      inside: [
        ["The skill", "The instructions for Claude to run the full audit and write the report for the business owner, not for a technician."],
        ["The checklist", "99 points in 14 areas, plus the spam signals, each with how to check it and how much it weighs."],
        ["The guide", "The why behind every point, the most repeated myths and what can be promised, and what can't."],
        ["A real example", "The audit of our own website: 80 out of 100, with everything we're missing in plain sight."],
        ["The calculator", "A Python script that reads the report and works out the score, so nobody does it by hand."]
      ],
      howK: "How to use it",
      how: [
        ["Download it", "It's a zip with one folder, auditoria-seo."],
        ["Install it in Claude", "On claude.ai, upload it as is in the skills section of the settings. In Claude Code, unzip it into the .claude/skills folder."],
        ["Ask for the audit", "Write, for example: “Run an SEO audit of https://yoursite.com, report in English.” Claude will ask what kind of business it is and which accounts you can access."]
      ],
      howNote: "It works best with an agent that can browse and run commands, like Claude Code. Without one, the checklist and the guide can also be followed by hand.",
      honestH: "No promises nobody can keep",
      honest: "Nobody can promise you the top spot on Google, or more sales. This audit doesn't: it tells you, with evidence, what's working, what's holding your website back and in what order to fix it.",
      license: "It's free and you can share it. CC BY 4.0 license: use it, adapt it and share it, crediting 16 Ball Creations.",
      ctaH: "Would you rather we did it?",
      ctaP: "We review your website with this same method and hand you the report with the fixes. If we built your website, it already comes reviewed.",
      ctaBtn: "See Digital ecosystem"
    }
  }
};
