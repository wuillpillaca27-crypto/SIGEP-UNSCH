const { tipoPorPrograma } = require("./solicitudes");
const { facultadDemostracion, programasVisibles, requisitosVisibles } = require("./datos-demostracion");

const tipos = new Map(Object.entries(tipoPorPrograma).map(([programa, tramite]) => [tramite, programa]));

function leerNormativa(texto) {
  const registros = JSON.parse(texto.replace(/^\uFEFF/, ""));
  if (!Array.isArray(registros)) throw new Error("Se esperaba una lista de registros normativos.");
  const resultado = new Map();
  for (const entrada of registros) {
    const { tramite, programaId, fuente, costos, plazos, procedimiento, observaciones } = entrada ?? {};
    const datos = { fuente, costos, plazos, procedimiento, observaciones };
    const clave = `${tramite}/${programaId}`;
    if (!tipos.has(tramite) || !Number.isSafeInteger(programaId) || programaId < 1 ||
        typeof fuente !== "string" || !fuente.trim() || resultado.has(clave) ||
        Object.values(datos).some((valor) => valor !== undefined && (typeof valor !== "string" || !valor.trim() || valor.length > 2000))) {
      throw new Error("Hay un registro normativo inválido o duplicado.");
    }
    resultado.set(clave, datos);
  }
  return resultado;
}

function registrarCatalogo(app, prisma, normativa = new Map()) {
  app.get("/api/catalogo-grados/:tramite", async (req, res) => {
    const tipo = tipos.get(req.params.tramite);
    if (!tipo) return res.status(404).json({ error: "Trámite desconocido" });

    const datos = await prisma.programa.findMany({
      where: { activo: true, tipo, ...programasVisibles() },
      select: { id: true, nombre: true },
      orderBy: [{ nombre: "asc" }, { id: "asc" }],
    });
    return res.json({ datos });
  });

  app.get("/api/catalogo-grados/:tramite/:programaId", async (req, res) => {
    const tipoTramite = req.params.tramite;
    const tipo = tipos.get(tipoTramite);
    const id = Number(req.params.programaId);
    if (!tipo || !/^[1-9]\d*$/.test(req.params.programaId) || !Number.isSafeInteger(id)) {
      return res.status(404).json({ error: "Programa desconocido" });
    }

    const programa = await prisma.programa.findFirst({
      where: { id, tipo, activo: true, ...programasVisibles() },
      select: {
        facultad: true,
        plantillasRequisito: {
          where: { activo: true, tipoTramite, ...requisitosVisibles() },
          select: { id: true, nombre: true, descripcion: true, tipo: true, obligatorio: true, versionNorm: true },
          orderBy: [{ orden: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!programa) return res.status(404).json({ error: "Programa desconocido" });
    if (programa.facultad === facultadDemostracion) {
      return res.json({ requisitos: programa.plantillasRequisito, demostracion: true });
    }
    return res.json({ requisitos: programa.plantillasRequisito, ...normativa.get(`${tipoTramite}/${id}`) });
  });
}

module.exports = { leerNormativa, registrarCatalogo };
