const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
const bcrypt = require("bcryptjs");
const express = require("express");
const { registrarIdentidad } = require("./identidad");
const { registrarRevision } = require("./revision-grados");

jest.setTimeout(30000);

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-revision-listado-"));
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
  const hash = bcrypt.hashSync("credencial-prueba", 4);
  await prisma.programa.create({ data: { id: 1, nombre: "Programa prueba", tipo: "doctorado", facultad: "Ciencias" } });
  const usuarios = [
    { id: 1, nombres: "Ana", apellidos: "Operadora", dni: "10000001", email: "ana@test.invalid", password: hash, rol: "operador" },
    { id: 2, nombres: "Luis", apellidos: "Administrador", dni: "10000002", email: "luis@test.invalid", password: hash, rol: "administrador" },
    { id: 3, nombres: "Carla", apellidos: "Estudiante", dni: "12345678", email: "carla@test.invalid", password: hash, rol: "estudiante" },
  ];
  for (let id = 4; id <= 27; id += 1) usuarios.push({ id, nombres: "Persona" + id, apellidos: "Apellido" + id, dni: "8765" + String(id).padStart(4, "0"), email: "persona" + id + "@test.invalid", password: hash, rol: "estudiante" });
  await prisma.usuario.createMany({ data: usuarios });
  await prisma.estudiante.create({ data: { id: 1, usuarioId: 3, codigoUniv: "EST-1", programaId: 1 } });
  const tipos = ["grado_doctor", "grado_maestro", "titulo_segunda_especialidad", "certificado_diplomado", "certificacion_modulos"];
  const estados = ["en_revision", "observado", "aprobado", "emitido"];
  const solicitudes = Array.from({ length: 24 }, (_, index) => ({ id: index + 1, codigo: "SIGEP-" + String(index + 1).padStart(3, "0"), estudianteId: 1, usuarioId: index + 4, programaId: 1, tipoTramite: tipos[index % tipos.length], estado: estados[index % estados.length], presentadoEn: new Date("2026-01-01T00:00:00.000Z") }));
  solicitudes.push({ id: 25, codigo: "BUSCAR-CODIGO", estudianteId: 1, usuarioId: 3, programaId: 1, tipoTramite: "grado_doctor", estado: "en_revision", presentadoEn: new Date("2026-01-01T00:00:00.000Z") });
  await prisma.solicitud.createMany({ data: solicitudes });
  await fixture.sincronizarSecuencias();
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
    await fixture.cerrar();
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
