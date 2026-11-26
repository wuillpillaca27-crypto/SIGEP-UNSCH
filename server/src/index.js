require("dotenv").config();
const { resolve } = require("node:path");
const { readFileSync } = require("node:fs");
const cors = require("cors");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("../openapi.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { leerNormativa, registrarCatalogo } = require("./catalogo-grados");
const { registrarIdentidad } = require("./identidad");
const { registrarSolicitudes } = require("./solicitudes");
const { registrarRevision } = require("./revision-grados");
const { registrarVerificacion } = require("./verificacion-documentos");
const { registrarAdministracion } = require("./administracion");

const url = process.env.DATABASE_URL;
if (!url?.startsWith("postgresql://")) {
  throw new Error("DATABASE_URL debe usar el esquema postgresql://.");
}

const schema = new URL(url).searchParams.get("schema") ?? undefined;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }, { schema }) });
const app = express();
const origenes = (process.env.CLIENT_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",").map((valor) => valor.trim());
const erroresBaseDatos = new Set([
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN",
  "P1000", "P1001", "P1002", "P1003", "P1008", "P1010", "P1017", "P2021", "P2022", "P2024",
  "28P01", "3D000", "42P01", "53300", "57P01", "PrismaClientInitializationError",
]);

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
app.get("/api/salud", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  await prisma.programa.findFirst({ select: { id: true } });
  return res.json({ estado: "disponible", baseDatos: "disponible" });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));
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
app.use("/api", (_req, res) => res.status(404).json({ codigo: "RUTA_INEXISTENTE", error: "La ruta de la API no existe" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.too.large") return res.status(413).json({ error: "El archivo o solicitud supera el tamaño permitido" });
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "La solicitud tiene un formato inválido" });
  if (error.status === 404) return res.status(404).json({ error: "Archivo no encontrado" });
  const codigo = error.code ?? error.name;
  console.error("Error de la API SIGEP", req.method, req.route?.path ?? "sin ruta", codigo);
  if (erroresBaseDatos.has(codigo)) {
    return res.status(503).json({ codigo: "BASE_DATOS_NO_DISPONIBLE", error: "PostgreSQL no está disponible o su esquema requiere configuración" });
  }
  return res.status(500).json({ codigo: "ERROR_INTERNO", error: "La API no pudo completar la operación por un error interno" });
});

const puerto = Number(process.env.PORT ?? 8000);
app.listen(puerto, process.env.HOST ?? "127.0.0.1", () => {
  console.log(`API SIGEP disponible en el puerto ${puerto}`);
});
