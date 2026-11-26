const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { pathToFileURL } = require("node:url");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const express = require("express");
const { registrarIdentidad } = require("./identidad");

jest.setTimeout(30000);

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-identidad-sin-secreto-"));
  const archivo = join(directorio, "sin-secreto.sqlite");
  const base = new DatabaseSync(archivo);
  base.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY, nombres TEXT NOT NULL, apellidos TEXT NOT NULL, dni TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, rol TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, actualizadoEn TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE programas (
      id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, tipo TEXT NOT NULL, facultad TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE estudiantes (
      id INTEGER PRIMARY KEY, usuarioId INTEGER NOT NULL UNIQUE, codigoUniv TEXT NOT NULL UNIQUE,
      programaId INTEGER NOT NULL, telefono TEXT, estadoAcad TEXT DEFAULT 'activo',
      creditosAprobados INTEGER DEFAULT 0, promedioGeneral REAL DEFAULT 0,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, actualizadoEn TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const app = express();
  app.use(express.json());
  registrarIdentidad(app, prisma, undefined);
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;

  async function pedir(ruta, { metodo = "GET", datos, cookie } = {}) {
    const response = await fetch(api + ruta, {
      method: metodo,
      headers: {
        Connection: "close",
        ...(cookie !== undefined && { Cookie: cookie }),
        ...(datos !== undefined && { "Content-Type": "application/json" }),
      },
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
    });
    return { status: response.status, body: await response.json() };
  }

  async function cerrar() {
    servidor.closeAllConnections();
    if (servidor.listening) await new Promise((resolve) => servidor.close(resolve));
    await prisma.$disconnect();
    try {
      await rm(directorio, { recursive: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      console.warn("No se pudo eliminar el directorio temporal de sesión:", error.code ?? error.message);
    }
  }
  return { pedir, cerrar };
}

describe("Identidad sin secreto de sesión", () => {
  let ctx;
  beforeAll(async () => { ctx = await crearContexto(); }, 60000);
  afterAll(async () => { if (ctx) await ctx.cerrar(); }, 30000);

  test("devuelve 503 para login y perfil si falta el secreto, incluso con cookie inválida", async () => {
    expect(await ctx.pedir("/auth/login", {
      metodo: "POST", datos: { email: "admin@test.invalid", password: "clave-valida" },
    })).toMatchObject({ status: 503, body: { error: "El ingreso con cuentas SIGEP aún no está habilitado" } });
    expect(await ctx.pedir("/auth/perfil")).toMatchObject({
      status: 503, body: { error: "El ingreso con cuentas SIGEP aún no está habilitado" },
    });
    expect(await ctx.pedir("/auth/perfil", { cookie: "sigep_sesion=inválida" })).toMatchObject({
      status: 503, body: { error: "El ingreso con cuentas SIGEP aún no está habilitado" },
    });
  });
});
