/* Theme Page Studio → Postiz relay (Cloudflare Worker)

   The app calls this Worker; the Worker adds your Postiz API key and
   forwards the request to Postiz. The key never leaves Cloudflare.

   Settings (Worker → Settings → Variables and Secrets):
     POSTIZ_API_KEY  (secret)  your key from Postiz → Settings → Public API
     APP_PASSCODE    (secret)  any long passphrase; you type the same one into the app
     ALLOWED_ORIGIN  (text)    https://zewalrus.github.io
*/

const POSTIZ = "https://api.postiz.com";

/* Only the calls the app needs. Anything else is refused. */
const ALLOWED = [
  ["GET",    /^\/public\/v1\/integrations$/],
  ["POST",   /^\/public\/v1\/upload$/],
  ["GET",    /^\/public\/v1\/posts$/],
  ["POST",   /^\/public\/v1\/posts$/],
  ["DELETE", /^\/public\/v1\/posts\/[\w-]+$/],
  ["GET",    /^\/public\/v1\/analytics\/post\/[\w-]+$/],
];

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowOrigin = env.ALLOWED_ORIGIN || "";
    const cors = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Studio-Pass",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    const reply = (status, body) => new Response(JSON.stringify(body), {
      status, headers: { ...cors, "Content-Type": "application/json" },
    });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (!env.POSTIZ_API_KEY || !env.APP_PASSCODE || !allowOrigin)
      return reply(500, { error: "Relay is missing a setting: POSTIZ_API_KEY, APP_PASSCODE or ALLOWED_ORIGIN." });
    if (origin && origin !== allowOrigin)
      return reply(403, { error: "This relay only works from " + allowOrigin });
    if (!safeEqual(req.headers.get("X-Studio-Pass") || "", env.APP_PASSCODE))
      return reply(401, { error: "Wrong passcode." });

    const url = new URL(req.url);
    if (!ALLOWED.some(([m, re]) => m === req.method && re.test(url.pathname)))
      return reply(404, { error: "Not allowed: " + req.method + " " + url.pathname });

    const headers = new Headers({ Authorization: env.POSTIZ_API_KEY });
    const type = req.headers.get("Content-Type");
    if (type) headers.set("Content-Type", type); // keeps the multipart boundary for uploads

    const upstream = await fetch(POSTIZ + url.pathname + url.search, {
      method: req.method,
      headers,
      body: ["GET", "DELETE"].includes(req.method) ? undefined : req.body,
      duplex: "half", // stream uploads straight through instead of buffering them
    });

    const out = new Headers(cors);
    out.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    return new Response(upstream.body, { status: upstream.status, headers: out });
  },
};

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
