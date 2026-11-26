# Tareas: Documentación de análisis y arquitectura de SIGEP-UNSCH

**Entrada**: Documentos de diseño de `specs/008-documentacion-arquitectura/`.

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md` y `quickstart.md`.

**Organización**: Una tarea por cada documento de entrega, agrupada por carpeta (01 a 04). Son 19 tareas en total; no se agregan tareas auxiliares para respetar el alcance solicitado.

**Regla común de contenido**: Cada archivo debe estar en español, incluir resumen claro, separar `Implementado hoy` de `Objetivo Sprint 2`, citar las fuentes pertinentes y no presentar propuestas como capacidades actuales. Aplican FR-002 y FR-015 de `spec.md`.

## Fase 1: Análisis del sistema — Historia 1 (P1)

**Objetivo**: Consultar el análisis de actores, historias, requisitos, calidad, restricciones y decisiones con evidencia trazable.

**Prueba independiente**: Revisar los ocho archivos de `docs/01-analisis-de-sistema/`; verificar las rutas exactas, fuentes citadas, separación de estado actual/futuro, trazabilidad y las reglas FR-003 a FR-008.

- [X] T001 [P] [US1] Crear `docs/01-analisis-de-sistema/01-actores.md`; consultar `specs/001-mis-tramites/spec.md` a `specs/006-banner-autoridades/spec.md`, `server/prisma/schema.prisma`, módulos de autenticación y administración en `server/src/identidad.js` y `server/src/administracion.js`, y requisitos heredados `docs/legacy/openspec/requirements.md`. Distinguir roles del esquema de roles con operaciones confirmadas; no inferir permisos por el nombre (FR-003, FR-005).
- [X] T002 [P] [US1] Crear `docs/01-analisis-de-sistema/02-historias-del-usuario.md`; consultar las historias y escenarios de `specs/001-mis-tramites/spec.md` a `specs/006-banner-autoridades/spec.md`, más `specs/007-pruebas-frontend/spec.md` como contexto cuando corresponda. Conservar identificadores fuente y citar archivo/sección si se asignan IDs locales (FR-003, FR-004).
- [X] T003 [P] [US1] Crear `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`; derivar requisitos de `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md` y contrastarlos con `server/src/index.js`, `server/src/catalogo-grados.js`, `server/src/identidad.js`, `server/src/identidad-google.js`, `server/src/solicitudes.js`, `server/src/revision-grados.js`, `server/src/administracion.js`, `server/src/verificacion-documentos.js`, `client/app/` y `docs/legacy/openspec/requirements.md`. Conservar IDs existentes; los RF heredados OpenSpec son solo RF-01 a RF-03 (FR-003, FR-004, FR-016, FR-017).
- [X] T004 [P] [US1] Crear `docs/01-analisis-de-sistema/04-atributos-de-calidad.md`; consultar `specs/008-documentacion-arquitectura/spec.md` (FR-006 a FR-008), `server/src/`, `server/prisma/schema.prisma`, `client/app/` y `docs/legacy/openspec/`. Cubrir rendimiento, seguridad, disponibilidad, mantenibilidad y trazabilidad; marcar toda métrica `propuesta, pendiente de validación del equipo` y señalar métricas no medidas.
- [X] T005 [P] [US1] Crear `docs/01-analisis-de-sistema/05-restricciones.md`; consultar `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`, `.specify/memory/constitution.md`, `server/prisma/schema.prisma`, `server/src/index.js` y referencias de `docs/legacy/openspec/`. Separar restricciones observadas de decisiones propuestas y documentar stack, datos y seguridad solo con evidencia.
- [X] T006 [P] [US1] Crear `docs/01-analisis-de-sistema/06-driver-arquitectonicos.md`; consultar `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`, `server/src/`, `client/app/`, `server/prisma/schema.prisma`, `.specify/memory/constitution.md` y `docs/legacy/openspec/`. Asociar cada driver a requisitos, historias o escenarios de origen y separar condiciones actuales de objetivos Sprint 2.
- [X] T007 [P] [US1] Crear `docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md`; consultar decisiones y antecedentes en `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`, `docs/legacy/openspec/`, `server/src/index.js`, módulos funcionales de `server/src/` y `server/prisma/schema.prisma`. Distinguir decisiones verificadas, antecedentes, comentarios desactualizados y propuestas (FR-009, FR-010, FR-017).
- [X] T008 [P] [US1] Crear `docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md`; consultar `specs/008-documentacion-arquitectura/spec.md` (FR-006 a FR-008), `server/src/`, `server/prisma/schema.prisma`, `client/app/` y `docs/legacy/openspec/`. Cubrir los cinco atributos requeridos, evidencias y respuestas actuales; marcar cada métrica propuesta con la frase literal requerida y no medida cuando falte evidencia.

---

## Fase 2: Arquitectura del software — Historia 2 (P2)

**Objetivo**: Documentar la arquitectura y componentes observados para orientar cambios compatibles con el sistema.

**Prueba independiente**: Revisar los cuatro archivos de `docs/02-arquitectura-software/` contra `server/src/`, `client/app/`, `server/prisma/schema.prisma` y referencias contractuales; comprobar estado actual/futuro y trazabilidad (FR-009, FR-010, FR-013, FR-016, FR-017).

- [X] T009 [P] [US2] Crear `docs/02-arquitectura-software/arquitectura-inicial.md`; consultar `server/src/index.js`, todos los módulos funcionales de `server/src/`, `server/prisma/schema.prisma`, estructura de `client/app/`, historias de `specs/001-mis-tramites/spec.md` a `specs/006-banner-autoridades/spec.md` y `docs/legacy/openspec/`. Describir el monolito Express actual, composición real de `registrarX`, SQLite/libSQL y separar objetivos futuros.
- [X] T010 [P] [US2] Crear `docs/02-arquitectura-software/componentes-arquitectonicos.md`; consultar `server/src/index.js`, `server/src/catalogo-grados.js`, `server/src/identidad.js`, `server/src/identidad-google.js`, `server/src/solicitudes.js`, `server/src/revision-grados.js`, `server/src/administracion.js`, `server/src/verificacion-documentos.js`, `server/prisma/schema.prisma` y estructura de `client/app/`. Enumerar componentes y endpoints observados con su RF/HU/escenario o fuente de existencia; indicar que `server/src/lib/`, `middleware/` y `routes/` están vacías en el estado inspeccionado (FR-009, FR-013, FR-016).
- [X] T011 [P] [US2] Crear `docs/02-arquitectura-software/enfoque-aquitectonico.md`; consultar `.specify/memory/constitution.md`, `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`, `server/src/index.js`, módulos funcionales de `server/src/`, `client/app/` y `docs/legacy/openspec/`. Describir el enfoque implementado con fuentes y clasificar capas, caché o Swagger como propuestas/objetivos únicamente si las fuentes lo sostienen (FR-010, FR-013).
- [X] T012 [P] [US2] Crear `docs/02-arquitectura-software/estilo-arquitectonico.md`; consultar `server/src/index.js`, módulos de `server/src/`, estructura de `client/app/`, `server/prisma/schema.prisma`, `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md` y `docs/legacy/openspec/`. Identificar estilos observables y sus evidencias; no atribuir separación por capas al servidor actual (FR-009, FR-010).

---

## Fase 3: Diseño interno — Historia 3 (P3)

**Objetivo**: Diferenciar los módulos y patrones observados de las recomendaciones futuras.

**Prueba independiente**: Revisar los tres documentos de `docs/03-diseño-de-software/diseño-interno/`; comprobar fuentes por módulo, clasificación observado/propuesto y ausencia de responsabilidades inventadas (FR-011, FR-013).

- [X] T013 [P] [US3] Crear `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md`; consultar `server/src/index.js`, cada módulo funcional directamente bajo `server/src/`, estructura y módulos bajo `client/app/`, `server/prisma/schema.prisma` y `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`. Describir responsabilidades verificadas, composición y acceso a datos, citando archivos y asociando cada módulo a su origen.
- [X] T014 [P] [US3] Crear `docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md`; consultar `server/src/`, `client/app/`, `server/prisma/schema.prisma`, `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md` y `.specify/memory/constitution.md`. Documentar solo patrones identificables en el código como observados; etiquetar patrones recomendados como propuesta u objetivo futuro (FR-011).
- [X] T015 [P] [US3] Crear `docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md`; consultar `server/src/`, `client/app/`, `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`, `.specify/memory/constitution.md` y `docs/legacy/openspec/`. Separar prácticas evidenciadas en archivos de principios recomendados para el futuro, incluyendo SOLID solo como propuesta si no está demostrado (FR-010, FR-011).

---

## Fase 4: Modelo C4 — Historia 4 (P4)

**Objetivo**: Visualizar contexto, contenedores, componentes y código del sistema actual mediante diagramas trazables.

**Prueba independiente**: Abrir los cuatro archivos C4 en vista previa Markdown compatible con GitHub; validar que cada bloque `mermaid` con `flowchart` renderiza, representa el nivel correcto y tiene explicación, límites, fuentes y trazabilidad (FR-012, FR-013).

- [X] T016 [P] [US4] Crear `docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md`; consultar `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`, `server/src/index.js`, rutas de `server/src/`, `client/app/`, `server/prisma/schema.prisma` y `docs/legacy/openspec/`. Incluir un Mermaid `flowchart` de contexto con actores/sistemas externos solo cuando se acrediten; explicar límites y fuentes.
- [X] T017 [P] [US4] Crear `docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`; consultar `server/package.json`, `server/src/index.js`, `server/prisma/schema.prisma`, `client/package.json`, estructura de `client/app/`, `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md` y `docs/legacy/openspec/`. Incluir Mermaid `flowchart` de contenedores ejecutables/almacenamiento observados; mostrar SQLite/libSQL según configuración y dejar capas futuras fuera del estado actual.
- [X] T018 [P] [US4] Crear `docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`; consultar `server/src/index.js`, `server/src/catalogo-grados.js`, `server/src/identidad.js`, `server/src/identidad-google.js`, `server/src/solicitudes.js`, `server/src/revision-grados.js`, `server/src/administracion.js`, `server/src/verificacion-documentos.js`, `server/prisma/schema.prisma` y `client/app/`. Incluir Mermaid `flowchart` de componentes observados, sus relaciones respaldadas y la trazabilidad a RF/HU/escenario o archivo fuente.
- [X] T019 [P] [US4] Crear `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`; consultar `server/src/index.js`, firmas y rutas de módulos en `server/src/`, `server/prisma/schema.prisma`, estructura de `client/app/` y `specs/008-documentacion-arquitectura/spec.md` (FR-009, FR-012, FR-016, FR-017). Incluir Mermaid `flowchart` del nivel de código con elementos verificables, explicación textual y fuentes; conservar exactamente este nombre de archivo.

---

## Dependencias y orden de ejecución

### Dependencias entre historias

- **Historia 1 (P1)**: primera; establece el análisis y la trazabilidad base.
- **Historia 2 (P2)**: después de Historia 1 para alinear terminología y requisitos con el análisis.
- **Historia 3 (P3)**: después de Historia 2 para describir el diseño sin contradecir la arquitectura documentada.
- **Historia 4 (P4)**: después de Historias 1 y 2 para que los elementos y vínculos C4 reflejen el inventario y la arquitectura descritos.

Las tareas dentro de cada historia crean archivos distintos y pueden ejecutarse en paralelo si consultan las mismas fuentes vigentes. El resultado sigue siendo exactamente una tarea por archivo de entrega.

### Oportunidades de paralelismo

- Historia 1: T001–T008 pueden redactarse en paralelo; mantener IDs y referencias consistentes con FR-003/FR-004.
- Historia 2: T009–T012 pueden redactarse en paralelo tras acordar los hechos actuales del servidor y cliente.
- Historia 3: T013–T015 pueden redactarse en paralelo tras establecer el inventario de módulos.
- Historia 4: T016–T019 pueden redactarse en paralelo si comparten los mismos nombres, límites y trazabilidad de componentes.

### Ejemplo de ejecución paralela: Historia 4

```text
T016 → docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md
T017 → docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md
T018 → docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md
T019 → docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md
```

## Estrategia de entrega

### MVP

Completar Historia 1 (T001–T008) para disponer de análisis verificable de actores, historias, RF, calidad, restricciones y decisiones. Validar independientemente los ocho documentos antes de continuar.

### Entrega incremental

1. Historia 1: análisis del sistema.
2. Historia 2: arquitectura de software.
3. Historia 3: diseño interno.
4. Historia 4: modelo C4 y renderizado Mermaid.
5. Al cerrar el conjunto, ejecutar la lista de validación de `quickstart.md` y comprobar el inventario de 19 documentos.

## Alcance transversal

No hay tareas separadas de setup, código, pruebas automatizadas o polish: el trabajo solicitado consta exclusivamente de los 19 documentos, y su verificación queda en el criterio independiente de cada historia y en `quickstart.md`. No modificar `client/`, `server/` ni la base de datos.
