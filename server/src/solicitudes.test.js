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
const { registrarOrientacion } = require("./orientacion");

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
  registrarOrientacion(app, prisma, autenticar);
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
      await tx.consultaOrientacion.deleteMany();
      await tx.notificacion.deleteMany();
      await tx.revision.deleteMany();
      await tx.auditoria.deleteMany();
      await tx.documentoSolicitud.deleteMany();
      await tx.historialEstado.deleteMany();
      await tx.validacionRequisito.deleteMany();
      await tx.solicitud.deleteMany();
      await tx.plantillaRequisito.deleteMany();
      await tx.configuracionTramite.deleteMany();
      await tx.cambioAcademico.deleteMany();
      await tx.estudiante.deleteMany();
      await tx.programa.deleteMany();
      await tx.usuario.deleteMany();
      await tx.programa.create({ data: { id: 1, nombre: "Doctorado de prueba", tipo: "doctorado", facultad: "Ciencias" } });
      const hash = bcrypt.hashSync(clave, 4);
      await tx.usuario.createMany({ data: [1, 2, 3, 4, 5].map((id) => ({ id, nombres: "Cuenta" + id, apellidos: "Prueba", dni: String(id).padStart(8, "0"), email: "cuenta" + id + "@test.invalid", password: hash, rol: id <= 2 ? "estudiante" : id === 3 ? "operador" : "administrador", puedeAprobar: id === 4 })) });
      await tx.estudiante.createMany({ data: [1, 2].map((id) => ({ id, usuarioId: id, codigoUniv: "TEST" + id, programaId: 1 })) });
      await tx.plantillaRequisito.create({ data: { id: 1, programaId: 1, tipoTramite: "grado_doctor", codigo: "REQ-SOLICITUD", nombre: "Documento de prueba", descripcion: "Descripción", tipo: "documental" } });
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
  await ctx.pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "finalizar_validacion" } });
  await ctx.pedir(accion, 200, { token: operador, metodo: "POST", datos: { accion: "remitir" } });
  const tecnico = await ctx.ingresar(5);
  await ctx.pedir(accion, 403, { token: tecnico, metodo: "POST", datos: { accion: "aprobar", comentario: "Prueba" } });
  await ctx.pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "aprobar", comentario: "Resolución de prueba" } });
  return { solicitud, ruta, accion, presentado };
}

