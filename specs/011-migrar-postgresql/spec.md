# Especificación de funcionalidad: Migrar base de datos a PostgreSQL

**Rama de funcionalidad**: `011-migrar-postgresql`

**Creada**: 2026-11-22

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Migrar la base de datos de SIGEP-UNSCH de SQLite (libSQL) a PostgreSQL para soportar crecimiento hasta 20.000 usuarios. Cambiar el provider Prisma a postgresql con el adaptador @prisma/adapter-pg, exigir DATABASE_URL postgresql://, crear la migración inicial documentada y un script de inicialización. Adaptar los fixtures de las pruebas Jest del servidor (009) a una base PostgreSQL de prueba con el mismo esquema, conservando todas las aserciones. Documentar diferencias de comportamiento (mayúsculas en búsquedas, enums) como hallazgos. Actualizar docs/01 a docs/04 y la constitución (v1.3.0). Sin cambiar la lógica de negocio ni client/."

## Escenarios de usuario y pruebas

### Historia 1 - Ejecutar SIGEP sobre PostgreSQL (Prioridad: P1)

Como equipo responsable de SIGEP-UNSCH, queremos persistir los datos institucionales en PostgreSQL, para soportar el crecimiento previsto y mantener integridad entre expedientes, usuarios, requisitos y auditoría.

**Por qué esta prioridad**: La conexión, el esquema y el despliegue inicial son la base de los flujos del servidor.

**Prueba independiente**: Inicializar una base PostgreSQL vacía desde el esquema versionado, arrancar el servidor con una URL PostgreSQL válida, ejecutar consultas de lectura y escritura ya existentes y confirmar que una URL ausente o SQLite es rechazada antes de servir tráfico.

**Escenarios de aceptación**:

1. **Dado** un `DATABASE_URL` que empieza por `postgresql://`, **cuando** se inicia el servidor, **entonces** Prisma se conecta a PostgreSQL usando el adaptador requerido y el esquema PostgreSQL vigente.
2. **Dado** `DATABASE_URL` ausente o con prefijo distinto de `postgresql://`, **cuando** se inicializa el servidor o el script de base de datos, **entonces** se detiene con un error claro y no intenta volver a SQLite ni a un destino por defecto.
3. **Dado** una base PostgreSQL vacía, **cuando** se ejecuta el script de inicialización, **entonces** aplica las migraciones versionadas sin duplicar objetos al ejecutarse de nuevo y deja la base lista para el servidor.
4. **Dado** el esquema actual de entidades, relaciones, restricciones e índices, **cuando** se crea una base vacía desde la migración inicial, **entonces** Prisma puede generar el cliente y se conservan nombres de tablas/campos y valores válidos del modelo.

---

### Historia 2 - Ejecutar pruebas Jest del servidor con PostgreSQL (Prioridad: P2)

Como desarrollador del servidor, quiero ejecutar las mismas suites de integración sobre una base PostgreSQL temporal de prueba, para verificar que el cambio de proveedor conserva las aserciones y los flujos actuales.

**Por qué esta prioridad**: Los fixtures SQLite actuales no comprueban diferencias de comportamiento o restricciones que aparecen en PostgreSQL.

**Prueba independiente**: Ejecutar desde `server/` las ocho suites Jest contra PostgreSQL local en Docker o el servicio PostgreSQL de GitHub Actions. Un helper compartido crea un schema aleatorio por archivo, aplica las migraciones, siembra datos sintéticos propios y ejecuta `DROP SCHEMA ... CASCADE` al terminar.

**Escenarios de aceptación**:

1. **Dado** `SIGEP_TEST_DATABASE_URL` que apunta al PostgreSQL exclusivo de pruebas, **cuando** se ejecuta un archivo Jest, **entonces** el helper compartido crea un schema aleatorio, aplica ahi las migraciones, siembra datos sinteticos del archivo y lo elimina con `DROP SCHEMA ... CASCADE` al terminar.
2. **Dado** las ocho suites actuales del servidor, **cuando** se adaptan los fixtures al proveedor PostgreSQL, **entonces** se conservan todas las comprobaciones, nombres y objetivos de cobertura sin eliminar ni debilitar aserciones; una expectativa que cambie por el proveedor solo se ajusta al resultado observado y se registra como hallazgo.
3. **Dado** que `SIGEP_TEST_DATABASE_URL` falta o es igual a la URL institucional `DATABASE_URL`, **cuando** se prepara una suite, **entonces** el helper falla antes de conectarse, migrar, sembrar o limpiar datos.
4. **Dado** consultas de búsqueda y campos enum que se ejecutan contra ambas tecnologías, **cuando** los resultados difieren, **entonces** las pruebas anotan la conducta observada como hallazgo y no alteran lógica productiva para forzar paridad.

