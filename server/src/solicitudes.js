const { randomUUID } = require("node:crypto");
const { mkdir, unlink, writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const express = require("express");

const tipoPorPrograma = {
  maestria: "grado_maestro",
  doctorado: "grado_doctor",
  segunda_especialidad: "titulo_segunda_especialidad",
  diplomado: "certificado_diplomado",
  certificacion_modulos: "certificacion_modulos",
};
const tiposGrado = Object.values(tipoPorPrograma);

const detalle = {
  id: true, codigo: true, estado: true, tipoTramite: true, presentadoEn: true, observaciones: true,
  programa: { select: { id: true, nombre: true } },
  validaciones: {
    select: {
      id: true, estado: true, observacion: true,
      plantilla: { select: { id: true, nombre: true, descripcion: true, tipo: true, obligatorio: true } },
    },
    orderBy: { plantilla: { orden: "asc" } },
  },
  documentos: {
    where: { reemplazadoPor: null },
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
  router.use((req, res, next) => {
    if (req.usuario.rol !== "estudiante" || !req.usuario.estudiante) {
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
    const estudiante = req.usuario.estudiante;
    const tipoTramite = tipoPorPrograma[estudiante.programa.tipo];
    if (!tipoTramite || !estudiante.programa.activo || req.body?.tipoTramite !== tipoTramite) {
      return res.status(422).json({ error: "El trámite no corresponde al programa registrado en tu cuenta" });
    }
    const resultado = await prisma.$transaction(async (db) => {
      const datos = { usuarioId: req.usuario.id, estudianteId: estudiante.id, programaId: estudiante.programa.id, tipoTramite };
      const existente = await db.solicitud.findFirst({ where: { ...datos, estado: "borrador" }, select: detalle });
      if (existente) return existente;
      const plantillas = await db.plantillaRequisito.findMany({
        where: { programaId: datos.programaId, tipoTramite, activo: true }, select: { id: true },
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
    if (!Buffer.isBuffer(pdf) ||
        !/^%PDF-\d\.\d(?:\r|\n)/.test(pdf.subarray(0, 12).toString("ascii")) ||
        !/%%EOF\s*$/.test(pdf.subarray(-1024).toString("ascii"))) {
      return res.status(415).json({ error: "Adjunta un archivo PDF válido de hasta 10 MB" });
    }
    const solicitud = await encontrar(prisma, req);
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
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
          where: { solicitudId: solicitud.id, tipoDoc: req.params.plantilla, reemplazadoPor: null }, select: { id: true },
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

  router.get("/:id/documentos/:documento", async (req, res) => {
    if (!/^[1-9]\d{0,8}$/.test(req.params.documento)) return res.status(404).json({ error: "Documento no encontrado" });
    const documento = await prisma.documentoSolicitud.findFirst({
      where: { id: Number(req.params.documento), solicitud: propiedad(req) },
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

module.exports = { detalle, registrarSolicitudes, tiposGrado, tipoPorPrograma };
