# Drivers arquitectónicos

## Resumen

Un driver arquitectónico es una necesidad o restricción que condiciona la estructura del software. Los drivers siguientes conectan las historias y requisitos con decisiones que deben reflejar el sistema existente o declararse como objetivos futuros.

## Implementado hoy

| Driver | Evidencia vigente | Implicación documentada | Trazabilidad |
|---|---|---|---|
| Identidad y autorización | Sesión JWT en cookie, perfil activo y verificaciones de rol en módulos del servidor. | Describir autenticación y controles donde están implementados, sin inventar middleware central. | `server/src/identidad.js`, `revision-grados.js`, `administracion.js`; `specs/003-acceso-y-panel/spec.md` FR-001, `specs/004-login-institucional/spec.md` FR-003/005. |
| Titularidad del expediente | Las consultas de solicitudes filtran por `usuarioId` y el identificador de solicitud se valida en `server/src/solicitudes.js`. | Mantener las operaciones personales ligadas a la sesión y señalar su fuente concreta. | `server/src/solicitudes.js`; `specs/001-mis-tramites/spec.md` necesidad 5. |
| Privacidad de verificación pública | Consulta QR selecciona y devuelve campos limitados solo para estado emitido. | Separar el recorrido público del acceso autenticado y no exponer datos del titular. | `server/src/verificacion-documentos.js`; `specs/002-verificar-documento/spec.md` FR-001–FR-004. |
| Integridad del flujo de trámite | El modelo contiene estados y el servidor registra transiciones de solicitudes/revisión con operaciones Prisma. | Documentar las transiciones y restricciones observadas, sin generalizar a un motor de flujo separado. | `server/prisma/schema.prisma`; `server/src/solicitudes.js`, `revision-grados.js`; `specs/003-acceso-y-panel/spec.md` FR-002. |
| Persistencia y despliegue local | SQLite mediante libSQL y URL `file:` se configuran en el arranque. | Los diagramas deben mostrar ese almacenamiento local y no PostgreSQL. | `server/prisma/schema.prisma`, `server/src/index.js`, `server/package.json`. |
| Experiencia institucional accesible | Las especificaciones solicitan acceso por teclado, diseño adaptable, contenido institucional y texto alternativo; el cliente contiene páginas/componentes relacionados. | Las necesidades visuales se conservan como criterios especificados, sin asumir validación completa de accesibilidad. | `specs/001-mis-tramites/spec.md` necesidad 5, `specs/004-login-institucional/spec.md` FR-001, `specs/005-redisenar-secciones-inferiores-home/spec.md`, `specs/006-banner-autoridades/spec.md`. |
| Evidencia y auditabilidad | Existen modelos de auditoría, revisión e historial; rutas específicas registran eventos. | Explicar qué acciones registran eventos y declarar que no se ha probado cobertura completa. | `server/prisma/schema.prisma`; `server/src/solicitudes.js`, `revision-grados.js`, `administracion.js`. |

## Objetivo Sprint 2

Los atributos de rendimiento, disponibilidad, mantenibilidad, seguridad y trazabilidad deben ser validados mediante escenarios y mediciones del equipo. El objetivo de carga de hasta 2.000 usuarios virtuales concurrentes es **propuesta, pendiente de validación del equipo**. Las metas de capas, caché y Swagger requieren decisión y actualización de arquitectura antes de cualquier implementación.

## Trazabilidad y fuentes

Las relaciones de la tabla vinculan cada driver con RF, HU, escenarios o artefactos fuente. Para las especificaciones sin identificadores HU estables, se utiliza su ruta y número de necesidad. Complementan esta evidencia `.specify/memory/constitution.md` y los antecedentes `docs/legacy/openspec/api-contracts.md`, `data-models.md` y `requirements.md`.
