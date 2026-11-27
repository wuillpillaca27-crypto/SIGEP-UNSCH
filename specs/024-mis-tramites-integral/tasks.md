---
description: "Tareas de implementación de Mis Trámites integral"
---

# Tareas: Mis Trámites integral

**Entrada**: artefactos de `specs/024-mis-tramites-integral/`  
**Pruebas**: requeridas; Jest con PostgreSQL aislado, cliente, build y casos Playwright.

## Fase 1: preparación

- [ ] T001 [P] Agregar pruebas de regresión para las seis vistas en `client/app/__tests__/mis-tramites/` y confirmar sus contratos existentes.
- [ ] T002 [P] Agregar pruebas de autenticación/titularidad y estados para solicitudes en `server/src/solicitudes.test.js`.
- [ ] T003 Revisar rutas, `.gitignore`, seed demo y estado de migraciones sin mostrar secretos ni acceder a SQLite.

## Fase 2: fundacional

- [ ] T004 [P] Añadir prueba de contrato para notificaciones propias, acuse idempotente, recursos ajenos y rol en `server/src/solicitudes.test.js`.
- [x] T005 [P] Añadir pruebas de notificación por presentación, observación/subsanación/cambio de estado en `server/src/revision-grados-acciones.test.js`.
- [x] T006 Crear modelo `Notificacion` y migración PostgreSQL aditiva indexada/FK en `server/prisma/schema.prisma` y `server/prisma/migrations/`; probarla en suite temporal.

## Fase 3: Historia 1 — panel personal (P1)

**Prueba independiente**: comparar conteos agregados con fixtures propios en todos los estados; validar identidad, vacío, error y reintento.

- [ ] T007 [US1] Exponer resumen agregado del usuario sin enviar datos ajenos en `server/src/solicitudes.js`.
- [ ] T008 [US1] Mostrar bienvenida, indicadores dinámicos, actividad y accesos en `client/app/mis-tramites/page.tsx`.
- [ ] T009 [US1] Probar estados de carga/error/vacío y agregados en `client/app/__tests__/mis-tramites/panel.test.tsx`.

## Fase 4: Historia 2 — solicitudes propias (P1)

**Prueba independiente**: crear/recuperar/cancelar borrador propio; rechazar presentado/ajeno; filtros y acciones por estado.

- [x] T010 [P] [US2] Reutilizar la cancelación transaccional de borrador propio en `server/src/solicitudes.js`, conservando historial/auditoría.
- [x] T011 [US2] Conectar confirmación de cancelación con motivo y permisos por estado en `client/app/mis-tramites/expedientes/seguimiento.tsx`.
- [x] T012 [US2] Completar filtros de tipo/programa/fecha/estado, orden y paginación en `client/app/mis-tramites/expedientes/seguimiento.tsx`.
- [ ] T013 [US2] Probar cancelación, duplicación, ownership y filtros en `server/src/solicitudes.test.js` y `client/app/__tests__/mis-tramites/solicitudes.test.tsx`.

## Fase 5: Historia 3 — seguimiento y observaciones (P1)

**Prueba independiente**: derivar etapas/progreso de historial real; observar, subsanar, conservar versiones y revisar administrativamente.

- [x] T014 [US3] Derivar progreso/hitos solo del `HistorialEstado` persistido en `client/app/mis-tramites/expedientes/seguimiento.tsx`.
- [ ] T015 [US3] Completar filtros por tipo/fecha y enlace directo por expediente en `client/app/mis-tramites/observaciones/page.tsx` y `client/app/mis-tramites/subsanacion/page.tsx`.
- [ ] T016 [US3] Verificar que cargar corrección actualiza validación observada, conserva el original y requiere revisión de personal en `server/src/solicitudes.js` y `server/src/solicitudes.test.js`.
- [ ] T017 [US3] Probar acceso cruzado a expediente/documento y transición tras subsanación en `server/src/solicitudes.test.js` y `server/src/revision-grados-acciones.test.js`.

## Fase 6: Historia 4 — notificaciones persistentes (P2)

**Prueba independiente**: disparar evento transaccional, listar solo propias, marcar una/todas como leídas y rechazar acceso ajeno.

- [x] T018 [US4] Implementar listar/contar/marcar notificaciones del usuario en `server/src/solicitudes.js`.
- [x] T019 [US4] Crear notificaciones transaccionales para presentación, observación, subsanación recibida, decisión y emisión en `server/src/solicitudes.js` y `server/src/revision-grados.js`.
- [x] T020 [US4] Implementar centro/contador accesible y acciones de lectura en `client/app/mis-tramites/` sin alterar el header global.
- [x] T021 [US4] Añadir pruebas de persistencia, idempotencia, destinatario y regresión en suites de server/client.

## Fase 7: Historia 5 — historial y descargas (P2)

**Prueba independiente**: filtrar por año/tipo/estado, abrir timeline y descargar solo archivos autorizados.

- [x] T022 [US5] Añadir filtros históricos y conservar orden por fecha/ID en `client/app/mis-tramites/expedientes/seguimiento.tsx`.
- [ ] T023 [US5] Confirmar acceso a constancia/documentos emitidos y enlace de verificación en `server/src/solicitudes.test.js` y `client/app/__tests__/mis-tramites/`.

## Fase 8: verificación integral

- [ ] T024 [US1-US5] Ejecutar y documentar CP01–CP45 en `specs/024-mis-tramites-integral/evidencia/`; no aprobar pruebas omitidas.
- [x] T025 Ejecutar Jest cliente/servidor con cobertura y `npm run build`; actualizar `quickstart.md`.
- [x] T026 Revisar diffs, secretos/archivos ignorados, restricciones de rol y `git status`; confirmar que `specs/013` y `specs/015` no cambiaron.
- [ ] T027 Ejecutar `$speckit-analyze` y resolver inconsistencias documentales.

## Dependencias

- T001–T006 son prerequisitos compartidos; T006 bloquea endpoints de notificación.
- Historias 1–3 pueden avanzar usando el modelo actual después de la base común.
- Historia 4 depende de la migración y comparte transacciones con Historia 3.
- Historia 5 reutiliza documentos e historial ya probados.
- T024–T027 cierran todas las historias.
