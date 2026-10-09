/* Makes the hash of the panel's password, for the ADMIN_CLAVE_HASH secret.
   The Worker only checks it; it never makes one.

     node scripts/hash-clave.mjs            a random password (recommended)
     node scripts/hash-clave.mjs 'mi clave' the one you give it

   The password is printed once and kept nowhere: copy it to your password
   manager. Then:  npx wrangler secret put ADMIN_CLAVE_HASH  (paste the hash).
   While ADMIN_CLAVE_HASH is set, ADMIN_PASSWORD is no longer used.

   100,000 iterations and no more: Workers refuses PBKDF2 above that, and a
   bigger number would check fine in Node and fail every time once deployed. */
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 100000;
/* no l/I/1 or O/0, so it can be read out loud or typed on a phone */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_";
const b64 = bytes => Buffer.from(bytes).toString("base64");

function randomPassword(length = 24){
  return [...crypto.getRandomValues(new Uint8Array(length))].map(b => ALPHABET[b % ALPHABET.length]).join("");
}

const given = process.argv[2];
const password = given || randomPassword();
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt, iterations:ITERATIONS, hash:"SHA-256" }, key, 256);
const hash = `pbkdf2$sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;

if(!given){ console.log("Clave (guárdala en tu gestor de claves; no se vuelve a mostrar):\n  " + password + "\n"); }
console.log("Hash para ADMIN_CLAVE_HASH:\n  " + hash + "\n");
console.log("Siguiente paso:  npx wrangler secret put ADMIN_CLAVE_HASH   (y pega el hash)");
