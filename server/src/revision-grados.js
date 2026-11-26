const express = require("express");
const { resolve } = require("node:path");
const { randomUUID } = require("node:crypto");
const { mkdir, writeFile, unlink } = require("node:fs/promises");
const { detalle, tiposGrado, pdfValido } = require("./solicitudes");

const alcance = { presentadoEn: { not: null }, tipoTramite: { in: tiposGrado } };
const seleccion = { ...detalle, usuario: { select: { nombres: true, apellidos: true } } };
const accionesAutoridad = ["aprobar", "rechazar", "preparar_emision", "emitir", "anular"];
const etapas = {
  revisar: { desde: ["presentado"], hacia: "en_revision", registro: "iniciar_revision" },
  finalizar_validacion: { desde: ["en_revision"], hacia: "validado", registro: "validar" },
  remitir: { desde: ["validado"], hacia: "pendiente_aprobacion", registro: "validar" },
  aprobar: { desde: ["pendiente_aprobacion"], hacia: "aprobado", registro: "aprobar" },
  rechazar: { desde: ["pendiente_aprobacion"], hacia: "rechazado", registro: "rechazar" },
  preparar_emision: { desde: ["aprobado"], hacia: "en_emision", registro: "emitir" },
  emitir: { desde: ["en_emision"], hacia: "emitido", registro: "emitir" },
  anular: { desde: ["aprobado", "en_emision", "emitido"], hacia: "anulado", registro: "anular" },
};

