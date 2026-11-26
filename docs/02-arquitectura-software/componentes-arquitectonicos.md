# Componentes arquitectónicos

## Resumen

Este catálogo identifica componentes por sus archivos y límites observables. No convierte cada carpeta del esquema en un servicio ni presenta propuestas de capas como componentes desplegados.

## Implementado hoy

| Componente | Responsabilidad / interfaz observada | Origen funcional o evidencia |
|---|---|---|
| Aplicación cliente | Next.js App Router y React; rutas y vistas bajo `client/app/`, componentes UI, hooks, servicios, utilidades y tipos. | `client/package.json`, estructura y archivos de `client/app/`; necesidades de interfaz en `specs/001`–`006`. |
| Catálogo de grados | `GET /api/catalogo-grados/:tramite` y `GET /api/catalogo-grados/:tramite/:programaId`. | `server/src/catalogo-grados.js`; RF-DOC-006 / consultas para trámites. |
| Identidad local | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/perfil`; crea middleware de autenticación. | `server/src/identidad.js`; `specs/003-acceso-y-panel/spec.md` y `specs/004-login-institucional/spec.md`. |
| Identidad Google | `GET /api/auth/google/estado`, `GET /api/auth/google/iniciar`, `GET /api/auth/google/callback`; se registra desde identidad local y depende de configuración/vínculos. | `server/src/identidad-google.js`; `specs/004-login-institucional/spec.md` FR-005. |
| Solicitudes | Monta `/api/solicitudes`: GET/POST `/`, POST `/:id/presentar`, PUT `/:id/documentos/:plantilla`, POST `/:id/subsanar`, GET `/:id/documentos/:documento`. | `server/src/solicitudes.js`; `specs/001-mis-tramites/spec.md`; RF-DOC-001. |
| Revisión de grados | Monta `/api/revision-grados`: GET `/`, GET `/reporte`, GET `/:id/documentos/:documento`, POST `/:id/acciones`; restringe acceso a administrador u operador. | `server/src/revision-grados.js`; `specs/003-acceso-y-panel/spec.md`; RF-DOC-003. |
| Administración | Monta `/api/administracion`: GET `/configuracion`; GET/POST `/programas`; GET `/estudiantes`; GET/POST `/usuarios`; GET/POST `/requisitos`; GET `/auditoria`. Parte de las operaciones exige administrador. | `server/src/administracion.js`; `specs/003-acceso-y-panel/spec.md`; RF-DOC-003. |
| Verificación pública | `GET /api/documentos/verificar-qr/:codigo`; limita la consulta a registros emitidos y devuelve campos públicos. | `server/src/verificacion-documentos.js`; `specs/002-verificar-documento/spec.md`; RF-DOC-002. |
| Persistencia Prisma/SQLite | Prisma Client configurado con provider SQLite y adaptador libSQL local, inicializado en el punto de entrada. | `server/prisma/schema.prisma`, `server/src/index.js`, `server/package.json`. |
| Almacenamiento de documentos | Entidad `DocumentoSolicitud` conserva ruta interna y metadatos; los módulos de solicitud/revisión validan acceso antes de servir archivos. | `server/prisma/schema.prisma`, `server/src/solicitudes.js`, `server/src/revision-grados.js`. |
| Servicio externo Google OAuth | Proveedor OAuth usado por el flujo Google cuando la integración está configurada. | Dependencia/import `google-auth-library` en `server/package.json`, `server/src/identidad-google.js`. |

### Límites y seguridad visibles

- La composición HTTP y el manejador global de errores se encuentran en `server/src/index.js`.
- Las funciones registradoras tienen firmas distintas y pueden añadir rutas directas a `app` o montar un `Router` con un prefijo.
- El acceso a datos Prisma está integrado en los módulos que implementan las operaciones; no se observó una capa `repository`/`service` independiente en el servidor.
- La protección por sesión, rol y titularidad está distribuida entre identidad y los módulos de solicitudes, revisión y administración. El nivel exacto se debe leer por operación.
- `server/src/lib/`, `server/src/middleware/` y `server/src/routes/` están vacías en el estado inspeccionado; no se catalogan como componentes implementados.

## Objetivo Sprint 2

Una futura descomposición por capas, un subsistema de caché y documentación Swagger/OpenAPI podrían añadirse si el equipo los aprueba. No aparecen como nodos actuales ni se asignan endpoints o responsabilidades no existentes.

## Trazabilidad y fuentes

- Origen de requisitos e historias: `docs/01-analisis-de-sistema/02-historias-del-usuario.md` y `03-requisitos-funcionales.md`; specs `001`–`006`.
- Implementación: `server/src/index.js` y cada módulo citado en la tabla.
- Datos: `server/prisma/schema.prisma`.
- Cliente: estructura de `client/app/` y `client/package.json`.
- Referencias heredadas: `docs/legacy/openspec/api-contracts.md` y `data-models.md`.
