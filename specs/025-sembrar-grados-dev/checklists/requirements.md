# Lista de calidad: Siembra local de trámites académicos

**Propósito**: validar claridad, alcance y seguridad antes de planificar.
**Fecha**: 2026-11-26
**Feature**: [spec.md](../spec.md)

## Calidad de contenido

- [x] Las historias describen el valor para quien desarrolla/prueba.
- [x] Los requisitos son comprobables y no dejan destinos de escritura ambiguos.
- [x] Los criterios de éxito son medibles.
- [x] Se identifican fallos de conexión, conflictos y repetición.

## Seguridad y límites

- [x] La única base aceptada es PostgreSQL loopback `sigep_dev`.
- [x] `sigep`, `sigep_test`, bases remotas y modo producción se excluyen explícitamente.
- [x] Contraseñas, hashes, URL y `.env` quedan protegidos.
- [x] No se modifica ni se reemplaza la cadena de migraciones Prisma.
- [x] Se excluyen los archivos de `specs/013` y `specs/015`.

## Preparación

- [x] Plan, tareas y modelo de fixtures están alineados con la solicitud.
- [x] La idempotencia y la prueba de destinos rechazados tienen criterios explícitos.
