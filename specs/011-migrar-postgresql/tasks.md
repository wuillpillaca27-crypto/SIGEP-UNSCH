# Tasks: Migrar base de datos a PostgreSQL

**Input**: Documentos de diseño en `specs/011-migrar-postgresql/`

**Prerequisites**: `plan.md`, `spec.md`; `research.md`, `data-model.md` y `contracts/`.

**Tests**: Se incluyen tareas de pruebas porque la especificación pide adaptar y ejecutar las ocho suites Jest, validar la migración y comprobar la carga de 20.000 cuentas.

## Phase 1: Setup

**Purpose**: Preparar dependencias y comandos del servidor para PostgreSQL.

- [X] T001 Actualizar dependencias Prisma y scripts de base de datos en `server/package.json` y regenerar `server/package-lock.json` para usar `@prisma/adapter-pg` y `pg` con Prisma 7.8.0.

---

## Phase 2: Foundational

**Purpose**: Establecer el esquema PostgreSQL y la migración versionada que requieren las historias.

**Precondición arquitectónica**: Completar T034–T038 antes de cualquier tarea que modifique `server/`, incluida T001.

- [X] T034 [P] [US4] Actualizar análisis, requisitos y decisiones de persistencia en `docs/01-analisis-de-sistema/` para describir PostgreSQL y la transferencia del origen real.
- [X] T035 [P] [US4] Actualizar decisiones, componentes y arquitectura de persistencia en `docs/02-arquitectura-software/` para reflejar Prisma PostgreSQL y el adaptador.
- [X] T036 [P] [US4] Crear la documentación de conexión, migración inicial, inicialización y operación PostgreSQL en `docs/03-diseno-detallado/`.
- [X] T037 [P] [US4] Actualizar los diagramas C4 pertinentes en `docs/04-modelo-c4/` para representar PostgreSQL y el adaptador de persistencia.
- [X] T038 [P] [US4] Actualizar stack, principio de base de datos e informe de impacto a v1.3.0 en `.specify/memory/constitution.md`.

- [X] T002 Cambiar el provider a PostgreSQL en `server/prisma/schema.prisma` y preservar las restricciones de `Usuario.dni`, `Usuario.email`, `Estudiante.usuarioId`, `Estudiante.codigoUniv`, `PlantillaRequisito.codigo` y `Solicitud.codigo` según `specs/011-migrar-postgresql/data-model.md`.
- [X] T003 Generar y revisar la migración inicial en `server/prisma/migrations/` para que cree las diez tablas, enums, índices, relaciones y nombres físicos descritos en `specs/011-migrar-postgresql/data-model.md`.
- [X] T004 Ajustar la carga de `DATABASE_URL` para Prisma 7 en `server/prisma.config.ts` y validar que los comandos Prisma usan configuración PostgreSQL.
- [X] T005 Configurar el cliente Prisma con `PrismaPg` en `server/src/index.js`, exigir el prefijo `postgresql://` y fallar sin fallback a SQLite/libSQL.
- [X] T006 Sustituir la inicialización SQLite por despliegue idempotente de migraciones en `server/scripts/inicializar-base.js`, sin resetear ni borrar datos existentes.
- [ ] T007 Verificar la generación del cliente y la inicialización de una base PostgreSQL vacía mediante `server/prisma/schema.prisma`, `server/prisma/migrations/` y `server/scripts/inicializar-base.js`.

**Checkpoint**: T034–T038 están completos antes de T001 y cualquier cambio en `server/`; después, T001–T007 permiten generar el cliente y desplegar el esquema PostgreSQL en una base vacía.

---

## Phase 3: User Story 1 - Ejecutar SIGEP sobre PostgreSQL (Priority: P1) 🎯 MVP

**Goal**: Ejecutar el servidor y sus operaciones actuales con PostgreSQL y contar con una forma reproducible de revisar capacidad CRUD.

**Independent Test**: Inicializar una base PostgreSQL vacía, iniciar el servidor con `DATABASE_URL` válida, confirmar una lectura/escritura existente y comprobar que una URL ausente o no PostgreSQL falla antes de servir tráfico. Ejecutar la siembra de carga y confirmar 20.000 cuentas y operaciones CRUD.

