# Decisiones arquitectónicas

## Resumen

Este registro distingue decisiones visibles en el código, decisiones de diseño reflejadas por el runtime y propuestas futuras. No sustituye un ADR aprobado: las decisiones inferidas del estado actual indican el archivo que las demuestra.

## Implementado hoy

| ID | Decisión observada | Evidencia | Consecuencia y límite |
|---|---|---|---|
| OBS-01 | El servidor usa Express con módulos registradores cargados desde el punto de entrada. | `server/src/index.js` importa los módulos `registrarX` y los registra sobre una instancia `app`. | Los módulos funcionales están directamente bajo `server/src/`; no se concluye que formen capas independientes. |
| OBS-02 | Los módulos de dominio acceden a Prisma y registran rutas en los mismos archivos. | `server/src/solicitudes.js`, `revision-grados.js`, `administracion.js`, `catalogo-grados.js`. | Es una organización monolítica modular; `lib/`, `middleware/` y `routes/` están vacías en el estado inspeccionado. |
| OBS-03 | El almacenamiento actual usa PostgreSQL con el adaptador PrismaPg. | `server/prisma/schema.prisma` declara `provider = "postgresql"`; `server/src/index.js` exige `postgresql://` y usa `PrismaPg`. | SQLite/libSQL es el formato de origen de la migración local, no un fallback del runtime. |
| OBS-04 | Las sesiones locales usan JWT en cookie HttpOnly; las contraseñas se comparan con bcryptjs. | `server/src/identidad.js`; dependencias en `server/package.json`. | La respuesta selecciona datos de perfil y omite `password`; los controles deben atribuirse al código concreto. |
| OBS-05 | Los archivos documentales se almacenan con ruta interna y se sirven por endpoints controlados. | `DocumentoSolicitud.rutaArchivo` en schema; `server/src/solicitudes.js`, `revision-grados.js`. | El endpoint público de QR no equivale a descarga pública del archivo. |
| OBS-06 | La consulta QR pública se limita a solicitudes emitidas y una proyección de campos. | `server/src/verificacion-documentos.js`. | La búsqueda pública no revela datos personales ni contenido binario del documento. |

Estas son decisiones observadas/inferidas, no actas con fecha de aprobación. Las rutas de `server/src/index.js` muestran estas firmas: `registrarCatalogo(app, prisma, normativa)`, `registrarIdentidad(app, prisma, secreto)`, `registrarSolicitudes(app, prisma, autenticar, directorio)`, `registrarRevision(app, prisma, autenticar, directorio)`, `registrarAdministracion(app, prisma, autenticar)` y `registrarVerificacion(app, prisma, opciones)`. Google se registra desde identidad con el objeto de dependencias definido en `server/src/identidad-google.js`.

## Objetivo Sprint 2

| Propuesta | Estado | Condición antes de implementación |
|---|---|---|
| Separación explícita en capas | Objetivo futuro, no estructura observada. | Documentar diseño y límites, acordar cambios de arquitectura y actualizar estos documentos antes de tocar código. |
| Caché | Propuesta/objetivo; no se identificó mecanismo operativo en las fuentes consultadas. | Definir datos aptos, invalidación, privacidad y medición antes de adoptarlo. |
| Swagger/OpenAPI | Propuesta/objetivo; no se verificó un contrato OpenAPI vigente. | Aprobar fuente de verdad y mantener contrato sincronizado si se decide incorporar. |
| Metas cuantitativas de calidad | **Propuestas, pendientes de validación del equipo**. | Validar escenarios, métricas y entorno antes de tratarlas como compromisos. |

La selección PostgreSQL para persistencia está implementada y respaldada por la configuración del runtime. La migración de los registros y adjuntos del origen SQLite es una operación separada y solo se declara completa tras reconciliar sus resultados.

## Trazabilidad y fuentes

- Implementación: `server/src/index.js` y módulos funcionales en `server/src/`; `server/prisma/schema.prisma`, `server/prisma.config.ts`, `server/prisma/migrations/`, `server/scripts/inicializar-base.js`, `server/package.json`.
- Requisitos: `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`.
- Antecedentes no equivalentes a implementación actual: `docs/legacy/openspec/`.
