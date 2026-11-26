# Feature Specification: Análisis de base de datos y caché

**Feature Branch**: `013-analisis-bd-cache`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Spec 013: documento de análisis de base de datos y caché. Estado actual (SQLite, 10 tablas, 7 usuarios, 17 documentos), por qué recomendar PostgreSQL, plan de migración, riesgos y trabajo preparatorio en la rama 011, más una propuesta de caché del catálogo. Solo documentación, sin código."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender el estado y la recomendación de persistencia (Priority: P1)

Como equipo responsable de SIGEP, quiero consultar un análisis que distinga la base SQLite vigente, los datos de línea base y la recomendación de PostgreSQL, para decidir la evolución de persistencia con sus razones y límites explícitos.

**Why this priority**: El equipo necesita una fuente de contexto común antes de ejecutar o aprobar cambios de base de datos.

**Independent Test**: Revisar el documento contra el esquema Prisma vigente y Spec 011, y comprobar que separa hechos actuales, conteos de referencia, recomendación y condiciones aún por validar.

**Acceptance Scenarios**:

1. **Given** el esquema actual declara SQLite y diez modelos persistentes, **When** una persona consulta el análisis, **Then** encuentra SQLite como estado actual y no PostgreSQL como motor ya instalado.
2. **Given** la línea base de siete usuarios y 17 documentos, **When** se revisa la recomendación, **Then** el documento informa esos conteos con su procedencia y no los presenta como medición de concurrencia o capacidad.
3. **Given** que PostgreSQL se recomienda como destino, **When** se revisan sus fundamentos, **Then** se explican beneficios esperados, costos operativos, riesgos y supuestos, incluida la diferencia entre usuarios registrados y usuarios concurrentes.

---

### User Story 2 - Preparar una migración revisable en la rama 011 (Priority: P1)

Como equipo que desarrolla la migración descrita en Spec 011, quiero un plan de preparación y transición con verificaciones y rollback, para proteger los datos y archivos existentes y detectar discrepancias antes del cambio de destino.

**Why this priority**: El cambio de motor implica riesgos de integridad y continuidad de expedientes que deben tratarse antes de modificar el servidor o la base.

**Independent Test**: Cotejar el plan con la especificación, tareas y guía rápida de `011-migrar-postgresql`, comprobando respaldo, inventario, dry run, reconciliación, pruebas de aceptación y vuelta atrás.

**Acceptance Scenarios**:

1. **Given** que la rama 011 tiene trabajo de migración planificado, **When** se revisa el documento, **Then** distingue tareas preparatorias y pendientes según los artefactos de esa rama, sin afirmar que PostgreSQL o la transferencia de datos ya se implementaron.
2. **Given** una migración que aún no ha sido aprobada para ejecutar, **When** se sigue el plan documentado, **Then** primero se respalda SQLite y los documentos, se ejecuta una validación sin escritura y se reconcilian conteos y relaciones antes del corte.
3. **Given** que la validación o el corte falla, **When** el equipo consulta las instrucciones, **Then** puede conservar el origen intacto y volver al servicio previo sin borrar la única copia de datos.

---

### User Story 3 - Evaluar caché para el catálogo (Priority: P2)

Como equipo de arquitectura, quiero una propuesta delimitada de caché para las consultas del catálogo, para valorar latencia y carga de lectura sin confundir una idea futura con una capacidad implementada.

**Why this priority**: El catálogo es un área candidata a lecturas repetidas, pero el mecanismo debe evaluarse junto con consistencia, invalidación y despliegue antes de adoptarlo.

**Independent Test**: Contrastar la propuesta con las rutas actuales de catálogo y revisar que identifique datos cacheables, claves, caducidad, invalidación, riesgos de obsolescencia y preguntas de decisión.

**Acceptance Scenarios**:

