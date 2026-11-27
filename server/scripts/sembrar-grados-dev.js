require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env"), quiet: true });

const { randomBytes } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } = require("node:fs");
const { homedir } = require("node:os");
const { dirname, isAbsolute, join, relative, resolve, sep } = require("node:path");
const bcrypt = require("bcryptjs");
const { Client: PgClient } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const FACULTAD_DEMO = "Entorno local de demostración";
const DEFINICIONES = Object.freeze({
  programas: Object.freeze([
    Object.freeze({
      clave: "maestria", tipo: "maestria", tipoTramite: "grado_maestro",
      nombre: "SIGEP DEV | Maestría de prueba", codigoRequisito: "SIGEP-DEV-REQ-MAESTRIA",
      codigoUniv: "SIGEP-DEV-MAT-001", cuenta: "ESTUDIANTE_MAESTRIA",
    }),
    Object.freeze({
      clave: "doctorado", tipo: "doctorado", tipoTramite: "grado_doctor",
      nombre: "SIGEP DEV | Doctorado de prueba", codigoRequisito: "SIGEP-DEV-REQ-DOCTORADO",
      codigoUniv: "SIGEP-DEV-MAT-002", cuenta: "ESTUDIANTE_DOCTORADO",
    }),
    Object.freeze({
      clave: "segunda_especialidad", tipo: "segunda_especialidad", tipoTramite: "titulo_segunda_especialidad",
      nombre: "SIGEP DEV | Segunda especialidad de prueba", codigoRequisito: "SIGEP-DEV-REQ-SEGUNDA-ESPECIALIDAD",
      codigoUniv: "SIGEP-DEV-MAT-003", cuenta: "ESTUDIANTE_SEGUNDA_ESPECIALIDAD",
    }),
  ]),
  cuentas: Object.freeze([
    Object.freeze({ clave: "ESTUDIANTE_MAESTRIA", rol: "estudiante", nombres: "Estudiante Prueba Maestría", apellidos: "SIGEP Desarrollo", dni: "98000101", email: "estudiante.maestria@sigep-dev.test", programa: "maestria" }),
    Object.freeze({ clave: "ESTUDIANTE_DOCTORADO", rol: "estudiante", nombres: "Estudiante Prueba Doctorado", apellidos: "SIGEP Desarrollo", dni: "98000102", email: "estudiante.doctorado@sigep-dev.test", programa: "doctorado" }),
    Object.freeze({ clave: "ESTUDIANTE_SEGUNDA_ESPECIALIDAD", rol: "estudiante", nombres: "Estudiante Prueba Especialidad", apellidos: "SIGEP Desarrollo", dni: "98000103", email: "estudiante.especialidad@sigep-dev.test", programa: "segunda_especialidad" }),
    Object.freeze({ clave: "ADMINISTRADOR", rol: "administrador", nombres: "Administrador SIGEP DEV", apellidos: "Cuenta de desarrollo", dni: "98000901", email: "administrador@sigep-dev.test" }),
    Object.freeze({ clave: "OPERADOR", rol: "operador", nombres: "Operador SIGEP DEV", apellidos: "Revisión de desarrollo", dni: "98000902", email: "operador@sigep-dev.test" }),
  ]),
});

const VARIABLES_PASSWORD = Object.freeze(Object.fromEntries(
  DEFINICIONES.cuentas.map(({ clave }) => [clave, `SIGEP_DEV_PASSWORD_${clave}`]),
));

function validarDestino(databaseUrl, nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv !== "development") {
    throw new Error("SIGEP_DEV_SOLO_DESARROLLO: define NODE_ENV=development para la siembra local.");
  }
  let url;
  try { url = new URL(databaseUrl); } catch {
    throw new Error("SIGEP_DEV_URL_INVALIDA: DATABASE_URL no es una URL válida.");
  }
  const host = url.hostname.toLowerCase();
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  let database;
  try { database = decodeURIComponent(url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname); } catch {
    throw new Error("SIGEP_DEV_URL_INVALIDA: el nombre de base no es válido.");
  }
  const parametrosPeligrosos = ["host", "hostaddr", "port", "dbname", "database", "options"];
  if (url.protocol !== "postgresql:" || !loopback || database !== "sigep_dev" ||
      parametrosPeligrosos.some((parametro) => url.searchParams.has(parametro))) {
    throw new Error("SIGEP_DEV_DESTINO_RECHAZADO: solo se permite PostgreSQL local con base sigep_dev.");
  }
  return { host, database, schema: url.searchParams.get("schema") ?? undefined };
}

