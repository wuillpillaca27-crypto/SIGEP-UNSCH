const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { pathToFileURL } = require("node:url");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const express = require("express");
const { registrarRevision } = require("./revision-grados");

jest.setTimeout(30000);

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-revision-acciones-"));
  const archivo = join(directorio, "acciones.sqlite");
  const base = new DatabaseSync(archivo);
  base.exec(`
    CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombres TEXT, apellidos TEXT, dni TEXT, email TEXT,
      password TEXT, rol TEXT, activo INTEGER);
    CREATE TABLE estudiantes (id INTEGER PRIMARY KEY, usuarioId INTEGER, codigoUniv TEXT, programaId INTEGER);
    CREATE TABLE programas (id INTEGER PRIMARY KEY, nombre TEXT, tipo TEXT, activo INTEGER);
    CREATE TABLE plantillas_requisito (id INTEGER PRIMARY KEY, programaId INTEGER, tipoTramite TEXT,
      nombre TEXT, descripcion TEXT, tipo TEXT, obligatorio INTEGER, orden INTEGER, activo INTEGER);
    CREATE TABLE solicitudes (id INTEGER PRIMARY KEY, codigo TEXT UNIQUE, estudianteId INTEGER, usuarioId INTEGER,
      programaId INTEGER, tipoTramite TEXT, estado TEXT DEFAULT 'borrador', observaciones TEXT,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, actualizadoEn TEXT, presentadoEn TEXT, aprobadoEn TEXT);
    CREATE TABLE validaciones_requisito (id INTEGER PRIMARY KEY, solicitudId INTEGER, plantillaId INTEGER,
      estado TEXT DEFAULT 'pendiente', evidencia TEXT, observacion TEXT, validadoPor INTEGER, validadoEn TEXT,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, actualizadoEn TEXT);
    CREATE TABLE historial_estados (id INTEGER PRIMARY KEY, solicitudId INTEGER, estadoAntes TEXT,
      estadoDespues TEXT, motivo TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE documentos_solicitud (id INTEGER PRIMARY KEY, solicitudId INTEGER, nombre TEXT, tipoDoc TEXT,
      nombreArchivo TEXT, rutaArchivo TEXT, mimeType TEXT, tamanoBytes INTEGER, subidoPor INTEGER,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, reemplazadoPor INTEGER);
    CREATE TABLE auditoria (id INTEGER PRIMARY KEY, usuarioId INTEGER, accion TEXT, entidad TEXT, entidadId INTEGER,
      detalles TEXT, ip TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE revisiones (id INTEGER PRIMARY KEY, solicitudId INTEGER, revisorId INTEGER, accion TEXT,
      comentario TEXT, estadoAntes TEXT, estadoDespues TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const roles = new Map([["operador=operador", 3], ["administrador=administrador", 4], ["estudiante=estudiante", 1]]);
  const autenticar = (req, res, next) => {
    const id = roles.get(req.headers.cookie);
    if (!id) return res.status(401).json({ error: "No autorizado" });
    req.usuario = { id: Number(id), rol: req.headers.cookie.split("=")[0] };
    return next();
  };
  const app = express();
  app.use(express.json());
  registrarRevision(app, prisma, autenticar, join(directorio, "archivos"));
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;

  async function restablecer() {
    for (const tabla of ["revisiones", "auditoria", "documentos_solicitud", "historial_estados", "validaciones_requisito", "solicitudes", "plantillas_requisito", "estudiantes", "programas", "usuarios"]) {
      await prisma.$executeRawUnsafe(`DELETE FROM ${tabla}`);
    }
    await prisma.$executeRawUnsafe("INSERT INTO programas VALUES (1, 'Doctorado de prueba', 'doctorado', 1)");
    await prisma.$executeRawUnsafe("INSERT INTO estudiantes VALUES (1, 1, 'TEST1', 1)");
    await prisma.$executeRawUnsafe("INSERT INTO plantillas_requisito VALUES (1, 1, 'grado_doctor', 'Requisito documental', 'Descripción', 'documental', 1, 1, 1)");
    for (const [id, rol] of [[1, "estudiante"], [3, "operador"], [4, "administrador"]]) {
      await prisma.$executeRawUnsafe("INSERT INTO usuarios VALUES (?, ?, 'Prueba', ?, ?, ?, ?, 1)", id, rol, String(id).padStart(8, "0"), `cuenta${id}@test.invalid`, "hash-sintético", rol);
    }
    const estados = ["presentado", "en_revision", "en_revision", "aprobado", "presentado", "en_revision"];
    for (let i = 0; i < estados.length; i += 1) {
      const id = i + 1;
      await prisma.$executeRawUnsafe(
        "INSERT INTO solicitudes (id, codigo, estudianteId, usuarioId, programaId, tipoTramite, estado, presentadoEn) VALUES (?, ?, 1, 1, 1, 'grado_doctor', ?, '2026-01-01T00:00:00.000Z')",
        id, `SIGEP-P3-${id}`, estados[i],
      );
      await prisma.$executeRawUnsafe(
        "INSERT INTO validaciones_requisito (id, solicitudId, plantillaId, estado) VALUES (?, ?, 1, ?)",
        id, id, id === 3 || id === 4 ? "cumplido" : "pendiente",
      );
    }
    await prisma.$executeRawUnsafe("INSERT INTO documentos_solicitud VALUES (1, 1, 'Requisito', '1', 'documento.pdf', 'ruta-invalida.txt', 'application/pdf', 20, 1, CURRENT_TIMESTAMP, NULL)");
  }

  async function pedir(ruta, { rol, metodo = "GET", datos, sinJson } = {}) {
    const response = await fetch(api + ruta, {
      method: metodo,
      headers: { Connection: "close", ...(rol ? { Cookie: `${rol}=${rol}` } : {}), ...(datos !== undefined && { "Content-Type": "application/json" }) },
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
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
    servidor.close();
    await prisma.$disconnect();
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
      { estadoAntes: "presentado", estadoDespues: "en_revision", motivo: null },
      { estadoAntes: "en_revision", estadoDespues: "observado", motivo: "Adjuntar archivo legible" },
    ]);
    expect(await ctx.prisma.revision.count({ where: { solicitudId: 1 } })).toBe(3);
    expect(await ctx.prisma.auditoria.count({ where: { entidadId: 1 } })).toBe(3);
  });

  test("aprueba y emite con administrador y conserva los registros de cada transición", async () => {
    const aprobar = await ctx.pedir("/revision-grados/3/acciones", { rol: "administrador", metodo: "POST", datos: { accion: "aprobar" } });
    expect(aprobar.status).toBe(200);
    expect(aprobar.body.estado).toBe("aprobado");
    const emitir = await ctx.pedir("/revision-grados/3/acciones", { rol: "administrador", metodo: "POST", datos: { accion: "emitir", comentario: " Resolución 123 " } });
    expect(emitir.status).toBe(200);
    expect(emitir.body.estado).toBe("emitido");
    expect(await ctx.prisma.historialEstado.findMany({ where: { solicitudId: 3 }, select: { estadoAntes: true, estadoDespues: true, motivo: true } })).toEqual([
      { estadoAntes: "en_revision", estadoDespues: "aprobado", motivo: null },
      { estadoAntes: "aprobado", estadoDespues: "emitido", motivo: "Resolución 123" },
    ]);
    expect(await ctx.prisma.revision.count({ where: { solicitudId: 3 } })).toBe(2);
    expect(await ctx.prisma.auditoria.count({ where: { entidadId: 3 } })).toBe(2);
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

  test("bloquea aprobar si falta un requisito obligatorio y reserva aprobar y emitir al administrador", async () => {
    const bloqueada = await ctx.pedir("/revision-grados/2/acciones", { rol: "administrador", metodo: "POST", datos: { accion: "aprobar" } });
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
