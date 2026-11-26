const { once } = require("node:events");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
const bcrypt = require("bcryptjs");
const express = require("express");
const { registrarIdentidad } = require("./identidad");

jest.setTimeout(30000);

const clave = "clave-sintetica-segura";

async function crearContexto() {
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
  const hash = bcrypt.hashSync(clave, 4);
  await prisma.programa.create({ data: { id: 1, nombre: "Programa de prueba", tipo: "doctorado", facultad: "Ciencias" } });
  await prisma.usuario.create({ data: { id: 1, nombres: "Ada", apellidos: "Prueba", dni: "12345678", email: "admin@test.invalid", password: hash, rol: "administrador" } });
  await fixture.sincronizarSecuencias();
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
    await fixture.cerrar();
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
