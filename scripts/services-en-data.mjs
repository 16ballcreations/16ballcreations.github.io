/* The studio's services, in English: the same six, the same keys and balls as
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
  a: "It depends on what you need; after the call we send you a written proposal, with no commitment. Your MIRA and the first call are free, and if you want the full diagnosis in writing, the brand audit costs US$200."
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
  a: "No. Every project has a fixed price. If you'd like us to keep looking after it afterwards, there's an optional care plan."
};
export const FAQ_INDEPENDENCE = {
  q: "Will I depend on you for everything?",
  a: "No, and that's the point. Everything we make is in your name: the domain, the accounts, the files and the copy. We teach you how to run it; if you'd rather we handle something, we do, but always with the information in your hands, so you're in control of your business."
};
export const FAQ_WEB_PRICE = {
  q: "How much does a website cost?",
  a: "It depends on what you need. There are template sites that cost very little and custom-designed sites that cost several times more. Ours are custom, built from your brand. After your MIRA and the call, we send you the exact price in writing, with no commitment."
};
/* the questions on the home page, with their FAQPage data */
export const HOME_FAQ = [FAQ_AI, FAQ_BRAND_GOOGLE, FAQ_MONTHLY, FAQ_INDEPENDENCE, FAQ_WEB_PRICE];

const FAQ_START = {
  q: "Where do I start?",
  a: "With your MIRA: five questions about your brand. We use your answers to prepare the call, and we write back within 24 hours to schedule it."
};

export const SERVICES_EN = [
  {
    key: "auditoria",
    slug: "brand-audit",
    ball: 1,
    price: 200,
    name: "Brand audit",
    title: "Brand audit",
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
      "If you make the corrections with us within 30 days, what you paid is credited"
    ],
    steps: [
      MIRA_STEP,
      { t: "The research", d: "We look your brand up the way a customer would: on Google, on Maps, on your social media, on other sites and in AI tools." },
      { t: "The document", d: "We write every finding channel by channel, with its priority and the exact way to fix it." },
      { t: "The walkthrough", d: "We go through it with you in 45 minutes by video call and answer your questions." }
    ],
    faq: [
      { q: "How much does the audit cost?", a: "US$200, paid upfront. If within the next 30 days you decide to have us make the corrections and your website, what you paid is credited to the project." },
      { q: "Does the audit include the corrections?", a: "No. We tell you what to fix and how, so you or your team can do it. If you'd rather we do it, we quote it separately and the audit is credited." },
      { q: "How is it different from the MIRA?", a: "The MIRA is free: five questions about your brand, a call and a first look. The audit is the full detail, in writing: what's failing, on which channel and how to fix it." },
      FAQ_AI
    ]
  },
  {
    key: "marca",
    slug: "brand-identity",
    ball: 2,
    name: "Brand identity",
    title: "Brand identity",
    em: "people recognize",
    line: "A logo, colors, typography and a voice of its own, built from your brand's story.",
    what: "16 Ball Creations creates the identity of businesses and personal brands, logo, colors, typography and voice, from their story, working from Medellín.",
    intro: "A brand doesn't start with a logo: it starts with why it exists. We begin with your story, who you're speaking to and what you want them to feel, and from there we shape everything people see. The result is a brand that's recognizable in every piece, from the sign on the door to your latest post.",
    includes: [
      "Your story in writing: origin, purpose and who you speak to",
      "Logo and its versions (horizontal, vertical, icon)",
      "Colors and typefaces",
      "Brand guidelines: how to use it well",
      "Brand voice: how it speaks, and how it doesn't",
      "Core pieces: business cards, social templates, stationery"
    ],
    steps: [
      MIRA_STEP,
      { t: "Your story", d: "Together we write where the brand comes from and what it should make people feel. That story guides every decision." },
      { t: "Your identity", d: "We propose the logo, the colors and the voice, and refine them with you until they feel like yours." },
      { t: "Your guidelines", d: "We hand over the files and the brand guidelines, so anyone can use your brand without blurring it." }
    ],
    faq: [
      { q: "I already have a logo. Do I have to change it?", a: "Not necessarily. Often the logo is fine and what's missing is order: colors that don't repeat, social profiles telling a different story. Your MIRA tells us whether to update it or just tidy things up." },
      { q: "What do I get at the end?", a: "Your logo files in every format, the color palette, the typefaces, the brand guidelines and the agreed pieces, ready to use." },
      FAQ_PRICE,
      FAQ_START
    ]
  },
  {
    key: "web",
    slug: "websites",
    ball: 3,
    name: "Websites",
    title: "Website design",
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
      "Your domain set up (email on your domain is separate)",
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
    slug: "online-stores",
    ball: 4,
    name: "Online stores",
    title: "Online stores",
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
      { q: "Who uploads the products?", a: "We load the initial catalog and show you how to add, change and remove products." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  },
  {
    key: "sistemas",
    slug: "business-systems",
    ball: 5,
    name: "Business systems",
    title: "Systems to run your business",
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
      FAQ_PRICE,
      FAQ_START
    ]
  },
  {
    key: "asesoria",
    slug: "image-and-social-advisory",
    ball: 6,
    name: "Image and social media advisory",
    title: "Image and social media advisory",
    em: "so everything tells the same story",
    line: "We review your profiles, your image and your pieces so everything tells the same story.",
    what: "16 Ball Creations reviews the profiles, image and pieces of businesses and personal brands so everything tells the same story, from Medellín.",
    intro: "Sometimes you don't need to build anything new: you need to put things in order. We review how your brand looks and speaks everywhere it shows up, and tell you what to change so it all feels like one brand. It works for businesses and for personal brands.",
    includes: [
      "A review of your profiles: photo, name, bio, highlights",
      "What your brand says today, and what it should say",
      "An image guide: colors, photos and style for your posts",
      "Personal image advice, if you are the brand",
      "A written plan with what to change first"
    ],
    steps: [
      MIRA_STEP,
      { t: "The review", d: "We go through your social profiles, your website and your pieces, and note where the story breaks." },
      { t: "Your plan", d: "We give you, in writing, what to change, in what order and how, with examples." },
      { t: "Follow-through", d: "If you want, we apply it with you, or we do it for you. We always show you how, so the control stays in your hands." }
    ],
    faq: [
      { q: "How is this different from the MIRA?", a: "The MIRA is the first, free look, to know where to start. The advisory is the full job: an in-depth review, a written plan and follow-through." },
      { q: "Does it work for a personal brand?", a: "Yes. We've done it with artists and with outreach projects: putting profiles, image and voice in order so the person and the brand say the same thing." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  }
];
