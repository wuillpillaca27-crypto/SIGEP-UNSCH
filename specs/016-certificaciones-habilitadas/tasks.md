---
description: "Tareas de implementación de Certificaciones habilitadas"
---

# Tasks: Solicitud de certificaciones habilitadas

**Input**: Design documents from `/specs/016-certificaciones-habilitadas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/opciones-certificacion.md

**Tests**: Requeridos por la solicitud; añadir pruebas de contrato e integración con Jest y cobertura.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el alcance y usar fixtures aislados para pruebas.

- [X] T001 Preparar pruebas de certificación en el esquema temporal de `server/src/test/postgres-suite.js` y documentar que sus programas son datos de prueba.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fijar la regla de elegibilidad y el contrato compartido antes de implementar la UI.

- [X] T002 Confirmar en `specs/016-certificaciones-habilitadas/contracts/opciones-certificacion.md` que opciones y creación se derivan de `Estudiante.programaId` y no del catálogo público.

**Checkpoint**: El contrato preserva autenticación, rol, titularidad y catálogo activo.

---

## Phase 3: User Story 1 - Acceder a las certificaciones permitidas (Priority: P1) 🎯 MVP

**Goal**: Determinar la elegibilidad desde el servidor, redirigir las sesiones ausentes y mostrar opciones o una explicación útil.

**Independent Test**: Consultar elegibilidad sin sesión y con matrículas elegible/no elegible; verificar redirección al login, vínculo de retorno seguro, opciones limitadas al estudiante y motivos concretos.

### Tests for User Story 1

- [X] T003 [P] [US1] Añadir pruebas de contrato e integración para `GET /solicitudes/opciones-certificacion` en `server/src/solicitudes.test.js`: 401, rol incorrecto, sin estudiante, programa inactivo, tipo no certificable, sin plantillas activas, y programa elegible con requisitos solo propios.
- [X] T004 [P] [US1] Añadir pruebas del asistente de Certificaciones para sesión ausente, retorno al login, elegibilidad, selector, ayuda y motivos en `client/app/__tests__/certificaciones/asistente.test.tsx`.

### Implementation for User Story 1

- [X] T005 [US1] Implementar `GET /api/solicitudes/opciones-certificacion` en `server/src/solicitudes.js`, usando la matrícula autenticada y las condiciones de `Programa.activo` y `PlantillaRequisito.activo` descritas en `data-model.md`.
- [X] T006 [US1] Mantener la validación del endpoint bajo autenticación y rol estudiante, y devolver motivos distintos para matrícula ausente, programa inactivo, tipo no certificable o requisitos inexistentes en `server/src/solicitudes.js`.
- [X] T007 [US1] Crear `client/app/certificaciones/iniciar-solicitud/asistente.tsx` como flujo aislado: consultar sesión/opciones, redirigir 401 al login con retorno local, mostrar selectores solo con datos asociados a la matrícula y ofrecer Ayuda cuando no haya opción.
- [X] T008 [US1] Actualizar `client/app/certificaciones/iniciar-solicitud/page.tsx` para montar el asistente aislado sin tocar header, portada, login ni rutas de Grados y Títulos.

**Checkpoint**: Una cuenta estudiante solo ve opciones autorizadas por su propia matrícula; los demás casos explican la causa sin crear expedientes.

---

## Phase 4: User Story 2 - Completar y seguir una solicitud de certificación (Priority: P2)

**Goal**: Completar los cuatro pasos con persistencia de borrador, presentación y seguimiento existentes.

**Independent Test**: Con fixture marcado como prueba que tenga una plantilla activa, crear/retomar borrador, cargar PDF, presentar y comprobar código e historial en Mis Trámites; rechazar un programa ajeno.

### Tests for User Story 2

- [X] T009 [P] [US2] Añadir pruebas para selector y flujo de cuatro pasos, borrador retomado, error de sesión vencida, presentación y enlace a Mis Trámites en `client/app/__tests__/certificaciones/asistente.test.tsx`.
- [X] T010 [P] [US2] Añadir pruebas de `POST /solicitudes` que rechacen `programaId` ajeno/no coincidente y confirmen la persistencia de expediente, requisitos e historial en `server/src/solicitudes.test.js`.

### Implementation for User Story 2

- [X] T011 [US2] Extender `solicitudes.crear` con `programaId` opcional en `client/app/grados-titulos/solicitudes-api.ts`, conservando las llamadas actuales de Grados y Títulos.
- [X] T012 [US2] Validar `programaId` recibido contra `Estudiante.programaId` en `server/src/solicitudes.js` antes de crear o devolver un borrador; conservar la validación de `Programa.activo` y las plantillas activas definidas en `data-model.md`.
- [X] T013 [US2] Implementar en `client/app/certificaciones/iniciar-solicitud/asistente.tsx` los pasos programa/certificación, requisitos, documentos y confirmación con guardado/retoma de borrador, presentación y enlace al expediente.
- [X] T014 [US2] Confirmar desde el asistente de Certificaciones el seguimiento existente de todos los tipos de trámite en `client/app/mis-tramites/expedientes/seguimiento.tsx` sin cambiar su comportamiento visual ni el de Grados y Títulos.

**Checkpoint**: Una solicitud autorizada conserva titularidad, requisitos, PDF, código, historial y seguimiento en Mis Trámites.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verificar capas afectadas, seguridad y ausencia de regresiones.

- [X] T015 Ejecutar Jest con cobertura en `server/` y `client/`, además de `npm run build` en `client/`; registrar resultados y limitaciones de datos oficiales en `specs/016-certificaciones-habilitadas/quickstart.md`.
- [X] T016 Revisar `git diff` para confirmar que no cambiaron el header, la portada, el login, el esquema de base de datos ni los módulos ajenos en `client/` y `server/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depende de Setup; bloquea historias.
- **User Story 1 (Phase 3)**: Depende del contrato; es el MVP.
- **User Story 2 (Phase 4)**: Depende de la elegibilidad de US1 y el contrato validado.
- **Polish (Phase 5)**: Depende de ambas historias.

### User Story Dependencies

- **US1 (P1)**: Implementable después de contrato y fixtures; no depende de US2.
- **US2 (P2)**: Depende de la API y selección de elegibilidad de US1; usa el expediente existente.

### Parallel Opportunities

- T003 y T004 pueden prepararse en paralelo porque tocan suites distintas.
- T009 y T010 pueden prepararse en paralelo porque tocan suites distintas.
- La implementación backend/frontend de US1 puede dividirse por archivo una vez fijado el contrato.

## Parallel Example: User Story 1

```text
T003 server/src/solicitudes.test.js
T004 client/app/__tests__/certificaciones/asistente.test.tsx
```

## Implementation Strategy

### MVP First (User Story 1)

1. Crear fixtures aislados y probar contrato de elegibilidad.
2. Implementar opciones autenticadas y validación de sesión.
3. Implementar redirección, motivos, selector y enlace de ayuda de Certificaciones.
4. Verificar US1 independientemente.

### Incremental Delivery

1. Entregar acceso seguro y elegibilidad con US1.
2. Añadir cuatro pasos, persistencia, presentación y seguimiento con US2.
3. Ejecutar Jest de ambas capas y el build de cliente.
