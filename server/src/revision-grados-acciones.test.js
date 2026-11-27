const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
const express = require("express");
const { registrarRevision } = require("./revision-grados");

jest.setTimeout(30000);

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-revision-acciones-"));
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
  const roles = new Map([["operador=operador", 3], ["administrador=administrador", 4], ["estudiante=estudiante", 1]]);
  const autenticar = async (req, res, next) => {
    const id = roles.get(req.headers.cookie);
    if (!id) return res.status(401).json({ error: "No autorizado" });
    req.usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true, rol: true, puedeAprobar: true } });
    return next();
  };
  const app = express();
  app.use(express.json());
  registrarRevision(app, prisma, autenticar, join(directorio, "archivos"));
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;

  async function restablecer() {
    await prisma.$transaction(async (tx) => {
      await tx.revision.deleteMany();
      await tx.auditoria.deleteMany();
      await tx.documentoSolicitud.deleteMany();
      await tx.historialEstado.deleteMany();
      await tx.validacionRequisito.deleteMany();
      await tx.solicitud.deleteMany();
      await tx.plantillaRequisito.deleteMany();
      await tx.estudiante.deleteMany();
      await tx.programa.deleteMany();
      await tx.usuario.deleteMany();
      await tx.programa.create({ data: { id: 1, nombre: "Doctorado de prueba", tipo: "doctorado", facultad: "Ciencias" } });
      await tx.usuario.createMany({ data: [
        { id: 1, nombres: "Estudiante", apellidos: "Prueba", dni: "00000001", email: "cuenta1@test.invalid", password: "hash-sint?tico", rol: "estudiante" },
        { id: 3, nombres: "Operador", apellidos: "Prueba", dni: "00000003", email: "cuenta3@test.invalid", password: "hash-sint?tico", rol: "operador" },
        { id: 4, nombres: "Administrador", apellidos: "Prueba", dni: "00000004", email: "cuenta4@test.invalid", password: "hash-sint?tico", rol: "administrador" },
      ] });
      await tx.estudiante.create({ data: { id: 1, usuarioId: 1, codigoUniv: "TEST1", programaId: 1 } });
      await tx.plantillaRequisito.create({ data: { id: 1, programaId: 1, tipoTramite: "grado_doctor", codigo: "REQ-ACCIONES", nombre: "Requisito documental", descripcion: "Descripci?n", tipo: "documental" } });
      const estados = ["presentado", "en_revision", "en_revision", "aprobado", "presentado", "en_revision"];
      await tx.solicitud.createMany({ data: estados.map((estado, index) => ({ id: index + 1, codigo: "SIGEP-P3-" + (index + 1), estudianteId: 1, usuarioId: 1, programaId: 1, tipoTramite: "grado_doctor", estado, presentadoEn: new Date("2026-01-01T00:00:00.000Z") })) });
      await tx.validacionRequisito.createMany({ data: estados.map((_, index) => ({ id: index + 1, solicitudId: index + 1, plantillaId: 1, estado: index === 2 || index === 3 ? "cumplido" : "pendiente" })) });
      await tx.documentoSolicitud.create({ data: { id: 1, solicitudId: 1, nombre: "Requisito", tipoDoc: "1", nombreArchivo: "documento.pdf", rutaArchivo: "ruta-invalida.txt", mimeType: "application/pdf", tamanoBytes: 20, subidoPor: 1 } });
    });
    await fixture.sincronizarSecuencias();
  }
  async function pedir(ruta, { rol, metodo = "GET", datos, sinJson, pdf } = {}) {
    const response = await fetch(api + ruta, {
      method: metodo,
      headers: { Connection: "close", ...(rol ? { Cookie: `${rol}=${rol}` } : {}), ...(datos !== undefined && { "Content-Type": "application/json" }),
        ...(pdf && { "Content-Type": "application/pdf", "X-Sigep-Referencia": encodeURIComponent("Resolución 123") }) },
      body: pdf ?? (datos !== undefined ? JSON.stringify(datos) : undefined),
    });
    const texto = await response.text();
    let body = texto;
    if (!sinJson) {
      try { body = JSON.parse(texto); } catch {}
    }
    return { status: response.status, body };
  }

  async function cerrar() {
    servidor.closeAllConnections();
    if (servidor.listening) await new Promise((resolve) => servidor.close(resolve));
    await fixture.cerrar();
    await rm(directorio, { recursive: true, maxRetries: 24, retryDelay: 250 });
  }
  return { prisma, pedir, restablecer, cerrar };
}