function rutaCredenciales(entorno = process.env, raizRepo = resolve(__dirname, "../..")) {
  const baseUsuario = entorno.LOCALAPPDATA || entorno.XDG_CONFIG_HOME || join(homedir(), ".config");
  return validarRutaCredenciales(
    resolve(entorno.SIGEP_DEV_CREDENTIALS_FILE || join(baseUsuario, "SIGEP-UNSCH", "credenciales-sigep-dev.json")),
    raizRepo,
  );
}

function estaDentroDe(ruta, directorio) {
  const relativo = relative(directorio, ruta);
  return relativo === "" || (relativo !== ".." && !relativo.startsWith(`..${sep}`) && !isAbsolute(relativo));
}

function validarRutaCredenciales(archivo, raizRepo) {
  const ruta = resolve(archivo);
  const repo = realpathSync(resolve(raizRepo));
  if (estaDentroDe(ruta, resolve(raizRepo))) {
    throw new Error("SIGEP_DEV_RUTA_CREDENCIALES_RECHAZADA: el archivo de claves debe quedar fuera del repositorio.");
  }
  let ancestro = dirname(ruta);
  while (!existsSync(ancestro)) {
    const padre = dirname(ancestro);
    if (padre === ancestro) break;
    ancestro = padre;
  }
  const destinoReal = resolve(realpathSync(ancestro), relative(ancestro, ruta));
  if (estaDentroDe(destinoReal, repo)) {
    throw new Error("SIGEP_DEV_RUTA_CREDENCIALES_RECHAZADA: el archivo de claves debe quedar fuera del repositorio.");
  }
  return ruta;
}

function leerPasswordGuardada(archivo) {
  try {
    const contenido = JSON.parse(readFileSync(archivo, "utf8"));
    if (contenido?.version !== 1 || typeof contenido.passwords !== "object" || !contenido.passwords) {
      throw new Error("formato");
    }
    return contenido.passwords;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error("SIGEP_DEV_ARCHIVO_CREDENCIALES_INVALIDO: revisa el archivo externo de credenciales.");
  }
}

function validarPassword(password) {
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("SIGEP_DEV_PASSWORD_INVALIDA: cada contraseña debe tener entre 12 y 72 bytes UTF-8.");
  }
}

function obtenerCredenciales(entorno = process.env, archivo = undefined, raizRepo = resolve(__dirname, "../..")) {
  const ruta = archivo ? validarRutaCredenciales(archivo, raizRepo) : rutaCredenciales(entorno, raizRepo);
  const guardadas = leerPasswordGuardada(ruta);
  const passwords = {};
  const guardadasSiguientes = { ...guardadas };
  let generadas = false;

  for (const { clave } of DEFINICIONES.cuentas) {
    const variable = VARIABLES_PASSWORD[clave];
    const configurada = entorno[variable] || entorno.SIGEP_DEV_PASSWORD;
    if (configurada !== undefined && configurada !== "") {
      validarPassword(configurada);
      passwords[clave] = configurada;
      delete guardadasSiguientes[clave];
    } else if (guardadas[clave]) {
      validarPassword(guardadas[clave]);
      passwords[clave] = guardadas[clave];
    } else {
      passwords[clave] = randomBytes(24).toString("base64url");
      guardadasSiguientes[clave] = passwords[clave];
      generadas = true;
    }
  }

  const hayGuardadas = Object.keys(guardadasSiguientes).length > 0;
  if (generadas || Object.keys(guardadas).length !== Object.keys(guardadasSiguientes).length) {
    mkdirSync(dirname(ruta), { recursive: true, mode: 0o700 });
    const temporal = `${ruta}.${process.pid}.tmp`;
    writeFileSync(temporal, `${JSON.stringify({ version: 1, passwords: hayGuardadas ? guardadasSiguientes : {} }, null, 2)}\n`, { mode: 0o600, flag: "w" });
    chmodSync(temporal, 0o600);
    renameSync(temporal, ruta);
    chmodSync(ruta, 0o600);
  }
  return { passwords, archivo: hayGuardadas ? ruta : null };
}

function ejecutarMigraciones(directorioServidor) {
  const prismaCli = resolve(directorioServidor, "node_modules/prisma/build/index.js");
  try {
    execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
      cwd: directorioServidor,
      env: process.env,
      stdio: "pipe",
      timeout: 120000,
    });
  } catch (error) {
    const codigo = typeof error.status === "number" ? error.status : "fallo";
    throw new Error(`SIGEP_DEV_MIGRACION_FALLIDA: Prisma migrate deploy terminó con ${codigo}.`);
  }
}

