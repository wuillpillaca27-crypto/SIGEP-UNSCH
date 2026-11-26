const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const { Client } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const raizServidor = resolve(__dirname, "../..");

function urlSegura(valor) {
  return String(valor || "").replace(/(?:postgres|postgresql):\/\/[^\s"']+/gi, "[DATABASE_URL]");
}

function validarDestino(url) {
  if (!url || !["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("SIGEP_TEST_DATABASE_URL debe usar PostgreSQL.");
  }
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Las pruebas solo pueden usar PostgreSQL local fuera de producción.");
  }
  if (!url.pathname.slice(1).endsWith("_test")) {
    throw new Error("La base de pruebas debe terminar en _test.");
  }
  return url;
}

async function crearBasePostgresSuite(nombreSuite) {
  require("dotenv").config({ path: resolve(raizServidor, ".env"), quiet: true });
  const baseUrl = validarDestino(new URL(process.env.SIGEP_TEST_DATABASE_URL || ""));
  const schema = `jest_${process.pid}_${randomUUID().replaceAll("-", "")}`;
  if (!/^jest_[a-zA-Z0-9_]+$/.test(schema) || schema.length > 63) {
    throw new Error("No se pudo generar un nombre de esquema temporal seguro.");
  }

  const admin = new Client({ connectionString: baseUrl.href, connectionTimeoutMillis: 5000 });
  let schemaCreado = false;
  let prisma;
  let transferirConexion = false;
  try {
    await admin.connect();
    const identidad = await admin.query("SELECT current_database() AS database");
    if (identidad.rows[0].database !== baseUrl.pathname.slice(1)) {
      throw new Error("La conexión PostgreSQL no llegó a la base de pruebas indicada.");
    }
    await admin.query(`CREATE SCHEMA "${schema}"`);
    schemaCreado = true;

    const urlMigracion = new URL(baseUrl.href);
    urlMigracion.protocol = "postgresql:";
    urlMigracion.searchParams.set("schema", schema);
    const migracion = spawnSync(process.execPath, [
      require.resolve("prisma/build/index.js"), "migrate", "deploy",
    ], {
      cwd: raizServidor,
      env: { ...process.env, DATABASE_URL: urlMigracion.href },
      encoding: "utf8",
      timeout: 60000,
      windowsHide: true,
    });
    if (migracion.error || migracion.status !== 0) {
      const detalle = urlSegura(`${migracion.stdout || ""}\n${migracion.stderr || ""}`).trim();
      throw new Error(`No se pudieron aplicar las migraciones Prisma a la suite ${nombreSuite}: ${detalle || migracion.error?.message || "falló prisma migrate deploy"}`);
    }

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: baseUrl.href }, { schema }) });
    await prisma.$connect();
    await prisma.usuario.count();
    transferirConexion = true;
    return {
      prisma,
      schema,
      async sincronizarSecuencias() {
        for (const tabla of ["usuarios", "programas", "estudiantes", "plantillas_requisito", "solicitudes", "validaciones_requisito", "documentos_solicitud", "revisiones", "historial_estados", "auditoria"]) {
          await prisma.$queryRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${schema}"."${tabla}"', 'id'), COALESCE((SELECT MAX(id) FROM "${schema}"."${tabla}"), 1), EXISTS (SELECT 1 FROM "${schema}"."${tabla}"))`);
        }
      },
      async cerrar() {
        try {
          await prisma.$disconnect();
        } finally {
          try {
            await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
          } finally {
            await admin.end();
          }
        }
      },
    };
  } catch (error) {
    await prisma?.$disconnect().catch(() => {});
    if (schemaCreado) await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => {});
    throw new Error(urlSegura(error.message));
  } finally {
    if (!transferirConexion) await admin.end().catch(() => {});
  }
}

module.exports = { crearBasePostgresSuite, validarDestino };