---

### Historia 3 - Operar y mantener la arquitectura documentada (Prioridad: P3)

Como equipo de mantenimiento, queremos que la documentación arquitectónica y la constitución reflejen el motor y la transición reales, para que despliegues y futuros cambios usen una fuente de verdad coherente.

**Por qué esta prioridad**: Las decisiones de base de datos afectan requisitos de calidad, arquitectura, operación, inicialización y pruebas.

**Prueba independiente**: Revisar documentación de las capas 01 a 04 y verificar que ninguna describa SQLite/libSQL como motor operativo vigente, que la migración de datos y los hallazgos estén registrados y que la constitución tenga versión 1.3.0.

**Escenarios de aceptación**:

1. **Dado** los documentos existentes de análisis y arquitectura en `docs/01` y `docs/02`, **cuando** se actualizan, **entonces** expresan PostgreSQL como destino, explican la capacidad objetivo de hasta 20.000 usuarios y distinguen hechos actuales de decisiones aprobadas.
2. **Dado** que `docs/03` no existe en el repositorio inspeccionado, **cuando** se documenta el diseño detallado, **entonces** se crea la capa documental faltante y se describen conexión, migración inicial, inicialización y operación PostgreSQL.
3. **Dado** los diagramas y documentos C4 existentes en `docs/04`, **cuando** se actualizan, **entonces** representan PostgreSQL y el adaptador de persistencia en los límites y niveles pertinentes.
4. **Dado** la constitución v1.2.0, **cuando** se incorpora el cambio aprobado, **entonces** se actualizan stack y principio de base de datos, se registra el impacto y se publica la versión 1.3.0 sin retirar los demás principios.

### Casos límite

- `DATABASE_URL` falta, usa `file:`, `libsql:`/`libsql://`, está mal formada o apunta a un host no disponible; no se permite fallback silencioso ni secretos en logs o repositorio.
- La base destino ya tiene tablas, migraciones previas o esquema incompatible; la inicialización no debe borrar ni reiniciar una base existente.
- La importación encuentra enum desconocido, clave foránea huérfana, secuencia desfasada, IDs duplicados, fecha no válida o columna con datos no representables; el proceso debe informar tabla/registro y evitar declarar la migración completa.
- La base de prueba comparte por error la URL institucional; la suite debe rechazarla antes de ejecutar limpieza o escritura.
- Consultas Prisma `contains` que incluyen mayúsculas/minúsculas pueden devolver resultados distintos con las reglas de comparación de SQLite/libSQL y PostgreSQL. Se contrastan búsquedas de solicitudes, revisión y administración; cualquier divergencia queda como hallazgo.
- Los enum Prisma en SQLite se almacenan como texto y su validez la aplica Prisma; en PostgreSQL se crean enums nativos y el motor también restringe sus valores. Se valida la traducción de todos los valores actuales y se registra el cambio de enforcement sin cambiar estados o reglas del negocio.
- Los procedimientos SQLite y PRAGMAs del inicializador actual no son reutilizables tal cual en PostgreSQL; el nuevo flujo no debe ejecutar ni interpretar esos comandos en el destino.
- La carga objetivo de 20.000 usuarios significa 20.000 cuentas registradas en total; no se interpreta como 20.000 sesiones o solicitudes simultáneas ni como un SLA de latencia.

Hallazgos técnicos para validar y documentar, no corregir en lógica de negocio:

- Prisma documenta que PostgreSQL usa comparación sensible a mayúsculas por defecto y ofrece `mode: "insensitive"` para filtros compatibles; cambiar el resultado de búsqueda mediante ese modo sería una decisión funcional fuera de este alcance. Las pruebas registrarán diferencias frente a las consultas actuales.
- PostgreSQL aplica enums nativos en base de datos, mientras SQLite los representa como texto y Prisma los valida en su cliente. La conversión añade enforcement de almacenamiento, pero no debe introducir nuevos valores ni cambiar las transiciones de negocio.
- El runtime actual `server/src/index.js` solo acepta `DATABASE_URL` con prefijo `file:` y usa `@prisma/adapter-libsql@7.8.0`; `server/prisma/schema.prisma` declara `provider = "sqlite"`; `server/prisma.config.ts` carga dotenv y expone `DATABASE_URL` a Prisma Config; `server/scripts/inicializar-base.js` usa `node:sqlite`, `PRAGMA user_version` y un SQL SQLite. Prisma recomienda que el adaptador sea de la misma serie mayor 7; aqui se fija `@prisma/adapter-pg@7.8.0` para igualar `prisma` y `@prisma/client` 7.8.0. Prisma requiere el driver `pg` pero no fija su version exacta; se selecciona `pg@8.22.0` de la serie 8.x.
- La arquitectura anterior de OpenSpec describe SQLite local y pide verificar proveedor/adaptador/migraciones antes del despliegue institucional. Esta feature resuelve ese riesgo y actualiza la documentación vigente; los antecedentes se conservan como registro histórico.

