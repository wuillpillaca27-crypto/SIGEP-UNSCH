const { once } = require("node:events");
const { mkdtemp, rm, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { OAuth2Client } = require("google-auth-library");
const express = require("express");
const jwt = require("jsonwebtoken");
const { registrarGoogle } = require("./identidad-google");

test("Google conserva el trámite autorizado en la transacción y rechaza destinos externos", async () => {
  const carpeta = await mkdtemp(join(tmpdir(), "sigep-google-test-"));
  const vinculos = join(carpeta, "vinculos.json");
  const secreto = "secreto-del-fixture-de-integracion";
  let servidor;
  try {
    await writeFile(vinculos, JSON.stringify({ "123": "estudiante@example.test" }));
    jest.replaceProperty(process, "env", {
      ...process.env, SIGEP_GOOGLE_CLIENT_ID: "fixture", SIGEP_GOOGLE_CLIENT_SECRET: "fixture",
      SIGEP_GOOGLE_REDIRECT_URI: "https://sigep.example.test/api/sigep/auth/google/callback",
      SIGEP_GOOGLE_VINCULOS: vinculos, SIGEP_GOOGLE_DOMINIOS: "",
    });
    jest.spyOn(OAuth2Client.prototype, "getToken").mockResolvedValue({ tokens: { id_token: "fixture" } });
    const verificar = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
    const iniciarSesion = jest.fn();
    const app = express();
    registrarGoogle(app, {
      prisma: { usuario: { findFirst: async () => ({ id: 1, rol: "estudiante", estudiantes: [{ id: 7 }] }) } },
      secreto, perfil: {}, opcionesCookie: { httpOnly: true, secure: true },
      leerCookie: (req) => req.get("cookie")?.split("=")[1], iniciarSesion,
    });
    servidor = app.listen(0, "127.0.0.1");
    await once(servidor, "listening");
    const base = `http://127.0.0.1:${servidor.address().port}/api/auth/google`;
    const seleccionado = "/grados-titulos/iniciar-solicitud?tramite=doctor";

    for (const [pedido, destino] of [[seleccionado, seleccionado], ["//externo.example.test", "/mis-tramites"]]) {
      const inicio = await fetch(`${base}/iniciar?${new URLSearchParams({ continuar: pedido })}`, { redirect: "manual" });
      expect(inicio.status).toBe(302);
      const cookie = inicio.headers.get("set-cookie").split(";")[0];
      const { nonce, state } = jwt.verify(cookie.split("=")[1], secreto);
      verificar.mockResolvedValue({ getPayload: () => ({ sub: "123", email: "estudiante@example.test", email_verified: true, nonce }) });
      const callback = await fetch(`${base}/callback?code=fixture&state=${state}`, { redirect: "manual", headers: { cookie } });
      expect(callback.status).toBe(302);
      expect(callback.headers.get("location")).toBe(`https://sigep.example.test${destino}`);
    }
    expect(iniciarSesion).toHaveBeenCalledTimes(2);
  } finally {
    servidor?.closeAllConnections();
    servidor?.close();
    jest.restoreAllMocks();
    await rm(carpeta, { recursive: true, force: true });
  }
});
