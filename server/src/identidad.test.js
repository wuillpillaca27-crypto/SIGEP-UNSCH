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
const jwt = require("jsonwebtoken");
const express = require("express");
const { registrarIdentidad } = require("./identidad");

jest.setTimeout(30000);

const secreto = "secreto-sintetico-para-pruebas-de-identidad";
const clave = "clave-sintetica-segura";
const cookieSecure = process.env.SIGEP_DEMOSTRACION !== "1";
const variablesGoogle = [
  "SIGEP_GOOGLE_CLIENT_ID", "SIGEP_GOOGLE_CLIENT_SECRET", "SIGEP_GOOGLE_REDIRECT_URI",
  "SIGEP_GOOGLE_VINCULOS", "SIGEP_GOOGLE_DOMINIOS", "SIGEP_DEMOSTRACION",
];
const entornoOriginal = new Map();

async function crearContexto(claveSesion = secreto) {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-identidad-"));
  const archivo = join(directorio, "identidad.sqlite");
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
    INSERT INTO programas VALUES (1, 'Doctorado de prueba', 'doctorado', 'Ciencias', 1, CURRENT_TIMESTAMP);
  `);
  const hash = bcrypt.hashSync(clave, 4);
  const usuario = base.prepare("INSERT INTO usuarios (id, nombres, apellidos, dni, email, password, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  usuario.run(1, "Ada", "Administradora", "12345678", "admin@test.invalid", hash, "administrador", 1);
  usuario.run(2, "Ina", "Inactiva", "87654321", "inactiva@test.invalid", hash, "estudiante", 0);
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const app = express();
  app.use(express.json());
  registrarIdentidad(app, prisma, claveSesion);
  app.use((error, _req, res, _next) => res.status(503).json({ error: "El servicio no está disponible en este momento" }));
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;
  const cookies = new Map();

  async function ingresar(rol = "admin") {
    if (cookies.has(rol)) return cookies.get(rol);
    const credenciales = rol === "inactiva"
      ? { email: "inactiva@test.invalid", password: clave }
      : { email: "admin@test.invalid", password: clave };
    const response = await fetch(`${api}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify(credenciales),
    });
    assert.equal(response.status, 200, `No se pudo iniciar sesión: ${rol}`);
    const setCookie = response.headers.get("set-cookie");
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    const cookie = setCookie.split(";")[0];
    const sesion = { cookie, setCookie, body: await response.json() };
    cookies.set(rol, sesion);
    return sesion;
  }

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
    const texto = await response.text();
    let body = texto;
    try { body = JSON.parse(texto); } catch {}
    return { status: response.status, body, setCookie: response.headers.get("set-cookie") };
  }

  async function cerrar() {
    servidor.closeAllConnections();
    if (servidor.listening) await new Promise((resolve) => servidor.close(resolve));
    await prisma.$disconnect();
    try {
      await rm(directorio, { recursive: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      console.warn("No se pudo eliminar el directorio temporal de identidad:", error.code ?? error.message);
    }
  }

  return { prisma, ingresar, pedir, cerrar };
}

describe("Identidad y sesión", () => {
  let ctx;
  beforeAll(async () => {
    for (const variable of variablesGoogle) {
      entornoOriginal.set(variable, process.env[variable]);
      delete process.env[variable];
    }
    ctx = await crearContexto();
  }, 60000);
  afterAll(async () => {
    try {
      if (ctx) await ctx.cerrar();
    } finally {
      for (const variable of variablesGoogle) {
        const valor = entornoOriginal.get(variable);
        if (valor === undefined) delete process.env[variable];
        else process.env[variable] = valor;
      }
    }
  }, 30000);

  test("inicia sesión con cookie segura y entrega perfil sin token ni hash", async () => {
    const sesion = await ctx.ingresar();
    expect(sesion.body.token).toBeUndefined();
    expect(sesion.body.usuario.password).toBeUndefined();
    expect(sesion.setCookie).toMatch(/HttpOnly/);
    expect(sesion.setCookie).toMatch(/SameSite=Lax/);
    if (cookieSecure) expect(sesion.setCookie).toMatch(/Secure/);
    else expect(sesion.setCookie).not.toMatch(/Secure/);
    expect(sesion.setCookie).toMatch(/Max-Age=3600/);
    const cookie = sesion.cookie;
    const perfil = await ctx.pedir("/auth/perfil", { cookie });
    expect(perfil).toMatchObject({
      status: 200,
      body: { id: 1, nombres: "Ada", apellidos: "Administradora", dni: "12345678", email: "admin@test.invalid", rol: "administrador", estudiante: null },
    });
    expect(perfil.body.password).toBeUndefined();
  });

  test("rechaza entradas mal formadas, credenciales incorrectas y cuenta inactiva", async () => {
    for (const datos of [
      { email: "correo-inválido", password: clave },
      { email: "admin@test.invalid", password: "" },
      { email: "admin@test.invalid", password: "x".repeat(73) },
      { dni: "123", password: clave },
    ]) expect((await ctx.pedir("/auth/login", { metodo: "POST", datos })).status).toBe(400);

    const incorrectas = await ctx.pedir("/auth/login", {
      metodo: "POST", datos: { email: "admin@test.invalid", password: "incorrecta" },
    });
    expect(incorrectas).toMatchObject({ status: 401, body: { error: "Credenciales incorrectas" } });
    const inactiva = await ctx.pedir("/auth/login", {
      metodo: "POST", datos: { email: "inactiva@test.invalid", password: clave },
    });
    expect(inactiva).toMatchObject({ status: 401, body: { error: "Credenciales incorrectas" } });
  });

  test("rechaza sesiones ausentes, inválidas, vencidas, revocadas y de cuenta inactiva", async () => {
    expect((await ctx.pedir("/auth/perfil")).status).toBe(401);
    expect((await ctx.pedir("/auth/perfil", { cookie: "sigep_sesion=not-a-jwt" })).status).toBe(401);
    const vencida = jwt.sign({ iat: Math.floor(Date.now() / 1000) - 7200 }, secreto, {
      algorithm: "HS256", issuer: "sigep", audience: "sigep-web", subject: "1", jwtid: "sesion-vencida", expiresIn: "1h",
    });
    expect((await ctx.pedir("/auth/perfil", { cookie: `sigep_sesion=${vencida}` })).status).toBe(401);
    const deInactiva = jwt.sign({}, secreto, {
      algorithm: "HS256", issuer: "sigep", audience: "sigep-web", subject: "2", jwtid: "sesion-inactiva", expiresIn: "1h",
    });
    expect((await ctx.pedir("/auth/perfil", { cookie: `sigep_sesion=${deInactiva}` })).status).toBe(401);

    const { cookie } = await ctx.ingresar();
    expect((await ctx.pedir("/auth/logout", { metodo: "POST", cookie })).body).toEqual({ ok: true });
    expect((await ctx.pedir("/auth/perfil", { cookie })).status).toBe(401);
  });

  test("logout es idempotente para sesión ausente o inválida y limpia la cookie", async () => {
    const ausente = await ctx.pedir("/auth/logout", { metodo: "POST" });
    expect(ausente).toMatchObject({ status: 200, body: { ok: true } });
    expect(ausente.setCookie).toMatch(/sigep_sesion=/);
    expect(ausente.setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
    const invalida = await ctx.pedir("/auth/logout", { metodo: "POST", cookie: "sigep_sesion=basura" });
    expect(invalida).toMatchObject({ status: 200, body: { ok: true } });
  });

  test("Google informa que no está configurado y no inicia una solicitud externa", async () => {
    expect(await ctx.pedir("/auth/google/estado")).toMatchObject({ status: 200, body: { habilitado: false } });
    expect(await ctx.pedir("/auth/google/iniciar")).toMatchObject({ status: 503, body: { error: "Google no está configurado." } });
    expect(await ctx.pedir("/auth/google/callback?code=falso&state=falso")).toMatchObject({ status: 503, body: { error: "Google no está configurado." } });
  });
});
