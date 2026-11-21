# C4 — Nivel 4: Código

## Resumen

Este nivel muestra la organización de archivos y la composición del servidor, además del enlace hacia el cliente y la persistencia que se puede verificar en el repositorio. Se conserva exactamente el nombre solicitado: `Nivel4-DiagramadeCodigo.md`.

## Implementado hoy

```mermaid
flowchart TD
  Web["Cliente Next.js (RF-DOC-001-006; client/app)"]
  Api["Express app y composición (RF-DOC-001-005; server/src/index.js)"]
  Catalogo["registrarCatalogo (HU-001; server/src/catalogo-grados.js)"]
  Identidad["registrarIdentidad (specs/003-004; server/src/identidad.js)"]
  Google["registrarGoogle (FR-005; server/src/identidad-google.js)"]
  Solicitudes["registrarSolicitudes (HU-001; server/src/solicitudes.js)"]
  Revision["registrarRevision (FR-002; server/src/revision-grados.js)"]
  Administracion["registrarAdministracion (FR-003; server/src/administracion.js)"]
  Verificacion["registrarVerificacion (FR-001-004; server/src/verificacion-documentos.js)"]
  Prisma["PrismaClient + PrismaLibSql (RF-DOC-001-003; server/src/index.js)"]
  Modelo["Modelos Usuario, Solicitud, DocumentoSolicitud, Auditoria (RF-DOC-001-003; server/prisma/schema.prisma)"]
  Sqlite[("provider sqlite / URL file: (server/prisma/schema.prisma, server/src/index.js)")]

  Web -->|"HTTP API"| Api
  Api --> Catalogo
  Api --> Identidad
  Api --> Solicitudes
  Api --> Revision
  Api --> Administracion
  Api --> Verificacion
  Identidad --> Google
  Identidad -.->|"provee autenticar"| Solicitudes
  Identidad -.->|"provee autenticar"| Revision
  Identidad -.->|"provee autenticar"| Administracion
  Catalogo --> Prisma
  Solicitudes --> Prisma
  Revision --> Prisma
  Administracion --> Prisma
  Verificacion --> Prisma
  Prisma --> Modelo
  Modelo --> Sqlite
```

### Elementos, origen y límites

| Elemento representado | RF/HU/escenario de origen | Evidencia del código |
|---|---|---|
| Cliente web | RF-DOC-001–006, derivados de specs `001`–`006`. | `client/app/`, `client/app/lib/api.ts`. |
| Punto de composición Express | Fuente de existencia y escenario de API autenticada (specs `001`, `003`, `004`). | `server/src/index.js`. |
| Catálogo | HU-001, iniciar/consultar un trámite en `specs/001-mis-tramites/spec.md`. | `server/src/catalogo-grados.js`. |
| Identidad local | FR-001 de `specs/003-acceso-y-panel/spec.md`; FR-001–004 de `specs/004-login-institucional/spec.md`. | `server/src/identidad.js`. |
| Identidad Google | FR-005 de `specs/004-login-institucional/spec.md`. | `server/src/identidad-google.js`. |
| Solicitudes | HU-001 y necesidades 2–5 de `specs/001-mis-tramites/spec.md`. | `server/src/solicitudes.js`. |
| Revisión | FR-002 de `specs/003-acceso-y-panel/spec.md`. | `server/src/revision-grados.js`. |
| Administración | FR-003 de `specs/003-acceso-y-panel/spec.md`. | `server/src/administracion.js`. |
| Verificación | FR-001–004 de `specs/002-verificar-documento/spec.md`. | `server/src/verificacion-documentos.js`. |
| Prisma/libSQL | Flujos persistentes RF-DOC-001–003; fuente de existencia/configuración. | `server/src/index.js`, `server/package.json`. |
| Modelos y almacenamiento SQLite | Fuente de existencia del esquema de los flujos anteriores; no implica por sí sola que cada entidad tenga flujo activo. | `server/prisma/schema.prisma`. |

Las flechas continuas representan importación/registro o acceso a persistencia; las punteadas indican que `registrarIdentidad` devuelve `autenticar` y este se entrega a los módulos correspondientes desde `server/src/index.js`. El diagrama no implica que `registrarGoogle` se invoque directamente desde `index.js`: se registra internamente desde identidad.

## Objetivo Sprint 2

No se muestran carpetas/capas inexistentes (`server/src/lib/`, `middleware/`, `routes/`) como unidades actuales, ni repositorios, caché o Swagger. Si el código se reorganiza, este nivel deberá actualizarse con los nuevos archivos después de aprobar el diseño y antes de implementar el cambio arquitectónico.

## Trazabilidad y fuentes

Fuentes primarias: `server/src/index.js`, módulos listados, `server/prisma/schema.prisma`, `server/package.json`, `client/app/` y las especificaciones indicadas por elemento. Requisitos consolidados: `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`; arquitectura de contenedores y componentes: `docs/02-arquitectura-software/arquitectura-inicial.md` y `componentes-arquitectonicos.md`.
