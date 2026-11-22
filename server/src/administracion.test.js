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
const { registrarAdministracion } = require("./administracion");

jest.setTimeout(30000);

const clave = "credencial-sintetica-segura";

async function crearContexto() {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-administracion-"));
  const archivo = join(directorio, "administracion.sqlite");
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
    CREATE TABLE plantillas_requisito (
      id INTEGER PRIMARY KEY, programaId INTEGER NOT NULL, tipoTramite TEXT NOT NULL, codigo TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL, descripcion TEXT NOT NULL, tipo TEXT NOT NULL, obligatorio INTEGER NOT NULL DEFAULT 1,
      orden INTEGER NOT NULL DEFAULT 0, activo INTEGER NOT NULL DEFAULT 1,
      versionNorm TEXT NOT NULL DEFAULT '1.0', creadoEn TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE auditoria (
      id INTEGER PRIMARY KEY, usuarioId INTEGER NOT NULL, accion TEXT NOT NULL, entidad TEXT NOT NULL,
      entidadId INTEGER NOT NULL, detalles TEXT, ip TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO programas VALUES
      (1, 'Doctorado de prueba', 'doctorado', 'Ciencias', 1, CURRENT_TIMESTAMP),
      (2, 'Programa inactivo', 'maestria', 'Letras', 0, CURRENT_TIMESTAMP);
  `);

  const hash = bcrypt.hashSync(clave, 4);
  const insertarUsuario = base.prepare("INSERT INTO usuarios (id, nombres, apellidos, dni, email, password, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const roles = ["administrador", "operador", "estudiante"];
  for (const [index, rol] of roles.entries()) {
    const id = index + 1;
    insertarUsuario.run(id, `Usuario${id}`, `Prueba${id}`, String(id).padStart(8, "0"), `usuario${id}@test.invalid`, hash, rol, 1);
  }
  for (let id = 4; id <= 28; id += 1) {
    insertarUsuario.run(id, `Estudiante${id}`, `Sintetico${id}`, String(id).padStart(8, "0"), `estudiante${id}@test.invalid`, hash, "estudiante", 1);
  }
  const insertarEstudiante = base.prepare("INSERT INTO estudiantes (id, usuarioId, codigoUniv, programaId) VALUES (?, ?, ?, 1)");
  for (let id = 1; id <= 26; id += 1) insertarEstudiante.run(id, id + 2, `EST-${String(id).padStart(3, "0")}`);
  base.exec(`
    INSERT INTO plantillas_requisito (id, programaId, tipoTramite, codigo, nombre, descripcion, tipo, obligatorio, orden, activo, versionNorm)
      VALUES (1, 1, 'grado_doctor', 'REQ-BASE', 'Requisito base', 'Descripción sintética', 'documental', 1, 1, 1, 'v1');
  `);
  const insertarAuditoria = base.prepare("INSERT INTO auditoria (id, usuarioId, accion, entidad, entidadId, detalles, ip, creadoEn) VALUES (?, 1, 'consulta', 'solicitud', ?, NULL, '127.0.0.1', ?)");
  for (let id = 1; id <= 26; id += 1) insertarAuditoria.run(id, id, new Date(Date.UTC(2026, 0, id)).toISOString());
  base.close();

  const adapter = new PrismaLibSql({ url: pathToFileURL(archivo).href });
  const conectar = adapter.connect.bind(adapter);
  let adaptadorConectado;
  adapter.connect = async () => {
    adaptadorConectado = await conectar();
    return adaptadorConectado;
  };
  const prisma = new PrismaClient({ adapter });
  const app = express();
  app.use(express.json());
  const autenticar = registrarIdentidad(app, prisma, "secreto-sintetico-administracion-seguro");
  registrarAdministracion(app, prisma, autenticar);
  app.use((error, _req, res, _next) => res.status(503).json({ error: "El servicio no está disponible en este momento" }));
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;
  const cookies = new Map();
  const cuentaPorRol = { administrador: 1, operador: 2, estudiante: 3 };

  async function ingresar(rol) {
    if (cookies.has(rol)) return cookies.get(rol);
    const id = cuentaPorRol[rol];
    const response = await fetch(`${api}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ email: `usuario${id}@test.invalid`, password: clave }),
    });
    assert.equal(response.status, 200, `No se pudo iniciar sesión con rol ${rol}`);
    const cookieHeader = response.headers.get("set-cookie");
    assert.match(cookieHeader, /HttpOnly/);
    assert.match(cookieHeader, /SameSite=Lax/);
    const cookie = cookieHeader.split(";")[0];
    cookies.set(rol, cookie);
    return cookie;
  }

  async function pedir(ruta, { rol, metodo = "GET", datos } = {}) {
    const response = await fetch(api + ruta, {
      method: metodo,
      headers: {
        Connection: "close",
        ...(rol && { Cookie: await ingresar(rol) }),
        ...(datos !== undefined && { "Content-Type": "application/json" }),
      },
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
    });
    const texto = await response.text();
    let body = texto;
    try { body = JSON.parse(texto); } catch {}
    return { status: response.status, body };
  }

  async function cerrar() {
    servidor.closeAllConnections();
    if (servidor.listening) await new Promise((resolve) => servidor.close(resolve));

    await prisma.$disconnect();
    if (adaptadorConectado?.client) await adaptadorConectado.client.close();
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      await rm(directorio, { recursive: true, maxRetries: 5, retryDelay: 250 });
    } catch (error) {
      console.warn("No se pudo eliminar el directorio temporal de administración:", error.code ?? error.message);
    }
  }
  return { prisma, pedir, ingresar, cerrar };
}

