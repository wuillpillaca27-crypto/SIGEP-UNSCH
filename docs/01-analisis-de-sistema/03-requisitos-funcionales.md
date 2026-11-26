# Requisitos funcionales

## Resumen

Este inventario separa requisitos heredados con identificadores fuente de requisitos locales derivados de las especificaciones y del código observado. Una necesidad especificada no se considera implementada hasta que una ruta o archivo de interfaz verificable la respalde.

## Implementado hoy

### Inventario de rutas API

Las rutas siguientes están declaradas por el servidor. Los prefijos se componen donde el módulo monta un `Router` con `app.use`.

| Método y ruta resultante | Módulo fuente | Alcance comprobable |
|---|---|---|
| GET `/api/catalogo-grados/:tramite` | `server/src/catalogo-grados.js` | Consulta de catálogo por tipo de trámite. |
| GET `/api/catalogo-grados/:tramite/:programaId` | `server/src/catalogo-grados.js` | Consulta de catálogo por trámite y programa. |
| POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/perfil` | `server/src/identidad.js` | Inicio/cierre de sesión y perfil; login por DNI o correo y contraseña. |
| GET `/api/auth/google/estado`, `/iniciar`, `/callback` | `server/src/identidad-google.js` | Estado y flujo de autenticación OAuth Google. |
| GET `/api/solicitudes/`, POST `/api/solicitudes/` | `server/src/solicitudes.js` | Listado propio y creación de solicitudes. |
| POST `/api/solicitudes/:id/presentar` | `server/src/solicitudes.js` | Presentación de solicitud propia. |
| PUT `/api/solicitudes/:id/documentos/:plantilla` | `server/src/solicitudes.js` | Carga PDF asociado a requisito. |
| POST `/api/solicitudes/:id/subsanar` | `server/src/solicitudes.js` | Envío de subsanación. |
| GET `/api/solicitudes/:id/documentos/:documento` | `server/src/solicitudes.js` | Descarga de documento propio sujeto a titularidad. |
| GET `/api/revision-grados/`, `/reporte` | `server/src/revision-grados.js` | Listado paginado de expedientes y resumen. |
| GET `/api/revision-grados/:id/documentos/:documento` | `server/src/revision-grados.js` | Descarga para personal autorizado. |
| POST `/api/revision-grados/:id/acciones` | `server/src/revision-grados.js` | Acción de revisión según etapa y rol. |
| GET `/api/administracion/configuracion` | `server/src/administracion.js` | Parámetros informativos de configuración. |
| GET/POST `/api/administracion/programas` | `server/src/administracion.js` | Consulta y creación (creación solo admin). |
| GET `/api/administracion/estudiantes` | `server/src/administracion.js` | Consulta paginada. |
| GET/POST `/api/administracion/usuarios` | `server/src/administracion.js` | Consulta y creación (solo admin). |
| GET/POST `/api/administracion/requisitos` | `server/src/administracion.js` | Consulta y creación (creación solo admin). |
| GET `/api/administracion/auditoria` | `server/src/administracion.js` | Consulta paginada de auditoría (solo admin). |
| GET `/api/documentos/verificar-qr/:codigo` | `server/src/verificacion-documentos.js` | Consulta pública de un documento en estado emitido; no devuelve datos personales ni archivo. |

### Persistencia implementada

El servidor usa PostgreSQL mediante Prisma 7 y `PrismaPg`; `DATABASE_URL` se obtiene con `prisma.config.ts`, y el arranque solo acepta `postgresql://`. El esquema conserva diez modelos/tablas y ocho enums. El origen SQLite documentado por Spec 011 es una fuente de migración separada; no hay fallback del runtime a `file:` ni se importan sus datos al arrancar. La ruta de inicialización aplica únicamente migraciones versionadas.

### Requisitos heredados OpenSpec

Se conservan literalmente los identificadores y alcance de `docs/legacy/openspec/requirements.md`:

- **RF-01**: Autenticación mediante credenciales institucionales.
- **RF-02**: Creación y seguimiento de solicitudes.
- **RF-03**: Asignación de roles y permisos mediante JWT.

El archivo heredado los presenta como elementos no marcados; el código actual demuestra que hay operaciones relacionadas, pero el antecedente no es un catálogo de requisitos actuales completo.

## Objetivo Sprint 2

Los requisitos siguientes son identificadores locales de esta documentación, derivados de las specs 001–006. Se conservan los IDs FR de cada spec cuando existen. Las capacidades visuales o criterios completos siguen siendo «solicitados» hasta su verificación específica.

| ID local | Requisito derivado | Fuentes de origen |
|---|---|---|
| RF-DOC-001 | El estudiante debe poder acceder al panel personal, consultar solicitudes, borradores, estado e historial y subsanar observaciones, con comprobación de titularidad en la API. | `specs/001-mis-tramites/spec.md`, necesidades 1–5; `server/src/solicitudes.js`. |
| RF-DOC-002 | Una consulta pública de código debe confirmar solo documentos emitidos y exponer únicamente datos públicos permitidos. | `specs/002-verificar-documento/spec.md`, FR-001–FR-005; `server/src/verificacion-documentos.js`. |
| RF-DOC-003 | El personal autorizado puede revisar expedientes; las acciones administrativas de aprobación/emisión y administración de cuentas/catálogos se restringen por rol. | `specs/003-acceso-y-panel/spec.md`, FR-001–FR-004; `server/src/revision-grados.js`, `server/src/administracion.js`. |
| RF-DOC-004 | El acceso local debe admitir identificador institucional y contraseña; la sesión y el perfil se administran en la API. | `specs/004-login-institucional/spec.md`, FR-001–FR-005; `server/src/identidad.js`. |
| RF-DOC-005 | El acceso Google debe depender de configuración y vinculación previa a cuenta local, conforme al flujo OAuth implementado. | `specs/004-login-institucional/spec.md`, FR-005; `server/src/identidad-google.js`. |
| RF-DOC-006 | La portada debe presentar servicios, etapas, información institucional y banner según sus requisitos de contenido y adaptación. | `specs/005-redisenar-secciones-inferiores-home/spec.md`, FR-001–FR-005; `specs/006-banner-autoridades/spec.md`, FR-001–FR-003; `client/app/page.tsx` y páginas/componentes de `client/app/`. |

RF-DOC no reemplaza IDs fuente: es una nomenclatura local de resumen. Los endpoints anteriores constituyen inventario de implementación actual, no requisitos de funcionalidad futura.

## Objetivo Sprint 2

Capas separadas, caché y Swagger aparecen en antecedentes/propuestas del proyecto. No se registran aquí como requisito operativo ni como capacidad disponible, salvo que una especificación fuente identificable las requiera expresamente.

## Trazabilidad y fuentes

- Especificaciones: `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`.
- Rutas y comportamiento: los ocho módulos indicados en la tabla, todos bajo `server/src/`.
- Datos/configuración: `server/prisma/schema.prisma`, `server/src/index.js`.
- Configuración, proveedor y despliegue de esquema: `server/prisma.config.ts`, `server/scripts/inicializar-base.js`, `server/prisma/migrations/` y `specs/011-migrar-postgresql/`.
- Cliente: páginas y componentes bajo `client/app/`.
- Legado: `docs/legacy/openspec/requirements.md`, `api-contracts.md`, `data-models.md`.
