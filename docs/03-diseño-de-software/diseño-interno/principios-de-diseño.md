# Principios de diseño

## Resumen

Este documento registra prácticas y límites observables, sin afirmar que todo el código cumpla de forma sistemática un marco de diseño. Las recomendaciones futuras se mantienen separadas para no confundirlas con la arquitectura existente.

## Implementado hoy

| Práctica o principio observado | Evidencia y límite | Origen funcional / fuente |
|---|---|---|
| Responsabilidad agrupada por módulo | Los módulos principales del servidor se nombran por dominio y registran sus rutas; cada archivo también contiene lógica y acceso Prisma. Existe agrupación, pero no separación estricta de responsabilidades por capas. | `server/src/` y `server/src/index.js`; funciones en `specs/001-mis-tramites/spec.md` a `specs/004-login-institucional/spec.md`. |
| Composición explícita de dependencias | `index.js` pasa `app`, `prisma`, `autenticar`, directorio o configuración según firma. Las firmas no son uniformes. | `server/src/index.js`; evidencia directa de composición. |
| Validación próxima a la frontera HTTP | Login, acciones administrativas, revisión, carga de archivos y consulta QR validan tipos, formatos, longitudes, estados o parámetros en sus módulos. | `server/src/identidad.js`, `administracion.js`, `revision-grados.js`, `solicitudes.js`, `verificacion-documentos.js`; origen `specs/001`–`004`. |
| Control de acceso contextual | El servidor deriva el usuario de la sesión y comprueba rol, titularidad y etapa según la operación; no depende únicamente de ocultar acciones en la interfaz. | `server/src/identidad.js`, `solicitudes.js`, `revision-grados.js`, `administracion.js`; `specs/001-mis-tramites/spec.md` y `003-acceso-y-panel/spec.md`. |
| Minimización de datos devueltos | El perfil y respuestas públicas emplean selecciones explícitas; el login elimina `password` del objeto de respuesta. | `server/src/identidad.js`, `server/src/verificacion-documentos.js`; `specs/002-verificar-documento/spec.md` FR-003 y `specs/004-login-institucional/spec.md` FR-003. |
| Historial de operaciones específicas | Algunas transiciones escriben historial, revisión y auditoría dentro del flujo de escritura. El registro no cubre necesariamente todas las operaciones. | `server/src/solicitudes.js`, `revision-grados.js`, `server/prisma/schema.prisma`; `specs/003-acceso-y-panel/spec.md` FR-002/004. |

## Objetivo Sprint 2

Aplicar de forma dirigida SOLID, patrones, separación de capas, validación compartida o contratos de API solo cuando una especificación y un plan lo soliciten. No se afirma que esos principios estén implementados hoy. Cualquier refactorización debe conservar comportamiento con pruebas previas y posteriores y actualizar antes la documentación arquitectónica (`.specify/memory/constitution.md`).

Las métricas de calidad que se propongan para comprobar estas prácticas se marcan **propuesta, pendiente de validación del equipo**; no hay mediciones de mantenibilidad en las fuentes consultadas.

## Trazabilidad y fuentes

Especificaciones: `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`. Evidencia: archivos mencionados en `server/src/`, `server/prisma/schema.prisma`, componentes y servicios de `client/app/`, y reglas de `.specify/memory/constitution.md`.