describe("Solicitudes, revisión e identidad", () => {
  let ctx;
  beforeAll(async () => { ctx = await crearContexto(); });
  beforeEach(async () => { await ctx.restablecer(); });
  afterAll(async () => { await ctx.cerrar(); });

  test("notificaciones propias: presentación, lectura idempotente, lectura masiva y aislamiento", async () => {
    const token = await ctx.ingresar(1);
    const tokenAjeno = await ctx.ingresar(2);
    const { solicitud, ruta } = await prepararSolicitud(ctx, token);
    await ctx.pedir(ruta + "/presentar", 200, { token, metodo: "POST" });

    const bandeja = await ctx.pedir("/solicitudes/notificaciones", 200, { token });
    expect(bandeja.noLeidas).toBe(1);
    expect(bandeja.datos[0]).toMatchObject({ solicitudId: solicitud.id, tipo: "solicitud_presentada", leida: false });
    await ctx.pedir(`/solicitudes/notificaciones/${bandeja.datos[0].id}/leer`, 200, { token, metodo: "PATCH", datos: {} });
    await ctx.pedir(`/solicitudes/notificaciones/${bandeja.datos[0].id}/leer`, 200, { token, metodo: "PATCH", datos: {} });
    expect((await ctx.pedir("/solicitudes/notificaciones", 200, { token })).noLeidas).toBe(0);

    const privada = await ctx.prisma.notificacion.create({ data: {
      usuarioId: 2, tipo: "privada", mensaje: "No debe aparecer en otra cuenta.",
    } });
    await ctx.pedir(`/solicitudes/notificaciones/${privada.id}/leer`, 404, { token, metodo: "PATCH", datos: {} });
    await ctx.prisma.notificacion.create({ data: { usuarioId: 1, tipo: "segunda", mensaje: "Aviso adicional." } });
    expect(await ctx.pedir("/solicitudes/notificaciones/leer-todas", 200, { token, metodo: "PATCH", datos: {} })).toEqual({ actualizadas: 1 });
    expect((await ctx.pedir("/solicitudes/notificaciones", 200, { token })).noLeidas).toBe(0);
    expect((await ctx.pedir("/solicitudes/notificaciones", 200, { token: tokenAjeno })).datos).toEqual([
      expect.objectContaining({ tipo: "privada" }),
    ]);
  });

  test("retira adjuntos de borradores y limita la constancia al titular después de presentar", async () => {
    const token = await ctx.ingresar(1);
    const ajeno = await ctx.ingresar(2);
    const { solicitud, ruta, documento } = await prepararSolicitud(ctx, token);
    await ctx.pedir(ruta + "/constancia", 404, { token });
    await ctx.pedir(documento, 404, { token: ajeno, metodo: "DELETE" });
    const retirado = await ctx.pedir(documento, 200, { token, metodo: "DELETE" });
    expect(retirado.documentos).toEqual([]);
    expect(retirado.validaciones[0].estado).toBe("pendiente");
    await ctx.pedir(documento, 404, { token });
    await ctx.pedir(ruta + "/presentar", 422, { token, metodo: "POST" });
    const adjunto = await ctx.pedir(ruta + "/documentos/1", 200, { token, metodo: "PUT", pdf });
    await ctx.pedir(ruta + "/presentar", 200, { token, metodo: "POST" });
    await ctx.pedir(ruta + "/documentos/" + adjunto.documentos[0].id, 409, { token, metodo: "DELETE" });
    await ctx.pedir(ruta + "/constancia", 404, { token: ajeno });
    const acuse = await ctx.pedir(ruta + "/constancia", 200, { token, binario: true });
    expect(acuse.toString("utf8")).toContain(solicitud.codigo);
  });

  test("registra orientación y solo permite la respuesta al personal autorizado", async () => {
    const alumno = await ctx.ingresar(1);
    const operador = await ctx.ingresar(3);
    const correo = "consulta@test.invalid";
    const datos = { nombres: "Persona de prueba", correo, asunto: "Orientación", descripcion: "Consulta de prueba", tipoTramite: "grado_doctor" };
    const alta = await ctx.pedir("/orientacion", 201, { metodo: "POST", datos });
    expect(alta.codigo).toMatch(/^ORI-[A-F0-9]{32}$/);
    expect(alta.correo).toBeUndefined();
    const consultar = "/orientacion/consultar";
    await ctx.pedir(consultar, 404, { metodo: "POST", datos: { codigo: alta.codigo, correo: "otro@test.invalid" } });
    expect((await ctx.pedir(consultar, 200, { metodo: "POST", datos: { codigo: alta.codigo, correo } })).respuesta).toBeNull();
    await ctx.pedir("/atencion-orientacion", 403, { token: alumno });
    const bandeja = await ctx.pedir("/atencion-orientacion", 200, { token: operador });
    const ruta = `/atencion-orientacion/${bandeja.datos[0].id}/respuesta`;
    const respuesta = "Consulta atendida";
    await ctx.pedir(ruta, 403, { token: alumno, metodo: "PATCH", datos: { respuesta } });
    await ctx.pedir(ruta, 200, { token: operador, metodo: "PATCH", datos: { respuesta } });
    await ctx.pedir(ruta, 409, { token: operador, metodo: "PATCH", datos: { respuesta } });
    const vista = await ctx.pedir(consultar, 200, { metodo: "POST", datos: { codigo: alta.codigo, correo } });
    expect(vista.respuesta).toBe(respuesta);
    expect(vista.respondidaPorId).toBeUndefined();
  });

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
    await ctx.prisma.estudiante.delete({ where: { usuarioId_programaId: { usuarioId: 2, programaId: 1 } } });
    const sinMatricula = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(sinMatricula).toMatchObject({ programas: [], motivo: "sin_matricula" });

    await ctx.prisma.estudiante.create({ data: { usuarioId: 2, codigoUniv: "TEST2", programaId: 1 } });
    await ctx.prisma.programa.update({ where: { id: 1 }, data: { activo: false } });
    const inactivo = await ctx.pedir("/solicitudes/opciones-certificacion", 200, { token });
    expect(inactivo).toMatchObject({ programas: [], motivo: "programa_inactivo" });
  });

  test("admite dos matrículas compatibles, conserva borradores distintos y bloquea una matrícula suspendida o ajena", async () => {
    await ctx.prisma.programa.create({ data: { id: 2, nombre: "Segundo doctorado de prueba", tipo: "doctorado", facultad: "Pruebas" } });
    const matricula = await ctx.prisma.estudiante.create({ data: { usuarioId: 1, programaId: 2, codigoUniv: "TEST-SEGUNDO" } });
    await ctx.prisma.plantillaRequisito.create({ data: {
      programaId: 2, tipoTramite: "grado_doctor", codigo: "REQ-SEGUNDO", nombre: "PDF del segundo programa",
      descripcion: "Documento de prueba", tipo: "documental",
    } });
    const token = await ctx.ingresar(1);
    const otraCuenta = await ctx.ingresar(2);
    const opciones = await ctx.pedir("/solicitudes/opciones", 200, { token });
    expect(opciones.programas.map(({ id }) => id)).toEqual([1, 2]);
    expect(opciones.matriculas[1]).toMatchObject({ matriculaId: matricula.id, estadoAcad: "activo" });
    const perfil = await ctx.pedir("/auth/perfil", 200, { token });
    expect(perfil.estudiantes.map(({ programa }) => programa.tipo)).toEqual(["doctorado", "doctorado"]);
    const tipoTramite = "grado_doctor";
    await ctx.pedir("/solicitudes", 422, { token, metodo: "POST", datos: { tipoTramite } });
    await ctx.pedir("/solicitudes", 422, { token: otraCuenta, metodo: "POST", datos: { tipoTramite, programaId: 2 } });
    const primero = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite, programaId: 1 } });
    const segundo = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite, programaId: 2 } });
    expect(segundo.id).not.toBe(primero.id);
    expect(await ctx.prisma.solicitud.findUnique({ where: { id: segundo.id } })).toMatchObject({ estudianteId: matricula.id, programaId: 2 });
    const archivo = `/solicitudes/${segundo.id}/documentos/${segundo.validaciones[0].plantilla.id}`;
    await ctx.pedir(archivo, 404, { token: otraCuenta, metodo: "PUT", pdf });
    await ctx.pedir(archivo, 200, { token, metodo: "PUT", pdf });
    await ctx.prisma.estudiante.update({ where: { id: matricula.id }, data: { estadoAcad: "suspendido" } });
    const suspendida = await ctx.pedir("/solicitudes/opciones", 200, { token });
    expect(suspendida.matriculas[1]).toMatchObject({ motivo: "matricula_no_habilitada", tramites: [] });
    const unico = await ctx.pedir("/solicitudes", 200, { token, metodo: "POST", datos: { tipoTramite } });
    expect(unico.id).toBe(primero.id);
    await ctx.pedir(`/solicitudes/${segundo.id}/presentar`, 409, { token, metodo: "POST" });
    await ctx.prisma.estudiante.update({ where: { id: matricula.id }, data: { estadoAcad: "egresado" } });
    const presentada = await ctx.pedir(`/solicitudes/${segundo.id}/presentar`, 200, { token, metodo: "POST" });
    expect(presentada).toMatchObject({ estado: "presentado", programa: { id: 2 } });
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
    assert.equal(await ctx.prisma.notificacion.count({ where: { solicitudId: solicitud.id, tipo: "solicitud_presentada" } }), 1);
    await ctx.pedir("/revision-grados", 403, { token });
    assert.equal(solicitud.tipoTramite, "grado_doctor");
  });

  test("S-28 a S-40: acciones de revisión, aprobación, auditoría e informe", async () => {
    const token = await ctx.ingresar(1);
    const operador = await ctx.ingresar(3);
    const admin = await ctx.ingresar(4);
    const { solicitud, accion } = await aprobarSolicitud(ctx, token, operador, admin);
    await ctx.pedir(accion, 403, { token: operador, metodo: "POST", datos: { accion: "aprobar" } });
    assert.equal(await ctx.prisma.auditoria.count({ where: { entidadId: solicitud.id } }), 10);
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
    await ctx.pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "preparar_emision", comentario: "Resolución de prueba" } });
    await ctx.pedir(accion, 200, { token: admin, metodo: "POST", datos: { accion: "emitir", comentario: "Referencia de prueba" } });
    const verificado = await ctx.pedir(verificacion, 200);
    expect(Object.keys(verificado).sort()).toEqual(["codigo", "demostracion", "emitidoEn", "programa", "tipoTramite"]);
    assert.equal(verificado.codigo, presentado.codigo);
    assert.equal(verificado.tipoTramite, "grado_doctor");
    assert(verificado.emitidoEn);
    const eventos = await ctx.prisma.notificacion.findMany({ where: { solicitudId: solicitud.id }, select: { tipo: true } });
    expect(eventos.map(({ tipo }) => tipo)).toEqual(expect.arrayContaining([
      "solicitud_presentada", "observacion_registrada", "estado_en_revision", "estado_aprobado", "estado_emitido",
    ]));
    await ctx.pedir(verificacion + "?tipo=grado_maestro", 404);
    await ctx.prisma.solicitud.update({ where: { id: solicitud.id }, data: { estado: "anulado" } });
    await ctx.pedir(verificacion, 404);
    await ctx.pedir("/auth/google/estado", 200);
    await ctx.pedir("/auth/google/iniciar", 503);
    await ctx.pedir("/auth/logout", 200, { token, metodo: "POST" });
    await ctx.pedir("/auth/perfil", 401, { token });
  });
});
