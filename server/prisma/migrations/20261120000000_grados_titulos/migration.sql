-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('administrador', 'operador', 'docente', 'estudiante');

-- CreateEnum
CREATE TYPE "TipoPrograma" AS ENUM ('maestria', 'doctorado', 'segunda_especialidad', 'diplomado', 'certificacion_modulos');

-- CreateEnum
CREATE TYPE "EstadoAcademico" AS ENUM ('activo', 'egresado', 'graduado', 'suspendido', 'retirado');

-- CreateEnum
CREATE TYPE "TipoTramite" AS ENUM ('grado_maestro', 'grado_doctor', 'titulo_segunda_especialidad', 'certificado_diplomado', 'certificacion_modulos');

-- CreateEnum
CREATE TYPE "TipoRequisito" AS ENUM ('academico', 'documental', 'pago', 'idioma', 'otro');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('borrador', 'presentado', 'en_revision', 'observado', 'validado', 'pendiente_aprobacion', 'aprobado', 'en_emision', 'emitido', 'rechazado', 'desistido', 'anulado');

-- CreateEnum
CREATE TYPE "EstadoValidacion" AS ENUM ('cumplido', 'pendiente', 'observado', 'en_revision', 'no_aplica');

-- CreateEnum
CREATE TYPE "AccionRevision" AS ENUM ('presentar', 'iniciar_revision', 'observar', 'validar', 'aprobar', 'rechazar', 'solicitar_subsanacion', 'subsanar', 'emitir', 'anular');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'estudiante',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoPrograma" NOT NULL,
    "facultad" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "codigoUniv" TEXT NOT NULL,
    "programaId" INTEGER NOT NULL,
    "telefono" TEXT,
    "estadoAcad" "EstadoAcademico" NOT NULL DEFAULT 'activo',
    "creditosAprobados" INTEGER NOT NULL DEFAULT 0,
    "promedioGeneral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_requisito" (
    "id" SERIAL NOT NULL,
    "programaId" INTEGER NOT NULL,
    "tipoTramite" "TipoTramite" NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoRequisito" NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "versionNorm" TEXT NOT NULL DEFAULT '1.0',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantillas_requisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "tipoTramite" "TipoTramite" NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'borrador',
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "presentadoEn" TIMESTAMP(3),
    "aprobadoEn" TIMESTAMP(3),

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validaciones_requisito" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "plantillaId" INTEGER NOT NULL,
    "estado" "EstadoValidacion" NOT NULL DEFAULT 'pendiente',
    "evidencia" TEXT,
    "observacion" TEXT,
    "validadoPor" INTEGER,
    "validadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validaciones_requisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_solicitud" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDoc" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "subidoPor" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reemplazadoPor" INTEGER,

    CONSTRAINT "documentos_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisiones" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "revisorId" INTEGER NOT NULL,
    "accion" "AccionRevision" NOT NULL,
    "comentario" TEXT,
    "estadoAntes" "EstadoSolicitud" NOT NULL,
    "estadoDespues" "EstadoSolicitud" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estados" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "estadoAntes" "EstadoSolicitud",
    "estadoDespues" "EstadoSolicitud" NOT NULL,
    "motivo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" INTEGER NOT NULL,
    "detalles" TEXT,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas_requisito" ADD CONSTRAINT "plantillas_requisito_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_requisito" ADD CONSTRAINT "validaciones_requisito_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_requisito" ADD CONSTRAINT "validaciones_requisito_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "plantillas_requisito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_requisito" ADD CONSTRAINT "validaciones_requisito_validadoPor_fkey" FOREIGN KEY ("validadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_solicitud" ADD CONSTRAINT "documentos_solicitud_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_solicitud" ADD CONSTRAINT "documentos_solicitud_subidoPor_fkey" FOREIGN KEY ("subidoPor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
