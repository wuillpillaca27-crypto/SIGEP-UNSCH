# Contrato OpenAPI

## Superficie

- Interfaz Swagger UI: `GET /api-docs`.
- Definición OpenAPI servida por la interfaz: la interfaz carga el documento versionado en `server/openapi.json`.
- Operaciones de negocio descritas: las 28 combinaciones método/ruta del inventario FR-016 en `specs/008-documentacion-arquitectura/spec.md`, cotejadas con los registradores actuales.

## Inventario cotejado

| Archivo fuente | Método y ruta completa |
|---|---|
| `server/src/catalogo-grados.js` | `GET /api/catalogo-grados/:tramite` |
| `server/src/catalogo-grados.js` | `GET /api/catalogo-grados/:tramite/:programaId` |
| `server/src/identidad.js` | `POST /api/auth/login` |
| `server/src/identidad.js` | `POST /api/auth/logout` |
| `server/src/identidad.js` | `GET /api/auth/perfil` |
| `server/src/identidad-google.js` | `GET /api/auth/google/estado` |
| `server/src/identidad-google.js` | `GET /api/auth/google/iniciar` |
| `server/src/identidad-google.js` | `GET /api/auth/google/callback` |
| `server/src/solicitudes.js` (prefijo `/api/solicitudes`) | `GET /` |
| `server/src/solicitudes.js` (prefijo `/api/solicitudes`) | `POST /` |
| `server/src/solicitudes.js` (prefijo `/api/solicitudes`) | `POST /:id/presentar` |
| `server/src/solicitudes.js` (prefijo `/api/solicitudes`) | `PUT /:id/documentos/:plantilla` |
| `server/src/solicitudes.js` (prefijo `/api/solicitudes`) | `POST /:id/subsanar` |
| `server/src/solicitudes.js` (prefijo `/api/solicitudes`) | `GET /:id/documentos/:documento` |
| `server/src/revision-grados.js` (prefijo `/api/revision-grados`) | `GET /` |
| `server/src/revision-grados.js` (prefijo `/api/revision-grados`) | `GET /reporte` |
| `server/src/revision-grados.js` (prefijo `/api/revision-grados`) | `GET /:id/documentos/:documento` |
| `server/src/revision-grados.js` (prefijo `/api/revision-grados`) | `POST /:id/acciones` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `GET /configuracion` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `GET /programas` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `POST /programas` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `GET /estudiantes` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `GET /usuarios` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `POST /usuarios` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `GET /requisitos` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `POST /requisitos` |
| `server/src/administracion.js` (prefijo `/api/administracion`) | `GET /auditoria` |
| `server/src/verificacion-documentos.js` | `GET /api/documentos/verificar-qr/:codigo` |

El conteo es 28 operaciones HTTP (método + ruta), no 19. La cifra anterior en el plan era incorrecta y queda corregida; no representa un cambio al alcance funcional.

## Compatibilidad

La adición de documentación no cambia los contratos HTTP de negocio. El documento describe el comportamiento vigente; no crea endpoints, respuestas, permisos, parámetros ni validaciones nuevas. La fuente para cada detalle es el handler actual y, como antecedente, `docs/legacy/openspec/api-contracts.md`.

## Respuestas no confirmadas

Cuando código o contrato fuente no permita determinar una estructura o estado de respuesta, la documentación no debe inventar el detalle; debe describir solo lo comprobable o dejarlo explícitamente sin especificar.