describe("Acciones de revisión", () => {
  let ctx;
  beforeAll(async () => { ctx = await crearContexto(); });
  beforeEach(async () => { await ctx.restablecer(); });
  afterAll(async () => { if (ctx) await ctx.cerrar(); });

  test("registra revisar, observar y validar junto con estado, historial y auditoría", async () => {
    const revisar = await ctx.pedir("/revision-grados/1/acciones", { rol: "operador", metodo: "POST", datos: { accion: "revisar" } });
    expect(revisar.status).toBe(200);
    expect(revisar.body.estado).toBe("en_revision");
    const observar = await ctx.pedir("/revision-grados/1/acciones", { rol: "operador", metodo: "POST", datos: { accion: "observar", requisitoId: 1, comentario: "  Adjuntar archivo legible  " } });
    expect(observar.status).toBe(200);
    expect(observar.body.estado).toBe("observado");
    expect(observar.body.observaciones).toBe("Adjuntar archivo legible");
    const validar = await ctx.pedir("/revision-grados/1/acciones", { rol: "operador", metodo: "POST", datos: { accion: "validar", requisitoId: 1, comentario: "Documento verificado" } });
    expect(validar.status).toBe(200);

    const estado = await ctx.prisma.solicitud.findUnique({ where: { id: 1 } });
    const validacion = await ctx.prisma.validacionRequisito.findUnique({ where: { id: 1 } });
    expect(estado.estado).toBe("observado");
    expect(validacion).toMatchObject({ estado: "cumplido", evidencia: "Documento verificado", validadoPor: 3 });
    expect(await ctx.prisma.historialEstado.findMany({ where: { solicitudId: 1 }, select: { estadoAntes: true, estadoDespues: true, motivo: true } })).toEqual([
      { estadoAntes: "presentado", estadoDespues: "en_revision", motivo: "revisar" },
      { estadoAntes: "en_revision", estadoDespues: "observado", motivo: "Adjuntar archivo legible" },
    ]);
    expect(await ctx.prisma.revision.count({ where: { solicitudId: 1 } })).toBe(3);
    expect(await ctx.prisma.auditoria.count({ where: { entidadId: 1 } })).toBe(3);
  });

  test("aprueba y emite con autorización explícita y conserva cada transición", async () => {
    await ctx.prisma.usuario.updateMany({ where: { rol: "administrador" }, data: { puedeAprobar: true } });
    const ejecutar = (accion, comentario) => ctx.pedir("/revision-grados/3/acciones", { rol: "administrador", metodo: "POST", datos: { accion, comentario } });
    expect((await ejecutar("finalizar_validacion")).body.estado).toBe("validado");
    expect((await ejecutar("remitir")).body.estado).toBe("pendiente_aprobacion");
    const aprobar = await ejecutar("aprobar", "Resolución de prueba");
    expect(aprobar.status).toBe(200);
    expect(aprobar.body.estado).toBe("aprobado");
    expect((await ejecutar("preparar_emision", "Preparación")).body.estado).toBe("en_emision");
    const emitir = await ctx.pedir("/revision-grados/3/acciones", {
      rol: "administrador", metodo: "POST", pdf: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    expect(emitir.status).toBe(200);
    expect(emitir.body.estado).toBe("emitido");
    expect(emitir.body.documentos).toEqual(expect.arrayContaining([expect.objectContaining({ tipoDoc: "documento_emitido" })]));
    expect(await ctx.prisma.historialEstado.findMany({ where: { solicitudId: 3 }, select: { estadoAntes: true, estadoDespues: true, motivo: true } })).toEqual([
      { estadoAntes: "en_revision", estadoDespues: "validado", motivo: "finalizar_validacion" },
      { estadoAntes: "validado", estadoDespues: "pendiente_aprobacion", motivo: "remitir" },
      { estadoAntes: "pendiente_aprobacion", estadoDespues: "aprobado", motivo: "Resolución de prueba" },
      { estadoAntes: "aprobado", estadoDespues: "en_emision", motivo: "Preparación" },
      { estadoAntes: "en_emision", estadoDespues: "emitido", motivo: "Resolución 123" },
    ]);
    expect(await ctx.prisma.revision.count({ where: { solicitudId: 3 } })).toBe(5);
    expect(await ctx.prisma.auditoria.count({ where: { entidadId: 3 } })).toBe(5);
  });

  test("rechaza ID y entradas inválidas con el error de validación vigente", async () => {
    const ruta = (id) => `/revision-grados/${id}/acciones`;
    for (const [id, datos] of [
      ["no-entero", { accion: "revisar" }],
      ["1", { accion: "desconocida" }],
      ["1", { accion: "revisar", comentario: "x".repeat(1501) }],
      ["1", {}],
    ]) {
      const respuesta = await ctx.pedir(ruta(id), { rol: "operador", metodo: "POST", datos });
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toMatch(/inválidos/);
    }
  });

  test("bloquea cerrar validación sin requisitos y reserva aprobación y emisión a personal habilitado", async () => {
    const bloqueada = await ctx.pedir("/revision-grados/2/acciones", { rol: "operador", metodo: "POST", datos: { accion: "finalizar_validacion" } });
    expect(bloqueada.status).toBe(409);
    const operadorAprueba = await ctx.pedir("/revision-grados/3/acciones", { rol: "operador", metodo: "POST", datos: { accion: "aprobar" } });
    expect(operadorAprueba.status).toBe(403);
    const operadorEmite = await ctx.pedir("/revision-grados/4/acciones", { rol: "operador", metodo: "POST", datos: { accion: "emitir", comentario: "Resolución" } });
    expect(operadorEmite.status).toBe(403);
    expect((await ctx.pedir("/revision-grados/1/acciones", { rol: "estudiante", metodo: "POST", datos: { accion: "revisar" } })).status).toBe(403);
  });

  test("rechaza la descarga cuando la ruta almacenada no es un UUID PDF permitido", async () => {
    const respuesta = await ctx.pedir("/revision-grados/1/documentos/1", { rol: "operador", sinJson: true });
    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toMatch(/Documento no encontrado/);
  });

  test("devuelve conflicto para una acción repetida concurrentemente y evita registros duplicados", async () => {
    const acciones = () => ctx.pedir("/revision-grados/5/acciones", { rol: "operador", metodo: "POST", datos: { accion: "revisar" } });
    const respuestas = await Promise.all([acciones(), acciones()]);
    expect(respuestas.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(await ctx.prisma.historialEstado.count({ where: { solicitudId: 5 } })).toBe(1);
    expect(await ctx.prisma.revision.count({ where: { solicitudId: 5 } })).toBe(1);
    expect(await ctx.prisma.auditoria.count({ where: { entidadId: 5 } })).toBe(1);
  });

  test("responde conflicto ante una transición incompatible con el estado actual", async () => {
    const respuesta = await ctx.pedir("/revision-grados/4/acciones", { rol: "administrador", metodo: "POST", datos: { accion: "revisar" } });
    expect(respuesta.status).toBe(409);
  });
});