function registrarRevision(app, prisma, autenticar, directorio) {
  const router = express.Router();
  app.use("/api/revision-grados", autenticar, router);
  router.use((req, res, next) => {
    if (!["administrador", "operador"].includes(req.usuario.rol)) return res.status(403).json({ error: "Acceso restringido al personal autorizado" });
    return next();
  });

  router.get("/", async (req, res) => {
    const pagina = Math.max(1, Math.min(10000, Number.parseInt(req.query.pagina, 10) || 1));
    const tipos = typeof req.query.tipos === "string" ? req.query.tipos.split(",").filter((tipo) => tiposGrado.includes(tipo)) : tiposGrado;
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim().slice(0, 100) : "";
    const estado = ["en_revision", "observado", "aprobado", "emitido"].includes(req.query.estado) ? req.query.estado : undefined;
    const datos = await prisma.solicitud.findMany({
      where: {
        ...alcance, tipoTramite: { in: tipos }, estado,
        ...(buscar && { OR: [
          { codigo: { contains: buscar } }, { usuario: { dni: { contains: buscar } } },
          { usuario: { nombres: { contains: buscar } } }, { usuario: { apellidos: { contains: buscar } } },
        ] }),
      },
      select: seleccion, skip: (pagina - 1) * 20, take: 21,
      orderBy: [{ presentadoEn: "desc" }, { id: "desc" }],
    });
    return res.json({ datos: datos.slice(0, 20), siguiente: datos.length > 20, puedeAprobar: req.usuario.puedeAprobar });
  });

  router.get("/reporte", async (_req, res) => {
    const filas = await prisma.solicitud.groupBy({ by: ["tipoTramite", "estado"], where: alcance, _count: { _all: true } });
    return res.json(filas.map((fila) => ({ tipoTramite: fila.tipoTramite, estado: fila.estado, total: fila._count._all })));
  });

  router.get("/:id/documentos/:documento", async (req, res) => {
    const id = Number(req.params.id);
    const archivoId = Number(req.params.documento);
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(archivoId)) return res.status(404).json({ error: "Documento no encontrado" });
    const documento = await prisma.documentoSolicitud.findFirst({
      where: { id: archivoId, solicitud: { ...alcance, id } }, select: { rutaArchivo: true, nombreArchivo: true },
    });
    if (!documento || !/^[0-9a-f-]{36}\.pdf$/i.test(documento.rutaArchivo)) return res.status(404).json({ error: "Documento no encontrado" });
    res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    return res.download(resolve(directorio, documento.rutaArchivo), documento.nombreArchivo);
  });

  router.post("/:id/acciones", express.raw({ type: "application/pdf", limit: "10mb" }), async (req, res) => {
    const id = Number(req.params.id);
    const pdf = req.is("application/pdf") ? req.body : null;
    if (pdf !== null && !pdfValido(pdf)) return res.status(415).json({ error: "Adjunta un PDF válido de hasta 10 MB." });
    let referencia;
    if (pdf) {
      try { referencia = decodeURIComponent(req.get("x-sigep-referencia") ?? ""); }
      catch { return res.status(400).json({ error: "La referencia de emisión no es válida." }); }
    }
    const { accion, requisitoId, comentario } = pdf ? { accion: "emitir", comentario: referencia } : req.body ?? {};
    const nota = typeof comentario === "string" ? comentario.trim() : "";
    if (!Number.isSafeInteger(id) || nota.length > 1500 || (!Object.hasOwn(etapas, accion) && !["observar", "validar"].includes(accion))) {
      return res.status(400).json({ error: "La acción o los datos de revisión son inválidos" });
    }
    if (accionesAutoridad.includes(accion) && !req.usuario.puedeAprobar) return res.status(403).json({ error: "La acción requiere autorización académica expresa" });
    let rutaPDF;
    const resultado = await prisma.$transaction(async (db) => {
      const caso = await db.solicitud.findFirst({ where: { ...alcance, id }, select: seleccion });
      if (!caso) return { status: 404, error: "Expediente no encontrado" };
      const requisito = caso.validaciones.find((item) => item.id === requisitoId);
      const editable = ["en_revision", "observado"].includes(caso.estado);
      let estado = caso.estado;
      let accionRevision;
      const etapa = Object.hasOwn(etapas, accion) ? etapas[accion] : null;
      const requisitosCumplidos = caso.validaciones.length > 0 && caso.validaciones.every(
        (item) => !item.plantilla.obligatorio || ["cumplido", "no_aplica"].includes(item.estado)
      );
      if (etapa?.desde.includes(estado) && (!accionesAutoridad.includes(accion) || nota) &&
          (!["finalizar_validacion", "remitir", "aprobar"].includes(accion) || requisitosCumplidos)) {
        estado = etapa.hacia;
        accionRevision = etapa.registro;
      } else if (accion === "observar" && editable && requisito?.plantilla.tipo === "documental" && nota) {
        estado = "observado";
        accionRevision = "solicitar_subsanacion";
      } else if (accion === "validar" && editable && requisito && nota && (
        requisito.plantilla.tipo !== "documental" || caso.documentos.some((doc) => doc.tipoDoc === String(requisito.plantilla.id))
      )) {
        accionRevision = "validar";
      } else {
        return { status: 409, error: "Revisa la etapa, la evidencia y los datos de la acción" };
      }
      const actualizado = await db.solicitud.updateMany({
        where: { id, estado: caso.estado },
        data: { estado, actualizadoEn: new Date(), ...(accion === "observar" && { observaciones: nota }), ...(accion === "aprobar" && { aprobadoEn: new Date() }) },
      });
      if (!actualizado.count) return { status: 409, error: "El expediente cambió durante la revisión" };
      if (pdf) {
        const archivo = randomUUID() + ".pdf";
        const ruta = resolve(directorio, archivo);
        await mkdir(directorio, { recursive: true, mode: 0o700 });
        await writeFile(ruta, pdf, { flag: "wx", mode: 0o600 });
        rutaPDF = ruta;
        await db.documentoSolicitud.create({ data: {
          solicitudId: id, tipoDoc: "documento_emitido", nombre: "Documento emitido",
          nombreArchivo: archivo, rutaArchivo: archivo, mimeType: "application/pdf", tamanoBytes: pdf.length, subidoPor: req.usuario.id,
        } });
      }
      if (accion === "observar" || accion === "validar") {
        await db.validacionRequisito.update({
          where: { id: requisito.id },
          data: accion === "observar"
            ? { estado: "observado", observacion: nota, evidencia: null, validadoPor: null, validadoEn: null }
            : { estado: "cumplido", observacion: null, evidencia: nota, validadoPor: req.usuario.id, validadoEn: new Date() },
        });
      }
      if (estado !== caso.estado) await db.historialEstado.create({ data: {
        solicitudId: id, estadoAntes: caso.estado, estadoDespues: estado, motivo: nota || accion,
      } });
      await db.revision.create({ data: {
        solicitudId: id, revisorId: req.usuario.id, accion: accionRevision, comentario: nota || null,
        estadoAntes: caso.estado, estadoDespues: estado,
      } });
      await db.auditoria.create({ data: {
        usuarioId: req.usuario.id, accion, entidad: "solicitud", entidadId: id,
        detalles: requisito ? JSON.stringify({ requisitoId: requisito.id }) : null,
      } });
      return { caso: await db.solicitud.findFirst({ where: { id }, select: seleccion }) };
    }).catch(async (error) => {
      if (rutaPDF) await unlink(rutaPDF).catch(() => {});
      throw error;
    });
    return resultado.error ? res.status(resultado.status).json({ error: resultado.error }) : res.json(resultado.caso);
  });
}

module.exports = { registrarRevision };
