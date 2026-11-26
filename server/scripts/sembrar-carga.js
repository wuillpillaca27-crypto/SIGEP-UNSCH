const { PrismaClient, Rol } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const TAMANO_LOTE = 1000;
const TOTAL_DEFAULT = 20000;

class RollbackVerificado extends Error {
  constructor(resumen) {
    super("Carga y CRUD verificados; rollback solicitado.");
    this.resumen = resumen;
  }
}

function parsearArgumentos(argumentos) {
  const opciones = { count: TOTAL_DEFAULT, runId: Date.now().toString(36), rollback: false };
  for (let indice = 0; indice < argumentos.length; indice += 1) {
    const argumento = argumentos[indice];
    if (argumento === "--rollback") opciones.rollback = true;
    else if (argumento === "--count") opciones.count = Number(argumentos[++indice]);
    else if (argumento.startsWith("--count=")) opciones.count = Number(argumento.slice("--count=".length));
    else if (argumento === "--run-id") opciones.runId = argumentos[++indice];
    else if (argumento.startsWith("--run-id=")) opciones.runId = argumento.slice("--run-id=".length);
    else if (argumento === "--help") opciones.help = true;
    else throw new Error(`Argumento desconocido: ${argumento}`);
  }
  if (!Number.isSafeInteger(opciones.count) || opciones.count < 1 || opciones.count > 20000) {
    throw new Error("--count debe ser un entero entre 1 y 20000.");
  }
  if (!/^[a-zA-Z0-9_-]{1,30}$/.test(opciones.runId)) {
    throw new Error("--run-id solo admite letras, números, guion y guion bajo (máximo 30 caracteres).");
  }
  return opciones;
}

function validarDestino(url) {
  if (!url?.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL debe usar el esquema postgresql://.");
  }
  const destino = new URL(url);
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(destino.hostname)) {
    throw new Error("La siembra solo se permite contra PostgreSQL local fuera de producción.");
  }
}

async function sembrarCarga(argumentos = process.argv.slice(2)) {
  require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env"), quiet: true });
  const opciones = parsearArgumentos(argumentos);
  if (opciones.help) {
    console.log("Uso: npm run db:seed:load -- [--count 20000] [--run-id id] [--rollback]");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  validarDestino(databaseUrl);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const prefijo = `sigep-load-${opciones.runId}-`;
  let resumen;

  try {
    resumen = await prisma.$transaction(async (tx) => {
      const previos = await tx.usuario.count({ where: { email: { startsWith: prefijo } } });
      if (previos !== 0) throw new Error("El run-id ya existe; usa otro para evitar duplicar la siembra.");

      let insertados = 0;
      const instante = new Date();
      for (let inicio = 0; inicio < opciones.count; inicio += TAMANO_LOTE) {
        const fin = Math.min(inicio + TAMANO_LOTE, opciones.count);
        const lote = Array.from({ length: fin - inicio }, (_, desplazamiento) => {
          const numero = inicio + desplazamiento + 1;
          return {
            nombres: `Carga${numero}`,
            apellidos: "SIGEP Prueba",
            dni: String(9000000000 + numero),
            email: `${prefijo}${numero}@load.test`,
            password: "HASH_NO_AUTENTICABLE_CARGA",
            rol: Rol.estudiante,
            activo: true,
            creadoEn: instante,
            actualizadoEn: instante,
          };
        });
        const resultado = await tx.usuario.createMany({ data: lote });
        insertados += resultado.count;
      }

      const total = await tx.usuario.count({ where: { email: { startsWith: prefijo } } });
      if (insertados !== opciones.count || total !== opciones.count) {
        throw new Error(`Conteo de carga inconsistente: esperados ${opciones.count}, insertados ${insertados}, leídos ${total}.`);
      }

      const probe = await tx.usuario.create({
        data: {
          nombres: "Carga CRUD",
          apellidos: "SIGEP Prueba",
          dni: String(9000000000 + opciones.count + 1),
          email: `${prefijo}probe@load.test`,
          password: "HASH_NO_AUTENTICABLE_CARGA",
          rol: Rol.estudiante,
        },
      });
      const lectura = await tx.usuario.findUnique({ where: { id: probe.id }, select: { email: true } });
      const actualizacion = await tx.usuario.update({
        where: { id: probe.id }, data: { nombres: "Carga CRUD actualizada" }, select: { nombres: true },
      });
      await tx.usuario.delete({ where: { id: probe.id } });
      const eliminado = await tx.usuario.findUnique({ where: { id: probe.id }, select: { id: true } });
      if (lectura?.email !== `${prefijo}probe@load.test` || actualizacion.nombres !== "Carga CRUD actualizada" || eliminado) {
        throw new Error("La verificación CRUD sintética no produjo los resultados esperados.");
      }
      const resultado = { runId: opciones.runId, requested: opciones.count, inserted: insertados, verified: total, crud: "passed" };
      if (opciones.rollback) throw new RollbackVerificado(resultado);
      return resultado;
    }, { maxWait: 10000, timeout: 120000 });
  } catch (error) {
    if (!opciones.rollback || !(error instanceof RollbackVerificado)) throw error;
    resumen = error.resumen;
  } finally {
    await prisma.$disconnect();
  }

  console.log(JSON.stringify({ ...resumen, persisted: !opciones.rollback }));
}

if (require.main === module) {
  sembrarCarga().catch((error) => {
    console.error(JSON.stringify({ error: error.name, detail: error.message.replace(/postgresql:\/\/[^\s"']+/gi, "[DATABASE_URL]") }));
    process.exitCode = 1;
  });
}

module.exports = { parsearArgumentos, sembrarCarga, validarDestino };
