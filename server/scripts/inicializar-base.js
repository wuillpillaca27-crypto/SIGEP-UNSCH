const { DatabaseSync } = require("node:sqlite");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { fileURLToPath } = require("node:url");

function inicializarBase(ruta) {
  const base = new DatabaseSync(ruta);
  try {
    const version = base.prepare("PRAGMA user_version").get().user_version;
    if (version === 1) return;
    if (version !== 0 || base.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table'").get()) {
      throw new Error("La base contiene un esquema preexistente. No se modificó.");
    }
    const sql = readFileSync(resolve(__dirname, "../prisma/migrations/20261120000000_grados_titulos/migration.sql"), "utf8");
    base.exec(`BEGIN;\n${sql}\nPRAGMA user_version = 1;\nCOMMIT;`);
  } finally {
    base.close();
  }
}

if (require.main === module) {
  require("dotenv").config();
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) throw new Error("Configura DATABASE_URL con la ruta de una base SQLite nueva.");
  inicializarBase(url.startsWith("file://") ? fileURLToPath(url) : resolve(url.slice(5)));
  console.log("Esquema SQLite disponible.");
}

module.exports = { inicializarBase };
