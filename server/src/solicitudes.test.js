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
const { registrarSolicitudes } = require("./solicitudes");
const { registrarRevision } = require("./revision-grados");
const { registrarVerificacion } = require("./verificacion-documentos");
const { registrarAdministracion } = require("./administracion");

jest.setTimeout(120000);

const clave = "credencial-solo-para-pruebas";
const pdf = "%PDF-1.7\narchivo de prueba\n%%EOF\n";

async function crearContexto() {
  const carpeta = await mkdtemp(join(tmpdir(), "sigep-expedientes-"));
  const archivo = join(carpeta, "expedientes.sqlite");
  const base = new DatabaseSync(archivo);
  base.exec(`
    CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombres TEXT, apellidos TEXT, dni TEXT, email TEXT,
      password TEXT, rol TEXT, activo INTEGER);
    CREATE TABLE estudiantes (id INTEGER PRIMARY KEY, usuarioId INTEGER, codigoUniv TEXT, programaId INTEGER);
    CREATE TABLE programas (id INTEGER PRIMARY KEY, nombre TEXT, tipo TEXT, activo INTEGER);
    CREATE TABLE plantillas_requisito (id INTEGER PRIMARY KEY, programaId INTEGER, tipoTramite TEXT,
      nombre TEXT, descripcion TEXT, tipo TEXT, obligatorio INTEGER, orden INTEGER, activo INTEGER);
    CREATE TABLE solicitudes (id INTEGER PRIMARY KEY, codigo TEXT UNIQUE, estudianteId INTEGER, usuarioId INTEGER,
      programaId INTEGER, tipoTramite TEXT, estado TEXT DEFAULT 'borrador', observaciones TEXT,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, actualizadoEn TEXT, presentadoEn TEXT, aprobadoEn TEXT);
    CREATE TABLE validaciones_requisito (id INTEGER PRIMARY KEY, solicitudId INTEGER, plantillaId INTEGER,
      estado TEXT DEFAULT 'pendiente', evidencia TEXT, observacion TEXT, validadoPor INTEGER, validadoEn TEXT,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, actualizadoEn TEXT);
    CREATE TABLE historial_estados (id INTEGER PRIMARY KEY, solicitudId INTEGER, estadoAntes TEXT, estadoDespues TEXT,
      motivo TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE documentos_solicitud (id INTEGER PRIMARY KEY, solicitudId INTEGER, nombre TEXT, tipoDoc TEXT,
      nombreArchivo TEXT, rutaArchivo TEXT, mimeType TEXT, tamanoBytes INTEGER, subidoPor INTEGER,
      creadoEn TEXT DEFAULT CURRENT_TIMESTAMP, reemplazadoPor INTEGER);
    CREATE TABLE auditoria (id INTEGER PRIMARY KEY, usuarioId INTEGER, accion TEXT, entidad TEXT, entidadId INTEGER,
      detalles TEXT, ip TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE revisiones (id INTEGER PRIMARY KEY, solicitudId INTEGER, revisorId INTEGER, accion TEXT,
      comentario TEXT, estadoAntes TEXT, estadoDespues TEXT, creadoEn TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO programas VALUES (1, 'Doctorado de prueba', 'doctorado', 1);
    INSERT INTO estudiantes VALUES (1, 1, 'TEST1', 1), (2, 2, 'TEST2', 1);
    INSERT INTO plantillas_requisito VALUES (1, 1, 'grado_doctor', 'Documento de prueba', 'Descripción', 'documental', 1, 1, 1);
  `);
  const hash = bcrypt.hashSync(clave, 4);
  const crearUsuario = base.prepare("INSERT INTO usuarios VALUES (?, ?, 'Prueba', ?, ?, ?, ?, 1)");
  for (const [id, rol] of [[1, "estudiante"], [2, "estudiante"], [3, "operador"], [4, "administrador"]]) {
    crearUsuario.run(id, rol, String(id).padStart(8, "0"), `cuenta${id}@test.invalid`, hash, rol);
  }
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const app = express();
  app.use(express.json());
  const autenticar = registrarIdentidad(app, prisma, "secreto-desechable-de-prueba-seguro");
  registrarSolicitudes(app, prisma, autenticar, join(carpeta, "archivos"));
  registrarRevision(app, prisma, autenticar, join(carpeta, "archivos"));
  registrarVerificacion(app, prisma);
  registrarAdministracion(app, prisma, autenticar);
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;
  const cookies = new Map();
  async function pedir(ruta, status, { token, metodo = "GET", datos, pdf: contenidoPdf, binario } = {}) {
    const respuesta = await fetch(api + ruta, {
      method: metodo,
      headers: {
        ...(token && { Cookie: token }),
        ...(contenidoPdf ? { "Content-Type": "application/pdf" } : datos && { "Content-Type": "application/json" }),
      },
      body: contenidoPdf ?? (datos && JSON.stringify(datos)),
    });
    const resultado = binario ? Buffer.from(await respuesta.arrayBuffer()) : await respuesta.text();
    assert.equal(respuesta.status, status, `${metodo} ${ruta}: ${String(resultado).slice(0, 250)}`);
    return binario ? resultado : JSON.parse(resultado);
  }
  async function ingresar(id) {
    if (cookies.has(id)) return cookies.get(id);
    const respuesta = await fetch(api + "/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `cuenta${id}@test.invalid`, password: clave }),
    });
    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).token, undefined);
    const cookie = respuesta.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    const token = cookie.split(";")[0];
    cookies.set(id, token);
    return token;
  }
  async function restablecer() {
    for (const tabla of ["revisiones", "auditoria", "documentos_solicitud", "historial_estados", "validaciones_requisito", "solicitudes", "plantillas_requisito", "estudiantes", "programas", "usuarios"]) {
      await prisma.$executeRawUnsafe(`DELETE FROM ${tabla}`);
    }
    await prisma.$executeRawUnsafe("INSERT INTO programas VALUES (1, 'Doctorado de prueba', 'doctorado', 1)");
    await prisma.$executeRawUnsafe("INSERT INTO estudiantes VALUES (1, 1, 'TEST1', 1), (2, 2, 'TEST2', 1)");
    await prisma.$executeRawUnsafe("INSERT INTO plantillas_requisito VALUES (1, 1, 'grado_doctor', 'Documento de prueba', 'Descripción', 'documental', 1, 1, 1)");
    const hash = bcrypt.hashSync(clave, 4);
    for (const [id, rol] of [[1, "estudiante"], [2, "estudiante"], [3, "operador"], [4, "administrador"]]) {
      await prisma.$executeRawUnsafe("INSERT INTO usuarios VALUES (?, ?, 'Prueba', ?, ?, ?, ?, 1)", id, rol, String(id).padStart(8, "0"), `cuenta${id}@test.invalid`, hash, rol);
    }
  }
  async function cerrar() {
    servidor.closeAllConnections();
    servidor.close();
    await prisma.$disconnect();
    await rm(carpeta, { recursive: true, maxRetries: 24, retryDelay: 250 });
  }
  return { prisma, pedir, ingresar, restablecer, cerrar };
}

