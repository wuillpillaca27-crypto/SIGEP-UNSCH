const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { test } = require("node:test");
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

test("presentación, permisos y revisión de un expediente", async (t) => {
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
  const clave = "credencial-solo-para-pruebas";
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
  t.after(async () => {
    await new Promise((resolve) => servidor.close(resolve));
    await prisma.$disconnect();
    await rm(carpeta, { recursive: true, maxRetries: 8, retryDelay: 100 });
  });
  await once(servidor, "listening");
  const api = `http://127.0.0.1:${servidor.address().port}/api`;
  async function pedir(ruta, status, { token, metodo = "GET", datos, pdf, binario } = {}) {
    const respuesta = await fetch(api + ruta, {
      method: metodo,
      headers: {
        ...(token && { Cookie: token }),
        ...(pdf ? { "Content-Type": "application/pdf" } : datos && { "Content-Type": "application/json" }),
      },
      body: pdf ?? (datos && JSON.stringify(datos)),
    });
    const resultado = binario ? Buffer.from(await respuesta.arrayBuffer()) : await respuesta.text();
    assert.equal(respuesta.status, status, `${metodo} ${ruta}: ${String(resultado).slice(0, 250)}`);
    return binario ? resultado : JSON.parse(resultado);
  }
  async function ingresar(id) {
    const respuesta = await fetch(api + "/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `cuenta${id}@test.invalid`, password: clave }),
    });
    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).token, undefined);
    const cookie = respuesta.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    return cookie.split(";")[0];
  }
  const token = await ingresar(1);
  const ajeno = await ingresar(2);
  const operador = await ingresar(3);
  const admin = await ingresar(4);
  await pedir("/solicitudes", 401);
  await pedir("/administracion/configuracion", 401);
  await pedir("/administracion/configuracion", 403, { token });
  await pedir("/administracion/configuracion", 200, { token: operador });
  await pedir("/administracion/usuarios", 403, { token: operador });
  assert.equal((await pedir("/auth/perfil", 200, { token })).estudiante.codigoUniv, "TEST1");
  const solicitud = await pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite: "grado_doctor" } });
  const ruta = `/solicitudes/${solicitud.id}`;
  assert.equal((await pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite: "grado_doctor" } })).id, solicitud.id);
  await pedir(ruta + "/presentar", 422, { token, metodo: "POST" });
  await pedir(ruta + "/documentos/1", 415, { token, metodo: "PUT", pdf: "datos sin cabecera" });
  const pdf = "%PDF-1.7\narchivo de prueba\n%%EOF\n";
  const adjunto = await pedir(ruta + "/documentos/1", 200, { token, metodo: "PUT", pdf });
  const documento = ruta + "/documentos/" + adjunto.documentos[0].id;
  await pedir(documento, 404, { token: ajeno });
  assert.equal(String(await pedir(documento, 200, { token, binario: true })), pdf);
  const [presentado, repetido] = await Promise.all([
    pedir(ruta + "/presentar", 200, { token, metodo: "POST" }),
    pedir(ruta + "/presentar", 200, { token, metodo: "POST" }),
  ]);
  assert.equal(presentado.estado, "presentado");
  assert.equal(repetido.codigo, presentado.codigo);
  assert.equal((await pedir(ruta + "/presentar", 200, { token, metodo: "POST" })).codigo, presentado.codigo);
  assert.equal(await prisma.historialEstado.count({ where: { estadoDespues: "presentado" } }), 1);
  await pedir("/revision-grados", 403, { token });
  const accion = `/revision-grados/${solicitud.id}/acciones`;
  await pedir(accion, 403, { token: operador, metodo: "POST", datos: { accion: "aprobar" } });
  await pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "revisar" } });
  const requisitoId = presentado.validaciones[0].id;
  await pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "observar", requisitoId, comentario: "Adjuntar otra versión" } });
  await pedir(ruta + "/subsanar", 409, { token, metodo: "POST" });
  await pedir(ruta + "/documentos/1", 200, { token, metodo: "PUT", pdf });
  const corregido = await pedir(ruta + "/subsanar", 200, { token, metodo: "POST" });
  assert.equal(corregido.estado, "en_revision");
  await pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "validar", requisitoId, comentario: "Evidencia cotejada" } });
  assert.equal((await pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "aprobar" } })).estado, "aprobado");
  assert.equal(await prisma.auditoria.count({ where: { entidadId: solicitud.id } }), 8);
  assert.deepEqual(await pedir("/revision-grados/reporte", 200, { token: admin }), [
    { tipoTramite: "grado_doctor", estado: "aprobado", total: 1 },
  ]);
  const verificacion = "/documentos/verificar-qr/" + presentado.codigo.toUpperCase();
  await pedir(verificacion, 404);
  await pedir("/documentos/verificar-qr/NO-REGISTRADO", 404);
  await pedir("/documentos/verificar-qr/%3F", 400);
  await pedir(accion, 403, { token: operador, metodo: "POST", datos: { accion: "emitir", comentario: "Referencia de prueba" } });
  await pedir(accion, 409, { token: admin, metodo: "POST", datos: { accion: "emitir" } });
  await pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "emitir", comentario: "Referencia de prueba" } });
  const verificado = await pedir(verificacion, 200);
  assert.deepEqual(Object.keys(verificado).sort(), ["codigo", "demostracion", "emitidoEn", "programa", "tipoTramite"]);
  assert.equal(verificado.codigo, presentado.codigo);
  assert.equal(verificado.tipoTramite, "grado_doctor");
  assert(verificado.emitidoEn);
  await pedir(verificacion + "?tipo=grado_maestro", 404);
  await prisma.solicitud.update({ where: { id: solicitud.id }, data: { estado: "anulado" } });
  await pedir(verificacion, 404);
  await pedir("/auth/google/estado", 200);
  await pedir("/auth/google/iniciar", 503);
  await pedir("/auth/logout", 200, { token, metodo: "POST" });
  await pedir("/auth/perfil", 401, { token });
});