1. **Given** las rutas GET actuales del catálogo, **When** se revisa la propuesta, **Then** la caché se limita a las proyecciones públicas de programas activos y requisitos activos por trámite/programa.
2. **Given** una modificación de programas, requisitos o normativa, **When** se evalúa la frescura, **Then** el documento identifica cómo invalidar o caducar la entrada y qué comportamiento se espera si hay más de una instancia del servidor.
3. **Given** que no existe implementación de caché, **When** una persona lee el documento, **Then** reconoce la solución como propuesta y no como parte del sistema actual.

### Edge Cases

- Si los conteos del archivo SQLite real difieren de la línea base proporcionada, el análisis debe dejar visibles los conteos reales comprobados, los esperados y la discrepancia; no debe resolverla por inferencia.
- Si la carpeta o alguno de los 17 documentos esperados no está disponible, el plan debe tratarlo como una discrepancia de migración y preservar el origen para investigación.
- Si PostgreSQL aún no existe en el entorno destino, el documento debe separar preparación, provisión, migración y corte; no debe presentar la recomendación como una decisión de despliegue ya ejecutada.
- Si datos, enum, fechas, IDs, secuencias o consultas se comportan distinto entre motores, el documento debe exigir registro y evaluación del impacto antes de cambiar expectativas o reglas.
- Si la caché opera en varias instancias o cambia la normativa sin una escritura de base de datos, una entrada puede quedar obsoleta; la propuesta debe contemplar invalidación compartida o caducidad máxima.
- Si una consulta de catálogo falla o la caché deja de estar disponible, el análisis debe priorizar respuesta correcta desde la fuente y evitar servir contenido inválido o datos de usuarios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La entrega DEBE consistir únicamente en documentación; NO DEBE modificar código, dependencias, configuración de ejecución, esquema, datos de la base ni archivos institucionales.
- **FR-002**: La entrega DEBE crear `docs/02-arquitectura-software/analisis-base-datos-y-cache.md` en español, con secciones diferenciadas para estado actual, recomendación de destino, plan de migración, riesgos, preparación de la rama 011 y propuesta de caché del catálogo.
- **FR-003**: El documento DEBE describir el estado vigente como SQLite local a través de Prisma/libSQL y diez tablas/modelos, respaldado por las fuentes del repositorio.
- **FR-004**: El documento DEBE presentar la línea base indicada de siete usuarios y 17 documentos; debe atribuirla a la base SQLite de origen descrita por Spec 011 y exigir reconciliarla contra el archivo real antes de migrar. No debe inferir que esos conteos prueban capacidad, concurrencia o actividad productiva.
- **FR-005**: El inventario de línea base DEBE incluir, cuando esté disponible en Spec 011, los conteos de las diez tablas: usuarios 7, programas 6, estudiantes 6, plantillas de requisito 6, solicitudes 12, validaciones 11, documentos 17, revisiones 34, historial de estados 56 y auditoría 68; toda diferencia debe quedar identificada y no ocultarse.
- **FR-006**: La recomendación de PostgreSQL DEBE explicar necesidades futuras que la motivan, incluidas concurrencia de escrituras, integridad relacional y operación institucional, y contrastarlas con los beneficios de mantener SQLite para el volumen pequeño actual, los costos operativos de PostgreSQL y los supuestos pendientes de validación.
- **FR-007**: El análisis DEBE precisar que la meta de 20.000 usuarios registrada en Spec 011 describe cuentas registradas totales y no solicitudes ni sesiones concurrentes, salvo que el equipo apruebe otra definición.
- **FR-008**: El plan de migración DEBE cubrir trabajo preparatorio, respaldo de la base y de los documentos, verificación de conteos, creación versionada del esquema, ensayo sin escritura, conversión y carga por dependencias, conservación de IDs/secuencias, copia de adjuntos, reconciliación, pruebas, corte y rollback.
- **FR-009**: La sección de trabajo preparatorio DEBE trazar y verificar el estado de las tareas documentales T034–T039 de `specs/011-migrar-postgresql/tasks.md`, actualizar la documentación arquitectónica antes de cambios de servidor y no afirmar tareas pendientes como completadas.
- **FR-010**: La sección de riesgos DEBE identificar impacto y una acción de mitigación para pérdida o divergencia de datos, integridad referencial, conversión de tipos/enums/fechas, diferencias de búsqueda entre motores, documentos faltantes, interrupción del servicio, credenciales/configuración y costos/operación del destino.
- **FR-011**: La propuesta de caché DEBE basarse en las operaciones GET que existen en `server/src/catalogo-grados.js`, separar explícitamente propuesta de estado actual y describir datos elegibles, dimensiones de clave, política de caducidad inicial, invalidación, consistencia, despliegue en una o varias instancias, fallos, observabilidad y criterios para decidir su adopción.
- **FR-012**: La propuesta de caché NO DEBE incluir respuestas autenticadas, datos personales, expedientes ni documentos; cualquier ampliación requerirá una evaluación de seguridad y una especificación aparte.
- **FR-013**: El documento DEBE citar rutas y artefactos internos que respaldan sus hechos, registrar el momento o revisión de la línea base y distinguir dato verificado, dato proporcionado, recomendación y pregunta pendiente.
- **FR-014**: El documento DEBE indicar que la recomendación PostgreSQL y la caché no autorizan despliegue, migración efectiva ni cambios de lógica de negocio; tales acciones requieren aprobación y trabajo separado.

