# Atributos de calidad

## Resumen

Los atributos de calidad expresan cómo debería responder el sistema además de qué funciones ofrece. Aquí se describe evidencia visible en el repositorio y se separa de metas que el equipo todavía debe acordar y medir.

## Implementado hoy

| Atributo | Evidencia disponible | Lo que no está demostrado |
|---|---|---|
| Rendimiento | La API pagina listas de revisión, estudiantes, usuarios y auditoría (`server/src/revision-grados.js`, `server/src/administracion.js`). | No hay medición de carga o latencia en las fuentes revisadas. No se ha demostrado capacidad de 2.000 usuarios concurrentes. |
| Seguridad | `server/src/identidad.js` usa bcryptjs, JWT y cookie HttpOnly; los módulos aplican autenticación, roles y titularidad. `server/src/index.js` valida origen en solicitudes de escritura y configura tamaño máximo JSON. El endpoint público de verificación limita los campos devueltos. | La existencia de controles en código no constituye una auditoría de seguridad ni evidencia de efectividad ante ataques. |
| Disponibilidad | `server/src/index.js` inicia un proceso Express y devuelve errores de servicio para errores no clasificados. | No se observaron despliegue redundante, monitoreo, SLO, recuperación automatizada ni estadísticas de disponibilidad en las fuentes. |
| Mantenibilidad | El cliente organiza código bajo `client/app/` en páginas, componentes, hooks, servicios y utilidades. Las rutas del servidor se distribuyen en módulos registradores directamente bajo `server/src/`. | No hay métricas de mantenibilidad, cobertura o deuda técnica consideradas aquí; la estructura por sí sola no mide mantenibilidad. |
| Trazabilidad y auditoría | El esquema contiene `Auditoria`, `Revision` e `HistorialEstado`; ciertas acciones de solicitudes y revisión insertan registros en `server/src/solicitudes.js` y `server/src/revision-grados.js`; hay consulta de auditoría bajo administración. | El código visible registra acciones específicas, no toda lectura o modificación. No se afirma cobertura completa ni inmutabilidad del registro. |

## Objetivo Sprint 2

Proponer que el equipo valide indicadores antes de adoptarlos:

- **Rendimiento**: evaluar escenarios de carga de hasta 2.000 usuarios virtuales concurrentes. Es una meta **propuesta, pendiente de validación del equipo**; no implica capacidad medida ni garantizada.
- **Seguridad**: medir la cobertura de pruebas para autenticación, roles, titularidad y exposición de datos mediante revisión aprobada por el equipo. Cualquier umbral cuantitativo sería **propuesta, pendiente de validación del equipo**.
- **Disponibilidad**: acordar un SLO y período de medición solo después de conocer el entorno de despliegue. No se propone aquí un porcentaje como compromiso.
- **Mantenibilidad**: acordar indicadores de revisión (por ejemplo, tiempo para localizar y cambiar un módulo) y obtener una línea base antes de fijar una meta.
- **Trazabilidad**: acordar qué operaciones requieren evento de auditoría y comprobar su persistencia y consulta; no presumir cobertura total a partir del esquema.

Las mediciones actuales para estos atributos están **no medidas** en las fuentes consultadas. Toda métrica numérica que se agregue posteriormente debe marcarse literalmente `propuesta, pendiente de validación del equipo`.

## Trazabilidad y fuentes

- Drivers y criterios de calidad solicitados: `specs/008-documentacion-arquitectura/spec.md`, FR-006 a FR-008 y escenarios de las historias.
- Evidencia del servidor: `server/src/index.js`, `identidad.js`, `solicitudes.js`, `revision-grados.js`, `administracion.js`, `verificacion-documentos.js`.
- Modelo de datos: `server/prisma/schema.prisma` (`Auditoria`, `Revision`, `HistorialEstado`).
- Estructura del cliente: `client/app/` y `client/package.json`.
