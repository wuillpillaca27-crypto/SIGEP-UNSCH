const express = require("express");
const bcrypt = require("bcryptjs");
const { tipoPorPrograma } = require("./solicitudes");

const programas = { id: true, nombre: true, tipo: true, facultad: true, activo: true };
const usuarios = { id: true, nombres: true, apellidos: true, dni: true, email: true, rol: true, activo: true };
const texto = (valor, maximo) => typeof valor === "string" && valor.trim().length <= maximo ? valor.trim() : "";

function registrarAdministracion(app, prisma, autenticar) {
  const router = express.Router();
  app.use("/api/administracion", autenticar, router);
  router.use((req, res, next) => {
    if (!["administrador", "operador"].includes(req.usuario.rol)) return res.status(403).json({ error: "Acceso restringido" });
    next();
  });

  const soloAdmin = (req, res, next) => req.usuario.rol === "administrador"
    ? next() : res.status(403).json({ error: "Se necesita una cuenta de administrador" });

  router.get("/configuracion", (_req, res) => res.json({
    sistema: "SIGEP-UNSCH", ingreso: "DNI o correo registrado y contraseña",
    tamanoMaximoPDF: "10 MB", vigenciaSesion: "1 hora",
  }));

  router.get("/programas", async (_req, res) => res.json(await prisma.programa.findMany({
    orderBy: [{ nombre: "asc" }, { id: "asc" }], select: programas,
  })));
  router.post("/programas", soloAdmin, async (req, res) => {
    const nombre = texto(req.body?.nombre, 160);
    const facultad = texto(req.body?.facultad, 160);
    const tipo = req.body?.tipo;
    if (!nombre || !facultad || typeof tipo !== "string" || !Object.hasOwn(tipoPorPrograma, tipo)) {
      return res.status(400).json({ error: "Completa el nombre, la facultad y el tipo de programa." });
    }
    return res.status(201).json(await prisma.programa.create({ data: { nombre, facultad, tipo }, select: programas }));
  });

  router.get("/estudiantes", async (req, res) => {
    const pagina = Math.max(1, Math.min(10000, Number.parseInt(req.query.pagina, 10) || 1));
    const filas = await prisma.estudiante.findMany({
      orderBy: { id: "desc" }, take: 26, skip: (pagina - 1) * 25,
      select: { id: true, codigoUniv: true, estadoAcad: true, programa: { select: { nombre: true } }, usuario: { select: usuarios } },
    });
    res.json({ datos: filas.slice(0, 25), siguiente: filas.length > 25 });
  });
  router.get("/usuarios", soloAdmin, async (req, res) => {
    const pagina = Math.max(1, Math.min(10000, Number.parseInt(req.query.pagina, 10) || 1));
    const filas = await prisma.usuario.findMany({ orderBy: { id: "desc" }, take: 26, skip: (pagina - 1) * 25, select: usuarios });
    res.json({ datos: filas.slice(0, 25), siguiente: filas.length > 25 });
  });
  router.post("/usuarios", soloAdmin, async (req, res) => {
    const nombres = texto(req.body?.nombres, 100);
    const apellidos = texto(req.body?.apellidos, 100);
    const dni = texto(req.body?.dni, 8);
    const email = texto(req.body?.email, 254).toLowerCase();
    const { rol, password } = req.body ?? {};
    const codigoUniv = texto(req.body?.codigoUniv, 40);
    const programaId = Number(req.body?.programaId);
    if (!nombres || !apellidos || !/^\d{8}$/.test(dni) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !["estudiante", "operador", "administrador"].includes(rol) || typeof password !== "string" ||
        password.length < 10 || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ error: "Completa los datos y utiliza una contraseña de al menos 10 caracteres y hasta 72 bytes." });
    }
    if (rol === "estudiante" && (!codigoUniv || !Number.isSafeInteger(programaId) ||
        !await prisma.programa.findFirst({ where: { id: programaId, activo: true }, select: { id: true } }))) {
      return res.status(400).json({ error: "Selecciona un programa activo y registra el código universitario." });
    }
    try {
      const cuenta = await prisma.usuario.create({
        data: {
          nombres, apellidos, dni, email, rol, password: await bcrypt.hash(password, 12),
          ...(rol === "estudiante" && { estudiante: { create: { codigoUniv, programaId } } }),
        },
        select: usuarios,
      });
      return res.status(201).json(cuenta);
    } catch (error) {
      if (error.code === "P2002") return res.status(409).json({ error: "El DNI, correo o código universitario ya está registrado." });
      throw error;
    }
  });

  router.get("/requisitos", async (_req, res) => res.json(await prisma.plantillaRequisito.findMany({
    orderBy: [{ programaId: "asc" }, { orden: "asc" }, { id: "asc" }],
    select: { id: true, codigo: true, nombre: true, tipo: true, obligatorio: true, versionNorm: true, programa: { select: { nombre: true } } },
  })));
  router.post("/requisitos", soloAdmin, async (req, res) => {
    const programaId = Number(req.body?.programaId);
    const codigo = texto(req.body?.codigo, 50);
    const nombre = texto(req.body?.nombre, 160);
    const descripcion = texto(req.body?.descripcion, 2000);
    const tipo = req.body?.tipo;
    const versionNorm = texto(req.body?.versionNorm, 100);
    if (!Number.isSafeInteger(programaId) || !codigo || !nombre || !descripcion || !versionNorm ||
        !["academico", "documental", "pago", "idioma", "otro"].includes(tipo)) {
      return res.status(400).json({ error: "Completa los datos del requisito y su referencia normativa." });
    }
    const programa = await prisma.programa.findFirst({ where: { id: programaId, activo: true }, select: { tipo: true } });
    if (!programa) return res.status(400).json({ error: "Selecciona un programa activo." });
    try {
      const requisito = await prisma.plantillaRequisito.create({
        data: { programaId, codigo, nombre, descripcion, tipo, versionNorm, tipoTramite: tipoPorPrograma[programa.tipo] },
        select: { id: true },
      });
      return res.status(201).json(requisito);
    } catch (error) {
      if (error.code === "P2002") return res.status(409).json({ error: "El código del requisito ya existe." });
      throw error;
    }
  });

  router.get("/auditoria", soloAdmin, async (req, res) => {
    const pagina = Math.max(1, Math.min(10000, Number.parseInt(req.query.pagina, 10) || 1));
    const filas = await prisma.auditoria.findMany({
      orderBy: [{ creadoEn: "desc" }, { id: "desc" }], take: 26, skip: (pagina - 1) * 25,
      select: { id: true, accion: true, entidad: true, entidadId: true, creadoEn: true, usuario: { select: { nombres: true, apellidos: true } } },
    });
    res.json({ datos: filas.slice(0, 25), siguiente: filas.length > 25 });
  });
}

module.exports = { registrarAdministracion };
