const assert = require("node:assert/strict");
const { once } = require("node:events");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
const bcrypt = require("bcryptjs");
const express = require("express");
const { registrarIdentidad } = require("./identidad");
const { registrarAdministracion } = require("./administracion");

jest.setTimeout(30000);

const clave = "credencial-sintetica-segura";

async function crearContexto() {
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
  const hash = bcrypt.hashSync(clave, 4);
  await prisma.programa.createMany({ data: [
    { id: 1, nombre: "Doctorado de prueba", tipo: "doctorado", facultad: "Ciencias", activo: true },
    { id: 2, nombre: "Programa inactivo", tipo: "maestria", facultad: "Letras", activo: false },
  ] });
  const usuarios = ["administrador", "operador", "estudiante"].map((rol, index) => ({ id: index + 1, nombres: "Usuario" + (index + 1), apellidos: "Prueba" + (index + 1), dni: String(index + 1).padStart(8, "0"), email: "usuario" + (index + 1) + "@test.invalid", password: hash, rol, activo: true }));
  for (let id = 4; id <= 28; id += 1) usuarios.push({ id, nombres: "Estudiante" + id, apellidos: "Sintetico" + id, dni: String(id).padStart(8, "0"), email: "estudiante" + id + "@test.invalid", password: hash, rol: "estudiante", activo: true });
  await prisma.usuario.createMany({ data: usuarios });
  await prisma.estudiante.createMany({ data: Array.from({ length: 26 }, (_, index) => ({ id: index + 1, usuarioId: index + 3, codigoUniv: "EST-" + String(index + 1).padStart(3, "0"), programaId: 1 })) });
  await prisma.plantillaRequisito.create({ data: { id: 1, programaId: 1, tipoTramite: "grado_doctor", codigo: "REQ-BASE", nombre: "Requisito base", descripcion: "Descripci?n sint?tica", tipo: "documental", versionNorm: "v1" } });
  await prisma.solicitud.createMany({ data: Array.from({ length: 26 }, (_, index) => ({ id: index + 1, codigo: "SIGEP-ADMIN-" + (index + 1), estudianteId: index + 1, usuarioId: index + 3, programaId: 1, tipoTramite: "grado_doctor" })) });
  await prisma.auditoria.createMany({ data: Array.from({ length: 26 }, (_, index) => ({ id: index + 1, usuarioId: 1, accion: "consulta", entidad: "solicitud", entidadId: index + 1, ip: "127.0.0.1", creadoEn: new Date(Date.UTC(2026, 0, index + 1)) })) });
  await fixture.sincronizarSecuencias();
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
    await fixture.cerrar();
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

  test("publica un requisito, habilita su trámite y guarda el historial sin permitir gestión a operadores", async () => {
    const datos = { programaId: 1, codigo: "REQ-V2-CONFIG", nombre: "PDF de prueba", descripcion: "Fixture local", tipo: "documental", versionNorm: "v2", activo: false, obligatorio: false };
    const alta = await ctx.pedir("/administracion/requisitos", { rol: "administrador", metodo: "POST", datos });
    expect(alta.status).toBe(201);
    const ruta = "/administracion/configuracion-academica/1";
    const publicacion = `/administracion/requisitos/${alta.body.id}/publicacion`;
    const configuracion = { nombre: "Doctorado de prueba", facultad: "Ciencias", activo: true, habilitado: true,
      tipoTramite: "grado_doctor", fuente: "Referencia de prueba", costos: "", plazos: "", procedimiento: "" };
    expect((await ctx.pedir(publicacion, { rol: "operador", metodo: "PATCH", datos: { activo: true } })).status).toBe(403);
    expect((await ctx.pedir(publicacion, { rol: "administrador", metodo: "PATCH", datos: { activo: true } })).status).toBe(200);
    expect((await ctx.pedir(ruta, { rol: "administrador", metodo: "PATCH", datos: configuracion })).status).toBe(200);
    const detalle = await ctx.pedir(ruta, { rol: "administrador" });
    expect(detalle.body.configuracionTramite).toMatchObject({ habilitado: true, tipoTramite: "grado_doctor" });
    expect(detalle.body.plantillasRequisito).toEqual(expect.arrayContaining([expect.objectContaining({ id: alta.body.id, obligatorio: false, activo: true })]));
    expect(detalle.body.cambiosAcademicos.map(({ accion }) => accion)).toEqual(["configurar_tramite", "publicar_requisito", "crear_requisito"]);
  });

  test("delega errores Prisma no P2002 al manejador global vigente", async () => {
    const falloPrisma = jest.spyOn(ctx.prisma, "$transaction").mockRejectedValue(new Error("fallo sintético de Prisma"));
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
