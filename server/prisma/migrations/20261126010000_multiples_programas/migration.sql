ALTER TABLE "estudiantes"
  ADD COLUMN "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "fechaFin" TIMESTAMP(3),
  ADD COLUMN "habilitadoTramites" BOOLEAN NOT NULL DEFAULT true;

UPDATE "estudiantes" SET "fechaInicio" = "creadoEn";

CREATE UNIQUE INDEX "estudiantes_usuarioId_programaId_key" ON "estudiantes"("usuarioId", "programaId");
DROP INDEX "estudiantes_usuarioId_key";
