const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { pathToFileURL } = require("node:url");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const bcrypt = require("bcryptjs");
const express = require("express");
const { registrarIdentidad } = require("./identidad");
const { registrarRevision } = require("./revision-grados");

jest.setTimeout(30000);

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-revision-listado-"));
  const archivo = join(directorio, "revision.sqlite");
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
    INSERT INTO programas VALUES (1, 'Programa prueba', 'doctorado', 1);
    INSERT INTO estudiantes VALUES (1, 3, 'EST-1', 1);
  `);
  const hash = bcrypt.hashSync("credencial-prueba", 4);
  const usuario = base.prepare("INSERT INTO usuarios VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
  usuario.run(1, "Ana", "Operadora", "10000001", "ana@test.invalid", hash, "operador");
  usuario.run(2, "Luis", "Administrador", "10000002", "luis@test.invalid", hash, "administrador");
  usuario.run(3, "Carla", "Estudiante", "12345678", "carla@test.invalid", hash, "estudiante");
  for (let id = 4; id <= 27; id += 1) {
    usuario.run(id, `Persona${id}`, `Apellido${id}`, `8765${String(id).padStart(4, "0")}`, `persona${id}@test.invalid`, hash, "estudiante");
  }
  const solicitud = base.prepare(`INSERT INTO solicitudes
    (id, codigo, estudianteId, usuarioId, programaId, tipoTramite, estado, presentadoEn)
    VALUES (?, ?, 1, ?, 1, ?, ?, '2026-01-01T00:00:00.000Z')`);
  const tipos = ["grado_doctor", "grado_maestro", "titulo_segunda_especialidad", "certificado_diplomado", "certificacion_modulos"];
  const estados = ["en_revision", "observado", "aprobado", "emitido"];
  for (let id = 1; id <= 24; id += 1) {
    solicitud.run(id, `SIGEP-${String(id).padStart(3, "0")}`, id + 3, tipos[(id - 1) % tipos.length], estados[(id - 1) % estados.length]);
  }
  solicitud.run(25, "BUSCAR-CODIGO", 3, "grado_doctor", "en_revision");
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const app = express();
  app.use(express.json());
  const autenticar = registrarIdentidad(app, prisma, "secreto-temporal-de-revision-seguro");
  registrarRevision(app, prisma, autenticar, directorio);
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;
  const cookies = new Map();
  async function token(id) {
    if (cookies.has(id)) return cookies.get(id);
    const response = await fetch(`${api}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ email: ["", "ana@test.invalid", "luis@test.invalid", "carla@test.invalid"][id], password: "credencial-prueba" }),
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie").split(";")[0];
    cookies.set(id, cookie);
    return cookie;
  }
  async function pedir(ruta, cookie) {
    const response = await fetch(api + ruta, {
      headers: { Connection: "close", ...(cookie ? { Cookie: cookie } : {}) },
    });
    return { status: response.status, body: await response.json() };
  }
  async function cerrar() {
    if (servidor.listening) {
      const cerrado = new Promise((resolve) => servidor.close(resolve));
      servidor.closeAllConnections();
      await cerrado;
    }
    await prisma.$disconnect();
    await rm(directorio, { recursive: true, maxRetries: 24, retryDelay: 250 });
  }
  return { pedir, token, cerrar };
}

describe("Listados y reporte de revisión", () => {
  let ctx;
  beforeAll(async () => { ctx = await crearContexto(); }, 60000);
  afterAll(async () => { if (ctx) await ctx.cerrar(); });

  test("filtra por tipos reconocidos y estado, e ignora parámetros no válidos", async () => {
    const operador = await ctx.token(1);
    const filtrado = await ctx.pedir("/revision-grados?tipos=grado_doctor,desconocido&estado=en_revision", operador);
    expect(filtrado.status).toBe(200);
    expect(filtrado.body.datos.map(({ tipoTramite, estado }) => [tipoTramite, estado])).toEqual([
      ["grado_doctor", "en_revision"], ["grado_doctor", "en_revision"], ["grado_doctor", "en_revision"],
    ]);
    const ignorados = await ctx.pedir("/revision-grados?tipos=desconocido&estado=invalido", operador);
    expect(ignorados.body.datos).toHaveLength(0);
  });

  test.each([
    ["código", "buscar=BUSCAR-CODIGO", "BUSCAR-CODIGO"],
    ["DNI", "buscar=12345678", "BUSCAR-CODIGO"],
    ["nombres", "buscar=Carla", "BUSCAR-CODIGO"],
    ["apellidos", "buscar=Estudiante", "BUSCAR-CODIGO"],
  ])("busca expedientes por %s", async (_campo, query, esperado) => {
    const operador = await ctx.token(1);
    const resultado = await ctx.pedir(`/revision-grados?${query}`, operador);
    expect(resultado.status).toBe(200);
    expect(resultado.body.datos.map(({ codigo }) => codigo)).toEqual([esperado]);
  });

  test("devuelve hasta 20 de 21, indica la siguiente página y normaliza límites", async () => {
    const operador = await ctx.token(1);
    const primera = await ctx.pedir("/revision-grados?pagina=1", operador);
    expect(primera.body.datos).toHaveLength(20);
    expect(primera.body.siguiente).toBe(true);
    expect(primera.body.puedeAprobar).toBe(false);
    const segunda = await ctx.pedir("/revision-grados?pagina=2", operador);
    expect(segunda.body.datos).toHaveLength(5);
    expect(segunda.body.siguiente).toBe(false);
    expect((await ctx.pedir("/revision-grados?pagina=0", operador)).body.datos).toHaveLength(20);
    expect((await ctx.pedir("/revision-grados?pagina=10001", operador)).body.datos).toHaveLength(0);
    expect((await ctx.pedir("/revision-grados?pagina=no-numérica", operador)).body.datos).toHaveLength(20);
    // Hallazgo vigente: parseInt acepta el prefijo numérico de "2x" como página 2.
    expect((await ctx.pedir("/revision-grados?pagina=2x", operador)).body.datos).toHaveLength(5);
  });

  test("restringe listado y reporte al personal y habilita aprobar solo al administrador", async () => {
    const admin = await ctx.token(2);
    const estudiante = await ctx.token(3);
    const listado = await ctx.pedir("/revision-grados", admin);
    expect(listado.status).toBe(200);
    expect(listado.body.puedeAprobar).toBe(true);
    expect((await ctx.pedir("/revision-grados/reporte", admin)).status).toBe(200);
    expect((await ctx.pedir("/revision-grados", estudiante)).status).toBe(403);
    expect((await ctx.pedir("/revision-grados/reporte", estudiante)).status).toBe(403);
    expect((await ctx.pedir("/revision-grados")).status).toBe(401);
  });

  test("agrupa totales por tipo de trámite y estado de las filas presentadas", async () => {
    const admin = await ctx.token(2);
    const reporte = await ctx.pedir("/revision-grados/reporte", admin);
    expect(reporte.status).toBe(200);
    const pares = reporte.body.map(({ tipoTramite, estado }) => `${tipoTramite}:${estado}`);
    expect(new Set(pares).size).toBe(pares.length);
    expect(reporte.body.reduce((total, fila) => total + fila.total, 0)).toBe(25);
    expect(reporte.body.find(({ tipoTramite, estado }) => tipoTramite === "grado_doctor" && estado === "en_revision").total).toBe(3);
  });
});
