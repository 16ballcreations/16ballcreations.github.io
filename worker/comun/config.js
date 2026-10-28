/* Configuración del sitio: dominios, límites y direcciones. */

export const ALLOWED_ORIGINS = [
  "https://16ballcreations.github.io",
  "http://localhost:8717",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];
export const MAX_BODY = 32 * 1024;
export const MAX_TEXT = 3000;

/* The site's own domain. Links the panel hands out (MIRA, authorisations)
   always use it, whatever address the panel was opened from. */
export const SITE = "https://16ballcreations.com";
/* Addresses that still answer but now send people to SITE, keeping the path
   and the query (a MIRA ?t= or an authorisation token survives the move).
   The API is left alone so a form posted from an old page still arrives. */
export const MOVED_HOSTS = ["page.16ballcreations.workers.dev", "www.16ballcreations.com"];
/* retired pages and where they now lead (Video para redes left the offer on 22 Oct) */
export const RETIRED = {
  "/servicios/video-para-redes": "/servicios/",
  "/en/services/social-video": "/en/services/"
};
/* Where Email Routing delivers the studio's mail (a verified destination) */
export const INBOX = "16ballcreations@gmail.com";
