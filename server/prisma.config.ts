import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl = env("DATABASE_URL");
if (!databaseUrl.startsWith("postgresql://")) {
  throw new Error("DATABASE_URL debe usar el esquema postgresql://.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: databaseUrl },
});
