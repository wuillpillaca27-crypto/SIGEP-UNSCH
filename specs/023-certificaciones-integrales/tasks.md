---
description: "Tareas de implementación de Certificaciones integrales"
---

# Tareas: Certificaciones integrales para desarrollo

**Entrada**: `specs/023-certificaciones-integrales/`  
**Pruebas**: solicitadas explícitamente; Jest, build y pruebas reales de navegador sin inventar resultados.

## Fase 1: inspección y alcance

- [X] T001 [P] Auditar cada ruta pública, navegación, filtros y formularios bajo `client/app/certificaciones/`; registrar defectos reproducibles.
- [X] T002 [P] Auditar APIs/casos de prueba de catálogo, solicitudes y revisión en `server/src/catalogo-grados.js`, `server/src/solicitudes.js`, `server/src/revision-grados.js` y `server/src/*test.js`.
- [X] T003 Confirmar guard/aislamiento de seed demo y exclusiones de Git en `server/scripts/sembrar-demo.js`, `.gitignore` y `server/.gitignore`, sin imprimir secretos.

## Fase 2: fundacional

- [X] T004 [P] Añadir contrato probado de catálogo de certificaciones (vacío, búsqueda/selección, formatos seguros y requisitos por programa) en `server/src/catalogo-grados.test.js` y `client/app/__tests__/certificaciones/orientacion.test.tsx`.
- [X] T005 [P] Añadir pruebas de usuario/roles/propiedad para solicitudes de ambos tipos en `server/src/solicitudes.test.js` y `client/app/__tests__/certificaciones/asistente.test.tsx`.
- [ ] T006 Definir el origen académico de diplomados y módulos cursados y aprobar el modelo aditivo antes de crear tablas/migración; actualizar `research.md` y `data-model.md`. No sembrar historial como si fuera oficial.

## Fase 3: Historia 1 — catálogos públicos (P1)

**Prueba independiente**: abrir las rutas del menú; buscar/filtrar/limpiar programas y requisitos; navegar al detalle y volver; verificar vacío, error y enlace de orientación.

- [X] T007 [US1] Implementar lista buscable/filtrable de programas de certificación desde el catálogo de API en `client/app/grados-titulos/orientacion.tsx`.
- [ ] T008 [US1] Verificar contenido del menú, nombres, enlaces, estado activo y uso por teclado en `client/app/components/NavbarPublica.tsx` y `client/app/__tests__/certificaciones/`.
- [X] T009 [US1] Completar pruebas de formatos y ausencia de valores oficiales en `server/src/catalogo-grados.test.js` y la vista de certificación.

## Fase 4: Historia 2 — certificación de diplomados (P1)

**Prueba independiente**: solicitante propio y elegible crea borrador, adjunta documento, recupera, presenta y consulta expediente; matrícula ajena/no elegible se rechaza.

- [ ] T010 [US2] Confirmar con pruebas la autorización y persistencia de `certificado_diplomado` en `server/src/solicitudes.test.js`.
- [ ] T011 [US2] Verificar todos los estados y botones del flujo diplomado en `client/app/__tests__/certificaciones/asistente.test.tsx` y `server/src/revision-grados-acciones.test.js`.
- [ ] T012 [US2] Mostrar programas/diplomados cursados solo cuando exista el origen académico autorizado; no inferir aprobación desde matrícula ni promedios.

## Fase 5: Historia 3 — certificación por módulos (P1)

**Prueba independiente**: estudiante consulta módulos con estado, periodo, créditos y horas; se permite el módulo elegible y se rechazan no aprobado, inexistente o ajeno en backend.

- [ ] T013 [P] [US3] Diseñar entidades y restricciones del historial académico y selección de módulos en `data-model.md` y contratos; bloquear si falta fuente/regla institucional.
- [ ] T014 [US3] Añadir pruebas de elegibilidad, selección permitida, duplicado y ownership en `server/src/solicitudes.test.js`.
- [ ] T015 [US3] Implementar migración Prisma aditiva solo después de aprobar T006/T013; probar migración y secuencias con PostgreSQL.
- [ ] T016 [US3] Implementar API y formulario de consulta/selección de módulos persistidos, sin confiar en selección cliente, en `server/src/solicitudes.js` y `client/app/certificaciones/`.
- [ ] T017 [US3] Extender seed demo idempotente con datos académicos sintéticos marcados como demo en `server/scripts/sembrar-demo.js` y sus pruebas.

## Fase 6: Historia 4 — gestión y revisión administrativa (P2)

**Prueba independiente**: administrar requisitos con permisos, revisar expediente, observar/subsanar y avanzar transiciones legales; rol insuficiente y transición inválida se rechazan.

- [ ] T018 [US4] Verificar CRUD/publicación de requisitos y trazabilidad de cambios en `server/src/administracion.test.js` y pantallas admin.
- [ ] T019 [US4] Probar historial, roles y transiciones en `server/src/revision-grados-acciones.test.js` y `client/app/admin/revision.tsx`.
- [ ] T020 [US4] Limitar emisión de documentos demo a desarrollo y rotularlos como no oficiales; verificar código/QR sin datos privados en `server/src/verificacion-documentos.js` y pruebas.

## Fase 7: integración y regresión

- [ ] T021 Ejecutar casos E2E documentados CP01–CP30 y guardar solo evidencia sintética bajo `specs/023-certificaciones-integrales/evidencia/`.
- [X] T022 Ejecutar Jest del cliente y servidor con cobertura y `npm run build` del cliente; registrar resultados reales en `quickstart.md`.
- [ ] T023 Revisar diffs y `.gitignore` para excluir secretos, documentos, `.sqlite`, archivos `.env`, tokens y datos de salida; no tocar `specs/013` ni `specs/015`.
- [ ] T024 Ejecutar `$speckit-analyze`, resolver incompatibilidades entre spec/plan/tasks/contracts y registrar dependencias institucionales pendientes.

## Dependencias

- T001–T005 antes del cierre de historias.
- T006 y T013 bloquean cualquier tabla o seed de historial académico.
- US1 puede completarse independientemente; US2 reutiliza el asistente y autorización existentes.
- US3 depende de T006/T013 y de una migración aprobada; no simular elegibilidad.
- US4 reutiliza el flujo administrativo existente.
- T021–T024 cierran la verificación transversal.
