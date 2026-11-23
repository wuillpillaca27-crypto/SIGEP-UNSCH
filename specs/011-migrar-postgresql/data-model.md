# Modelo de datos: PostgreSQL

El contrato lógico existente se conserva. Este artefacto describe las entidades Prisma de `server/prisma/schema.prisma`; la implementación traduce el schema SQLite vigente a tipos, constraints y enums PostgreSQL sin cambiar nombres de campos ni reglas de dominio.

## Entidades

| Entidad (tabla física) | Claves y campos principales | Relaciones / reglas |
|---|---|---|
| `Usuario` (`usuarios`) | `id` autoincremental; nombres, apellidos, `dni` único, `email` único, password hash, rol, activo, creado/actualizado | Un usuario tiene opcionalmente un estudiante; puede tener solicitudes, revisiones, auditorías, validaciones responsables y documentos subidos. |
| `Programa` (`programas`) | `id`, nombre, tipo, facultad, activo, creado | Uno a muchos con estudiantes, solicitudes y plantillas de requisito. |
| `Estudiante` (`estudiantes`) | `id`, `usuarioId` único, `codigoUniv` único, `programaId`, teléfono opcional, estado académico, créditos, promedio, creado/actualizado | Pertenece a un usuario y programa; puede tener solicitudes. |
| `PlantillaRequisito` (`plantillas_requisito`) | `id`, programa, trámite, `codigo` único, nombre, descripción, tipo, obligatorio, orden, activo, versión normativa, creado | Pertenece a un programa; puede ser referida por validaciones de requisito. |
| `Solicitud` (`solicitudes`) | `id`, `codigo` único, estudiante, usuario solicitante, programa, trámite, estado, observaciones, fechas creado/actualizado/presentado/aprobado | Pertenece a estudiante, usuario y programa; agrega documentos, revisiones, validaciones, historial y auditorías. |
| `ValidacionRequisito` (`validaciones_requisito`) | `id`, solicitud, plantilla, estado, evidencia/observación opcionales, usuario validador opcional, fechas de validación y auditoría | Pertenece a solicitud y plantilla; usuario responsable opcional. |
| `DocumentoSolicitud` (`documentos_solicitud`) | `id`, solicitud, nombre, tipo, nombre/ruta interna de archivo, MIME, bytes, usuario que subió, creado, reemplazo opcional | Pertenece a una solicitud y a un usuario subidor; `rutaArchivo` es interna, no una URL pública. |
| `Revision` (`revisiones`) | `id`, solicitud, revisor, acción, comentario opcional, estado antes/después, creado | Pertenece a solicitud y usuario revisor; registra una transición ya existente. |
| `HistorialEstado` (`historial_estados`) | `id`, solicitud, estado antes opcional, estado después, motivo opcional, creado | Pertenece a una solicitud. |
| `Auditoria` (`auditoria`) | `id`, usuario, acción, entidad, entidadId, detalles/IP opcionales, creado | Pertenece a usuario; la relación opcional de solicitud utiliza `entidadId`, de acuerdo con el modelo actual. |

## Enums PostgreSQL

Todos los tipos y miembros se conservan exactamente. PostgreSQL almacena estos enums nativamente y restringe valores inválidos en el motor.

| Enum | Miembros |
|---|---|
| `Rol` | administrador, operador, docente, estudiante |
| `TipoPrograma` | maestria, doctorado, segunda_especialidad, diplomado, certificacion_modulos |
| `EstadoAcademico` | activo, egresado, graduado, suspendido, retirado |
| `TipoTramite` | grado_maestro, grado_doctor, titulo_segunda_especialidad, certificado_diplomado, certificacion_modulos |
| `TipoRequisito` | academico, documental, pago, idioma, otro |
| `EstadoSolicitud` | borrador, presentado, en_revision, observado, validado, pendiente_aprobacion, aprobado, en_emision, emitido, rechazado, desistido, anulado |
| `EstadoValidacion` | cumplido, pendiente, observado, en_revision, no_aplica |
| `AccionRevision` | presentar, iniciar_revision, observar, validar, aprobar, rechazar, solicitar_subsanacion, subsanar, emitir, anular |

## Reglas de integridad

- Las claves primarias mantienen el tipo entero y generación automática del modelo actual.
- `Usuario.dni`, `Usuario.email`, `Estudiante.usuarioId`, `Estudiante.codigoUniv`, `PlantillaRequisito.codigo` y `Solicitud.codigo` conservan unicidad.
- Todas las relaciones declaradas en Prisma se generan como foreign keys PostgreSQL; preservar el nombre de tabla física mediante `@@map`.
- Defaults, campos opcionales, precisión del promedio, timestamps, y `@updatedAt` se cotejan con el schema y la migración SQL inicial.
- Los IDs de una base SQLite local no se importan. La carga de 20.000 usuarios usa datos sintéticos y valida las relaciones que cree.

## Aislamiento de pruebas

No constituye un modelo de negocio persistente. El helper Jest crea un schema aleatorio por archivo, instala ahí el mismo historial de migraciones y lo elimina junto con sus tablas y tipos enum al cerrar el archivo.
