const { randomUUID } = require("node:crypto");
const { mkdir, unlink, writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const express = require("express");
const { programasVisibles, requisitosVisibles } = require("./datos-demostracion");

const tipoPorPrograma = {
  maestria: "grado_maestro",
  doctorado: "grado_doctor",
  segunda_especialidad: "titulo_segunda_especialidad",
  diplomado: "certificado_diplomado",
  certificacion_modulos: "certificacion_modulos",
};
const tiposGrado = Object.values(tipoPorPrograma);
const certificacionesPorPrograma = {
  diplomado: { clave: "diplomados", nombre: "Diplomados de Posgrado" },
  certificacion_modulos: { clave: "modulos", nombre: "Certificaciones por Módulos" },
};
const tramitesPorPrograma = {
  maestria: { clave: "maestro", nombre: "Grado de Maestro" },
  doctorado: { clave: "doctor", nombre: "Grado de Doctor" },
  segunda_especialidad: { clave: "segunda-especialidad", nombre: "Título de Segunda Especialidad" },
  ...certificacionesPorPrograma,
};
const tiposCertificacion = ["certificado_diplomado", "certificacion_modulos"];
const pdfValido = (pdf) => Buffer.isBuffer(pdf) &&
  /^%PDF-\d\.\d(?:\r|\n)/.test(pdf.subarray(0, 12).toString("ascii")) &&
  /%%EOF\s*$/.test(pdf.subarray(-1024).toString("ascii"));
const configuracionHabilitada = (tipoTramite) => ({
  OR: [{ configuracionTramite: null }, { configuracionTramite: { habilitado: true, tipoTramite } }],
});
const filtroPlantillasActivas = (programaId, tipoTramite) => ({
  programaId, tipoTramite, activo: true, ...requisitosVisibles(),
  programa: { activo: true, ...programasVisibles(), ...configuracionHabilitada(tipoTramite) },
});

function matriculaHabilitada(matricula) {
  return matricula.habilitadoTramites && matricula.fechaInicio <= new Date() &&
    ["activo", "egresado", "graduado"].includes(matricula.estadoAcad);
}

async function puedeEditarBorrador(db, usuarioId, solicitud) {
  if (solicitud.estado !== "borrador") return true;
  const matricula = await db.estudiante.findUnique({
    where: { usuarioId_programaId: { usuarioId, programaId: solicitud.programa.id } },
    include: { programa: { select: { tipo: true, activo: true } } },
  });
  if (!matricula || !matriculaHabilitada(matricula) || !matricula.programa.activo ||
      tipoPorPrograma[matricula.programa.tipo] !== solicitud.tipoTramite) return false;
  return Boolean(await db.plantillaRequisito.findFirst({
    where: filtroPlantillasActivas(matricula.programaId, solicitud.tipoTramite), select: { id: true },
  }));
}

async function opcionesDeMatricula(prisma, usuarioId, soloCertificaciones) {
  const matriculas = await prisma.estudiante.findMany({
    where: { usuarioId, programa: programasVisibles() }, orderBy: { id: "asc" },
    select: { id: true, codigoUniv: true, estadoAcad: true, habilitadoTramites: true, fechaInicio: true, fechaFin: true,
      programa: { select: {
        id: true, nombre: true, tipo: true, activo: true,
        configuracionTramite: { select: { habilitado: true, tipoTramite: true } },
        plantillasRequisito: {
          where: requisitosVisibles(),
          select: { id: true, nombre: true, descripcion: true, tipo: true, obligatorio: true, versionNorm: true, activo: true, tipoTramite: true },
          orderBy: [{ orden: "asc" }, { id: "asc" }],
        },
      } },
    },
  });
  return matriculas.map(({ id, programa, ...registro }) => {
    const { configuracionTramite, plantillasRequisito, ...datosPrograma } = programa;
    const tipoTramite = tipoPorPrograma[programa.tipo];
    const plantillas = plantillasRequisito.filter((plantilla) => plantilla.tipoTramite === tipoTramite);
    const requisitos = plantillas.filter(({ activo }) => activo)
      .map(({ activo: _activo, tipoTramite: _tipo, ...requisito }) => requisito);
    let motivo = null;
    if (!programa.activo) motivo = "programa_inactivo";
    else if (!matriculaHabilitada(registro)) motivo = "matricula_no_habilitada";
    else if (soloCertificaciones && !tiposCertificacion.includes(tipoTramite)) motivo = "tipo_no_certificable";
    else if (configuracionTramite && (!configuracionTramite.habilitado || configuracionTramite.tipoTramite !== tipoTramite)) motivo = "tramite_deshabilitado";
    else if (!requisitos.length) motivo = plantillas.length && !soloCertificaciones ? "plantilla_no_publicada" : "sin_requisitos_activos";
    const tramites = motivo ? [] : [{ ...tramitesPorPrograma[programa.tipo], tipoTramite, requisitos }];
    return { ...datosPrograma, ...registro, matriculaId: id, claveTramite: tramitesPorPrograma[programa.tipo].clave, motivo, tramites };
  });
}

const detalle = {
  id: true, codigo: true, estado: true, tipoTramite: true, presentadoEn: true, observaciones: true,
  programa: { select: { id: true, nombre: true } },
  validaciones: {
    select: {
      id: true, estado: true, observacion: true,
      plantilla: { select: { id: true, nombre: true, descripcion: true, tipo: true, obligatorio: true } },
    },
    orderBy: [{ plantilla: { orden: "asc" } }, { id: "asc" }],
  },
  documentos: {
    where: { reemplazadoPor: null, retiradoEn: null },
    select: { id: true, nombre: true, tipoDoc: true, nombreArchivo: true, tamanoBytes: true },
    orderBy: { id: "asc" },
  },
  historial: {
    select: { id: true, estadoDespues: true, motivo: true, creadoEn: true },
    orderBy: [{ creadoEn: "asc" }, { id: "asc" }],
  },
};

function registrarSolicitudes(app, prisma, autenticar, directorio) {
  const router = express.Router();
  app.use("/api/solicitudes", autenticar, router);
  router.get(["/opciones", "/opciones-certificacion"], async (req, res) => {
    if (req.usuario.rol !== "estudiante") return res.status(403).json({ error: "El trámite requiere una cuenta de estudiante" });
    const soloCertificaciones = /^\/opciones-certificacion\/?$/i.test(req.path);
    const matriculas = await opcionesDeMatricula(prisma, req.usuario.id, soloCertificaciones);
    const programas = matriculas.filter((matricula) => !matricula.motivo)
      .map(({ tramites, ...matricula }) => ({ ...matricula, [soloCertificaciones ? "certificaciones" : "tramites"]: tramites }));
    const primera = matriculas[0];
    const programaRegistrado = primera ? { id: primera.id, nombre: primera.nombre, tipo: primera.tipo, activo: primera.activo } : null;
    return res.json({
      programas, matriculas, programaRegistrado,
      motivo: programas.length ? null : primera?.motivo ?? "sin_matricula",
    });
  });
  router.use((req, res, next) => {
    if (req.usuario.rol !== "estudiante" || !req.usuario.estudiantes.length) {
      return res.status(403).json({ error: "El trámite requiere una cuenta de estudiante" });
    }
    return next();
  });

  const propiedad = (req) => ({ id: Number(req.params.id), usuarioId: req.usuario.id, tipoTramite: { in: tiposGrado } });
  router.param("id", (req, res, next, texto) => {
    if (!/^[1-9]\d{0,8}$/.test(texto)) return res.status(404).json({ error: "Solicitud no encontrada" });
    return next();
  });
  const encontrar = (db, req) => db.solicitud.findFirst({ where: propiedad(req), select: detalle });

  router.get("/", async (req, res) => {
    const solicitudes = await prisma.solicitud.findMany({
      where: { usuarioId: req.usuario.id, tipoTramite: { in: tiposGrado } },
      select: detalle,
      orderBy: { actualizadoEn: "desc" },
    });
    return res.json(solicitudes);
  });

  router.post("/", async (req, res) => {
    const { tipoTramite, programaId } = req.body ?? {};
    if (!tiposGrado.includes(tipoTramite)) return res.status(422).json({ error: "El tipo de trámite no es válido" });
    const registradas = req.usuario.estudiantes;
    let candidatas = programaId === undefined
      ? registradas.filter(({ programa }) => tipoPorPrograma[programa.tipo] === tipoTramite)
      : registradas.filter(({ programa }) => programa.id === programaId);
    if (programaId === undefined && candidatas.length > 1) {
      const matriculas = await opcionesDeMatricula(prisma, req.usuario.id, false);
      const habilitadas = new Set(matriculas.filter(({ tramites }) =>
        tramites.some((tramite) => tramite.tipoTramite === tipoTramite)).map(({ id }) => id));
      candidatas = candidatas.filter(({ programa }) => habilitadas.has(programa.id));
      if (!candidatas.length) return res.status(409).json({ error: "No tienes una matrícula habilitada para este trámite" });
    }
    if (candidatas.length !== 1) {
      return res.status(422).json({ error: "El programa seleccionado no corresponde a tu matrícula" });
    }
    const [estudiante] = candidatas;
    if (!estudiante.programa.activo || tipoPorPrograma[estudiante.programa.tipo] !== tipoTramite) {
      return res.status(422).json({ error: "El trámite no corresponde al programa registrado en tu cuenta" });
    }
    const resultado = await prisma.$transaction(async (db) => {
      // Serializa la creación de borradores para el mismo estudiante en PostgreSQL.
      await db.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext('sigep.solicitudes'), ${estudiante.id}::integer)`;
      const matricula = await db.estudiante.findUnique({
        where: { usuarioId_programaId: { usuarioId: req.usuario.id, programaId: estudiante.programa.id } },
      });
      if (!matricula || !matriculaHabilitada(matricula)) return null;
      const datos = { usuarioId: req.usuario.id, estudianteId: matricula.id, programaId: matricula.programaId, tipoTramite };
      const existente = await db.solicitud.findFirst({
        where: { ...datos, estado: "borrador" }, orderBy: [{ actualizadoEn: "desc" }, { id: "desc" }], select: detalle,
      });
      if (existente) return await puedeEditarBorrador(db, req.usuario.id, existente) ? existente : null;
      const plantillas = await db.plantillaRequisito.findMany({
        where: filtroPlantillasActivas(datos.programaId, tipoTramite), select: { id: true },
      });
      if (!plantillas.length) return null;
      return db.solicitud.create({
        data: {
          ...datos, codigo: `SIGEP-${randomUUID()}`,
          validaciones: { create: plantillas.map(({ id }) => ({ plantillaId: id })) },
          historial: { create: { estadoDespues: "borrador" } },
        },
        select: detalle,
      });
    });
    if (!resultado) return res.status(409).json({ error: "Tu programa aún no tiene un catálogo de requisitos activo" });
    return res.json(resultado);
  });

  router.post("/:id/presentar", async (req, res) => {
    const resultado = await prisma.$transaction(async (db) => {
      const solicitud = await encontrar(db, req);
      if (!solicitud) return { status: 404, error: "Solicitud no encontrada" };
      if (solicitud.presentadoEn) return { solicitud };
      if (solicitud.estado !== "borrador" || !solicitud.validaciones.length) {
        return { status: 409, error: "La solicitud no está lista para presentar" };
      }
      if (!await puedeEditarBorrador(db, req.usuario.id, solicitud)) {
        return { status: 409, error: "El trámite ya no está habilitado para tu matrícula" };
      }
      const documentos = new Set(solicitud.documentos.map((item) => item.tipoDoc));
      const pendiente = solicitud.validaciones.some(({ estado, plantilla }) =>
        plantilla.obligatorio && estado !== "no_aplica" && (
          estado === "observado" || (plantilla.tipo === "documental" && !documentos.has(String(plantilla.id)))
        )
      );
      if (pendiente) return { status: 422, error: "Completa los documentos obligatorios y corrige las observaciones" };
      const cambio = await db.solicitud.updateMany({
        where: { ...propiedad(req), estado: "borrador" },
        data: { estado: "presentado", presentadoEn: new Date() },
      });
      if (cambio.count) {
        await db.historialEstado.create({ data: { solicitudId: solicitud.id, estadoAntes: "borrador", estadoDespues: "presentado" } });
        await db.auditoria.create({ data: { usuarioId: req.usuario.id, accion: "presentar", entidad: "solicitud", entidadId: solicitud.id } });
      }
      return { solicitud: await encontrar(db, req) };
    });
    return resultado.error ? res.status(resultado.status).json({ error: resultado.error }) : res.json(resultado.solicitud);
  });

  router.put("/:id/documentos/:plantilla", express.raw({ type: "application/pdf", limit: "10mb" }), async (req, res) => {
    const pdf = req.body;
    if (!pdfValido(pdf)) {
      return res.status(415).json({ error: "Adjunta un archivo PDF válido de hasta 10 MB" });
    }
    const solicitud = await encontrar(prisma, req);
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
    if (!await puedeEditarBorrador(prisma, req.usuario.id, solicitud)) {
      return res.status(409).json({ error: "El trámite ya no está habilitado para tu matrícula" });
    }
    const requisito = solicitud.validaciones.find(({ plantilla }) =>
      String(plantilla.id) === req.params.plantilla && plantilla.tipo === "documental"
    );
    if (!requisito) return res.status(422).json({ error: "El documento no corresponde a esta solicitud" });
    const subsanacion = solicitud.estado === "observado" && requisito.estado === "observado";
    if (solicitud.estado !== "borrador" && !subsanacion) {
      return res.status(409).json({ error: "La solicitud no admite cambios en este documento" });
    }

    const archivo = randomUUID() + ".pdf";
    const ruta = resolve(directorio, archivo);
    await mkdir(directorio, { recursive: true, mode: 0o700 });
    await writeFile(ruta, pdf, { flag: "wx", mode: 0o600 });
    let actualizado;
    try {
      actualizado = await prisma.$transaction(async (db) => {
        const bloqueo = await db.solicitud.updateMany({
          where: { ...propiedad(req), estado: solicitud.estado }, data: { actualizadoEn: new Date() },
        });
        if (!bloqueo.count) return null;
        if (subsanacion) {
          const correccion = await db.validacionRequisito.updateMany({
            where: { id: requisito.id, estado: "observado" }, data: { estado: "en_revision" },
          });
          if (!correccion.count) return null;
        }
        const anteriores = await db.documentoSolicitud.findMany({
          where: { solicitudId: solicitud.id, tipoDoc: req.params.plantilla, reemplazadoPor: null, retiradoEn: null }, select: { id: true },
        });
        const documento = await db.documentoSolicitud.create({ data: {
          solicitudId: solicitud.id, nombre: requisito.plantilla.nombre, tipoDoc: req.params.plantilla,
          nombreArchivo: archivo, rutaArchivo: archivo, mimeType: "application/pdf",
          tamanoBytes: pdf.length, subidoPor: req.usuario.id,
        } });
        await db.documentoSolicitud.updateMany({
          where: { id: { in: anteriores.map(({ id }) => id) } }, data: { reemplazadoPor: documento.id },
        });
        await db.validacionRequisito.update({ where: { id: requisito.id }, data: { estado: "en_revision" } });
        await db.auditoria.create({ data: { usuarioId: req.usuario.id, accion: "adjuntar_documento", entidad: "solicitud", entidadId: solicitud.id } });
        return encontrar(db, req);
      });
    } catch (error) {
      await unlink(ruta);
      throw error;
    }
    if (!actualizado) {
      await unlink(ruta);
      return res.status(409).json({ error: "La solicitud cambió de estado" });
    }
    return res.json(actualizado);
  });

  router.delete("/:id/documentos/:documento", async (req, res) => {
    if (!/^[1-9]\d{0,8}$/.test(req.params.documento)) return res.status(404).json({ error: "Documento no encontrado" });
    const resultado = await prisma.$transaction(async (db) => {
      const solicitud = await encontrar(db, req);
      if (!solicitud) return { status: 404, error: "Solicitud no encontrada" };
      const bloqueo = await db.solicitud.updateMany({
        where: { ...propiedad(req), estado: "borrador" }, data: { actualizadoEn: new Date() },
      });
      if (!bloqueo.count) return { status: 409, error: "Solo puedes retirar documentos de un borrador" };
      const documento = await db.documentoSolicitud.findFirst({
        where: { id: Number(req.params.documento), solicitudId: solicitud.id, reemplazadoPor: null, retiradoEn: null },
        select: { id: true, tipoDoc: true },
      });
      const requisito = solicitud.validaciones.find(({ plantilla }) => documento && String(plantilla.id) === documento.tipoDoc);
      if (!documento || !requisito) return { status: 404, error: "Documento no encontrado" };
      await db.documentoSolicitud.update({ where: { id: documento.id }, data: { retiradoEn: new Date() } });
      await db.validacionRequisito.update({ where: { id: requisito.id }, data: { estado: "pendiente" } });
      await db.auditoria.create({ data: { usuarioId: req.usuario.id, accion: "retirar_documento", entidad: "solicitud",
        entidadId: solicitud.id, detalles: JSON.stringify({ documentoId: documento.id }) } });
      return { solicitud: await encontrar(db, req) };
    });
    return resultado.error ? res.status(resultado.status).json({ error: resultado.error }) : res.json(resultado.solicitud);
  });

  router.get("/:id/constancia", async (req, res) => {
    const solicitud = await encontrar(prisma, req);
    if (!solicitud?.presentadoEn) return res.status(404).json({ error: "El acuse está disponible después de presentar la solicitud" });
    const tramite = Object.entries(tipoPorPrograma).find(([, tipo]) => tipo === solicitud.tipoTramite)?.[0];
    res.set("Cache-Control", "no-store");
    res.attachment("acuse-de-presentacion.txt");
    return res.send([
      "SIGEP-UNSCH | Acuse de presentación",
      `Expediente: ${solicitud.codigo}`,
      `Trámite: ${tramitesPorPrograma[tramite]?.nombre ?? solicitud.tipoTramite}`,
      `Programa: ${solicitud.programa.nombre}`,
      `Titular: ${req.usuario.nombres} ${req.usuario.apellidos}`,
      `Presentado: ${solicitud.presentadoEn.toISOString()}`,
      "Este acuse confirma la recepción en el portal. No sustituye un documento académico emitido.",
    ].join("\r\n"));
  });

  router.post("/:id/subsanar", async (req, res) => {
    const resultado = await prisma.$transaction(async (db) => {
      const solicitud = await encontrar(db, req);
      if (!solicitud) return { status: 404, error: "Solicitud no encontrada" };
      if (solicitud.estado !== "observado" || solicitud.validaciones.some(({ estado }) => estado === "observado")) {
        return { status: 409, error: "Corrige los requisitos observados antes de enviar la subsanación" };
      }
      const cambio = await db.solicitud.updateMany({ where: { ...propiedad(req), estado: "observado" }, data: { estado: "en_revision" } });
      if (!cambio.count) return { status: 409, error: "El expediente cambió de estado" };
      await db.historialEstado.create({ data: { solicitudId: solicitud.id, estadoAntes: "observado", estadoDespues: "en_revision", motivo: "Subsanación presentada" } });
      await db.auditoria.create({ data: { usuarioId: req.usuario.id, accion: "subsanar", entidad: "solicitud", entidadId: solicitud.id } });
      return { solicitud: await encontrar(db, req) };
    });
    return resultado.error ? res.status(resultado.status).json({ error: resultado.error }) : res.json(resultado.solicitud);
  });

  router.post("/:id/desistir", async (req, res) => {
    const motivo = typeof req.body?.motivo === "string" ? req.body.motivo.trim() : "";
    if (!motivo || motivo.length > 1500) return res.status(400).json({ error: "Registra el motivo del desistimiento." });
    const resultado = await prisma.$transaction(async (db) => {
      const solicitud = await encontrar(db, req);
      if (!solicitud) return { status: 404, error: "Solicitud no encontrada" };
      if (!["borrador", "presentado", "en_revision", "observado", "validado", "pendiente_aprobacion"].includes(solicitud.estado)) {
        return { status: 409, error: "El expediente no admite desistimiento en esta etapa." };
      }
      const cambio = await db.solicitud.updateMany({ where: { ...propiedad(req), estado: solicitud.estado }, data: { estado: "desistido" } });
      if (!cambio.count) return { status: 409, error: "El expediente cambió de estado." };
      await db.historialEstado.create({ data: { solicitudId: solicitud.id, estadoAntes: solicitud.estado, estadoDespues: "desistido", motivo } });
      await db.auditoria.create({ data: { usuarioId: req.usuario.id, accion: "desistir", entidad: "solicitud", entidadId: solicitud.id } });
      return { solicitud: await encontrar(db, req) };
    });
    return resultado.error ? res.status(resultado.status).json({ error: resultado.error }) : res.json(resultado.solicitud);
  });

  router.get("/:id/documentos/:documento", async (req, res) => {
    if (!/^[1-9]\d{0,8}$/.test(req.params.documento)) return res.status(404).json({ error: "Documento no encontrado" });
    const documento = await prisma.documentoSolicitud.findFirst({
      where: { id: Number(req.params.documento), retiradoEn: null, solicitud: propiedad(req) },
      select: { rutaArchivo: true, nombreArchivo: true },
    });
    if (!documento || !/^[0-9a-f-]{36}\.pdf$/i.test(documento.rutaArchivo)) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    return res.download(resolve(directorio, documento.rutaArchivo), documento.nombreArchivo);
  });
}

module.exports = { detalle, registrarSolicitudes, tiposGrado, tipoPorPrograma, configuracionHabilitada, pdfValido };
