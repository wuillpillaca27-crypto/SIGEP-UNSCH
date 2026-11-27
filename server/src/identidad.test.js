const assert = require("node:assert/strict");
const { once } = require("node:events");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
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
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
  const hash = bcrypt.hashSync(clave, 4);
  await prisma.programa.create({ data: { id: 1, nombre: "Doctorado de prueba", tipo: "doctorado", facultad: "Ciencias" } });
  await prisma.usuario.createMany({ data: [
    { id: 1, nombres: "Ada", apellidos: "Administradora", dni: "12345678", email: "admin@test.invalid", password: hash, rol: "administrador", activo: true },
    { id: 2, nombres: "Ina", apellidos: "Inactiva", dni: "87654321", email: "inactiva@test.invalid", password: hash, rol: "estudiante", activo: false },
  ] });
  await fixture.sincronizarSecuencias();
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
    await fixture.cerrar();
  }

  return { prisma, ingresar, pedir, cerrar, api };
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

  test("el perfil conserva todas las matrículas y mantiene el campo heredado de primera matrícula", async () => {
    await ctx.prisma.programa.create({ data: { id: 2, nombre: "Maestría de prueba", tipo: "maestria", facultad: "Pruebas" } });
    await ctx.prisma.usuario.create({ data: {
      id: 3, nombres: "Estudiante", apellidos: "Integral", dni: "00000003", email: "integral@test.invalid",
      password: bcrypt.hashSync(clave, 4), rol: "estudiante",
    } });
    await ctx.prisma.estudiante.createMany({ data: [
      { id: 1, usuarioId: 3, programaId: 1, codigoUniv: "TEST-DOCTORADO" },
      { id: 2, usuarioId: 3, programaId: 2, codigoUniv: "TEST-MAESTRIA" },
    ] });

    const login = await fetch(`${ctx.api}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "integral@test.invalid", password: clave }),
    });
    expect(login.status).toBe(200);
    const sesion = await login.json();
    expect(sesion.usuario.estudiante.codigoUniv).toBe("TEST-DOCTORADO");
    expect(sesion.usuario.estudiantes.map(({ programa }) => programa.tipo)).toEqual(["doctorado", "maestria"]);
    expect(sesion.usuario.password).toBeUndefined();
    const perfil = await ctx.pedir("/auth/perfil", { cookie: login.headers.get("set-cookie").split(";")[0] });
    expect(perfil.body.estudiantes).toHaveLength(2);
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
    expect(await ctx.pedir("/auth/perfil")).toMatchObject({ status: 401, body: { codigo: "SESION_AUSENTE" } });
    expect((await ctx.pedir("/auth/perfil", { cookie: "sigep_sesion=not-a-jwt" })).status).toBe(401);
    const vencida = jwt.sign({ iat: Math.floor(Date.now() / 1000) - 7200 }, secreto, {
      algorithm: "HS256", issuer: "sigep", audience: "sigep-web", subject: "1", jwtid: "sesion-vencida", expiresIn: "1h",
    });
    expect(await ctx.pedir("/auth/perfil", { cookie: `sigep_sesion=${vencida}` })).toMatchObject({
      status: 401, body: { codigo: "SESION_EXPIRADA" },
    });
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
