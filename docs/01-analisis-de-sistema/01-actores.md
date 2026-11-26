# Actores del sistema

## Resumen

SIGEP-UNSCH tiene usuarios autenticados con roles definidos por el sistema y ofrece una consulta pública de documentos emitidos. Este documento separa los roles del modelo de datos de las operaciones que el servidor permite hoy; el nombre de un rol, por sí solo, no prueba permisos.

## Implementado hoy

El esquema Prisma define `Usuario.rol` mediante los valores `estudiante`, `operador` y `administrador` (`server/prisma/schema.prisma`, modelo `Usuario` y enum `Rol`). El servidor aplica controles observables en estas rutas y módulos:

| Actor observado | Evidencia y operaciones verificadas |
|---|---|
| Estudiante con sesión | `server/src/solicitudes.js` limita las operaciones de solicitudes al usuario autenticado y comprueba la relación con un registro de estudiante. Puede listar/crear solicitudes, presentarlas, cargar documentos y subsanar dentro de las rutas registradas. `server/src/identidad.js` obtiene del perfil el registro de estudiante asociado. |
| Personal autorizado: operador o administrador | `server/src/revision-grados.js` exige uno de esos roles para consultar expedientes, reportes, documentos y acciones de revisión. `server/src/administracion.js` permite a ambos consultar configuración, programas, estudiantes y requisitos. |
| Administrador | Además de lo anterior, `server/src/revision-grados.js` reserva aprobar y registrar emisión al administrador. `server/src/administracion.js` limita creación de programas, usuarios y requisitos, y la consulta de auditoría a `administrador`. |
| Persona consultante sin autenticación | `server/src/verificacion-documentos.js` expone `GET /api/documentos/verificar-qr/:codigo` sin middleware de sesión. La respuesta pública se limita a código, tipo de trámite, programa, fecha de emisión y marca de demostración; no devuelve datos personales ni archivos. |
| Persona con cuenta Google previamente vinculada | `server/src/identidad-google.js` ofrece el flujo OAuth cuando está configurado y busca una cuenta local activa vinculada. La especificación `specs/004-login-institucional/spec.md` describe el objetivo institucional; el acceso efectivo depende de la configuración y vínculo locales. |

El inicio de sesión local usa DNI o correo registrado y contraseña (`server/src/identidad.js`). La sesión se entrega en la cookie `sigep_sesion`, marcada HttpOnly y SameSite Lax; la autenticación vuelve a cargar un perfil de usuario activo. El módulo Google registra el flujo separado bajo `/api/auth/google/`.

Las historias de `specs/001-mis-tramites/spec.md` a `specs/006-banner-autoridades/spec.md` también nombran personas usuarias del portal y visitantes, pero no todas implican una identidad autenticada. En particular, las secciones públicas de información y la portada no permiten deducir permisos de cuenta.

## Objetivo Sprint 2

Una matriz formal actor–caso de uso y una política de permisos centralizada podrían facilitar revisión institucional. No se presenta esa matriz ni una capa de autorización separada como componente ya implementado: las comprobaciones visibles están en los módulos de `server/src/`.

## Trazabilidad y fuentes

- Historias y necesidades: `specs/001-mis-tramites/spec.md`, `specs/002-verificar-documento/spec.md`, `specs/003-acceso-y-panel/spec.md`, `specs/004-login-institucional/spec.md`, `specs/005-redisenar-secciones-inferiores-home/spec.md`, `specs/006-banner-autoridades/spec.md`.
- Roles y relaciones: `server/prisma/schema.prisma` (`Usuario`, `Rol`, `Estudiante`).
- Operaciones y controles: `server/src/identidad.js`, `server/src/identidad-google.js`, `server/src/solicitudes.js`, `server/src/revision-grados.js`, `server/src/administracion.js`, `server/src/verificacion-documentos.js`.
- Antecedente: `docs/legacy/openspec/requirements.md` describe autenticación, solicitudes y JWT como RF-01 a RF-03; es referencia histórica, no inventario completo del sistema actual.
