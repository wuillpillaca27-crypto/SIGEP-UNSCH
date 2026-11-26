const { randomBytes, timingSafeEqual } = require("node:crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const nombreCookie = "sigep_google";
const audiencia = "sigep-google-transaccion";
const random = () => randomBytes(32).toString("base64url");

function cargarConfiguracion(env) {
  const { SIGEP_GOOGLE_CLIENT_ID: clientId, SIGEP_GOOGLE_CLIENT_SECRET: clientSecret, SIGEP_GOOGLE_REDIRECT_URI: uri,
    SIGEP_GOOGLE_VINCULOS: archivo, SIGEP_GOOGLE_DOMINIOS: dominios } = env;
  if (!clientId || !clientSecret || !uri || !archivo) return null;
  try {
    const redirect = new URL(uri);
    const local = ["127.0.0.1", "localhost"].includes(redirect.hostname) && env.SIGEP_DEMOSTRACION === "1";
    if (redirect.protocol !== "https:" && !(local && redirect.protocol === "http:")) return null;
    if (redirect.pathname !== "/api/sigep/auth/google/callback" || redirect.search || redirect.hash ||
        redirect.username || redirect.password) return null;
    const datos = JSON.parse(require("node:fs").readFileSync(archivo, "utf8"));
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) return null;
    const vinculos = new Map(Object.entries(datos).filter(([sub, correo]) =>
      /^\d{1,255}$/.test(sub) && typeof correo === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ).map(([sub, correo]) => [sub, correo.toLowerCase()]));
    if (!vinculos.size || vinculos.size !== Object.keys(datos).length) return null;
    return {
      clientId, redirect, vinculos, dominios: new Set(dominios?.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)),
      cliente: new OAuth2Client(clientId, clientSecret, redirect.href),
    };
  } catch { return null; }
}

function registrarGoogle(app, { prisma, secreto, perfil, opcionesCookie, leerCookie, iniciarSesion }) {
  const config = secreto ? cargarConfiguracion(process.env) : null;
  app.get("/api/auth/google/estado", (_req, res) => res.set("Cache-Control", "no-store").json({ habilitado: Boolean(config) }));

  app.get("/api/auth/google/iniciar", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    if (!config) return res.status(503).json({ error: "Google no está configurado." });
    const state = random();
    const nonce = random();
    const { codeVerifier, codeChallenge } = await config.cliente.generateCodeVerifierAsync();
    const transaccion = jwt.sign({ state, nonce, codeVerifier }, secreto, { algorithm: "HS256", audience: audiencia, expiresIn: "5m" });
    res.cookie(nombreCookie, transaccion, { ...opcionesCookie, maxAge: 300_000 });
    return res.redirect(config.cliente.generateAuthUrl({
      scope: ["openid", "email"], state, nonce, code_challenge: codeChallenge, code_challenge_method: "S256",
      prompt: "select_account",
    }));
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!config) return res.status(503).json({ error: "Google no está configurado." });
    res.clearCookie(nombreCookie, opcionesCookie);
    try {
      const tx = jwt.verify(leerCookie(req, nombreCookie), secreto, { algorithms: ["HS256"], audience: audiencia });
      if (typeof req.query.state !== "string" || !/^[\w-]{43}$/.test(req.query.state) ||
          !timingSafeEqual(Buffer.from(tx.state), Buffer.from(req.query.state)) || typeof req.query.code !== "string") throw Error();
      const { tokens } = await config.cliente.getToken({ code: req.query.code, codeVerifier: tx.codeVerifier });
      const identidad = (await config.cliente.verifyIdToken({ idToken: tokens.id_token, audience: config.clientId })).getPayload();
      const email = identidad?.email?.toLowerCase();
      if (!email || identidad.nonce !== tx.nonce || identidad.email_verified !== true || config.vinculos.get(identidad.sub) !== email ||
          (config.dominios.size && !config.dominios.has(identidad.hd?.toLowerCase()))) throw Error();
      const usuario = await prisma.usuario.findFirst({ where: { email, activo: true }, select: perfil });
      const personal = usuario && ["administrador", "operador"].includes(usuario.rol);
      if (!usuario || (!personal && (usuario.rol !== "estudiante" || !usuario.estudiante))) throw Error();
      iniciarSesion(res, usuario);
      console.info("SIGEP auth: acceso por Google", usuario.id);
      return res.redirect(new URL(personal ? "/admin" : "/mis-tramites", config.redirect).href);
    } catch {
      console.info("SIGEP auth: acceso por Google rechazado");
      return res.redirect(new URL("/login?google=error", config.redirect).href);
    }
  });
}

module.exports = { registrarGoogle };
