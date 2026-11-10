/* The studio's services, in English: the same five, the same keys and balls as
   scripts/servicios-data.mjs (keep both in step), with their own slugs under
   /en/services/. Same rules of tone: plain words, no promises of sales,
   followers or reach, and no mobile apps. */

const MIRA_STEP = {
  t: "Your MIRA",
  d: "Five questions about your brand (about three minutes, free) and a 30-minute call. First we understand where your brand comes from, why it was born and where it's going."
};
const LIVE_STEP = {
  t: "Up and running",
  d: "We check everything before we hand it over, show you how to use it, and stay by your side afterwards."
};

const FAQ_PRICE = {
  q: "How much does it cost?",
  a: "Everything has a fixed price, shown on each service: the brand audit costs US$150, brand guidelines go from US$390 to US$910, and websites come in three plans, from US$970 to US$2,580. Your MIRA and the first call are free."
};
const FAQ_WHERE = {
  q: "Do you work with clients outside Colombia?",
  a: "Yes. We're based in Medellín, Colombia, and we work by video call with brands anywhere. We've done projects in Colombia, Venezuela and Costa Rica, and we work in English or Spanish."
};
/* Google, AI and the price of a website (SEO/AEO plan of 22 Oct, 2.6 and
   2.7). We never promise that Google or an AI will name anyone: we promise
   that everything says the same thing, so they can understand you. */
export const FAQ_AI = {
  q: "Can my business show up when someone asks ChatGPT?",
  a: "Nobody can promise that an AI will name you. What we can do is give it something clear to understand: your name, what you do and where you are, said the same way on your website, your Google profile and your social media. Google and AI tools recommend businesses they recognize as one, and that's exactly what aligning your brand does."
};
export const FAQ_BRAND_GOOGLE = {
  q: "What does my brand have to do with showing up on Google?",
  a: "A lot. Google doesn't just read your website: it compares your name, address, hours and what you say on your Google profile, your social media and your site. When everything tells the same story, it recognizes you as one business; when things contradict each other, it hesitates. Aligning your brand is what gives it that certainty."
};
export const FAQ_MONTHLY = {
  q: "Do you charge for SEO every month?",
  a: "No. Every project has a fixed price. If you'd like us to keep looking after it afterwards, there's optional maintenance for US$100 a month, with no minimum term."
};
export const FAQ_INDEPENDENCE = {
  q: "Will I depend on you for everything?",
  a: "No, and that's the point. Everything we make is in your name: the domain, the accounts, the files and the copy. We teach you how to run it; if you'd rather we handle something, we do, but always with the information in your hands, so you're in control of your business."
};
export const FAQ_WEB_PRICE = {
  q: "How much does a website cost?",
  a: "There are template sites that cost very little and custom-designed sites that cost several times more. Ours are custom, built from your brand, in three plans with a fixed price: Essential, US$970; Professional, US$1,360; and Complete, US$2,580. All of them include the brand audit and your domain for a year, and they're ready in one week."
};
/* the questions on the home page, with their FAQPage data */
export const HOME_FAQ = [FAQ_AI, FAQ_BRAND_GOOGLE, FAQ_MONTHLY, FAQ_INDEPENDENCE, FAQ_WEB_PRICE];

const FAQ_START = {
  q: "Where do I start?",
  a: "With your MIRA: five questions about your brand. We use your answers to prepare the call, and we write back within 24 hours to schedule it."
};