## Requisitos

### Requisitos funcionales

- **FR-001**: El servidor DEBE usar PostgreSQL como proveedor Prisma y `@prisma/adapter-pg` junto con el driver `pg`, en versiones compatibles con las dependencias Prisma existentes.
- **FR-002**: El arranque y los comandos de inicialización DEBEN exigir `DATABASE_URL` presente con prefijo literal `postgresql://`; deben rechazar SQLite, libSQL, esquemas distintos y valor ausente antes de conectarse o modificar una base.
- **FR-003**: DEBE existir una migración PostgreSQL inicial versionada y documentada que cree el esquema vigente, incluidas tablas, enums nativos, defaults, relaciones, restricciones, índices y nombres físicos preservados.
- **FR-004**: DEBE existir un script idempotente de inicialización/despliegue de migraciones para una base PostgreSQL vacía. No debe usar `db push`, reiniciar la base ni borrar objetos/datos preexistentes.
- **FR-006**: Las ocho suites Jest actuales de `server/` DEBEN usar PostgreSQL local en Docker o el servicio PostgreSQL de GitHub Actions, con un helper compartido que cree un schema aleatorio por archivo, aplique las migraciones vigentes, siembre datos sinteticos y ejecute `DROP SCHEMA ... CASCADE` al terminar. DEBEN conservar el 100 % de las aserciones y su intencion; solo se ajustan expectativas que difieran por proveedor y se registran como hallazgo.
- **FR-007**: Los fixtures DEBEN tomar la URL base desde `SIGEP_TEST_DATABASE_URL`, rechazarla antes de conectar si falta o coincide con la URL institucional `DATABASE_URL`, y limitar toda preparacion/limpieza al schema aleatorio del archivo.
- **FR-008**: Las diferencias observadas de sensibilidad a mayúsculas en búsquedas y validación de enums DEBEN registrarse como hallazgos de pruebas/documentación; este cambio no altera filtros, endpoints, permisos, transiciones ni reglas de negocio para ocultar esas diferencias.
- **FR-009**: Los documentos pertinentes de `docs/01-analisis-de-sistema/` y `docs/02-arquitectura-software/` DEBEN reflejar la decisión; DEBE crearse la documentación faltante de `docs/03` y actualizarse los niveles pertinentes de `docs/04-modelo-c4/`.
- **FR-010**: La constitución DEBE pasar de v1.2.0 a v1.3.0, actualizar stack/base de datos y registrar el impacto de la enmienda.
- **FR-011**: No se DEBE modificar `client/` ni la lógica de negocio en las rutas y módulos funcionales del servidor. Los cambios permitidos son persistencia/conexión, Prisma, migraciones, scripts, fixtures de prueba y documentación indicada.
- **FR-012**: Un script de siembra independiente de Jest DEBE crear al menos 20.000 cuentas registradas y comprobar que se conservan sus datos y permiten las operaciones CRUD actuales. Esto no establece concurrencia de 20.000 sesiones.
- **FR-013**: Las credenciales PostgreSQL DEBEN permanecer en variables de entorno/secretos; no se guardan URLs con credenciales, dumps ni `.env` en control de versiones.

### Entidades clave

