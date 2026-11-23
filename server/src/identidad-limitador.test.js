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

jest.setTimeout(30000);

const clave = "clave-sintetica-segura";

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-identidad-limitador-"));
  const archivo = join(directorio, "limitador.sqlite");
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
    INSERT INTO programas VALUES (1, 'Programa de prueba', 'doctorado', 'Ciencias', 1, CURRENT_TIMESTAMP);
  `);
  const hash = bcrypt.hashSync(clave, 4);
  base.prepare("INSERT INTO usuarios (id, nombres, apellidos, dni, email, password, rol, activo) VALUES (1, 'Ada', 'Prueba', '12345678', 'admin@test.invalid', ?, 'administrador', 1)").run(hash);
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const app = express();
  app.use(express.json());
  registrarIdentidad(app, prisma, "secreto-sintetico-limitador-identidad");
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;

  async function login(datos) {
    const response = await fetch(`${api}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify(datos),
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
      console.warn("No se pudo eliminar el directorio temporal del limitador:", error.code ?? error.message);
    }
  }
  return { login, cerrar };
}

describe("Limitador de login", () => {
  let ctx;
  beforeAll(async () => { ctx = await crearContexto(); }, 60000);
  afterAll(async () => { if (ctx) await ctx.cerrar(); }, 30000);

  test("permite diez intentos por IP y responde 429 en el undécimo", async () => {
    for (let intento = 1; intento <= 10; intento += 1) {
      const respuesta = await ctx.login({ email: "admin@test.invalid", password: "incorrecta" });
      expect(respuesta.status).toBe(401);
    }
    expect(await ctx.login({ email: "admin@test.invalid", password: "incorrecta" })).toMatchObject({
      status: 429, body: { error: "Demasiados intentos. Vuelve a intentar en un minuto" },
    });
  });
});
