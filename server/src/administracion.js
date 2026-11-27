const express = require("express");
const bcrypt = require("bcryptjs");
const { tipoPorPrograma } = require("./solicitudes");
const { facultadesDemostracion, requisitosVisibles } = require("./datos-demostracion");

const programas = { id: true, nombre: true, tipo: true, facultad: true, activo: true };
const usuarios = { id: true, nombres: true, apellidos: true, dni: true, email: true, rol: true, activo: true };
const texto = (valor, maximo) => typeof valor === "string" && valor.trim().length <= maximo ? valor.trim() : "";
const estadosAcademicos = ["activo", "egresado", "graduado", "suspendido", "retirado"];
function datosMatricula({ estadoAcad, fechaInicio, fechaFin, habilitadoTramites } = {}) {
  const fecha = (valor) => {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const dia = new Date(valor + "T00:00:00.000Z");
    return Number.isFinite(+dia) && dia.toISOString().slice(0, 10) === valor ? dia : null;
  };
  const inicio = fecha(fechaInicio);
  const fin = fecha(fechaFin);
  if (!estadosAcademicos.includes(estadoAcad) || typeof habilitadoTramites !== "boolean" ||
      !inicio || (fechaFin && !fin) || (fin && fin < inicio)) return null;
  return { estadoAcad, fechaInicio: inicio, fechaFin: fin, habilitadoTramites };
}

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

  router.get("/configuracion-academica/:id", soloAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.sendStatus(404);
    const programa = await prisma.programa.findUnique({ where: { id }, select: {
      ...programas, configuracionTramite: true,
      plantillasRequisito: { orderBy: [{ orden: "asc" }, { id: "asc" }],
        select: { id: true, nombre: true, codigo: true, activo: true, obligatorio: true, versionNorm: true, tipoTramite: true } },
      cambiosAcademicos: { orderBy: { id: "desc" }, take: 25,
        select: { id: true, accion: true, creadoEn: true, detalles: true, usuario: { select: { nombres: true, apellidos: true } } } },
    } });
    if (!programa) return res.status(404).json({ error: "Programa no encontrado." });
    return res.json({ ...programa, tipoTramite: tipoPorPrograma[programa.tipo] });
  });

  router.patch("/configuracion-academica/:id", soloAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, facultad, activo, habilitado, tipoTramite } = req.body ?? {};
    const campos = ["fuente", "costos", "plazos", "procedimiento"];
    if (!Number.isSafeInteger(id) || id < 1 || !texto(nombre, 160) || !texto(facultad, 160) ||
        typeof activo !== "boolean" || typeof habilitado !== "boolean" ||
        campos.some((campo) => typeof req.body[campo] !== "string" || req.body[campo].length > 2000)) {
      return res.status(400).json({ error: "Revisa los campos de configuración." });
    }
    const normativa = Object.fromEntries(campos.map((campo) => [campo, texto(req.body[campo], 2000) || null]));
    if (["costos", "plazos", "procedimiento"].some((campo) => normativa[campo]) && !normativa.fuente) {
      return res.status(422).json({ error: "Registra la fuente institucional para publicar costos, plazos o procedimiento." });
    }
    const resultado = await prisma.$transaction(async (db) => {
      const programa = await db.programa.findUnique({ where: { id }, select: { tipo: true, facultad: true } });
      if (!programa) return 404;
      if (tipoPorPrograma[programa.tipo] !== tipoTramite) return 422;
      if (facultadesDemostracion.includes(programa.facultad) !== facultadesDemostracion.includes(facultad.trim())) return 403;
      if (habilitado && activo && !await db.plantillaRequisito.findFirst({
        where: { programaId: id, tipoTramite, activo: true, ...requisitosVisibles() }, select: { id: true },
      })) return 409;
      const datos = { nombre: nombre.trim(), facultad: facultad.trim(), activo };
      const configuracion = { tipoTramite, habilitado, ...normativa };
      await db.programa.update({ where: { id }, data: { ...datos, configuracionTramite: {
        upsert: { create: configuracion, update: configuracion },
      } } });
      await db.cambioAcademico.create({ data: { programaId: id, usuarioId: req.usuario.id,
        accion: "configurar_tramite", detalles: { ...datos, ...configuracion } } });
      return 200;
    });
    if (resultado === 404) return res.status(404).json({ error: "Programa no encontrado." });
    if (resultado === 403) return res.status(403).json({ error: "La clasificación de demostración del programa es permanente." });
    if (resultado === 422) return res.status(422).json({ error: "El tipo de trámite no corresponde al programa." });
    if (resultado === 409) return res.status(409).json({ error: "Publica al menos un requisito compatible antes de habilitar el trámite." });
    return res.json({ ok: true });
  });

  router.patch("/requisitos/:id/publicacion", soloAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { activo } = req.body ?? {};
    if (!Number.isSafeInteger(id) || id < 1 || typeof activo !== "boolean") return res.status(400).json({ error: "Publicación inválida." });
    const requisito = await prisma.$transaction(async (db) => {
      const previo = await db.plantillaRequisito.findUnique({ where: { id }, select: { programaId: true, activo: true } });
      if (!previo) return null;
      if (previo.activo === activo) return previo;
      const registro = await db.plantillaRequisito.update({ where: { id }, data: { activo } });
      await db.cambioAcademico.create({ data: { programaId: registro.programaId, usuarioId: req.usuario.id,
        accion: activo ? "publicar_requisito" : "retirar_requisito", detalles: { id, codigo: registro.codigo, versionNorm: registro.versionNorm } } });
      return registro;
    });
    return requisito ? res.json({ id, activo }) : res.status(404).json({ error: "Requisito no encontrado." });
  });

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
    const registro = await prisma.$transaction(async (db) => {
      const programa = await db.programa.create({ data: { nombre, facultad, tipo }, select: programas });
      await db.cambioAcademico.create({ data: { programaId: programa.id, usuarioId: req.usuario.id,
        accion: "registrar_programa", detalles: { nombre, facultad, tipo } } });
      return programa;
    });
    return res.status(201).json(registro);
  });

  router.get("/estudiantes", async (req, res) => {
    const pagina = Math.max(1, Math.min(10000, Number.parseInt(req.query.pagina, 10) || 1));
    const filas = await prisma.estudiante.findMany({
      orderBy: { id: "desc" }, take: 26, skip: (pagina - 1) * 25,
      select: { id: true, codigoUniv: true, estadoAcad: true, fechaInicio: true, fechaFin: true, habilitadoTramites: true,
        programa: { select: { nombre: true } }, usuario: { select: usuarios } },
    });
    res.json({ datos: filas.slice(0, 25), siguiente: filas.length > 25 });
  });
  router.post("/matriculas", soloAdmin, async (req, res) => {
    const datos = datosMatricula(req.body);
    const codigoUniv = texto(req.body?.codigoUniv, 40);
    const dni = texto(req.body?.dni, 8);
    const programaId = Number(req.body?.programaId);
    if (!datos || !codigoUniv || !/^\d{8}$/.test(dni) || !Number.isSafeInteger(programaId) || programaId < 1) {
      return res.status(400).json({ error: "Revisa la cuenta, el programa y los datos de matrícula." });
    }
    try {
      const matricula = await prisma.$transaction(async (db) => {
        const usuario = await db.usuario.findFirst({ where: { dni, rol: "estudiante", activo: true }, select: { id: true } });
        const programa = await db.programa.findFirst({ where: { id: programaId, activo: true }, select: { id: true } });
        if (!usuario || !programa) return null;
        const registro = await db.estudiante.create({ data: { ...datos, codigoUniv, programaId, usuarioId: usuario.id } });
        await db.cambioAcademico.create({ data: { programaId, usuarioId: req.usuario.id,
          accion: "asignar_matricula", detalles: { matriculaId: registro.id, estadoAcad: registro.estadoAcad } } });
        return registro;
      });
      return matricula ? res.status(201).json(matricula) : res.status(422).json({ error: "La cuenta estudiante y el programa deben estar activos." });
    } catch (error) {
      if (error.code === "P2002") return res.status(409).json({ error: "La matrícula de ese programa o el código universitario ya están registrados." });
      throw error;
    }
  });
  router.patch("/matriculas/:id", soloAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const datos = datosMatricula(req.body);
    if (!datos || !Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Revisa las fechas y el estado de matrícula." });
    const matricula = await prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext('sigep.solicitudes'), ${id}::integer)`;
      const previa = await db.estudiante.findUnique({ where: { id }, select: { programaId: true } });
      if (!previa) return null;
      const registro = await db.estudiante.update({ where: { id }, data: datos });
      await db.cambioAcademico.create({ data: { programaId: previa.programaId, usuarioId: req.usuario.id,
        accion: "actualizar_matricula", detalles: { matriculaId: id, estadoAcad: registro.estadoAcad, habilitadoTramites: registro.habilitadoTramites } } });
      return registro;
    });
    return matricula ? res.json(matricula) : res.status(404).json({ error: "Matrícula no encontrada." });
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
          ...(rol === "estudiante" && { estudiantes: { create: { codigoUniv, programaId } } }),
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
      const requisito = await prisma.$transaction(async (db) => {
        const registro = await db.plantillaRequisito.create({
          data: { programaId, codigo, nombre, descripcion, tipo, versionNorm, tipoTramite: tipoPorPrograma[programa.tipo],
            obligatorio: ![false, "false"].includes(req.body?.obligatorio), activo: ![false, "false"].includes(req.body?.activo) },
          select: { id: true },
        });
        await db.cambioAcademico.create({ data: { programaId, usuarioId: req.usuario.id, accion: "crear_requisito",
          detalles: { id: registro.id, codigo, versionNorm } } });
        return registro;
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
