-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'estudiante',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "programas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "facultad" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "codigoUniv" TEXT NOT NULL,
    "programaId" INTEGER NOT NULL,
    "telefono" TEXT,
    "estadoAcad" TEXT NOT NULL DEFAULT 'activo',
    "creditosAprobados" INTEGER NOT NULL DEFAULT 0,
    "promedioGeneral" REAL NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "estudiantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "estudiantes_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plantillas_requisito" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "programaId" INTEGER NOT NULL,
    "tipoTramite" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "versionNorm" TEXT NOT NULL DEFAULT '1.0',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plantillas_requisito_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "tipoTramite" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "observaciones" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "presentadoEn" DATETIME,
    "aprobadoEn" DATETIME,
    CONSTRAINT "solicitudes_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "validaciones_requisito" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "plantillaId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "evidencia" TEXT,
    "observacion" TEXT,
    "validadoPor" INTEGER,
    "validadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "validaciones_requisito_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "validaciones_requisito_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "plantillas_requisito" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "validaciones_requisito_validadoPor_fkey" FOREIGN KEY ("validadoPor") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos_solicitud" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDoc" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "subidoPor" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reemplazadoPor" INTEGER,
    CONSTRAINT "documentos_solicitud_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "documentos_solicitud_subidoPor_fkey" FOREIGN KEY ("subidoPor") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revisiones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "revisorId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "comentario" TEXT,
    "estadoAntes" TEXT NOT NULL,
    "estadoDespues" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revisiones_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "revisiones_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historial_estados" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "estadoAntes" TEXT,
    "estadoDespues" TEXT NOT NULL,
    "motivo" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historial_estados_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" INTEGER NOT NULL,
    "detalles" TEXT,
    "ip" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auditoria_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_usuarioId_key" ON "estudiantes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_codigoUniv_key" ON "estudiantes"("codigoUniv");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_requisito_codigo_key" ON "plantillas_requisito"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_codigo_key" ON "solicitudes"("codigo");

