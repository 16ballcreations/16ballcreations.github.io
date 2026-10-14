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
  a: "Projects start at US$400. The final price depends on what you need; after the call we send you a written proposal, with no commitment. Your MIRA and the first call are free."
};
const FAQ_WHERE = {
  q: "Do you work with clients outside Colombia?",
  a: "Yes. We're based in Medellín, Colombia, and we work by video call with brands anywhere. We've done projects in Colombia, Venezuela and Costa Rica, and we work in English or Spanish."
};
const FAQ_START = {
  q: "Where do I start?",
  a: "With your MIRA: five questions about your brand. We use your answers to prepare the call, and we write back within 24 hours to schedule it."
};

export const SERVICES_EN = [
  {
    key: "marca",
    slug: "brand-identity",
    ball: 1,
    name: "Brand identity",
    title: "Brand identity",
    em: "people recognize",
    line: "A logo, colors, typography and a voice of its own, built from your brand's story.",
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
    ball: 2,
    name: "Websites",
    title: "Website design",
    em: "that tells who you are",
    line: "A site made to fit your brand, that looks right on a phone and makes it easy to reach you.",
    intro: "Your website is where your brand speaks without interruptions. We design it from your story, with no templates, so it feels like the rest of your brand: your social profiles, your shop, your documents. And we set it up so Google can understand it.",
    includes: [
      "Structure and copy shaped by your brand",
      "Custom design, no templates",
      "Looks right on phone, tablet and desktop",
      "Contact form and WhatsApp button",
      "Ready for Google: titles, descriptions and a sitemap",
      "Your domain and email set up",
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
      { q: "Will my site rank first on Google?", a: "We won't promise that, because nobody can guarantee it. What we do is build it properly so Google can understand it: titles, descriptions, speed and a sitemap." },
      FAQ_PRICE
    ]
  },
  {
    key: "tienda",
    slug: "online-stores",
    ball: 3,
    name: "Online stores",
    title: "Online stores",
    em: "with your brand end to end",
    line: "Your catalog online, with orders through the site or WhatsApp, that feels like your brand.",
    intro: "An online store is your brand serving someone who can't walk into your shop. So we build it with your voice and your style, not the face of a template: a catalog that's easy to browse and a simple way to order.",
    includes: [
      "Catalog with photos, prices and filters",
      "Orders through the site or straight to your WhatsApp",
      "Product pages written in your brand's words",
      "Looks right on phones, where most people shop",
      "A simple place to update products and prices",
      "Ready for Google: titles, descriptions and a sitemap"
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
    ball: 4,
    name: "Business systems",
    title: "Systems to run your business",
    em: "in one place",
    line: "Orders, inventory, appointments and invoices in one place, instead of notebooks and spreadsheets.",
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
    key: "video",
    slug: "social-video",
    ball: 5,
    name: "Video for social media",
    title: "Video and content for social media",
    em: "in your brand's voice",
    line: "Filming, editing and content for Instagram, TikTok and YouTube that looks and sounds like your brand.",
    intro: "Every video is your brand speaking out loud. We plan it from your story, film it and edit it with a style that repeats, so anyone who sees one of your videos recognizes it before reading your name. We learned it producing our own channel since 2020.",
    includes: [
      "Ideas and scripts drawn from your story",
      "Filming and editing",
      "A visual style that repeats: covers, captions, colors",
      "A publishing calendar",
      "Versions for Instagram, TikTok and YouTube"
    ],
    steps: [
      MIRA_STEP,
      { t: "Your content line", d: "We define what your brand talks about, how it says it and how its videos look." },
      { t: "Filming and editing", d: "We produce the videos and pieces, and review them with you before they go out." },
      { t: "Consistency", d: "We follow a calendar, look at what works and adjust, always in the same voice." }
    ],
    faq: [
      { q: "Do you promise more followers?", a: "No. Our job is to make your content tell the same story as your brand, with quality and consistency. Followers depend on many things nobody fully controls." },
      { q: "Do I have to be on camera?", a: "Not always. We decide together based on your brand: there are formats with a person, with the product, or with just a voice." },
      FAQ_PRICE,
      FAQ_WHERE
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
      { t: "Follow-through", d: "If you want, we apply it with you, or we do it for you." }
    ],
    faq: [
      { q: "How is this different from the MIRA?", a: "The MIRA is the first, free look, to know where to start. The advisory is the full job: an in-depth review, a written plan and follow-through." },
      { q: "Does it work for a personal brand?", a: "Yes. We've done it with artists and with outreach projects: putting profiles, image and voice in order so the person and the brand say the same thing." },
      FAQ_PRICE,
      FAQ_WHERE
    ]
  }
];