- [X] T008 [US1] Añadir pruebas de arranque para URL PostgreSQL válida y rechazo previo de URL ausente o no PostgreSQL en `server/src/index.test.js`.
- [X] T009 [P] [US1] Crear el script independiente de siembra y verificación CRUD de 20.000 cuentas en `server/scripts/sembrar-carga.js`, con identificadores sintéticos únicos y salida sin credenciales.
- [X] T010 [US1] Añadir el comando de siembra de carga y sus parámetros en `server/package.json`.
- [X] T011 [P] [US1] Añadir un servicio PostgreSQL 18.7 con health check y puerto de desarrollo para pruebas locales en `server/docker-compose.test.yml`.

**Checkpoint**: Servidor PostgreSQL y siembra de carga verificables de forma independiente.

---

## Phase 4: User Story 2 - Trasladar la base local y sus documentos a PostgreSQL (Priority: P2)

**Goal**: Importar datos y archivos del origen confirmado, con `--dry-run`, conteos reconciliados e importación repetible sin duplicados.

**Independent Test**: Crear primero `grados.respaldo.sqlite` y `documentos.respaldo/`; ejecutar `--dry-run` antes de la carga real y confirmar que informa conversiones, conteos y hashes sin cambios en PostgreSQL ni copias de archivos. Después, migrar y verificar conteos/hashes por tabla, ausencia de duplicados al repetir la carga, IDs y secuencias conservados, archivos copiados sin borrar originales y autenticación exitosa de una cuenta migrada cuyo hash se copió sin cambios.

- [ ] T012 [US2] Implementar el análisis de argumentos `--origen`, `--origen-archivos` y `--dry-run` en `server/scripts/migrar-datos.js`, con rutas obligatorias en modo normal y mensajes de uso claros.
- [ ] T013 [US2] Crear antes de cualquier migración el respaldo `server/.runtime-local/.sigep-local/grados.respaldo.sqlite` del origen y la copia `server/.runtime-local/.sigep-local/documentos.respaldo/` de la carpeta de documentos; actualizar `specs/011-migrar-postgresql/quickstart.md` para que ambos respaldos precedan al dry run y a la carga real.
- [ ] T014 [US2] Leer el origen SQLite `server/.runtime-local/.sigep-local/grados.sqlite`, convertir `activo` y `obligatorio` de 0/1 a boolean y convertir fechas ISO 8601 con zona a timestamp, normalizando a UTC cuando el destino no conserva zona, en `server/scripts/migrar-datos.js`.
- [ ] T015 [US2] Validar e informar en `server/scripts/migrar-datos.js` los conteos esperados de `usuarios` 7, `programas` 6, `estudiantes` 6, `plantillas_requisito` 6, `solicitudes` 12, `validaciones_requisito` 11, `documentos_solicitud` 17, `revisiones` 34, `historial_estados` 56 y `auditoria` 68, además de conversiones fallidas y discrepancias.
- [ ] T016 [US2] Implementar `--dry-run` en `server/scripts/migrar-datos.js` para recorrer y validar el origen y emitir el informe sin escribir en PostgreSQL ni copiar archivos; documentar y mantener esta ejecución antes de la carga real en `specs/011-migrar-postgresql/quickstart.md`.
- [ ] T017 [US2] Calcular hashes deterministas por tabla para las filas de origen y destino en `server/scripts/migrar-datos.js`, además de comparar conteos; el script debe fallar e informar tabla y diferencia si cualquier hash no coincide.
- [ ] T018 [US2] Implementar la carga real en el orden de dependencias, conservar IDs, sincronizar secuencias con `setval`, evitar duplicados al repetirla y ejecutar la verificación de conteos y hashes por tabla antes de declarar éxito en `server/scripts/migrar-datos.js`.
- [ ] T019 [US2] Verificar los 17 nombres en `server/.runtime-local/.sigep-local/documentos`, copiar los disponibles a la carpeta de subidas configurada sin borrar originales y guardar solo el nombre en `rutaArchivo` desde `server/scripts/migrar-datos.js`; enumerar faltantes en el informe.
- [ ] T020 [US2] Añadir el comando `db:migrar-datos` y sus entradas en `server/package.json`.
- [ ] T021 [US2] Añadir pruebas de respaldos, `--dry-run`, conteos, conversiones, hashes por tabla, IDs/secuencias, repetición sin duplicados y faltantes de archivos en `server/scripts/migrar-datos.test.js`.
- [ ] T022 [US2] Agregar un caso nuevo de inicio de sesión con una cuenta de prueba migrada en `server/src/identidad.test.js`, sin modificar ni borrar los casos existentes; después de la migración real, confirmar que el hash bcrypt de PostgreSQL coincide exactamente con el hash del origen y que la autenticación funciona con la contraseña de prueba. Al ejecutar las pruebas contra PostgreSQL, no superar 10 logins por archivo.

