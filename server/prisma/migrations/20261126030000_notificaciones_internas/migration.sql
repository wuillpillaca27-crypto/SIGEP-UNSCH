CREATE TABLE "notificaciones" (
  "id" SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "solicitudId" INTEGER REFERENCES "solicitudes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "tipo" TEXT NOT NULL,
  "mensaje" TEXT NOT NULL,
  "leida" BOOLEAN NOT NULL DEFAULT false,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leidaEn" TIMESTAMP(3)
);

CREATE INDEX "notificaciones_usuarioId_leida_creadoEn_id_idx"
  ON "notificaciones"("usuarioId", "leida", "creadoEn", "id");
