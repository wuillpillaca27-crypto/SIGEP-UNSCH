# Historias del usuario

## Resumen

Se reúnen las historias y requisitos de usuario de las especificaciones 001 a 006, conservando sus identificadores cuando existen. Las historias describen intención solicitada; su presencia en una spec no prueba que el comportamiento esté implementado.

## Implementado hoy

Las siguientes capacidades tienen evidencia en rutas de `server/src/` o páginas de `client/app/`; esta evidencia no implica que todas las pantallas y criterios de las specs estén completos.

| Capacidad que una persona puede realizar | Evidencia actual |
|---|---|
| Iniciar o cerrar sesión local, consultar su perfil y, si está configurado, iniciar sesión Google | Endpoints de `server/src/identidad.js` y `server/src/identidad-google.js`; interfaz en `client/app/login/`. |
| Consultar un código de documento emitido públicamente | `GET /api/documentos/verificar-qr/:codigo` en `server/src/verificacion-documentos.js`; página en `client/app/verificar-documento/`. |
| Consultar y gestionar solicitudes propias de grado/título | Rutas de `server/src/solicitudes.js`; páginas en `client/app/mis-tramites/`. El servidor filtra por usuario autenticado y controla etapa y titularidad. |
| Revisar solicitudes de grado/título como operador o administrador | Rutas de `server/src/revision-grados.js`; interfaz de administración bajo `client/app/admin/`. |
| Consultar y administrar catálogos y usuarios según rol | Rutas de `server/src/administracion.js` y `server/src/catalogo-grados.js`. |
| Ver servicios, información institucional y banner en el portal | Rutas y componentes bajo `client/app/`; la existencia visual de una página no acredita por sí misma un servicio de publicación o gestión detrás de ella. |

## Objetivo Sprint 2

Esta sección registra la intención funcional solicitada en las fuentes. Las pruebas de aceptación describen el resultado esperado por esas especificaciones, no una afirmación de que el criterio ya se haya verificado en producción.

### Especificaciones 001–006

| ID de origen | Historia o necesidad resumida | Fuente y estado de la evidencia |
|---|---|---|
| HU-001 a HU-005¹ | Entrar en Mis Trámites con una cuenta de estudiante; ver el panel y sus acciones; listar solicitudes y borradores; consultar historial; subsanar observaciones y mantener titularidad, uso móvil y teclado. | `specs/001-mis-tramites/spec.md`, sección «Historias y aceptación». Especificación sin IDs HU individuales: IDs locales de referencia asignados aquí; el texto fuente enumera cinco necesidades. |
| FR-001 a FR-005 | Consultar un documento por código o QR sin sesión; confirmar solo registros emitidos; mostrar datos públicos limitados; distinguir errores; permitir volver a consultar. | `specs/002-verificar-documento/spec.md`, requisitos funcionales. |
| FR-001 a FR-004 | Ingresar con cuenta local; consultar y revisar expedientes; administrar catálogos y usuarios; mantener consulta pública limitada a documentos emitidos. | `specs/003-acceso-y-panel/spec.md`, requisitos funcionales. |
| FR-001 a FR-005 | Usar el formulario institucional, validaciones, estado de envío, cookies HttpOnly, cierre de sesión, enlaces institucionales y OAuth Google con los mecanismos de seguridad descritos. | `specs/004-login-institucional/spec.md`, requisitos funcionales. |
| FR-001 a FR-005 | Consultar servicios y recorrido de cuatro etapas; presentar avisos vacíos y enlaces institucionales; mostrar pie y accesibilidad; adaptar secciones de portada a distintos anchos. | `specs/005-redisenar-secciones-inferiores-home/spec.md`, requisitos funcionales. |
| FR-001 a FR-003 | Mostrar el banner original entre portada y servicios, mantener proporción 3:1, permitir ampliarlo y describir sus autoridades con texto alternativo. | `specs/006-banner-autoridades/spec.md`, requisitos funcionales. |

¹ Los IDs HU-001 a HU-005 son locales para las cinco necesidades enumeradas en la fuente; no son identificadores originales.

### Contexto relacionado

`specs/007-pruebas-frontend/spec.md` plantea historias de verificación del comportamiento existente, pero no se incorpora como historia funcional de usuario 001–006. `docs/legacy/openspec/requirements.md` contiene únicamente RF-01, RF-02 y RF-03; sus identificadores se conservan en su propio documento de requisitos.

## Trazabilidad y fuentes

- Especificaciones: `specs/001-mis-tramites/spec.md` a `specs/006-banner-autoridades/spec.md`; contexto de pruebas en `specs/007-pruebas-frontend/spec.md`.
- Código de interfaz y servidor que acredita implementación: `client/app/`, `server/src/`.
- Antecedentes: `docs/legacy/openspec/requirements.md`, `api-contracts.md` y `data-models.md`.
