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

### Historia 2 - Conservar datos existentes durante la migración (Prioridad: P2)

Como responsable de los datos institucionales, quiero trasladar los registros de la base SQLite/libSQL vigente a PostgreSQL sin pérdida, para mantener la continuidad de expedientes y trazabilidad.

**Por qué esta prioridad**: Una migración tecnológica que pierde cuentas, expedientes o auditoría interrumpe operaciones y rompe referencias históricas.

**Prueba independiente**: Tomar una copia consistente del origen, importar sus registros a una base PostgreSQL inicializada y comparar conteos, identificadores, valores de enum y relaciones por tabla; verificar claves foráneas y que las secuencias continúen después de los IDs importados.

**Escenarios de aceptación**:

1. **Dado** la base SQLite/libSQL de origen disponible y respaldada, **cuando** se ejecuta la transferencia, **entonces** se preservan todos los registros y sus IDs en las entidades que existen en el esquema.
2. **Dado** filas relacionadas de usuarios, estudiantes, programas, solicitudes, requisitos, documentos, revisiones, historial y auditoría, **cuando** termina la transferencia, **entonces** sus relaciones siguen válidas y los conteos de origen/destino se pueden contrastar.
3. **Dado** valores existentes de enum, fechas, booleanos y claves generadas, **cuando** se convierten al esquema PostgreSQL, **entonces** los valores válidos se conservan sin redefinir reglas del negocio; los valores inválidos o no representables se informan antes de completar el corte.
4. **Dado** la fuente SQLite/libSQL, **cuando** se ejecuta la importación, **entonces** el origen no se elimina ni modifica y puede servir como respaldo hasta que el destino se valide.

---

### Historia 3 - Ejecutar pruebas Jest del servidor con PostgreSQL (Prioridad: P3)

Como desarrollador del servidor, quiero ejecutar las mismas suites de integración sobre una base PostgreSQL temporal de prueba, para verificar que el cambio de proveedor conserva las aserciones y los flujos actuales.

**Por qué esta prioridad**: Los fixtures SQLite actuales no comprueban diferencias de comportamiento o restricciones que aparecen en PostgreSQL.

**Prueba independiente**: Ejecutar desde `server/` las ocho suites Jest sobre una base PostgreSQL de prueba separada, previamente inicializada con el mismo esquema/migraciones, y comparar nombres, cantidad y resultado de todas las aserciones existentes.

**Escenarios de aceptación**:

1. **Dado** una base de prueba PostgreSQL dedicada y vacía, **cuando** se ejecutan las suites, **entonces** cada archivo prepara y limpia datos sintéticos en esa base sin conectarse al origen ni a la base institucional.
2. **Dado** las ocho suites actuales del servidor, **cuando** se adaptan los fixtures al proveedor PostgreSQL, **entonces** se conservan todas las comprobaciones, nombres y objetivos de cobertura sin eliminar ni debilitar aserciones; una expectativa que cambie por el proveedor solo se ajusta al resultado observado y se registra como hallazgo.
3. **Dado** un fallo al preparar la base, **cuando** corre una suite, **entonces** el fallo identifica el archivo/caso y libera los recursos creados sin borrar una base que no esté identificada como exclusiva de pruebas.
4. **Dado** consultas de búsqueda y campos enum que se ejecutan contra ambas tecnologías, **cuando** los resultados difieren, **entonces** las pruebas anotan la conducta observada como hallazgo y no alteran lógica productiva para forzar paridad.

---

### Historia 4 - Operar y mantener la arquitectura documentada (Prioridad: P4)

Como equipo de mantenimiento, queremos que la documentación arquitectónica y la constitución reflejen el motor y la transición reales, para que despliegues y futuros cambios usen una fuente de verdad coherente.

**Por qué esta prioridad**: Las decisiones de base de datos afectan requisitos de calidad, arquitectura, operación, inicialización y pruebas.

**Prueba independiente**: Revisar documentación de las capas 01 a 04 y verificar que ninguna describa SQLite/libSQL como motor operativo vigente, que la migración de datos y los hallazgos estén registrados y que la constitución tenga versión 1.3.0.

**Escenarios de aceptación**:

1. **Dado** los documentos existentes de análisis y arquitectura en `docs/01` y `docs/02`, **cuando** se actualizan, **entonces** expresan PostgreSQL como destino, explican la capacidad objetivo de hasta 20.000 usuarios y distinguen hechos actuales de decisiones aprobadas.
2. **Dado** que `docs/03` no existe en el repositorio inspeccionado, **cuando** se documenta el diseño detallado, **entonces** se crea la capa documental faltante y se describen conexión, migración inicial, inicialización, transferencia y operación PostgreSQL.
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
- El runtime actual `server/src/index.js` solo acepta `DATABASE_URL` con prefijo `file:` y `server/scripts/inicializar-base.js` usa `node:sqlite`, `PRAGMA user_version` y un SQL SQLite. Ambos son puntos de reemplazo de persistencia/inicialización; las rutas y módulos de dominio quedan fuera del cambio.
- La arquitectura anterior de OpenSpec describe SQLite local y pide verificar proveedor/adaptador/migraciones antes del despliegue institucional. Esta feature resuelve ese riesgo y actualiza la documentación vigente; los antecedentes se conservan como registro histórico.

## Requisitos

### Requisitos funcionales

- **FR-001**: El servidor DEBE usar PostgreSQL como proveedor Prisma y `@prisma/adapter-pg` junto con el driver `pg`, en versiones compatibles con las dependencias Prisma existentes.
- **FR-002**: El arranque y los comandos de inicialización DEBEN exigir `DATABASE_URL` presente con prefijo literal `postgresql://`; deben rechazar SQLite, libSQL, esquemas distintos y valor ausente antes de conectarse o modificar una base.
- **FR-003**: DEBE existir una migración PostgreSQL inicial versionada y documentada que cree el esquema vigente, incluidas tablas, enums nativos, defaults, relaciones, restricciones, índices y nombres físicos preservados.
- **FR-004**: DEBE existir un script idempotente de inicialización/despliegue de migraciones para una base PostgreSQL vacía. No debe usar `db push`, reiniciar la base ni borrar objetos/datos preexistentes.
- **FR-005**: La transición DEBE preservar los datos existentes de SQLite/libSQL; incluir copia/transferencia, comprobación de conteos, IDs, enums, relaciones y secuencias, y conservar la fuente intacta como respaldo hasta validar el destino.
- **FR-006**: Las ocho suites Jest actuales de `server/` DEBEN usar una base PostgreSQL dedicada de prueba con el mismo esquema/migraciones del runtime y conservar el 100 % de las aserciones y su intención; no se elimina ni debilita ninguna comprobación y solo se ajusta una expectativa cuando el resultado real difiere por proveedor, registrando el hallazgo.
- **FR-007**: Los fixtures de las suites DEBEN usar datos sintéticos aislados, limpiar únicamente la base marcada como exclusiva de pruebas y nunca conectarse ni ejecutar limpieza sobre el origen o producción.
- **FR-008**: Las diferencias observadas de sensibilidad a mayúsculas en búsquedas y validación de enums DEBEN registrarse como hallazgos de pruebas/documentación; este cambio no altera filtros, endpoints, permisos, transiciones ni reglas de negocio para ocultar esas diferencias.
- **FR-009**: Los documentos pertinentes de `docs/01-analisis-de-sistema/` y `docs/02-arquitectura-software/` DEBEN reflejar la decisión; DEBE crearse la documentación faltante de `docs/03` y actualizarse los niveles pertinentes de `docs/04-modelo-c4/`.
- **FR-010**: La constitución DEBE pasar de v1.2.0 a v1.3.0, actualizar stack/base de datos y registrar el impacto de la enmienda.
- **FR-011**: No se DEBE modificar `client/` ni la lógica de negocio en las rutas y módulos funcionales del servidor. Los cambios permitidos son persistencia/conexión, Prisma, migraciones, scripts, fixtures de prueba y documentación indicada.
- **FR-012**: La migración DEBE validar una carga de al menos 20.000 cuentas registradas, conservar íntegros sus datos y permitir las operaciones CRUD actuales. Esto no establece concurrencia de 20.000 sesiones.
- **FR-013**: Las credenciales PostgreSQL DEBEN permanecer en variables de entorno/secretos; no se guardan URLs con credenciales, dumps ni `.env` en control de versiones.

