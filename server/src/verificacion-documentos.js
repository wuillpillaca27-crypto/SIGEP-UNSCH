const { tiposGrado } = require("./solicitudes");

const formatoCodigo = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

function registrarVerificacion(app, prisma, { demostracion = false } = {}) {
  app.get("/api/documentos/verificar-qr/:codigo", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = req.params.codigo.trim().toUpperCase();
    const tipo = req.query.tipo;
    if (codigo.length < 6 || codigo.length > 80 || !formatoCodigo.test(codigo) ||
        (tipo !== undefined && !tiposGrado.includes(tipo))) {
      return res.status(400).json({ error: "Ingresa un código de verificación válido." });
    }
    const codigoExpediente = codigo.startsWith("SIGEP-") ? "SIGEP-" + codigo.slice(6).toLowerCase() : codigo;
    const coincidencias = await prisma.solicitud.findMany({
      where: {
        codigo: { in: [...new Set([req.params.codigo.trim(), codigo, codigoExpediente])] },
        estado: "emitido",
        tipoTramite: tipo ?? { in: tiposGrado },
      },
      take: 2,
      select: {
        codigo: true,
        tipoTramite: true,
        programa: { select: { nombre: true } },
        historial: { where: { estadoDespues: "emitido" }, orderBy: [{ creadoEn: "desc" }, { id: "desc" }], take: 1, select: { creadoEn: true } },
      },
    });
    if (coincidencias.length !== 1) {
      return res.status(404).json({ error: "No se encontró un documento emitido con ese código y tipo." });
    }
    const [documento] = coincidencias;
    return res.json({
      codigo: documento.codigo,
      tipoTramite: documento.tipoTramite,
      programa: documento.programa.nombre,
      emitidoEn: documento.historial[0]?.creadoEn ?? null,
      demostracion: demostracion || documento.codigo.startsWith("SIGEP-DEMO-"),
    });
  });
}

module.exports = { registrarVerificacion };