/* The Brand Ecosystem: the sum of two lines (rate card v7, 9 Nov 2026) */
export const LINES_EN = {
  esencia: {
    id: "brand-essence", name: "Brand Essence", em: "who you are",
    line: "Your brand feeling like yours and saying the same thing everywhere: the brand audit and your brand guidelines.",
    seo: "Brand Essence: brand audit and brand guidelines",
    desc: "Brand Essence: the brand audit (US$150) and your brand guidelines, express (US$390) or complete (US$910). Fixed prices, from Medellín.",
    intro: "Before any website, your brand needs to know who it is. We review how it looks today everywhere it shows up and put it in order in brand guidelines, so everything you do afterwards tells the same story.",
    has: ["Brand audit", "Express brand guidelines", "Complete brand guidelines"],
    offers: [
      { n: "Brand audit", tag: "What's failing and how to fix it", time: "Ready in 2 days", v: 150, items: [
        "Your website, Google profile, social media and contact details, reviewed one by one",
        "What ChatGPT and Gemini answer when people ask about your business",
        "Every finding with its priority and how to fix it, in writing",
        "A 45-minute walkthrough call",
        "Paid upfront"
      ] },
      { n: "Express brand guidelines", tag: "The essentials of your identity, in writing", v: 390, items: [
        "Your current logo, with its versions and uses",
        "Your colors and typography",
        "Your tone: how your brand speaks",
        "A clear document for your team and suppliers"
      ] },
      { n: "Complete brand guidelines", tag: "Your whole identity, so nobody blurs it", v: 910, items: [
        "Everything in the express guidelines",
        "Your essence: story, purpose and who you speak to",
        "Brand voice: how it speaks, and how it doesn't",
        "Photography: the style of your images",
        "Applications: social media, stationery and spaces",
        "The files, ready to use"
      ] }
    ],
    note: "If within 30 days you move up to something more complete (from the audit to guidelines, from express to complete or to a website plan), what you paid is credited."
  },
  ecosistema: {
    id: "digital-ecosystem", name: "Digital Ecosystem", em: "where people find you",
    line: "Where your brand serves, sells and keeps itself organized: your website, your store or your system.",
    seo: "Digital Ecosystem: your website in three plans and your online store",
    desc: "Digital Ecosystem: your website in three plans, Essential (US$970), Professional (US$1,360) and Complete (US$2,580), and The Store (US$1,670). Fixed prices.",
    intro: "Your ecosystem is where people find you: your website, your channels and, if you sell products, your store. Every plan is built on your essence: they all include the brand audit and are ready in one week.",
    has: ["Websites in three plans", "The Store", "Systems, with Modularity"],
    note: "If you move up a plan within 30 days of delivery, what you paid is credited."
  }
};
export const UMBRELLA_EN = {
  name: "Brand Ecosystem",
  line: "Your brand essence and your digital ecosystem, telling the same story."
};
export const PLANS_EN = [
  { n: "Essential", tag: "Get found and understood", time: "Ready in 1 week", v: 970, items: [
    "The brand audit and your MIRA",
    "Your channels aligned: Instagram, Facebook, LinkedIn, WhatsApp Business and Google",
    "Your Google profile completed",
    "An information website with a gallery of up to 6 projects",
    "Contact by WhatsApp, form and map",
    "Domain, hosting and an email on your domain for a year"
  ] },
  { n: "Professional", tag: "Get chosen", time: "Ready in 1 week", v: 1360, items: [
    "Everything in Essential",
    "Your express brand guidelines",
    "A page for each project, up to 8",
    "Ready for AI search to understand it"
  ] },
  { n: "Complete", tag: "Your whole ecosystem", time: "Ready in 1 week", v: 2580, items: [
    "Everything in Professional",
    "Your complete brand guidelines",
    "A page for each project, up to 12",
    "An assistant so you can edit your site yourself, with a 45-minute session",
    "3 months of maintenance"
  ] }
];

