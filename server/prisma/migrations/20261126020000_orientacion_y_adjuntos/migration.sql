ALTER TABLE "documentos_solicitud" ADD COLUMN "retiradoEn" TIMESTAMP(3);

CREATE TABLE "consultas_orientacion" (
    "id" SERIAL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "tipoTramite" "TipoTramite",
    "programa" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respuesta" TEXT,
    "respondidaEn" TIMESTAMP(3),
    "respondidaPorId" INTEGER REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "consultas_orientacion_codigo_key" ON "consultas_orientacion"("codigo");
CREATE INDEX "consultas_orientacion_creadoEn_id_idx" ON "consultas_orientacion"("creadoEn", "id");
