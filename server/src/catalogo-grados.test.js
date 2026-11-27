const assert = require("node:assert/strict");
const { once } = require("node:events");
const { crearBasePostgresSuite } = require("./test/postgres-suite");
const express = require("express");
const { leerNormativa, registrarCatalogo } = require("./catalogo-grados");

jest.setTimeout(30000);

let limpiar;
afterEach(async () => {
  if (limpiar) {
    await limpiar();
    limpiar = undefined;
  }
});

test("C-01 a C-07: el catálogo público filtra programas y requisitos en PostgreSQL", async () => {
  const fixture = await crearBasePostgresSuite(__filename);
  const { prisma } = fixture;
  await prisma.programa.createMany({ data: [
    { id: 1, nombre: "Programa de prueba", tipo: "doctorado", facultad: "Ciencias", activo: true },
    { id: 2, nombre: "Programa inactivo", tipo: "doctorado", facultad: "Ciencias", activo: false },
    { id: 3, nombre: "Otro tipo de programa", tipo: "maestria", facultad: "Letras", activo: true },
    { id: 4, nombre: "Programa de demostración", tipo: "doctorado", facultad: "Entorno local de demostración", activo: true },
  ] });
  await prisma.plantillaRequisito.createMany({ data: [
    { id: 1, programaId: 1, tipoTramite: "grado_doctor", codigo: "REQ-CAT-1", nombre: "Plantilla de prueba", descripcion: "Texto de prueba", tipo: "documental", obligatorio: true, versionNorm: "v-prueba", orden: 1, activo: true },
    { id: 2, programaId: 1, tipoTramite: "grado_doctor", codigo: "REQ-CAT-2", nombre: "Plantilla inactiva", descripcion: "Texto de prueba", tipo: "documental", obligatorio: true, versionNorm: "v-prueba", orden: 2, activo: false },
    { id: 3, programaId: 1, tipoTramite: "grado_doctor", codigo: "DEMO-PRUEBA", nombre: "Plantilla de demostración", descripcion: "Texto de prueba", tipo: "documental", versionNorm: "Demostración" },
  ] });
  await fixture.sincronizarSecuencias();
  const app = express();
  const normativa = leerNormativa("\uFEFF" + JSON.stringify([
    { tramite: "grado_doctor", programaId: 1, fuente: "Referencia de prueba", procedimiento: "Procedimiento de prueba", observaciones: "Observación de prueba",
      formatos: [{ nombre: "Formato de prueba", url: "https://ejemplo.invalid/formato.pdf" }] },
    { tramite: "grado_doctor", programaId: 4, fuente: "No publicar junto con la demostración",
      formatos: [{ nombre: "Formato de prueba", url: "https://ejemplo.invalid/formato.pdf" }] },
  ]));
  registrarCatalogo(app, prisma, normativa);
  const servidor = app.listen(0, "127.0.0.1");
  limpiar = async () => {
    servidor.closeAllConnections();
    servidor.close();
    await fixture.cerrar();
  };
  await once(servidor, "listening");
  const url = `http://127.0.0.1:${servidor.address().port}/api/catalogo-grados`;

  const listado = await fetch(`${url}/grado_doctor`);
  assert.equal(listado.status, 200);
  expect(await listado.json()).toEqual({ datos: [{ id: 1, nombre: "Programa de prueba" }] });

  const detalle = await fetch(`${url}/grado_doctor/1`);
  assert.equal(detalle.status, 200);
  expect(await detalle.json()).toEqual({
    requisitos: [{
      id: 1, nombre: "Plantilla de prueba", descripcion: "Texto de prueba",
      tipo: "documental", obligatorio: true, versionNorm: "v-prueba",
    }],
    fuente: "Referencia de prueba",
    procedimiento: "Procedimiento de prueba",
    observaciones: "Observación de prueba",
    formatos: [{ nombre: "Formato de prueba", url: "https://ejemplo.invalid/formato.pdf" }],
    fuenteFormatos: "Referencia de prueba",
  });

  for (const id of ["2", "3", "4", "1e0"]) {
    const respuesta = await fetch(`${url}/grado_doctor/${id}`);
    assert.equal(respuesta.status, 404);
    await respuesta.json();
  }
  const modo = process.env.SIGEP_DEMOSTRACION;
  try {
    process.env.SIGEP_DEMOSTRACION = "1";
    const demo = await fetch(`${url}/grado_doctor/4`);
    expect(demo.status).toBe(200);
    expect(await demo.json()).toEqual({ requisitos: [], demostracion: true });
  } finally {
    if (modo === undefined) delete process.env.SIGEP_DEMOSTRACION;
    else process.env.SIGEP_DEMOSTRACION = modo;
  }
});

test.each(["javascript:alert(1)", "http://ejemplo.invalid/archivo.pdf", "https://usuario@ejemplo.invalid/archivo.pdf"])(
  "rechaza formatos sin un enlace HTTPS público válido (%s)", (url) => {
    expect(() => leerNormativa(JSON.stringify([{
      tramite: "grado_doctor", programaId: 1, fuente: "Referencia de prueba", formatos: [{ nombre: "Formato", url }],
    }]))).toThrow(/HTTPS/);
  },
);
