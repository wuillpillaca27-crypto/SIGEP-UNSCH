const { once } = require("node:events");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
const express = require("express");
const { registrarIdentidad } = require("./identidad");

jest.setTimeout(30000);

async function crearContexto() {
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
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
    await fixture.cerrar();
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
