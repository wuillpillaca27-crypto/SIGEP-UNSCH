const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
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
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
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
    await prisma.$transaction(async (tx) => {
      await tx.revision.deleteMany();
      await tx.auditoria.deleteMany();
      await tx.documentoSolicitud.deleteMany();
      await tx.historialEstado.deleteMany();
      await tx.validacionRequisito.deleteMany();
      await tx.solicitud.deleteMany();
      await tx.plantillaRequisito.deleteMany();
      await tx.estudiante.deleteMany();
      await tx.programa.deleteMany();
      await tx.usuario.deleteMany();
      await tx.programa.create({ data: { id: 1, nombre: "Doctorado de prueba", tipo: "doctorado", facultad: "Ciencias" } });
      const hash = bcrypt.hashSync(clave, 4);
      await tx.usuario.createMany({ data: [1, 2, 3, 4].map((id) => ({ id, nombres: "Cuenta" + id, apellidos: "Prueba", dni: String(id).padStart(8, "0"), email: "cuenta" + id + "@test.invalid", password: hash, rol: id <= 2 ? "estudiante" : id === 3 ? "operador" : "administrador" })) });
      await tx.estudiante.createMany({ data: [1, 2].map((id) => ({ id, usuarioId: id, codigoUniv: "TEST" + id, programaId: 1 })) });
      await tx.plantillaRequisito.create({ data: { id: 1, programaId: 1, tipoTramite: "grado_doctor", codigo: "REQ-SOLICITUD", nombre: "Documento de prueba", descripcion: "Descripci?n", tipo: "documental" } });
    });
    await fixture.sincronizarSecuencias();
  }
  async function cerrar() {
    servidor.closeAllConnections();
    if (servidor.listening) await new Promise((resolve) => servidor.close(resolve));
    await fixture.cerrar();
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

  test("las opciones de certificación exigen sesión y rol estudiante", async () => {
    await ctx.pedir("/solicitudes/opciones-certificacion", 401);
    const operador = await ctx.ingresar(3);
    await ctx.pedir("/solicitudes/opciones-certificacion", 403, { token: operador });
  });

  test("las opciones académicas identifican el trámite propio y no duplican borradores simultáneos", async () => {
    await ctx.pedir("/solicitudes/opciones", 401);
    const operador = await ctx.ingresar(3);
    await ctx.pedir("/solicitudes/opciones", 403, { token: operador });
    const token = await ctx.ingresar(1);
    const opciones = await ctx.pedir("/solicitudes/opciones", 200, { token });
    expect(opciones.programas).toMatchObject([{ id: 1, tramites: [{ clave: "doctor", tipoTramite: "grado_doctor" }] }]);
    const datos = { tipoTramite: "grado_doctor", programaId: 1 };
    const borradores = await Promise.all([
      ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos }),
      ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos }),
    ]);
    expect(borradores[0].id).toBe(borradores[1].id);
    const propias = await ctx.pedir("/solicitudes", 200, { token });
    expect(propias.map(({ id }) => id)).toEqual([borradores[0].id]);
  });

  test("explica la elegibilidad y solo muestra la matrícula propia", async () => {
    const token = await ctx.ingresar(1);
    const noCertificable = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(noCertificable).toMatchObject({ programas: [], motivo: "tipo_no_certificable" });

    await ctx.prisma.programa.update({ where: { id: 1 }, data: { tipo: "diplomado" } });
    const sinRequisitos = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(sinRequisitos).toMatchObject({ programas: [], motivo: "sin_requisitos_activos" });

    await ctx.prisma.plantillaRequisito.create({ data: {
      programaId: 1, tipoTramite: "certificado_diplomado", codigo: "CERT-TEST-1",
      nombre: "PDF de prueba", descripcion: "Solo fixture de integración.", tipo: "documental",
    } });
    const elegibles = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(elegibles.programas).toHaveLength(1);
    expect(elegibles.programas[0]).toMatchObject({ id: 1, tipo: "diplomado" });
    expect(elegibles.programas[0].certificaciones).toMatchObject([
      { clave: "diplomados", tipoTramite: "certificado_diplomado", requisitos: [{ nombre: "PDF de prueba" }] },
    ]);

    await ctx.prisma.programa.create({ data: { id: 2, nombre: "Diplomado ajeno de prueba", tipo: "diplomado", facultad: "Fixture" } });
    await ctx.prisma.plantillaRequisito.create({ data: {
      programaId: 2, tipoTramite: "certificado_diplomado", codigo: "CERT-TEST-2",
      nombre: "PDF ajeno", descripcion: "No debe exponerse.", tipo: "documental",
    } });
    const acotadas = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(acotadas.programas.map(({ id }) => id)).toEqual([1]);
  });

  test("distingue ausencia de matrícula y programa inactivo", async () => {
    const token = await ctx.ingresar(2);
    await ctx.prisma.estudiante.delete({ where: { usuarioId: 2 } });
    const sinMatricula = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(sinMatricula).toMatchObject({ programas: [], motivo: "sin_matricula" });

    await ctx.prisma.estudiante.create({ data: { usuarioId: 2, codigoUniv: "TEST2", programaId: 1 } });
    await ctx.prisma.programa.update({ where: { id: 1 }, data: { activo: false } });
    const inactivo = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(inactivo).toMatchObject({ programas: [], motivo: "programa_inactivo" });
  });

  test("la creación de certificación comprueba el programa seleccionado", async () => {
    const token = await ctx.ingresar(1);
    await ctx.prisma.programa.update({ where: { id: 1 }, data: { tipo: "diplomado" } });
    await ctx.prisma.plantillaRequisito.create({ data: {
      programaId: 1, tipoTramite: "certificado_diplomado", codigo: "CERT-CREATE-TEST",
      nombre: "PDF de prueba", descripcion: "Solo fixture de integración.", tipo: "documental",
    } });
    await ctx.prisma.programa.create({ data: { id: 2, nombre: "Programa ajeno de prueba", tipo: "diplomado", facultad: "Fixture" } });
    await ctx.pedir("/solicitudes", 422, { token, metodo: "POST", datos: { programaId: 2, tipoTramite: "certificado_diplomado" } });
    await ctx.pedir("/solicitudes", 422, { token, metodo: "POST", datos: { programaId: "1", tipoTramite: "certificado_diplomado" } });
    const solicitud = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { programaId: 1, tipoTramite: "certificado_diplomado" } });
    expect(solicitud).toMatchObject({ programa: { nombre: "Doctorado de prueba" }, tipoTramite: "certificado_diplomado", estado: "borrador" });
    expect(solicitud.validaciones).toHaveLength(1);
    expect(solicitud.historial).toHaveLength(1);
    const datos = { programaId: 1, tipoTramite: "certificado_diplomado" };
    const borrador = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos });
    expect(borrador.id).toBe(solicitud.id);
    const plantillaId = solicitud.validaciones[0].plantilla.id;
    const archivo = `/solicitudes/${solicitud.id}/documentos/${plantillaId}`;
    const presentar = `/solicitudes/${solicitud.id}/presentar`;
    await ctx.prisma.plantillaRequisito.update({ where: { id: plantillaId }, data: { activo: false } });
    await ctx.pedir("/solicitudes", 409, { token, metodo: "POST", datos });
    await ctx.pedir(archivo, 409, { token, metodo: "PUT", pdf });
    await ctx.pedir(presentar, 409, { token, metodo: "POST" });
    await ctx.prisma.plantillaRequisito.update({ where: { id: plantillaId }, data: { activo: true } });
    await ctx.pedir(presentar, 422, { token, metodo: "POST" });
    const adjunta = await ctx.pedir(archivo, 200, { token, metodo: "PUT", pdf });
    expect(adjunta.documentos).toHaveLength(1);
    const presentada = await ctx.pedir(presentar, 200, { token, metodo: "POST" });
    expect(presentada).toMatchObject({ id: solicitud.id, codigo: solicitud.codigo, tipoTramite: "certificado_diplomado", estado: "presentado" });
    expect(presentada.historial.map(({ estadoDespues }) => estadoDespues)).toEqual(["borrador", "presentado"]);
    const propias = await ctx.pedir("/solicitudes", 200, { token });
    expect(propias.map(({ id }) => id)).toEqual([solicitud.id]);
  });

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
