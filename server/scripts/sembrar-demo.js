require("dotenv").config({ quiet: true });
const { randomBytes } = require("node:crypto");
const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { facultadDemostracion, facultadesDemostracion } = require("../src/datos-demostracion");
const { tipoPorPrograma } = require("../src/solicitudes");

const tipos = Object.entries({
  maestria: "Maestría", doctorado: "Doctorado", segunda_especialidad: "Segunda Especialidad",
  diplomado: "Diplomado", certificacion_modulos: "Certificación por Módulos",
});

async function sembrar() {
  const url = new URL(process.env.DATABASE_URL);
  if (process.env.NODE_ENV !== "development" || url.protocol !== "postgresql:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("La siembra requiere PostgreSQL local y NODE_ENV=development.");
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }, { schema: url.searchParams.get("schema") ?? undefined }) });
  const carpeta = resolve(__dirname, "../.sigep-local");
  const archivo = resolve(carpeta, "cuentas-academicas.tsv");
  mkdirSync(carpeta, { recursive: true });
  const previas = new Map();
  try {
    for (const linea of readFileSync(archivo, "utf8").trim().split("\n").slice(1)) {
      previas.set(linea.split("\t")[0], linea);
    }
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  try {
    const filas = await prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext('sigep.demo.seed'), 0)`;
      const resultados = [];
      async function cuenta(clave, indice, rol, registros = [], email = `${clave}@academico.demo.sigep.test`) {
        const dni = String(99008000 + indice);
        const previa = await db.usuario.findUnique({ where: { email }, select: { id: true } });
        if (previa) {
          for (const { programaId, codigoUniv } of registros) {
            await db.estudiante.upsert({
              where: { usuarioId_programaId: { usuarioId: previa.id, programaId } },
              create: { usuarioId: previa.id, programaId, codigoUniv }, update: {},
            });
          }
          if (previas.has(clave)) resultados.push(previas.get(clave));
          return;
        }
        const password = randomBytes(15).toString("base64url");
        await db.usuario.create({ data: {
          nombres: "Cuenta", apellidos: `Demostración ${clave}`, dni, email, rol, password: await bcrypt.hash(password, 10),
          ...(registros.length && { estudiantes: { create: registros } }),
          ...(clave === "autoridad" && { puedeAprobar: true }),
        } });
        resultados.push([clave, rol, dni, email, password].join("\t"));
      }
      const multiples = [];
      for (const [indice, [tipo, nombre]] of tipos.entries()) {
        const tramite = tipoPorPrograma[tipo];
        const codigo = `DEMO-ACA-${tipo}`;
        const previa = await db.plantillaRequisito.findUnique({ where: { codigo }, select: { programaId: true } });
        const heredado = previa ? null : await db.programa.findFirst({
          where: { tipo, facultad: { in: facultadesDemostracion }, plantillasRequisito: { some: { codigo: { startsWith: "DEMO-" } } } },
          orderBy: { id: "asc" }, select: { id: true },
        });
        const datos = { nombre: `${nombre} de demostración`, facultad: facultadDemostracion, tipo, activo: true };
        const existente = previa?.programaId ?? heredado?.id;
        const programa = existente ? await db.programa.update({ where: { id: existente }, data: datos })
          : await db.programa.create({ data: datos });
        await db.plantillaRequisito.updateMany({
          where: { programaId: programa.id, codigo: { startsWith: "DEMO-" }, versionNorm: "Demostraci?n" },
          data: { versionNorm: "Demostración", nombre: "PDF de demostración", descripcion: "Documento de prueba sin validez institucional." },
        });
        const requisito = { programaId: programa.id, tipoTramite: tramite, codigo, tipo: "documental", nombre: "PDF de prueba",
          descripcion: "Adjunta un PDF sin datos personales para comprobar el flujo de demostración.", versionNorm: "Demostración", activo: true };
        if (!heredado) await db.plantillaRequisito.upsert({ where: { codigo }, create: requisito, update: {} });
        const ejemplos = [
          { sufijo: "ACADEMICO", tipo: "academico", nombre: "Revisión de créditos de demostración",
            descripcion: "Ejemplo para consultar el avance en el plan de estudios durante la prueba." },
          { sufijo: "OPCIONAL", tipo: "documental", nombre: "PDF complementario de demostración",
            descripcion: "Archivo opcional para probar la carga de documentos adicionales." },
        ];
        for (const { sufijo, ...ejemplo } of ejemplos) {
          const codigoEjemplo = `DEMO-${sufijo}-${tipo}`;
          await db.plantillaRequisito.upsert({ where: { codigo: codigoEjemplo }, update: {},
            create: { ...requisito, ...ejemplo, codigo: codigoEjemplo, obligatorio: false } });
        }
        await cuenta(tipo, indice + 1, "estudiante", [{ programaId: programa.id, codigoUniv: `DEMO-ACA-${indice + 1}` }]);
        multiples.push({ programaId: programa.id, codigoUniv: `DEMO-MULTI-${indice + 1}` });
      }
      await cuenta("multiprograma", 6, "estudiante", multiples);
      await cuenta("integral", 7, "estudiante", multiples.map(({ programaId, codigoUniv }) => ({
        programaId, codigoUniv: codigoUniv.replace("DEMO-MULTI-", "DEMO-INTEGRAL-"),
      })), "estudiante.integral@demo.test");
      await cuenta("administracion", 10, "administrador");
      await cuenta("revision", 11, "operador");
      await cuenta("autoridad", 12, "operador");
      return resultados;
    }, { timeout: 30000 });
    writeFileSync(archivo, "Cuenta\tRol\tDNI\tCorreo\tContraseña\n" + filas.join("\n") + "\n", { mode: 0o600 });
    console.log("Demostraciones preparadas. Consulta server/.sigep-local/cuentas-academicas.tsv.");
  } finally {
    await prisma.$disconnect();
  }
}
sembrar().catch((error) => { console.error("No se pudo preparar la demostración:", error.code ?? error.name); process.exitCode = 1; });