export const SERVICES_EN = [
  {
    key: "auditoria",
    slug: "brand-audit",
    ball: 1,
    group: "esencia",
    prices: [{ n: "Brand audit", v: 150, d: "Paid upfront. Ready in 2 days, with the walkthrough call." }],
    name: "Brand audit",
    title: "Brand audit",
    seo: "Brand audit: website, Google and social",
    who: "For businesses that already have a website and social profiles, and feel something doesn't add up.",
    desc: "Brand audit from Medellín: we review your website, Google listing, social profiles and contact details, and give you in writing what to fix. US$150.",
    em: "channel by channel",
    line: "We review your brand everywhere it shows up and give you, in writing, what's failing and how to fix it.",
    what: "16 Ball Creations reviews the brand of businesses and personal brands everywhere it shows up and gives you, in writing, what to fix, from Medellín.",
    intro: "It's the full MIRA, in depth. We review how your brand looks and what it says on your website, your Google profile, your social media, your contact details and in what AI answers when someone asks about your business. You get a document with every finding, its priority and how to fix it, and we go through it with you. You can make the corrections yourself, or make them with us.",
    includes: [
      "A channel-by-channel review: your website, your Google profile, your social media and your contact details",
      "The AI test: what ChatGPT and Gemini answer when someone asks about your business",
      "Every finding with its priority and how to fix it",
      "A written document, yours to keep",
      "A 45-minute walkthrough by video call",
      "If you hire brand guidelines or a plan within 30 days, what you paid is credited"
    ],
    steps: [
      MIRA_STEP,
      { t: "The research", d: "We look your brand up the way a customer would: on Google, on Maps, on your social media, on other sites and in AI tools." },
      { t: "The document", d: "We write every finding channel by channel, with its priority and the exact way to fix it." },
      { t: "The walkthrough", d: "We go through it with you in 45 minutes by video call and answer your questions." }
    ],
    faq: [
      { q: "How much does the audit cost?", a: "US$150, paid upfront. If within the next 30 days you hire brand guidelines or one of the website plans, what you paid is credited." },
      { q: "Does the audit include the corrections?", a: "No. We tell you what to fix and how, so you or your team can do it. If you'd rather we do it, that is part of the website plans, which already include the audit, and what you paid is credited." },
      { q: "How is it different from the MIRA?", a: "The MIRA is free: five questions about your brand, a call and a first look. The audit is the full detail, in writing: what's failing, on which channel and how to fix it." },
      FAQ_AI
    ]
  },
  {
    key: "marca",
    group: "esencia",
    prices: [
      { n: "Express brand guidelines", v: 390, d: "The essentials of your identity in writing: your logo, colors, typography and tone. If you move up to complete guidelines or a plan within 30 days, it's credited." },
      { n: "Complete brand guidelines", v: 910, d: "Your whole identity: essence, voice, logo and its uses, colors, typefaces, photography and applications." }
    ],
    extras: [
      { n: "New logo", v: 450, d: "If your logo needs a redesign: three proposals and the final version, inside your guidelines." },
      { n: "Professional photography", d: "Priced per shoot. Medellín only, with our partner photographers." }
    ],
    slug: "brand-identity",
    ball: 2,
    name: "Brand identity",
    title: "Brand identity",
    seo: "Brand identity and logo design",
    who: "For brands that are starting out, or grew without an identity that tells their story.",
    em: "people recognize",
    line: "Your logo, colors, typography and voice, put in order in brand guidelines that tell your story.",
    what: "16 Ball Creations puts the identity of businesses and personal brands in order, logo, colors, typography and voice, in brand guidelines built from their story, working from Medellín.",
    intro: "A brand doesn't start with a logo: it starts with why it exists. We begin with your story, who you're speaking to and what you want them to feel, and from there we shape everything people see. The result is a brand that's recognizable in every piece, from the sign on the door to your latest post.",
    includes: [
      "Your story in writing: origin, purpose and who you speak to",
      "Your logo in order, with its versions and uses",
      "Colors and typefaces",
      "Brand voice: how it speaks, and how it doesn't",
      "Brand guidelines: how to use it well, so anyone can apply it without blurring it",
      "If your logo needs a redesign, we do it separately with our partner designer"
    ],
    steps: [
      MIRA_STEP,
      { t: "Your story", d: "Together we write where the brand comes from and what it should make people feel. That story guides every decision." },
      { t: "Your identity", d: "We put your logo, colors and voice in order, and refine them with you until they feel like yours." },
      { t: "Your guidelines", d: "We hand over the files and the brand guidelines, so anyone can use your brand without blurring it." }
    ],
    faq: [
      { q: "I already have a logo. Do I have to change it?", a: "Not necessarily. Often the logo is fine and what's missing is order: colors that don't repeat, social profiles telling a different story. Your MIRA tells us whether to update it or just tidy things up." },
      { q: "What do I get at the end?", a: "Your brand guidelines, express or complete, with your logo files in every format, the color palette, the typefaces and the voice, ready to use." },
      { q: "Does it work for a personal brand?", a: "Yes. We've done it with artists and outreach projects: putting image and voice in order so the person and the brand say the same thing." },
      FAQ_PRICE,
      FAQ_START
    ]
  },
  {
    key: "web",
    group: "ecosistema",
    plans: true,
    extras: [
      { n: "Monthly maintenance", v: 100, d: "Per month, no minimum term: 2 changes a month plus a technical and Google profile check." },
      { n: "Extra project page", v: 80, d: "With the same design as the rest." },
      { n: "SEO and AI search review", v: 450, d: "For a website we didn't build, with the full report." }
    ],
    slug: "websites",
    ball: 3,
    name: "Websites",
    title: "Website design",
    seo: "Custom website design",
    who: "For businesses and personal brands that need a website that speaks for them.",
    em: "that tells who you are",
    line: "A site made to fit your brand, that looks right on a phone and makes it easy to reach you.",
    what: "16 Ball Creations designs custom websites for businesses and personal brands from Medellín: they look right on a phone and make it easy to reach you.",
    intro: "Your website is where your brand speaks without interruptions. We design it from your story, with no templates, so it feels like the rest of your brand: your social profiles, your shop, your documents. And we set it up so Google can understand it.",
    includes: [
      "Structure and copy shaped by your brand",
      "Custom design, no templates",
      "Looks right on phone, tablet and desktop",
      "Contact form and WhatsApp button",
      "Ready for Google and AI to understand it: your name, location and services stated the same way as on your Google profile and social media",
      "Your domain, hosting and an email on your domain to receive mail, for a year",
      "We show you how to update what changes often"
    ],
    steps: [
      MIRA_STEP,
      { t: "What it will say", d: "We define the sections your site needs and what each one says, in your brand's words." },
      { t: "Design and build", d: "We show you how it will look, then we build it. You can watch it take shape from the first week." },
      LIVE_STEP
    ],
    faq: [
      { q: "Does my brand need to be ready first?", a: "It helps, but it isn't required. If your brand isn't clear yet, your MIRA will show it, and we can start there or do both together." },
      { q: "Can I edit the text myself?", a: "Yes. We show you how to update what changes often, and for anything beyond that, you just write to us." },
      { q: "Will my site rank first on Google?", a: "We won't promise that, on Google or on ChatGPT, because nobody can guarantee it. What we do is make everything say the same thing (your website, your Google profile and your social media) and build it properly: titles, descriptions, speed and a sitemap. That way Google and AI can understand you." },
      FAQ_AI,
      FAQ_MONTHLY,
      FAQ_INDEPENDENCE,
      FAQ_WEB_PRICE
    ]
  },
  {
    key: "tienda",
    group: "ecosistema",
    prices: [{ n: "The Store", v: 1670, d: "Your catalog online with up to 25 products, orders through the site or WhatsApp, payments and shipping." }],
    slug: "online-stores",
    ball: 4,
    name: "Online stores",
    title: "Online stores",
    seo: "Online stores with WhatsApp ordering",
    who: "For businesses that sell products and still take orders by hand.",
    em: "with your brand end to end",
    line: "Your catalog online, with orders through the site or WhatsApp, that feels like your brand.",
    what: "16 Ball Creations builds online stores for businesses that sell products, with orders through the site or WhatsApp, working from Medellín.",
    intro: "An online store is your brand serving someone who can't walk into your shop. So we build it with your voice and your style, not the face of a template: a catalog that's easy to browse and a simple way to order.",
    includes: [
      "Catalog with photos, prices and filters",
      "Orders through the site or straight to your WhatsApp",
      "Product pages written in your brand's words",
      "Looks right on phones, where most people shop",
      "A simple place to update products and prices",
      "Ready for Google and AI to understand it: your name, location and products stated the same way as on your Google profile and social media"
    ],
    steps: [
      MIRA_STEP,
      { t: "Your catalog", d: "We organize your products: categories, photos, descriptions, and how your customers will browse them." },
      { t: "Design and build", d: "We show you how it will look, build it, and test every order from start to finish." },
      LIVE_STEP
    ],
    faq: [
      { q: "Can I receive orders through WhatsApp?", a: "Yes. It's the most common setup in our projects: customers put together their order in the store and it reaches your WhatsApp ready to go." },
      { q: "Who uploads the products?", a: "We load your initial catalog, up to 25 products, and show you how to add, change and remove products." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  },
  {
    key: "sistemas",
    group: "ecosistema",
    slug: "business-systems",
    ball: 5,
    name: "Business systems",
    title: "Systems to run your business",
    seo: "Order, inventory and booking systems",
    who: "For businesses that track orders, bookings or stock in notebooks and spreadsheets.",
    examples: {
      "kicker": "What it's for",
      "h": "A system that speaks <em>like your business</em>",
      "lead": "Every business tells its day in its own words. The system is built with them: what you order, what you sell, what you book.",
      "items": [
        [
          "Coffee shops and restaurants",
          "Table and takeaway orders, deliveries, a stock of supplies that warns you before it runs out, and the day's cash count."
        ],
        [
          "Repair shops",
          "Work orders with before-and-after photos, the parts used, the status of every vehicle and the invoice at handover."
        ],
        [
          "Salons and barbershops",
          "A calendar per professional, appointment reminders, each client's history and the products sold."
        ],
        [
          "Clinics and practices",
          "Appointments, each patient's record, the services they received and what's still to be paid."
        ]
      ],
      "demo": {
        "label": "Try the Modularity demo",
        "note": "Modularity is our own system: with sample data from a repair shop, you can walk through orders, stock, bookings and invoices.",
        "url": "https://modularity.16ballcreations.workers.dev/?demo"
      }
    },
    em: "in one place",
    line: "Orders, inventory, appointments and invoices in one place, instead of notebooks and spreadsheets.",
    what: "16 Ball Creations builds custom systems so small businesses keep orders, inventory, appointments and invoices in one place, working from Medellín.",
    intro: "As a business grows, notebooks and spreadsheets start telling different stories. We build custom systems so everything lives in one place, in your business's own words, and each person sees only what they need.",
    includes: [
      "Orders and work orders",
      "Inventory that warns you when something runs low",
      "Calendar and appointments",
      "Invoices and a record of every sale",
      "Customers and their history",
      "Permissions: each employee sees only their part"
    ],
    steps: [
      MIRA_STEP,
      { t: "How you work today", d: "We walk through how your business runs with you: what gets written down, where things get lost, what you want to see at a glance." },
      { t: "Built in parts", d: "We build it module by module, starting with what hurts most, and you try it early on." },
      LIVE_STEP
    ],
    faq: [
      { q: "What is Modularity?", a: "It's our own product for running a business, currently in development. You can explore the demo with sample data; if it fits your business, it can be a faster starting point than a system built from scratch." },
      { q: "Do I need to know about technology?", a: "No. The system uses your business's own words, and we teach you and your team how to use it." },
      { q: "How much does a system cost?", a: "It has no public price yet: Modularity, our system, is in development and we are not selling it yet. If you are interested for your business, write to us and we will talk it through; meanwhile you can explore the demo." },
      FAQ_START
    ]
  }
];
