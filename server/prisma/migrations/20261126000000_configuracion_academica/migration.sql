ALTER TABLE "usuarios" ADD COLUMN "puedeAprobar" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "configuraciones_tramite" (
    "programaId" INTEGER PRIMARY KEY REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "tipoTramite" "TipoTramite" NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "fuente" TEXT,
    "costos" TEXT,
    "plazos" TEXT,
    "procedimiento" TEXT
);

CREATE TABLE "cambios_academicos" (
    "id" SERIAL PRIMARY KEY,
    "programaId" INTEGER NOT NULL REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "usuarioId" INTEGER NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "accion" TEXT NOT NULL,
    "detalles" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "cambios_academicos_programaId_id_idx" ON "cambios_academicos"("programaId", "id");