- **Base SQLite/libSQL local de desarrollo**: Artefacto temporal ignorado por Git, sin datos institucionales versionados; se recrea con el script de inicialización y no requiere transferencia a PostgreSQL.
- **Base PostgreSQL destino**: Persistencia operativa con el mismo modelo SIGEP y enforcement nativo de relaciones, restricciones y enums.
- **Migración versionada**: Cambio de esquema ordenado que lleva una base PostgreSQL vacía al contrato actual y deja registro de aplicación.
- **Base PostgreSQL de pruebas**: Servicio PostgreSQL de Docker local o GitHub Actions identificado por `SIGEP_TEST_DATABASE_URL`; cada archivo Jest usa un schema aleatorio aislado que el helper compartido elimina al finalizar.
- **Hallazgo de proveedor**: Diferencia observable entre SQLite/libSQL y PostgreSQL que se registra sin alterar reglas de negocio en esta feature.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Una base PostgreSQL vacía puede inicializarse desde el repositorio y superar todas las validaciones del esquema sin intervención manual no documentada.
- **SC-003**: Las ocho suites Jest del servidor pasan sobre PostgreSQL, mantienen el 100 % de sus aserciones preexistentes y documentan las expectativas que deban reflejar una diferencia comprobada del proveedor.
- **SC-004**: El script de siembra independiente de Jest crea 20.000 cuentas y verifica lecturas y escrituras CRUD sin perdida, duplicacion no autorizada ni relaciones invalidas.
- **SC-005**: Las URLs no PostgreSQL son rechazadas antes de iniciar el servidor o cambiar datos; el helper de pruebas rechaza `SIGEP_TEST_DATABASE_URL` ausente o igual a `DATABASE_URL` antes de tocar la base.
- **SC-006**: `docs/01`, `docs/02`, el nuevo documento de `docs/03`, `docs/04` y la constitución v1.3.0 describen el mismo proveedor y flujo de migración.
- **SC-007**: La revisión de cambios confirma que `client/` y la lógica de negocio del servidor no cambiaron.

## Supuestos

- La base SQLite local contiene solo datos desechables de desarrollo; la migracion crea el esquema PostgreSQL y no traslada registros locales.
- “20.000 usuarios” se refiere a cuentas registradas en total, no a concurrencia. No se fija SLA de latencia sin una carga de trabajo institucional acordada.
- El modelo funcional, los nombres de entidades, las reglas de permisos y las transiciones no cambian; solo se adapta persistencia y la infraestructura de pruebas.
- Las ocho suites Jest existentes en `specs/009-pruebas-servidor-jest` son la fuente de verdad para conservar las aserciones.
- `SIGEP_TEST_DATABASE_URL` suministra la conexion al PostgreSQL de pruebas; se usa Docker localmente y un servicio PostgreSQL en GitHub Actions, sin incluir credenciales en la especificacion.
- `docs/03` falta en el árbol actual; la implementación creará esa capa documental antes de completar el cambio arquitectónico, de acuerdo con la constitución.

## Referencias

- Estado actual: `server/prisma/schema.prisma`, `server/prisma.config.ts`, `server/src/index.js`, `server/scripts/inicializar-base.js`, `server/package.json` y las suites de `server/src/*.test.js`.
- Arquitectura vigente: documentos de `docs/01-analisis-de-sistema/`, `docs/02-arquitectura-software/` y `docs/04-modelo-c4/`.
- Antecedentes a conservar: `docs/legacy/openspec/changes/implementar-grados-titulos-sigep/design.md`, `docs/legacy/openspec/changes/implementar-certificaciones-sigep/design.md`, `docs/legacy/openspec/api-contracts.md` y `docs/legacy/openspec/data-models.md`.
- Compatibilidad: [guía oficial de actualización a Prisma ORM 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) recomienda `@prisma/adapter-pg@7`; [Prisma PostgreSQL v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) documenta el adaptador para el driver PostgreSQL `pg`.
- Prisma 7 PostgreSQL y adaptador: [PostgreSQL con Prisma ORM v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql), [driver adapters](https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers) y [pool de conexiones v7](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool).
- Diferencias de filtros y enums: [sensibilidad a mayúsculas en Prisma](https://docs.prisma.io/docs/orm/v6/prisma-client/queries/case-sensitivity), [enums Prisma](https://docs.prisma.io/docs/orm/reference/prisma-schema-reference) y [matching PostgreSQL](https://www.postgresql.org/docs/current/functions-matching.html).

## Clarifications

### Session 2026-11-22

- Se confirmó que `sigep.db` y los datos de `.runtime-local/` son solo de desarrollo y no están versionados; se elimina Historia 2, FR-005 y SC-002, y PostgreSQL se inicializa desde migraciones sin copiar esos datos.
- FR-012 se valida con un script de siembra independiente de Jest que crea y comprueba 20.000 cuentas.
- Se registró el comportamiento real de `index.js`, `schema.prisma`, `prisma.config.ts` e `inicializar-base.js`; se alinea `@prisma/adapter-pg` a 7.8.0 con Prisma 7.8.0 y se fija `pg` 8.22.0 (rama 8.x).
- Los tests comparten un helper que crea un schema aleatorio por archivo, aplica migraciones, siembra datos y ejecuta `DROP SCHEMA ... CASCADE`; rechaza `SIGEP_TEST_DATABASE_URL` ausente o igual a `DATABASE_URL` antes de conectar.
- Las pruebas usan PostgreSQL en Docker local y como servicio de GitHub Actions, configurado mediante `SIGEP_TEST_DATABASE_URL`.