describe("Administración", () => {
  let ctx;
  beforeAll(async () => {
    ctx = await crearContexto();
    for (const rol of ["administrador", "operador", "estudiante"]) await ctx.ingresar(rol);
  }, 60000);
  afterAll(async () => { if (ctx) await ctx.cerrar(); }, 60000);

  test("expone configuración a administrador y operador, y la restringe a estudiante y sesión ausente", async () => {
    const esperada = {
      sistema: "SIGEP-UNSCH", ingreso: "DNI o correo registrado y contraseña",
      tamanoMaximoPDF: "10 MB", vigenciaSesion: "1 hora",
    };
    expect(await ctx.pedir("/administracion/configuracion", { rol: "administrador" })).toEqual({ status: 200, body: esperada });
    expect(await ctx.pedir("/administracion/configuracion", { rol: "operador" })).toEqual({ status: 200, body: esperada });
    expect((await ctx.pedir("/administracion/configuracion", { rol: "estudiante" })).status).toBe(403);
    expect((await ctx.pedir("/administracion/configuracion")).status).toBe(401);
  });

  test("lista programas ordenados y solo el administrador puede crearlos con datos válidos", async () => {
    const programas = await ctx.pedir("/administracion/programas", { rol: "operador" });
    expect(programas.body.map(({ nombre }) => nombre)).toEqual(["Doctorado de prueba", "Programa inactivo"]);
    const datos = { nombre: "  Maestría de prueba  ", facultad: "  Ingeniería  ", tipo: "maestria" };
    const sinPermiso = await ctx.pedir("/administracion/programas", { rol: "operador", metodo: "POST", datos });
    expect(sinPermiso.status).toBe(403);
    const creada = await ctx.pedir("/administracion/programas", { rol: "administrador", metodo: "POST", datos });
    expect(creada).toMatchObject({ status: 201, body: { nombre: "Maestría de prueba", facultad: "Ingeniería", tipo: "maestria", activo: true } });
    expect((await ctx.pedir("/administracion/programas", { rol: "administrador" })).body).toHaveLength(3);
    for (const invalido of [
      { nombre: " ", facultad: "Facultad", tipo: "doctorado" },
      { nombre: "P".repeat(161), facultad: "Facultad", tipo: "doctorado" },
      { nombre: "Programa", facultad: "F".repeat(161), tipo: "doctorado" },
      { nombre: "Programa", facultad: "Facultad", tipo: "desconocido" },
    ]) expect((await ctx.pedir("/administracion/programas", { rol: "administrador", metodo: "POST", datos: invalido })).status).toBe(400);
  });

  test("página estudiantes a 25, indica siguiente y acepta normalización parcial observada", async () => {
    const primera = await ctx.pedir("/administracion/estudiantes", { rol: "operador" });
    expect(primera.status).toBe(200);
    expect(primera.body.datos).toHaveLength(25);
    expect(primera.body.siguiente).toBe(true);
    expect(primera.body.datos[0]).toMatchObject({ programa: { nombre: "Doctorado de prueba" }, usuario: { rol: "estudiante" } });
    expect((await ctx.pedir("/administracion/estudiantes?pagina=2", { rol: "administrador" })).body.datos).toHaveLength(1);
    expect((await ctx.pedir("/administracion/estudiantes?pagina=0", { rol: "administrador" })).body.datos).toHaveLength(25);
    // Hallazgo: parseInt convierte "1x" y "1.5" silenciosamente en la página 1.
    expect((await ctx.pedir("/administracion/estudiantes?pagina=1x", { rol: "administrador" })).body.datos).toHaveLength(25);
    expect((await ctx.pedir("/administracion/estudiantes?pagina=1.5", { rol: "administrador" })).body.datos).toHaveLength(25);
  });

  test("lista usuarios con paginación, protege la ruta y nunca expone contraseñas", async () => {
    const operador = await ctx.pedir("/administracion/usuarios", { rol: "operador" });
    const estudiante = await ctx.pedir("/administracion/usuarios", { rol: "estudiante" });
    expect(operador.status).toBe(403);
    expect(estudiante.status).toBe(403);
    const primera = await ctx.pedir("/administracion/usuarios", { rol: "administrador" });
    expect(primera.status).toBe(200);
    expect(primera.body.datos).toHaveLength(25);
    expect(primera.body.siguiente).toBe(true);
    expect(primera.body.datos.every((usuario) => !Object.hasOwn(usuario, "password"))).toBe(true);
    expect((await ctx.pedir("/administracion/usuarios?pagina=2", { rol: "administrador" })).body.datos).toHaveLength(3);
  });

  test("valida altas de usuarios, programa activo, límites y duplicados P2002", async () => {
    const base = { nombres: "María", apellidos: "Prueba", dni: "70000001", email: "MARIA@test.invalid", rol: "operador", password: "clave-de-prueba" };
    for (const invalido of [
      { ...base, nombres: " " }, { ...base, nombres: "N".repeat(101) }, { ...base, apellidos: "A".repeat(101) },
      { ...base, dni: "123" }, { ...base, email: "mal-correo" }, { ...base, rol: "docente" },
      { ...base, password: "corta" }, { ...base, password: "á".repeat(37) },
    ]) expect((await ctx.pedir("/administracion/usuarios", { rol: "administrador", metodo: "POST", datos: invalido })).status).toBe(400);
    expect((await ctx.pedir("/administracion/usuarios", { rol: "operador", metodo: "POST", datos: base })).status).toBe(403);
    const creada = await ctx.pedir("/administracion/usuarios", { rol: "administrador", metodo: "POST", datos: base });
    expect(creada.status).toBe(201);
    expect(creada.body).toMatchObject({ nombres: "María", email: "maria@test.invalid", rol: "operador", activo: true });
    expect(Object.hasOwn(creada.body, "password")).toBe(false);
    const duplicadoP2002 = jest.spyOn(ctx.prisma.usuario, "create").mockRejectedValue(Object.assign(new Error("único duplicado de prueba"), { code: "P2002" }));
    try {
      expect((await ctx.pedir("/administracion/usuarios", { rol: "administrador", metodo: "POST", datos: base })).status).toBe(409);
    } finally {
      duplicadoP2002.mockRestore();
    }
    const estudianteInvalido = { ...base, dni: "70000002", email: "estudiante.nuevo@test.invalid", rol: "estudiante", codigoUniv: "NUEVO-01", programaId: 2 };
    expect((await ctx.pedir("/administracion/usuarios", { rol: "administrador", metodo: "POST", datos: estudianteInvalido })).status).toBe(400);
    const estudianteValido = { ...estudianteInvalido, dni: "70000003", codigoUniv: "NUEVO-02", programaId: 1 };
    expect((await ctx.pedir("/administracion/usuarios", { rol: "administrador", metodo: "POST", datos: estudianteValido })).status).toBe(201);
  });

  test("lista y crea requisitos, valida campos y programa activo y responde 409 al código duplicado", async () => {
    const lista = await ctx.pedir("/administracion/requisitos", { rol: "operador" });
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ codigo: "REQ-BASE", programa: { nombre: "Doctorado de prueba" } });
    expect((await ctx.pedir("/administracion/requisitos", { rol: "estudiante" })).status).toBe(403);
    const datos = { programaId: 1, codigo: "REQ-NEW", nombre: "  Requisito nuevo  ", descripcion: "Descripción nueva", tipo: "academico", versionNorm: "Norma 2026" };
    expect((await ctx.pedir("/administracion/requisitos", { rol: "operador", metodo: "POST", datos })).status).toBe(403);
    for (const invalido of [
      { ...datos, programaId: 2 }, { ...datos, programaId: 1.5 }, { ...datos, codigo: "" },
      { ...datos, codigo: "C".repeat(51) }, { ...datos, nombre: "N".repeat(161) },
      { ...datos, descripcion: "D".repeat(2001) }, { ...datos, tipo: "invalido" },
      { ...datos, versionNorm: "" }, { ...datos, programaId: 999 },
    ]) expect((await ctx.pedir("/administracion/requisitos", { rol: "administrador", metodo: "POST", datos: invalido })).status).toBe(400);
    expect((await ctx.pedir("/administracion/requisitos", { rol: "administrador", metodo: "POST", datos })).status).toBe(201);
    expect((await ctx.pedir("/administracion/requisitos", { rol: "administrador", metodo: "POST", datos })).status).toBe(409);
  });

  test("permite auditoría solo a administrador y pagina el máximo de 25 de 26", async () => {
    expect((await ctx.pedir("/administracion/auditoria", { rol: "operador" })).status).toBe(403);
    expect((await ctx.pedir("/administracion/auditoria", { rol: "estudiante" })).status).toBe(403);
    expect((await ctx.pedir("/administracion/auditoria")).status).toBe(401);
    const primera = await ctx.pedir("/administracion/auditoria", { rol: "administrador" });
    expect(primera.status).toBe(200);
    expect(primera.body.datos).toHaveLength(25);
    expect(primera.body.siguiente).toBe(true);
    expect(primera.body.datos[0].usuario).toMatchObject({ nombres: "Usuario1", apellidos: "Prueba1" });
    expect((await ctx.pedir("/administracion/auditoria?pagina=2", { rol: "administrador" })).body.datos).toHaveLength(1);
  });

  test("delega errores Prisma no P2002 al manejador global vigente", async () => {
    const falloPrisma = jest.spyOn(ctx.prisma.programa, "create").mockRejectedValue(new Error("fallo sintético de Prisma"));
    try {
      const respuesta = await ctx.pedir("/administracion/programas", {
        rol: "administrador", metodo: "POST", datos: { nombre: "Error Prisma", facultad: "Pruebas", tipo: "doctorado" },
      });
      expect(respuesta).toEqual({ status: 503, body: { error: "El servicio no está disponible en este momento" } });
    } finally {
      falloPrisma.mockRestore();
    }
  });
});