**Checkpoint**: Respaldos previos creados; dry run completado antes de la carga real; migración repetible que falla ante diferencias de conteo o hash, con IDs, archivos y autenticación de una cuenta migrada verificados.

---

## Phase 5: User Story 3 - Ejecutar pruebas Jest del servidor con PostgreSQL (Priority: P3)

**Goal**: Ejecutar las ocho suites existentes en schemas aislados de PostgreSQL, sin reducir aserciones ni cobertura.

**Independent Test**: Ejecutar cada suite con `SIGEP_TEST_DATABASE_URL`; comprobar que el helper crea/migra/limpia solo su schema. Confirmar que falta de URL o igualdad con `DATABASE_URL` aborta antes de conectar.

- [ ] T023 [US3] Crear el helper de schemas PostgreSQL por suite, validación de URL, migración, cierre de conexiones y limpieza segura en `server/test-support/postgres-schema.js`.
- [ ] T024 [P] [US3] Adaptar fixtures y preservar aserciones de solicitudes en `server/src/solicitudes.test.js` para usar el helper PostgreSQL.
- [ ] T025 [P] [US3] Adaptar fixtures y preservar aserciones de identidad/secreto en `server/src/identidad-secreto.test.js` para usar el helper PostgreSQL.
- [ ] T026 [P] [US3] Adaptar fixtures y preservar aserciones del limitador de identidad en `server/src/identidad-limitador.test.js` para usar el helper PostgreSQL.
- [ ] T027 [P] [US3] Adaptar fixtures y preservar aserciones del catálogo en `server/src/catalogo-grados.test.js` para usar el helper PostgreSQL.
- [ ] T028 [P] [US3] Adaptar fixtures y preservar aserciones de administración en `server/src/administracion.test.js` para usar el helper PostgreSQL.
- [ ] T029 [P] [US3] Adaptar fixtures y preservar aserciones del listado de revisión en `server/src/revision-grados-listado.test.js` para usar el helper PostgreSQL.
- [ ] T030 [P] [US3] Adaptar fixtures y preservar aserciones de acciones de revisión en `server/src/revision-grados-acciones.test.js` para usar el helper PostgreSQL.
- [ ] T031 [P] [US3] Adaptar fixtures y preservar aserciones de identidad en `server/src/identidad.test.js` para usar el helper PostgreSQL.
- [ ] T032 [US3] Configurar el job de GitHub Actions con PostgreSQL 18.7, health check y `SIGEP_TEST_DATABASE_URL` en `.github/workflows/`.
- [ ] T033 [US3] Registrar los resultados observados de diferencias de búsqueda y enums en `specs/011-migrar-postgresql/research.md` y reflejarlos en las pruebas afectadas sin cambiar la lógica productiva.

**Checkpoint**: Las ocho suites pasan con PostgreSQL, preservan sus aserciones y generan cobertura.

---

## Phase 6: User Story 4 - Operar y mantener la arquitectura documentada (Priority: P4)

**Goal**: Alinear arquitectura, operación y principios del proyecto con PostgreSQL y su proceso de migración.

**Independent Test**: Revisar docs/01 a docs/04 y la constitución para confirmar coherencia sobre proveedor, migración de datos, archivos, pruebas y capacidad objetivo; ejecutar los pasos de `quickstart.md` en un entorno de desarrollo.

- [ ] T039 [US4] Actualizar la guía operacional para que `specs/011-migrar-postgresql/quickstart.md` documente respaldar la base y la carpeta de documentos, ejecutar `--dry-run` y solo después la migración real, validar hashes/conteos y probar el inicio de sesión con una cuenta migrada.

