const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const { registrarGoogle } = require("./identidad-google");

const perfil = {
  id: true, nombres: true, apellidos: true, dni: true, email: true, rol: true,
  estudiante: { select: { id: true, codigoUniv: true, programa: { select: { id: true, nombre: true, tipo: true, activo: true } } } },
};

const nombreCookie = "sigep_sesion";
const opcionesCookie = { httpOnly: true, sameSite: "lax", secure: process.env.SIGEP_DEMOSTRACION !== "1", path: "/" };
const hashAlternativo = bcrypt.hashSync("sigep-comparacion-reservada", 12);

function leerCookie(req, nombre) {
  return req.get("cookie")?.split(";").map((parte) => parte.trim()).find((parte) => parte.startsWith(nombre + "="))?.slice(nombre.length + 1);
}

function registrarIdentidad(app, prisma, secreto) {
  const intentos = new Map();
  const revocadas = new Map();
  function iniciarSesion(res, usuario) {
    const token = jwt.sign({}, secreto, { algorithm: "HS256", issuer: "sigep", audience: "sigep-web", subject: String(usuario.id), jwtid: randomUUID(), expiresIn: "1h" });
    res.cookie(nombreCookie, token, { ...opcionesCookie, maxAge: 3600_000 });
  }

  function verificarSesion(req) {
    return jwt.verify(leerCookie(req, nombreCookie), secreto, { algorithms: ["HS256"], issuer: "sigep", audience: "sigep-web" });
  }

  async function autenticar(req, res, next) {
    res.set("Cache-Control", "no-store");
    if (!secreto) return res.status(503).json({ error: "El ingreso con cuentas SIGEP aún no está habilitado" });
    let id;
    try {
      const sesion = verificarSesion(req);
      id = Number(sesion.sub);
      if (!Number.isSafeInteger(id) || revocadas.has(sesion.jti)) throw new Error("Sesión inválida");
    } catch {
      return res.status(401).json({ error: "Inicia sesión nuevamente" });
    }
    const usuario = await prisma.usuario.findFirst({ where: { id, activo: true }, select: perfil });
    if (!usuario) return res.status(401).json({ error: "Inicia sesión nuevamente" });
    req.usuario = usuario;
    return next();
  }

  app.post("/api/auth/login", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!secreto) return res.status(503).json({ error: "El ingreso con cuentas SIGEP aún no está habilitado" });
    const { dni, email, password } = req.body ?? {};
    const identificador = typeof dni === "string" && /^\d{8}$/.test(dni)
      ? { dni }
      : typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? { email: email.trim().toLowerCase() } : null;
    if (!identificador || typeof password !== "string" || Buffer.byteLength(password) > 72 || !password) {
      return res.status(400).json({ error: "Revisa tus credenciales" });
    }
    const ahora = Date.now();
    const previo = intentos.get(req.ip);
    const intento = previo?.vence > ahora ? previo : { veces: 0, vence: ahora + 60_000 };
    if (intento.veces >= 10) return res.status(429).json({ error: "Demasiados intentos. Vuelve a intentar en un minuto" });
    if (!previo && intentos.size >= 4096) {
      for (const [ip, registro] of intentos) if (registro.vence <= ahora) intentos.delete(ip);
      if (intentos.size >= 4096) return res.status(429).json({ error: "Vuelve a intentar en un minuto" });
    }
    intento.veces++;
    intentos.set(req.ip, intento);
    const usuario = await prisma.usuario.findFirst({
      where: { ...identificador, activo: true }, select: { ...perfil, password: true },
    });
    const coincide = await bcrypt.compare(password, usuario?.password ?? hashAlternativo);
    if (!usuario || !coincide) {
      console.info("SIGEP auth: acceso rechazado");
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const { password: _password, ...datos } = usuario;
    iniciarSesion(res, datos);
    console.info("SIGEP auth: acceso por contraseña", datos.id);
    return res.json({ usuario: datos });
  });
  app.post("/api/auth/logout", (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const sesion = verificarSesion(req);
      const ahora = Date.now() / 1000;
      for (const [id, vence] of revocadas) if (vence <= ahora) revocadas.delete(id);
      revocadas.set(sesion.jti, sesion.exp);
      console.info("SIGEP auth: cierre de sesión", sesion.sub);
    } catch { /* Cerrar la sesión también borra cookies vencidas. */ }
    res.clearCookie(nombreCookie, opcionesCookie);
    return res.json({ ok: true });
  });
  app.get("/api/auth/perfil", autenticar, (req, res) => res.json(req.usuario));
  registrarGoogle(app, { prisma, secreto, perfil, opcionesCookie, leerCookie, iniciarSesion });
  return autenticar;
}

module.exports = { registrarIdentidad };
