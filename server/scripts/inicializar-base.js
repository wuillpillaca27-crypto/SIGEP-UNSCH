const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

function inicializarBase() {
  require("dotenv").config({ path: resolve(__dirname, "../.env"), quiet: true });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL debe usar el esquema postgresql://.");
  }

  const directorioServidor = resolve(__dirname, "..");
  const prismaCli = resolve(directorioServidor, "node_modules/prisma/build/index.js");
  const resultado = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: directorioServidor,
    env: process.env,
    encoding: "utf8",
  });

  const ocultarUrl = (texto = "") => texto.replaceAll(databaseUrl, "[DATABASE_URL]");
  if (resultado.stdout) process.stdout.write(ocultarUrl(resultado.stdout));
  if (resultado.stderr) process.stderr.write(ocultarUrl(resultado.stderr));
  if (resultado.error) throw new Error(`No se pudo ejecutar Prisma Migrate: ${resultado.error.code ?? resultado.error.message}`);
  if (resultado.status !== 0) process.exitCode = resultado.status ?? 1;
}

if (require.main === module) inicializarBase();

module.exports = { inicializarBase };