### Entidades clave

- **Base SQLite/libSQL de origen**: Fuente existente de tablas SIGEP, relaciones, IDs y datos que deben respaldarse y transferirse sin mutar el origen.
- **Base PostgreSQL destino**: Persistencia operativa con el mismo modelo SIGEP y enforcement nativo de relaciones, restricciones y enums.
- **Migración versionada**: Cambio de esquema ordenado que lleva una base PostgreSQL vacía al contrato actual y deja registro de aplicación.
- **Base PostgreSQL de pruebas**: Base aislada y desechable donde se aplican las mismas migraciones para ejecutar fixtures Jest.
- **Hallazgo de proveedor**: Diferencia observable entre SQLite/libSQL y PostgreSQL que se registra sin alterar reglas de negocio en esta feature.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Una base PostgreSQL vacía puede inicializarse desde el repositorio y superar todas las validaciones del esquema sin intervención manual no documentada.
- **SC-002**: El 100 % de los registros e identificadores de la fuente incluida en la migración se conserva y los conteos, relaciones y enums de origen/destino quedan conciliados.
- **SC-003**: Las ocho suites Jest del servidor pasan sobre PostgreSQL, mantienen el 100 % de sus aserciones preexistentes y documentan las expectativas que deban reflejar una diferencia comprobada del proveedor.
- **SC-004**: Una comprobación de carga guarda y recupera 20.000 cuentas registradas sin pérdida, duplicación no autorizada ni relaciones inválidas.
- **SC-005**: Las URLs no PostgreSQL son rechazadas antes de iniciar el servidor o cambiar datos; la URL de pruebas no puede coincidir con la URL institucional.
- **SC-006**: `docs/01`, `docs/02`, el nuevo documento de `docs/03`, `docs/04` y la constitución v1.3.0 describen el mismo proveedor y flujo de migración.
- **SC-007**: La revisión de cambios confirma que `client/` y la lógica de negocio del servidor no cambiaron.

## Supuestos

- El principio vigente de la constitución exige preservar datos; por eso se asume que debe transferirse el contenido existente, no solo crear una base vacía.
- “20.000 usuarios” se refiere a cuentas registradas en total, no a concurrencia. No se fija SLA de latencia sin una carga de trabajo institucional acordada.
- El modelo funcional, los nombres de entidades, las reglas de permisos y las transiciones no cambian; solo se adapta persistencia y la infraestructura de pruebas.
- Las ocho suites Jest existentes en `specs/009-pruebas-servidor-jest` son la fuente de verdad para conservar las aserciones.
- La URL de conexión de prueba se suministra por variable de entorno a una instancia/base PostgreSQL exclusiva de pruebas; no se incorpora un proveedor cloud ni credenciales a la especificación.
- `docs/03` falta en el árbol actual; la implementación creará esa capa documental antes de completar el cambio arquitectónico, de acuerdo con la constitución.

## Referencias

- Estado actual: `server/prisma/schema.prisma`, `server/prisma.config.ts`, `server/src/index.js`, `server/scripts/inicializar-base.js`, `server/package.json` y las suites de `server/src/*.test.js`.
- Arquitectura vigente: documentos de `docs/01-analisis-de-sistema/`, `docs/02-arquitectura-software/` y `docs/04-modelo-c4/`.
- Antecedentes a conservar: `docs/legacy/openspec/changes/implementar-grados-titulos-sigep/design.md`, `docs/legacy/openspec/changes/implementar-certificaciones-sigep/design.md`, `docs/legacy/openspec/api-contracts.md` y `docs/legacy/openspec/data-models.md`.
- Prisma 7 PostgreSQL y adaptador: [PostgreSQL con Prisma ORM v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql), [driver adapters](https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers) y [pool de conexiones v7](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool).
- Diferencias de filtros y enums: [sensibilidad a mayúsculas en Prisma](https://docs.prisma.io/docs/orm/v6/prisma-client/queries/case-sensitivity), [enums Prisma](https://docs.prisma.io/docs/orm/reference/prisma-schema-reference) y [matching PostgreSQL](https://www.postgresql.org/docs/current/functions-matching.html).
