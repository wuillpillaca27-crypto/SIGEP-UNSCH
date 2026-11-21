# Escenarios de atributos de calidad

## Resumen

Los escenarios describen estímulo, respuesta y evidencia para evaluar calidad. Los registros actuales identifican controles o vacíos; las metas no medidas se dejan como propuestas para validación del equipo.

## Implementado hoy

| Atributo | Contexto y estímulo | Respuesta observada | Evidencia / medida actual |
|---|---|---|---|
| Seguridad: sesión | Un cliente solicita un recurso protegido sin cookie válida. | El middleware verifica JWT y usuario activo; rechaza sesión inválida con 401. | `server/src/identidad.js`. Medición de seguridad: no medida. |
| Seguridad: titularidad | Un estudiante consulta un expediente asociado a otro usuario. | Las consultas personales incorporan `usuarioId` de la sesión; si no existe coincidencia, la ruta no entrega el expediente. | `server/src/solicitudes.js`. Medición de cobertura: no medida. |
| Seguridad: consulta pública | Una persona consulta un código de documento. | Se confirma solo una solicitud `emitido`; la proyección pública no incluye identidad del titular ni archivo. | `server/src/verificacion-documentos.js`. Medición de privacidad: no medida. |
| Rendimiento | Aumenta el volumen de consultas/listados. | Algunos listados limitan filas por página; no se encontró evidencia de pruebas de carga. | `server/src/revision-grados.js`, `administracion.js`. Latencia y concurrencia actuales: no medidas. |
| Disponibilidad | La dependencia de datos o proceso falla. | El manejador HTTP devuelve un error de servicio genérico para errores no clasificados. | `server/src/index.js`. Disponibilidad medida: no. No se verificó redundancia ni recuperación. |
| Mantenibilidad | Un desarrollador necesita localizar el código de una ruta o página. | Cliente agrupa páginas y utilidades por áreas bajo `client/app/`; servidor ubica módulos registradores bajo `server/src/`. | Estructura de carpetas y módulos fuente. Tiempo de cambio: no medido. |
| Trazabilidad | Una solicitud cambia de etapa por acción registrada. | Algunas rutas insertan registros en `HistorialEstado`, `Revision` y `Auditoria`; existe consulta administrativa de auditoría. | `server/src/solicitudes.js`, `revision-grados.js`, `administracion.js`, `server/prisma/schema.prisma`. Cobertura total: no verificada. |

## Objetivo Sprint 2

| Atributo | Estímulo de evaluación propuesto | Respuesta deseada para validar | Métrica/estado |
|---|---|---|---|
| Rendimiento | Usuarios virtuales realizan consultas y operaciones representativas simultáneas. | Definir una respuesta aceptable y observar errores bajo carga. | Hasta 2.000 usuarios virtuales concurrentes: **propuesta, pendiente de validación del equipo**. No es una capacidad medida o garantizada. |
| Seguridad | Revisores prueban sesión, roles, titularidad, validación de entradas y exposición de información en endpoints representativos. | Ninguna persona no autorizada accede a datos/acciones fuera de su permiso; registrar hallazgos y remediación. | Protocolo y umbrales: **propuesta, pendiente de validación del equipo**. |
| Disponibilidad | Se interrumpe o degrada una dependencia en el entorno elegido. | Acordar comportamiento de degradación y recuperación con el equipo. | SLO y período: **propuesta, pendiente de validación del equipo**; valor no establecido. |
| Mantenibilidad | Se solicita cambiar una regla de trámite y seguir sus dependencias. | Medir localización, edición y validación del cambio. | Línea base y umbral: **propuesta, pendiente de validación del equipo**. |
| Trazabilidad/auditoría | Se ejecuta cada tipo de transición y acción administrativa definida como auditable. | Confirmar actor, acción, entidad y momento de los eventos que el equipo determine. | Cobertura y política de retención: **propuesta, pendiente de validación del equipo**. |

## Trazabilidad y fuentes

Requisitos de calidad: `specs/008-documentacion-arquitectura/spec.md`, FR-006–FR-008. Evidencia: `server/src/index.js`, `identidad.js`, `solicitudes.js`, `revision-grados.js`, `administracion.js`, `verificacion-documentos.js`, `server/prisma/schema.prisma` y estructura de `client/app/`.