**Checkpoint**: Documentación del sistema y pasos operativos describen la misma arquitectura y proceso.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar validación global, seguridad de configuración e integridad del alcance.

- [ ] T040 Ejecutar las ocho suites Jest y revisar el reporte de cobertura con PostgreSQL mediante `server/package.json` y `server/jest.config.js`.
- [ ] T041 Ejecutar la secuencia de respaldo, dry run y migración real de `specs/011-migrar-postgresql/quickstart.md` en un entorno PostgreSQL desechable; confirmar conteos, hashes por tabla, ausencia de duplicados, archivos y autenticación de la cuenta migrada.
- [ ] T042 Revisar el diff para confirmar que `client/` y la lógica de negocio de rutas del servidor permanecen sin cambios.

## Dependencies & Execution Order

### Phase Dependencies

- **Precondición documental de Foundational (T034–T038)**: Se ejecuta primero, aunque las tareas estén agrupadas al inicio de Phase 2; bloquea toda tarea que modifique `server/`.
- **Setup (Phase 1, T001)**: Depende de T034–T038; prepara las dependencias y comandos PostgreSQL.
- **Foundational (Phase 2, T002–T007)**: Depende de T001 y T034–T038; bloquea las historias porque establece el cliente y el esquema PostgreSQL.
- **User Story 1 (Phase 3)**: Depende de Foundational.
- **User Story 2 (Phase 4)**: Depende de Foundational; su prueba de integración requiere una base inicializada. Puede avanzar en paralelo con US1 tras completar la fundación.
- **User Story 3 (Phase 5)**: Depende de Foundational y del servicio PostgreSQL de prueba; puede desarrollarse en paralelo con US2.
- **User Story 4 (Phase 6)**: T034–T038 son la precondición arquitectónica de Phase 2; T039 depende de decisiones estables de las historias 1–3 para consolidar la guía operacional.
- **Polish (Phase 7)**: Depende de las historias que se vayan a entregar.

### User Story Dependencies

- **US1 (P1)**: Independiente tras Foundational; MVP sugerido.
- **US2 (P2)**: Independiente tras Foundational; requiere esquema ya inicializado en su validación completa.
- **US3 (P3)**: Independiente tras Foundational; sus suites comparten el helper, y cada archivo usa un schema aislado.
- **US4 (P4)**: T034–T038 preceden los cambios arquitectónicos; T039 consolida la guía operacional después de las decisiones de implementación.

### Parallel Opportunities

- T004 y T005 pueden avanzar en paralelo tras T001–T003 porque modifican archivos separados.
- T009 y T011 pueden avanzar en paralelo dentro de US1; T010 depende de la definición del script T009.
- T024–T031 pueden ejecutarse en paralelo una vez completado T023, ya que cada tarea adapta un archivo de suite distinto.
- T034–T038 pueden ejecutarse en paralelo porque actualizan archivos y carpetas diferentes; todas deben finalizar antes de T001 y de cualquier tarea que modifique `server/`. T039 depende de las decisiones operativas consolidadas.
- US2 y US3 pueden implementarse en paralelo una vez que la fundación PostgreSQL está lista.

## Parallel Example: User Story 3

```text
Completar primero T023. Después, distribuir en paralelo T024–T031, un archivo de suite por tarea.
```

## Implementation Strategy

### MVP First

Completar primero T034–T038, luego T001 y T002–T007; después US1 para iniciar SIGEP sobre PostgreSQL, crear el esquema y verificar operaciones CRUD. Validar esta historia antes de continuar.

### Incremental Delivery

1. Completar US1 y validar arranque, esquema y siembra de carga.
2. Completar US2 para incorporar origen, dry run, idempotencia y documentos.
3. Completar US3 para adaptar y ejecutar Jest en PostgreSQL.
4. Completar T039 y Polish para cerrar la guía operacional y la evidencia; T034–T038 ya deben estar completos antes de cualquier cambio en `server/`.

### Notes

- `[P]` identifica tareas paralelizables en archivos distintos sin dependencia incompleta.
- `[US#]` vincula cada tarea con la historia de `spec.md`.
- No se eliminan ni debilitan aserciones de las suites existentes.
