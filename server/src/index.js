require("dotenv").config();
const { resolve } = require("node:path");
const { readFileSync } = require("node:fs");
const { pathToFileURL } = require("node:url");
const cors = require("cors");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const { leerNormativa, registrarCatalogo } = require("./catalogo-grados");
const { registrarIdentidad } = require("./identidad");
const { registrarSolicitudes } = require("./solicitudes");
const { registrarRevision } = require("./revision-grados");
const { registrarVerificacion } = require("./verificacion-documentos");
const { registrarAdministracion } = require("./administracion");

const url = process.env.DATABASE_URL;
if (!url?.startsWith("file:")) {
  throw new Error("DATABASE_URL debe señalar la base SQLite configurada para SIGEP.");
}

const ubicacion = url.slice("file:".length);
const databaseUrl = url.startsWith("file://") ? url : pathToFileURL(resolve(ubicacion)).href;
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
const app = express();
const origenes = (process.env.CLIENT_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",").map((valor) => valor.trim());

app.disable("x-powered-by");
app.use(cors({ origin: origenes }));
app.use("/api", (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origen = req.get("origin");
    if (req.get("sec-fetch-site") === "cross-site" || (origen && !origenes.includes(origen))) {
      return res.status(403).json({ error: "Origen de solicitud no autorizado" });
    }
  }
  next();
});
app.use(express.json({ limit: "32kb" }));
const normativa = process.env.SIGEP_NORMATIVA_PATH
  ? leerNormativa(readFileSync(process.env.SIGEP_NORMATIVA_PATH, "utf8"))
  : undefined;
registrarCatalogo(app, prisma, normativa);
const secreto = process.env.SIGEP_JWT_SECRET;
if (secreto && Buffer.byteLength(secreto) < 32) throw new Error("SIGEP_JWT_SECRET debe tener al menos 32 bytes.");
const autenticar = registrarIdentidad(app, prisma, secreto);
const directorio = resolve(process.env.SIGEP_UPLOAD_DIR ?? "uploads/documentos");
registrarSolicitudes(app, prisma, autenticar, directorio);
registrarRevision(app, prisma, autenticar, directorio);
registrarAdministracion(app, prisma, autenticar);
registrarVerificacion(app, prisma, { demostracion: process.env.SIGEP_DEMOSTRACION === "1" });
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.too.large") return res.status(413).json({ error: "El archivo o solicitud supera el tamaño permitido" });
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "La solicitud tiene un formato inválido" });
  if (error.status === 404) return res.status(404).json({ error: "Archivo no encontrado" });
  console.error("Error de la API SIGEP", error.code ?? error.name);
  return res.status(503).json({ error: "El servicio no está disponible en este momento" });
});

const puerto = Number(process.env.PORT ?? 8000);
app.listen(puerto, process.env.HOST ?? "127.0.0.1", () => {
  console.log(`API SIGEP disponible en el puerto ${puerto}`);
});
