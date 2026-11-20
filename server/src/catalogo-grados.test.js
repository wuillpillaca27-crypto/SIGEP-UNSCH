const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { once } = require("node:events");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { test } = require("node:test");
const { pathToFileURL } = require("node:url");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const express = require("express");
const { leerNormativa, registrarCatalogo } = require("./catalogo-grados");

test("el catálogo público filtra programas y requisitos en SQLite", async (t) => {
  const directorio = await mkdtemp(join(tmpdir(), "sigep-catalogo-"));
  const archivo = join(directorio, "catalogo.sqlite");
  const base = new DatabaseSync(archivo);
  base.exec(`
    CREATE TABLE programas (id INTEGER PRIMARY KEY, nombre TEXT, tipo TEXT, activo INTEGER);
    CREATE TABLE plantillas_requisito (
      id INTEGER PRIMARY KEY, programaId INTEGER, tipoTramite TEXT, nombre TEXT,
      descripcion TEXT, tipo TEXT, obligatorio INTEGER, versionNorm TEXT, orden INTEGER, activo INTEGER
    );
    INSERT INTO programas VALUES
      (1, 'Programa de prueba', 'doctorado', 1),
      (2, 'Programa inactivo', 'doctorado', 0),
      (3, 'Otro tipo de programa', 'maestria', 1);
    INSERT INTO plantillas_requisito VALUES
      (1, 1, 'grado_doctor', 'Plantilla de prueba', 'Texto de prueba', 'documental', 1, 'v-prueba', 1, 1),
      (2, 1, 'grado_doctor', 'Plantilla inactiva', 'Texto de prueba', 'documental', 1, 'v-prueba', 2, 0);
  `);
  base.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(archivo).href }) });
  const app = express();
  const normativa = leerNormativa(JSON.stringify([
    { tramite: "grado_doctor", programaId: 1, fuente: "Referencia de prueba", observaciones: "Observación de prueba" },
  ]));
  registrarCatalogo(app, prisma, normativa);
  const servidor = app.listen(0, "127.0.0.1");
  t.after(async () => {
    await new Promise((resolve) => servidor.close(resolve));
    await prisma.$disconnect();
    await rm(directorio, { recursive: true, maxRetries: 5, retryDelay: 100 });
  });
  await once(servidor, "listening");
  const url = `http://127.0.0.1:${servidor.address().port}/api/catalogo-grados`;

  const listado = await fetch(`${url}/grado_doctor`);
  assert.equal(listado.status, 200);
  assert.deepEqual(await listado.json(), { datos: [{ id: 1, nombre: "Programa de prueba" }] });

  const detalle = await fetch(`${url}/grado_doctor/1`);
  assert.equal(detalle.status, 200);
  assert.deepEqual(await detalle.json(), {
    requisitos: [{
      id: 1, nombre: "Plantilla de prueba", descripcion: "Texto de prueba",
      tipo: "documental", obligatorio: true, versionNorm: "v-prueba",
    }],
    fuente: "Referencia de prueba",
    observaciones: "Observación de prueba",
  });

  for (const id of ["2", "3", "1e0"]) {
    const respuesta = await fetch(`${url}/grado_doctor/${id}`);
    assert.equal(respuesta.status, 404);
    await respuesta.json();
  }
});
