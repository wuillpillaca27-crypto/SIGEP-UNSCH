# Tareas: Siembra local de trámites académicos

**Entrada**: documentos de `specs/025-sembrar-grados-dev/`
**Pruebas**: requeridas por SC-001, SC-003 y SC-004; destino de pruebas aislado.

## Fase 1: preparación

- [x] T001 [P] Añadir pruebas unitarias de destino, manejo externo de credenciales, claves y reconciliación en `server/scripts/sembrar-grados-dev.test.js`.
- [x] T002 Revisar modelos, migraciones, `sembrar-carga.js`, catálogo y `.gitignore` sin acceder a `sigep`, `sigep_test` o SQLite.

## Fase 2: Historia 1 — preparar cuentas de desarrollo (P1)

**Prueba independiente**: validar rechazo de destinos sin conectarse y confirmar las claves de fixtures generadas.

- [x] T003 [US1] Implementar guardia exacta de `sigep_dev`, migración Prisma y manejo seguro de credenciales en `server/scripts/sembrar-grados-dev.js`.
- [x] T004 [US1] Reconciliar tres programas/configuraciones/plantillas, estudiantes/matrículas, administrador y operador en una transacción idempotente en `server/scripts/sembrar-grados-dev.js`.
- [x] T005 [US1] Exponer `db:seed:grados-dev` en `server/package.json`.
- [x] T006 [US1] Documentar preparación de PostgreSQL/base y arranque aislado en `server/README.md`.
- [x] T007 [US1] Ejecutar pruebas específicas y `npx jest`, revisar que no haya secretos ni cambios a `specs/013`/`specs/015`, y registrar resultados en `specs/025-sembrar-grados-dev/quickstart.md`.

## Fase 3: cierre

- [x] T008 Revisar `git diff --check`, confirmar solo los archivos de esta feature y crear un commit dedicado con los cambios de `server/` y `specs/025-sembrar-grados-dev/`.

## Dependencias

- T001 y T002 preceden a T003.
- T003 y T004 forman el núcleo de la historia; T005 y T006 exponen su uso.
- T007 depende de T001–T006; T008 cierra tras verificación.
