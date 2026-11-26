const { randomBytes } = require("node:crypto");
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const { inicializarBase } = require("./inicializar-base");

async function preparar() {
  const carpeta = resolve(".sigep-local");
  mkdirSync(carpeta, { recursive: true });
  const ruta = resolve(carpeta, "grados.sqlite");
  inicializarBase(ruta);

  const configuracion = resolve(carpeta, ".env");
  const credenciales = resolve(carpeta, "cuentas.txt");
  const cuentas = [
    [1, "maestro", "maestria", "grado_maestro"],
    [2, "doctor", "doctorado", "grado_doctor"],
    [3, "especialidad", "segunda_especialidad", "titulo_segunda_especialidad"],
    [5, "diplomado", "diplomado", "certificado_diplomado"],
    [6, "modulos", "certificacion_modulos", "certificacion_modulos"],
  ];
  if (!existsSync(configuracion)) {
    const secreto = randomBytes(32).toString("hex");
    writeFileSync(configuracion, [
      `DATABASE_URL=${pathToFileURL(ruta).href}`,
      `SIGEP_JWT_SECRET=${secreto}`,
      `SIGEP_UPLOAD_DIR="${resolve(carpeta, "documentos").replaceAll("\\", "/")}"`,
    ].join("\n") + "\n", { flag: "wx", mode: 0o600 });
  }
  const claves = new Map(existsSync(credenciales)
    ? readFileSync(credenciales, "utf8").trim().split(/\r?\n/).filter(Boolean).map((linea) => linea.split(" "))
    : []);
  const nuevas = [...cuentas.map(([, nombre]) => nombre), "revision"].map((nombre) => `${nombre}@sigep.test`).filter((email) => !claves.has(email));
  if (nuevas.length) {
    for (const email of nuevas) claves.set(email, randomBytes(12).toString("base64url"));
    writeFileSync(credenciales, [...claves].map((entrada) => entrada.join(" ")).join("\n") + "\n", { mode: 0o600 });
  }
  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: pathToFileURL(ruta).href }) });
  try {
    const existentes = await prisma.usuario.findMany({ where: { email: { in: [...claves.keys()] } }, select: { email: true } });
    const registradas = new Set(existentes.map(({ email }) => email));
    const faltantes = [...claves].filter(([email]) => !registradas.has(email));
    const hashes = new Map(await Promise.all(faltantes.map(async ([correo, clave]) => [correo, await bcrypt.hash(clave, 10)])));
    await prisma.$transaction(async (db) => {
      for (const [indice, nombre, tipo, tipoTramite] of cuentas) {
        const email = `${nombre}@sigep.test`;
        if (!hashes.has(email) || await db.usuario.findUnique({ where: { email } })) continue;
        const programa = await db.programa.create({ data: {
          nombre: `Programa de demostración · ${nombre}`, tipo, facultad: "Entorno local de demostración",
        } });
        await db.plantillaRequisito.create({ data: {
          programaId: programa.id, tipoTramite, codigo: `DEMO-${nombre}`, nombre: "PDF de ejemplo",
          descripcion: "Adjunta un PDF sin datos personales para probar la solicitud. Este archivo no es un requisito oficial.",
          tipo: "documental", versionNorm: "Demostración",
        } });
        await db.usuario.create({ data: {
          nombres: "Estudiante", apellidos: `Demo ${nombre}`, dni: String(indice).padStart(8, "0"),
          email, password: hashes.get(email),
          estudiante: { create: { codigoUniv: `DEMO-${indice}`, programaId: programa.id } },
        } });
      }
      if (hashes.has("revision@sigep.test") && !await db.usuario.findUnique({ where: { email: "revision@sigep.test" } })) await db.usuario.create({ data: {
        nombres: "Revisión", apellidos: "Demo", dni: "00000004", email: "revision@sigep.test",
        password: hashes.get("revision@sigep.test"), rol: "administrador",
      } });
      const estudiante = await db.estudiante.findFirst({
        where: { usuario: { email: "doctor@sigep.test" }, codigoUniv: "DEMO-2" },
        select: { id: true, usuarioId: true, programaId: true },
      });
      const codigo = "SIGEP-DEMO-DOCTOR";
      if (estudiante && !await db.solicitud.findUnique({ where: { codigo } })) {
        const fecha = new Date();
        await db.solicitud.create({ data: {
          codigo,
          estudianteId: estudiante.id,
          usuarioId: estudiante.usuarioId,
          programaId: estudiante.programaId,
          tipoTramite: "grado_doctor",
          estado: "emitido",
          presentadoEn: fecha,
          aprobadoEn: fecha,
          historial: { create: { estadoDespues: "emitido", motivo: "Registro local de demostración" } },
        } });
      }
    });
  } finally {
    await prisma.$disconnect();
    console.log(`Credenciales locales: ${credenciales}`);
  }
}

preparar().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
