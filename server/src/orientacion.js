const express = require("express");
const { randomBytes } = require("node:crypto");
const { tiposGrado } = require("./solicitudes");

function texto(valor, maximo) {
  if (typeof valor !== "string") return "";
  const limpio = valor.trim();
  return limpio.length <= maximo ? limpio : "";
}

function registrarOrientacion(app, prisma, autenticar) {
  const publica = express.Router();
  app.use("/api/orientacion", publica);
  const intentos = new Map();
  publica.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    const ahora = Date.now();
    if (intentos.size >= 4096) {
      for (const [ip, registro] of intentos) if (registro.vence <= ahora) intentos.delete(ip);
    }
    const previo = intentos.get(req.ip);
    const registro = previo?.vence > ahora ? previo : { total: 0, vence: ahora + 60_000 };
    if (registro.total >= 20 || (!previo && intentos.size >= 4096)) {
      return res.status(429).json({ error: "Demasiados intentos. Vuelve a intentarlo en un minuto." });
    }
    registro.total += 1;
    intentos.set(req.ip, registro);
    return next();
  });
  publica.post("/", async (req, res) => {
    const entrada = req.body ?? {};
    const nombres = texto(entrada.nombres, 160);
    const correo = texto(entrada.correo, 254).toLowerCase();
    const asunto = texto(entrada.asunto, 180);
    const descripcion = texto(entrada.descripcion, 3000);
    const programa = texto(entrada.programa, 160);
    const tipoTramite = entrada.tipoTramite || null;
    if (!nombres || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || !asunto || !descripcion ||
        (entrada.programa && !programa) || (tipoTramite !== null && !tiposGrado.includes(tipoTramite))) {
      return res.status(400).json({ error: "Revisa el nombre, correo, asunto, trámite y descripción." });
    }
    const consulta = await prisma.consultaOrientacion.create({
      data: { codigo: "ORI-" + randomBytes(16).toString("hex").toUpperCase(), nombres, correo, asunto, descripcion, programa, tipoTramite },
      select: { codigo: true, creadoEn: true },
    });
    return res.status(201).json(consulta);
  });
  publica.post("/consultar", async (req, res) => {
    const codigo = texto(req.body?.codigo, 36).toUpperCase();
    const correo = texto(req.body?.correo, 254).toLowerCase();
    if (!/^ORI-[A-F0-9]{32}$/.test(codigo) || !correo) {
      return res.status(400).json({ error: "Ingresa el código de atención y el correo registrado." });
    }
    const consulta = await prisma.consultaOrientacion.findFirst({
      where: { codigo, correo }, select: { codigo: true, creadoEn: true, respuesta: true, respondidaEn: true },
    });
    return consulta ? res.json(consulta) : res.status(404).json({ error: "No se encontró una consulta con esos datos." });
  });

  const personal = express.Router();
  app.use("/api/atencion-orientacion", autenticar, personal);
  personal.use((req, res, next) => ["administrador", "operador"].includes(req.usuario.rol)
    ? next() : res.status(403).json({ error: "No tienes permiso para atender consultas." }));
  personal.get("/", async (req, res) => {
    const pagina = Math.max(1, Math.min(10000, Number.parseInt(req.query.pagina, 10) || 1));
    const datos = await prisma.consultaOrientacion.findMany({
      orderBy: [{ creadoEn: "desc" }, { id: "desc" }], skip: (pagina - 1) * 20, take: 21,
    });
    return res.json({ datos: datos.slice(0, 20), siguiente: datos.length > 20 });
  });
  personal.patch("/:id/respuesta", async (req, res) => {
    const id = Number(req.params.id);
    const respuesta = texto(req.body?.respuesta, 3000);
    if (!Number.isSafeInteger(id) || id < 1 || !respuesta) return res.status(400).json({ error: "Escribe una respuesta válida." });
    const actualizadas = await prisma.consultaOrientacion.updateMany({
      where: { id, respondidaEn: null }, data: { respuesta, respondidaEn: new Date(), respondidaPorId: req.usuario.id },
    });
    return actualizadas.count ? res.json({ ok: true })
      : res.status(409).json({ error: "La consulta no existe o ya fue respondida." });
  });
}

module.exports = { registrarOrientacion };