async function prepararSolicitud(ctx, token) {
  const solicitud = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite: "grado_doctor" } });
  const ruta = `/solicitudes/${solicitud.id}`;
  const adjunto = await ctx.pedir(ruta + "/documentos/1", 200, { token, metodo: "PUT", pdf });
  return { solicitud, ruta, documento: ruta + "/documentos/" + adjunto.documentos[0].id };
}

async function aprobarSolicitud(ctx, token, operador, admin) {
  const { solicitud, ruta } = await prepararSolicitud(ctx, token);
  const presentado = await ctx.pedir(ruta + "/presentar", 200, { token, metodo: "POST" });
  const accion = `/revision-grados/${solicitud.id}/acciones`;
  const requisitoId = presentado.validaciones[0].id;
  await ctx.pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "revisar" } });
  await ctx.pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "observar", requisitoId, comentario: "Adjuntar otra versión" } });
  await ctx.pedir(ruta + "/documentos/1", 200, { token, metodo: "PUT", pdf });
  await ctx.pedir(ruta + "/subsanar", 200, { token, metodo: "POST" });
  await ctx.pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "validar", requisitoId, comentario: "Evidencia cotejada" } });
  await ctx.pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "aprobar" } });
  return { solicitud, ruta, accion, presentado };
}

describe("Solicitudes, revisión e identidad", () => {
  let ctx;
  beforeAll(async () => { ctx = await crearContexto(); });
  beforeEach(async () => { await ctx.restablecer(); });
  afterAll(async () => { await ctx.cerrar(); });

  test("S-01 a S-10: sesión, permisos y perfil", async () => {
    const token = await ctx.ingresar(1);
    const operador = await ctx.ingresar(3);
    await ctx.ingresar(2);
    await ctx.ingresar(4);
    await ctx.pedir("/solicitudes", 401);
    await ctx.pedir("/administracion/configuracion", 401);
    await ctx.pedir("/administracion/configuracion", 403, { token });
    await ctx.pedir("/administracion/configuracion", 200, { token: operador });
    await ctx.pedir("/administracion/usuarios", 403, { token: operador });
    assert.equal((await ctx.pedir("/auth/perfil", 200, { token })).estudiante.codigoUniv, "TEST1");
  });

  test("S-11 a S-19: creación, presentación incompleta y descarga de documentos", async () => {
    const token = await ctx.ingresar(1);
    const ajeno = await ctx.ingresar(2);
    const solicitud = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite: "grado_doctor" } });
    const ruta = `/solicitudes/${solicitud.id}`;
    assert.equal((await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite: "grado_doctor" } })).id, solicitud.id);
    await ctx.pedir(ruta + "/presentar", 422, { token, metodo: "POST" });
    await ctx.pedir(ruta + "/documentos/1", 415, { token, metodo: "PUT", pdf: "datos sin cabecera" });
    const adjunto = await ctx.pedir(ruta + "/documentos/1", 200, { token, metodo: "PUT", pdf });
    const documento = ruta + "/documentos/" + adjunto.documentos[0].id;
    await ctx.pedir(documento, 404, { token: ajeno });
    assert.equal(String(await ctx.pedir(documento, 200, { token, binario: true })), pdf);
  });

  test("S-20 a S-27: presentación concurrente, historial y acceso de revisión", async () => {
    const token = await ctx.ingresar(1);
    const { solicitud, ruta } = await prepararSolicitud(ctx, token);
    const [presentado, repetido] = await Promise.all([
      ctx.pedir(ruta + "/presentar", 200, { token, metodo: "POST" }),
      ctx.pedir(ruta + "/presentar", 200, { token, metodo: "POST" }),
    ]);
    assert.equal(presentado.estado, "presentado");
    assert.equal(repetido.codigo, presentado.codigo);
    assert.equal((await ctx.pedir(ruta + "/presentar", 200, { token, metodo: "POST" })).codigo, presentado.codigo);
    assert.equal(await ctx.prisma.historialEstado.count({ where: { estadoDespues: "presentado" } }), 1);
    await ctx.pedir("/revision-grados", 403, { token });
    assert.equal(solicitud.tipoTramite, "grado_doctor");
  });

  test("S-28 a S-40: acciones de revisión, aprobación, auditoría e informe", async () => {
    const token = await ctx.ingresar(1);
    const operador = await ctx.ingresar(3);
    const admin = await ctx.ingresar(4);
    const { solicitud, accion } = await aprobarSolicitud(ctx, token, operador, admin);
    await ctx.pedir(accion, 403, { token: operador, metodo: "POST", datos: { accion: "aprobar" } });
    assert.equal(await ctx.prisma.auditoria.count({ where: { entidadId: solicitud.id } }), 8);
    expect(await ctx.pedir("/revision-grados/reporte", 200, { token: admin })).toEqual([
      { tipoTramite: "grado_doctor", estado: "aprobado", total: 1 },
    ]);
  });

  test("S-41 a S-57: emisión, verificación QR, Google y cierre de sesión", async () => {
    const token = await ctx.ingresar(1);
    const operador = await ctx.ingresar(3);
    const admin = await ctx.ingresar(4);
    const { solicitud, accion, presentado } = await aprobarSolicitud(ctx, token, operador, admin);
    const verificacion = "/documentos/verificar-qr/" + presentado.codigo.toUpperCase();
    await ctx.pedir(verificacion, 404);
    await ctx.pedir("/documentos/verificar-qr/NO-REGISTRADO", 404);
    await ctx.pedir("/documentos/verificar-qr/%3F", 400);
    await ctx.pedir(accion, 403, { token: operador, metodo: "POST", datos: { accion: "emitir", comentario: "Referencia de prueba" } });
    await ctx.pedir(accion, 409, { token: admin, metodo: "POST", datos: { accion: "emitir" } });
    await ctx.pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "emitir", comentario: "Referencia de prueba" } });
    const verificado = await ctx.pedir(verificacion, 200);
    expect(Object.keys(verificado).sort()).toEqual(["codigo", "demostracion", "emitidoEn", "programa", "tipoTramite"]);
    assert.equal(verificado.codigo, presentado.codigo);
    assert.equal(verificado.tipoTramite, "grado_doctor");
    assert(verificado.emitidoEn);
    await ctx.pedir(verificacion + "?tipo=grado_maestro", 404);
    await ctx.prisma.solicitud.update({ where: { id: solicitud.id }, data: { estado: "anulado" } });
    await ctx.pedir(verificacion, 404);
    await ctx.pedir("/auth/google/estado", 200);
    await ctx.pedir("/auth/google/iniciar", 503);
    await ctx.pedir("/auth/logout", 200, { token, metodo: "POST" });
    await ctx.pedir("/auth/perfil", 401, { token });
  });
});