### Key Entities *(include if data involved)*

- **Base SQLite de origen**: Archivo local actualmente usado por el servidor; incluye entidades y datos que deben preservarse durante cualquier transición.
- **Línea base de datos**: Conteos por tabla atribuidos a una revisión de la base de origen y reconciliados antes de migrar.
- **Destino PostgreSQL propuesto**: Motor recomendado para una etapa futura; no se considera implementado hasta que Spec 011 se complete y verifique.
- **Plan de migración**: Secuencia con respaldo, preparación, transferencia, validación, corte y rollback.
- **Propuesta de caché del catálogo**: Alternativa de lectura para datos públicos de programas y requisitos, con sus reglas de clave, caducidad e invalidación.
- **Riesgo de transición**: Evento que puede comprometer integridad, disponibilidad, privacidad o costo, acompañado de impacto y mitigación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El documento presenta el motor actual, los diez modelos y los conteos de usuarios/documentos solicitados, con fuente y condición de reconciliación claramente identificadas.
- **SC-002**: Una revisión puede seguir de inicio a fin las etapas del plan de migración, incluidas al menos una verificación previa al corte y una ruta de rollback, sin depender de instrucciones implícitas.
- **SC-003**: El 100 % de los riesgos requeridos en FR-010 contiene impacto y mitigación verificables.
- **SC-004**: La recomendación diferencia el volumen actual de la meta de crecimiento y no presenta usuarios totales como concurrencia medida.
- **SC-005**: La propuesta cubre las dos rutas GET del catálogo y distingue estado actual de alternativa futura en todas sus secciones.
- **SC-006**: La revisión del diff confirma cambios solo en documentos y artefactos Spec Kit; no hay modificaciones de código, dependencias, configuración de runtime, esquema o datos.

## Assumptions

- El estado de diez tablas/modelos proviene de `server/prisma/schema.prisma`, y SQLite/libSQL es el motor actual según ese esquema, `server/src/index.js` y la arquitectura documentada.
- Los conteos 7 usuarios y 17 documentos son la línea base indicada por la persona solicitante y por los artefactos de migración de Spec 011; deberán comprobarse contra el archivo SQLite exacto antes de ejecutar transferencia.
- La rama `011-migrar-postgresql` y `specs/011-migrar-postgresql/` contienen el trabajo preparatorio y planificado pertinente. La existencia de una rama o una tarea no significa que esté implementada o aprobada.
- PostgreSQL se recomienda como destino a evaluar para el crecimiento y operación futura; el volumen reducido actual por sí solo no demuestra que SQLite sea insuficiente.
- La caché se propone solo para las respuestas públicas de lectura del catálogo y la validez de su información debe prevalecer sobre una reducción de latencia.
- Esta especificación produce análisis y propuestas documentales; cualquier cambio de motor, despliegue o caché ejecutable queda fuera de alcance.
