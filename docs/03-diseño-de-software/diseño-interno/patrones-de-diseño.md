# Patrones de diseño

## Resumen

Se identifican mecanismos de organización que aparecen en el código y se describe su alcance concreto. Llamar a una práctica un patrón no significa que el proyecto lo aplique de forma uniforme ni que exista una capa dedicada.

## Implementado hoy

| Práctica observada | Evidencia concreta | Alcance y origen |
|---|---|---|
| Punto de composición de la aplicación | `server/src/index.js` crea Express y Prisma e invoca `registrarX` con dependencias. | Composición de módulos de API; evidencia `server/src/index.js`; relacionada con el acceso/trámites de `specs/001-mis-tramites/spec.md` y `specs/003-acceso-y-panel/spec.md`. No se presenta como contenedor de inyección formal. |
| Registro modular de rutas | Funciones `registrarCatalogo`, `registrarIdentidad`, `registrarSolicitudes`, `registrarRevision`, `registrarAdministracion` y `registrarVerificacion` agregan endpoints, algunas directamente a `app` y otras mediante `Router`. | Evidencia: módulos de `server/src/`; origen según funciones de `specs/001`–`004`. Es modularidad dentro de un proceso Express, no microservicios. |
| Cadena de middleware | `autenticar` protege rutas y funciones `router.use` aplican restricciones adicionales; Express también ejecuta middleware transversal y manejador de errores. | Evidencia: `server/src/identidad.js`, `solicitudes.js`, `revision-grados.js`, `administracion.js`, `index.js`; origen: sesión y acceso de `specs/001`, `003` y `004`. |
| Transacción de base de datos | `server/src/solicitudes.js` y `revision-grados.js` usan `$transaction` para agrupar escrituras relacionadas con una operación. | Evidencia en esos archivos y modelo relacionado en `server/prisma/schema.prisma`; origen: flujo de solicitudes y revisión de `specs/001-mis-tramites/spec.md` y `specs/003-acceso-y-panel/spec.md`. No significa que toda operación use transacciones. |
| Proyección explícita de datos | Consultas Prisma definen `select` para escoger campos de perfil, listado y verificación pública. | Evidencia: `server/src/identidad.js`, `administracion.js`, `verificacion-documentos.js`; origen: acceso y privacidad en `specs/002-verificar-documento/spec.md` y `specs/004-login-institucional/spec.md`. |
| Verificación de etapa antes de transición | Solicitud y revisión comparan estado actual y condición de la operación antes de actualizar y, en operaciones específicas, escriben historial/auditoría. | Evidencia: `server/src/solicitudes.js`, `revision-grados.js`, `server/prisma/schema.prisma`; origen: gestión y revisión en `specs/001-mis-tramites/spec.md` y `specs/003-acceso-y-panel/spec.md`. |

En el cliente existen componentes, hooks y servicios reutilizables (`client/app/components/`, `hooks/`, `services/`), lo cual acredita organización por responsabilidad. No se asigna un patrón GoF concreto a esos directorios sin evidencia de una implementación específica.

## Objetivo Sprint 2

Repositorios, servicios de aplicación, controladores separados, capas SOLID, caché y contrato Swagger/OpenAPI pueden evaluarse como propuestas. No se describen como patrones actuales. Una adopción futura debe justificar su necesidad, trazarse a una spec y probar que conserva el comportamiento.

## Trazabilidad y fuentes

Especificaciones de origen: `specs/001-mis-tramites/spec.md`, `specs/002-verificar-documento/spec.md`, `specs/003-acceso-y-panel/spec.md`, `specs/004-login-institucional/spec.md`. Evidencia de implementación: archivos mencionados de `server/src/`, `client/app/` y `server/prisma/schema.prisma`.