async function crearBaseSiFalta(databaseUrl, ClientePostgres = PgClient) {
  validarDestino(databaseUrl, process.env.NODE_ENV);
  const mantenimiento = new URL(databaseUrl);
  mantenimiento.pathname = "/postgres";
  mantenimiento.searchParams.delete("schema");
  const client = new ClientePostgres({ connectionString: mantenimiento.href, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query("SELECT pg_advisory_lock(hashtext($1), 0)", ["sigep.dev.database"]);
    const existente = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", ["sigep_dev"]);
    if (existente.rowCount === 0) {
      await client.query('CREATE DATABASE "sigep_dev"');
      return "creada";
    }
    return "existente";
  } catch (error) {
    if (error.code === "42P04") return "existente";
    const codigo = typeof error.code === "string" && /^[A-Z0-9_]{1,32}$/.test(error.code) ? error.code : "fallo";
    throw new Error(`SIGEP_DEV_BASE_NO_DISPONIBLE: no se pudo preparar sigep_dev (${codigo}).`);
  } finally {
    try { await client.query("SELECT pg_advisory_unlock(hashtext($1), 0)", ["sigep.dev.database"]); } catch {}
    try { await client.end(); } catch {}
  }
}

async function reconciliarPrograma(tx, definicion) {
  const existente = await tx.programa.findFirst({ where: { tipo: definicion.tipo, nombre: definicion.nombre }, select: { id: true } });
  const datos = { nombre: definicion.nombre, tipo: definicion.tipo, facultad: FACULTAD_DEMO, activo: true };
  const programa = existente
    ? await tx.programa.update({ where: { id: existente.id }, data: datos })
    : await tx.programa.create({ data: datos });

  await tx.configuracionTramite.upsert({
    where: { programaId: programa.id },
    create: { programaId: programa.id, tipoTramite: definicion.tipoTramite, habilitado: true, fuente: "Fixture local SIGEP-DEV; sin validez oficial.", costos: null, plazos: null, procedimiento: "Recorrido sintético para pruebas locales." },
    update: { tipoTramite: definicion.tipoTramite, habilitado: true, fuente: "Fixture local SIGEP-DEV; sin validez oficial.", costos: null, plazos: null, procedimiento: "Recorrido sintético para pruebas locales." },
  });

  const requisito = {
    programaId: programa.id,
    tipoTramite: definicion.tipoTramite,
    codigo: definicion.codigoRequisito,
    nombre: "PDF de prueba para el trámite",
    descripcion: "Requisito documental sintético de desarrollo; no representa una exigencia oficial.",
    tipo: "documental",
    obligatorio: true,
    orden: 1,
    activo: true,
    versionNorm: "Demostración",
  };
  await tx.plantillaRequisito.upsert({ where: { codigo: definicion.codigoRequisito }, create: requisito, update: requisito });
  return programa;
}

async function reconciliarUsuario(tx, definicion, password, programas) {
  const [porCorreo, porDni] = await Promise.all([
    tx.usuario.findUnique({ where: { email: definicion.email }, select: { id: true, email: true, dni: true, rol: true, password: true } }),
    tx.usuario.findUnique({ where: { dni: definicion.dni }, select: { id: true, email: true, dni: true, rol: true } }),
  ]);
  if ((porDni && porDni.email !== definicion.email) || (porCorreo && porCorreo.rol !== definicion.rol)) {
    throw new Error("SIGEP_DEV_IDENTIDAD_EN_CONFLICTO: una clave reservada ya pertenece a otra identidad.");
  }

  const programa = definicion.programa ? programas[definicion.programa] : null;
  const matricula = DEFINICIONES.programas.find(({ clave }) => clave === definicion.programa);
  const hash = porCorreo && await bcrypt.compare(password, porCorreo.password)
    ? porCorreo.password
    : await bcrypt.hash(password, 12);
  const datosUsuario = {
    nombres: definicion.nombres,
    apellidos: definicion.apellidos,
    dni: definicion.dni,
    email: definicion.email,
    password: hash,
    rol: definicion.rol,
    activo: true,
    puedeAprobar: definicion.rol === "administrador",
  };
  const usuario = porCorreo
    ? await tx.usuario.update({ where: { id: porCorreo.id }, data: datosUsuario })
    : await tx.usuario.create({ data: datosUsuario });

  if (programa) {
    const existente = await tx.estudiante.findUnique({ where: { usuarioId_programaId: { usuarioId: usuario.id, programaId: programa.id } } });
    const porCodigo = await tx.estudiante.findUnique({ where: { codigoUniv: matricula.codigoUniv } });
    const otrasMatriculas = await tx.estudiante.findMany({ where: { usuarioId: usuario.id, programaId: { not: programa.id } }, select: { id: true } });
    if ((porCodigo && porCodigo.usuarioId !== usuario.id) || otrasMatriculas.length > 0) {
      throw new Error("SIGEP_DEV_MATRICULA_EN_CONFLICTO: una clave reservada está asociada a otra cuenta o programa.");
    }
    const datosEstudiante = {
      usuarioId: usuario.id,
      programaId: programa.id,
      codigoUniv: matricula.codigoUniv,
      estadoAcad: "activo",
      habilitadoTramites: true,
    };
    if (existente) {
      await tx.estudiante.update({ where: { id: existente.id }, data: datosEstudiante });
    } else if (porCodigo) {
      await tx.estudiante.update({ where: { id: porCodigo.id }, data: datosEstudiante });
    } else {
      await tx.estudiante.create({ data: datosEstudiante });
    }
  } else if (await tx.estudiante.count({ where: { usuarioId: usuario.id } })) {
    throw new Error("SIGEP_DEV_ROL_EN_CONFLICTO: la cuenta administrativa no debe tener matrículas de estudiante.");
  }
}

async function sembrarDatos(prisma, passwords) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext('sigep.dev.seed'), 0)`;
    const programas = {};
    for (const definicion of DEFINICIONES.programas) {
      programas[definicion.clave] = await reconciliarPrograma(tx, definicion);
    }
    for (const cuenta of DEFINICIONES.cuentas) {
      await reconciliarUsuario(tx, cuenta, passwords[cuenta.clave], programas);
    }

    const resumen = {
      programas: await tx.programa.count({ where: { nombre: { in: DEFINICIONES.programas.map(({ nombre }) => nombre) } } }),
      estudiantes: await tx.usuario.count({ where: { email: { in: DEFINICIONES.cuentas.filter(({ rol }) => rol === "estudiante").map(({ email }) => email) }, rol: "estudiante" } }),
      matriculas: await tx.estudiante.count({ where: { codigoUniv: { in: DEFINICIONES.programas.map(({ codigoUniv }) => codigoUniv) } } }),
      administrador: await tx.usuario.count({ where: { email: "administrador@sigep-dev.test", rol: "administrador" } }),
      operador: await tx.usuario.count({ where: { email: "operador@sigep-dev.test", rol: "operador" } }),
      requisitos: await tx.plantillaRequisito.count({ where: { codigo: { in: DEFINICIONES.programas.map(({ codigoRequisito }) => codigoRequisito) } } }),
    };
    if (resumen.programas !== 3 || resumen.estudiantes !== 3 || resumen.matriculas !== 3 ||
        resumen.administrador !== 1 || resumen.operador !== 1 || resumen.requisitos !== 3) {
      throw new Error("SIGEP_DEV_CONTEO_INVALIDO: los conteos del fixture no coinciden con los esperados.");
    }
    return resumen;
  }, { isolationLevel: "Serializable", maxWait: 10000, timeout: 60000 });
}

async function sembrarGradosDev() {
  const databaseUrl = process.env.DATABASE_URL;
  const destino = validarDestino(databaseUrl);
  const base = await crearBaseSiFalta(databaseUrl);
  const credenciales = obtenerCredenciales();
  const directorioServidor = resolve(__dirname, "..");
  ejecutarMigraciones(directorioServidor);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }, { schema: destino.schema }),
  });
  try {
    const resumen = await sembrarDatos(prisma, credenciales.passwords);
    return { ...resumen, base, migraciones: "aplicadas", destino: "sigep_dev", credenciales: credenciales.archivo ? "guardadas_fuera_del_repositorio" : "configuradas_por_entorno" };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  sembrarGradosDev().then((resumen) => {
    console.log(JSON.stringify({ ok: true, ...resumen }));
    if (resumen.credenciales === "guardadas_fuera_del_repositorio") {
      console.log(`Credenciales generadas guardadas fuera del repositorio: ${rutaCredenciales()}`);
    }
  }).catch((error) => {
    const mensaje = typeof error.message === "string" && error.message.startsWith("SIGEP_DEV_")
      ? error.message
      : "SIGEP_DEV_ERROR: la siembra terminó sin completar; no se muestran detalles de conexión.";
    const codigo = typeof error.code === "string" && /^[A-Z0-9_]{1,32}$/.test(error.code)
      ? error.code
      : typeof error.name === "string" && /^[A-Za-z0-9_]{1,40}$/.test(error.name) ? error.name : "Error";
    console.error(JSON.stringify({ ok: false, error: mensaje, code: codigo }));
    process.exitCode = 1;
  });
}

module.exports = { DEFINICIONES, crearBaseSiFalta, obtenerCredenciales, rutaCredenciales, sembrarDatos, validarDestino };
