# Tareas: Trámites académicos con matrículas compatibles

**Entrada**: Diseño en `specs/022-unificar-demostracion-matriculas/`  
**Prerequisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`.  
**Pruebas**: Solicitadas explícitamente. Jest, build y 14 casos Playwright/Chrome con evidencia real.

## Fase 1: Setup

**Propósito**: Confirmar el entorno seguro y establecer evidencia inicial antes de cambiar código.

- [ ] T001 Inspeccionar el flujo de sesión, las matrículas cargadas, endpoints y esquema en `server/src/identidad.js`, `server/src/solicitudes.js` y `server/prisma/schema.prisma`; redactar la causa raíz observada en `specs/022-unificar-demostracion-matriculas/research.md` sin copiar valores de `.env`.
- [ ] T002 Confirmar que el objetivo local del servidor es PostgreSQL loopback y `NODE_ENV=development` sin mostrar `DATABASE_URL`; documentar la precondición en `specs/022-unificar-demostracion-matriculas/quickstart.md`.

## Fase 2: Fundacional

**Propósito**: Proteger los datos existentes y unificar el contrato matrícula-programa-trámite.

- [ ] T003 [P] Agregar pruebas de autorización y opciones por varias matrículas en `server/src/solicitudes.test.js`, incluyendo titularidad, estados académicos y publicación.
- [ ] T004 [P] Agregar pruebas de sesión/perfil mult matrícula en `server/src/identidad.test.js`, preservando las aserciones existentes.
- [ ] T005 Verificar la migración versionada de matrícula múltiple y las FKs de `Solicitud` en `server/prisma/migrations/20261126010000_multiples_programas/migration.sql`; crear una migración aditiva solo si el modelo o PostgreSQL no satisface `data-model.md`.

## Fase 3: Historia 1 — Elegibilidad por matrícula (P1)

**Objetivo**: Seleccionar el programa y matrícula correctos y conservar las restricciones en backend.

**Prueba independiente**: Consultar opciones e intentar crear solicitudes de Maestro, Doctor y Segunda Especialidad con la cuenta integral y con la cuenta negativa solo-maestría.

- [ ] T006 [US1] Ejecutar primero las pruebas T003–T004 y ajustar `server/src/identidad.js` para exponer matrículas propias con sus programas sin depender del primer registro.
- [ ] T007 [US1] Corregir los casos de compatibilidad, detalle de motivos y elección única/múltiple en `server/src/solicitudes.js`, manteniendo estados, fechas, habilitación, configuración, requisitos y ownership.
- [ ] T008 [US1] Añadir pruebas del contrato de opciones y creación para los tres tipos, selección automática, selección múltiple, matrícula incompatible y programa ajeno en `server/src/solicitudes.test.js`.
- [ ] T009 [US1] Verificar que la sesión del frontend y la pantalla de programas consumen la lista real en `client/app/mis-tramites/sesion.tsx` y `client/app/mis-tramites/programas/`.

## Fase 4: Historia 2 — Asistentes completos (P1)

**Objetivo**: Ejecutar los mismos cinco pasos para los tres trámites y conservar expedientes.

**Prueba independiente**: Crear, guardar, recuperar y presentar un borrador de cada tipo; confirmar requisitos, archivos y Mis Trámites.

- [ ] T010 [P] [US2] Ampliar pruebas de opciones, selector y mensajes de elegibilidad del asistente en `client/app/__tests__/grados-titulos/asistente.test.tsx` (crear la suite si aún no existe).
- [ ] T011 [P] [US2] Probar solicitudes HTTP, reemplazo/retiro de PDF, ownership y errores recuperables en `client/app/__tests__/lib/api.test.ts` y `server/src/solicitudes.test.js`.
- [ ] T012 [US2] Conectar el tipo de trámite y `programaId` seleccionado desde `client/app/grados-titulos/iniciar-solicitud/page.tsx`, `asistente.tsx` y `solicitudes-api.ts`.
- [ ] T013 [US2] Diferenciar causas de bloqueo, selección automática/múltiple y enlaces de requisitos/orientación en `client/app/grados-titulos/iniciar-solicitud/asistente.tsx` y `tramites.ts`.
- [ ] T014 [US2] Verificar y conectar los botones de navegación, descarga de formatos, adjuntar/visualizar/reemplazar/retirar, borrador, cancelar, presentar y consultar expediente en `client/app/grados-titulos/` y `client/app/mis-tramites/`.
- [ ] T015 [US2] Confirmar que la lista de expedientes, documentos e historial filtra por usuario y refleja el programa seleccionado en `server/src/solicitudes.js`, `client/app/mis-tramites/expedientes/` y sus pruebas.

## Fase 5: Historia 3 — Cuenta integral de demostración aislada (P2)

**Objetivo**: Preparar los tres programas solicitados y sus requisitos sin alterar registros reales.

**Prueba independiente**: Ejecutar dos veces el seed en PostgreSQL local development; verificar tres matrículas, plantillas publicadas y que producción/host remoto es rechazado.

- [ ] T016 [P] [US3] Añadir pruebas del guard de entorno, seed repetible, conservación de contraseñas y no duplicación en `server/scripts/sembrar-demo.test.js`.
- [ ] T017 [US3] Corregir el seed para crear/reconciliar la cuenta integral con Maestría, Doctorado y Segunda Especialidad y requisitos demo, sin cambiar datos no demo, en `server/scripts/sembrar-demo.js`.
- [ ] T018 [US3] Verificar que contraseñas seed no aparecen en consola ni en Git y que el archivo local de credenciales queda ignorado mediante `server/scripts/sembrar-demo.js` y `server/.gitignore`.
- [ ] T019 [US3] Ejecutar `npm run db:seed:demo` dos veces en la base local confirmada y revisar conteos e IDs de las tres matrículas sin imprimir contraseñas, hashes ni URL; registrar evidencia en `specs/022-unificar-demostracion-matriculas/evidencia/`.

## Fase 6: Historia 4 — Pruebas reales de extremo a extremo (P2)

**Objetivo**: Dejar evidencia ejecutable CP01–CP14 de los tres flujos y del rechazo negativo.

**Prueba independiente**: Ejecutar el script Playwright con Chrome contra el portal local conectado a PostgreSQL development.

- [ ] T020 [P] [US4] Revisar y completar el script navegador para CP01–CP07 en `server/scripts/verificar-integral.cjs`, cubriendo login, matrículas, tres asistentes, requisitos y archivos.
- [ ] T021 [P] [US4] Completar CP08–CP14 en `server/scripts/verificar-integral.cjs`, incluyendo persistencia tras sesión nueva, cuenta incompatible y regresión Maestro.
- [ ] T022 [US4] Guardar capturas sintéticas de selector y asistentes/expedientes en `specs/022-unificar-demostracion-matriculas/evidencia/` sin tokens, contraseñas ni datos personales reales.
- [ ] T023 [US4] Ejecutar CP01–CP14, revisar la persistencia de tres expedientes y guardar reporte sin datos sensibles en `specs/022-unificar-demostracion-matriculas/evidencia/`.

## Fase 7: Polish y verificación

**Propósito**: Asegurar que el cambio no afecte las interfaces institucionales ni la regresión de Maestro.

- [ ] T024 Ejecutar Jest del cliente y servidor con cobertura y `npm run build` del cliente; registrar comandos y resultados en `specs/022-unificar-demostracion-matriculas/quickstart.md`.
- [ ] T025 Revisar `git diff` para confirmar que no cambió inicio, header, footer, menús o diseño del login, y que no se debilitó ninguna validación académica.
- [ ] T026 Confirmar `.gitignore` y `git status` para que `.env`, `.sqlite`, archivos de cuentas, cargas, tokens y cobertura no se agreguen a Git; actualizar los criterios completos en `tasks.md`.

## Dependencias y orden

- Setup T001–T002 antes de tocar la base o ejecutar el seed.
- Fundacional T003–T005 antes de backend US1.
- US1 T006–T009 antes de finalizar el cliente US2.
- US3 puede implementarse después de confirmar el guard de entorno; el seed real requiere revisión previa del destino y autorización del entorno development.
- US4 depende del seed y de los tres asistentes funcionales.
- Polish y verificación después de todas las historias.

## Oportunidades de paralelismo

- T003 y T004 son suites distintas.
- T010 y T011 se enfocan en capas/suites diferentes y pueden ejecutarse antes de T012.
- T020 y T021 pueden editarse en paralelo solo si se coordinan bloques independientes del mismo archivo; preferir secuencia para evitar conflicto.

## Estrategia

1. Cerrar US1 para resolver el bloqueo de selección y proteger ownership.
2. Completar US2 y conservar Maestro como regresión inmediata.
3. Ejecutar seed aislado y después CP01–CP14 en navegador.
4. Cerrar con Jest, cobertura, build y revisión de seguridad de los datos de demo.
