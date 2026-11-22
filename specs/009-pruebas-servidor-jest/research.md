# InvestigaciÃ³n: Jest, cobertura y SQLite temporal para el servidor

## DecisiÃ³n: Jest como Ãºnica dependencia nueva de desarrollo

- **DecisiÃ³n**: Agregar solo `jest@30.5.2` a `devDependencies` de `server/`.
- **JustificaciÃ³n**: La constituciÃ³n v1.2.0 exige Jest en las capas del proyecto. Jest ejecuta los casos, recoge cobertura con `--coverage` y ofrece los reporters solicitados. Los tests actuales son JavaScript CommonJS, por lo que no requieren transformador, `@types/jest` ni framework adicional. La guÃ­a oficial muestra el uso del runner como dependencia de desarrollo: [Jest: Getting Started](https://jestjs.io/docs/getting-started).
- **Alternativas**: Conservar `node --test` incumplirÃ­a la constituciÃ³n y el requisito de reporte; un proveedor separado de cobertura duplicarÃ­a lo que Jest ya incluye. No se agrega Supertest: `fetch` nativo de Node puede invocar la instancia Express real en un puerto asignado por el SO.

## DecisiÃ³n: configuraciÃ³n de reporters y cobertura

- **DecisiÃ³n**: En `server/jest.config.js`, fijar `coverageReporters: ["text", "html", "lcov"]`, `coverageDirectory: "coverage"`, `verbose: true`, `testEnvironment: "node"` y `collectCoverageFrom` para mÃ³dulos `src/**/*.js` excluyendo `.test.js`. Mantener el script `test` exactamente como `jest --coverage` y no declarar `coverageThreshold`.
- **JustificaciÃ³n**: La documentaciÃ³n oficial especifica `coverageReporters`, `coverageDirectory` y aclara que el umbral es opcional; al establecer reporters explÃ­citos se incluyen el resumen de texto y los archivos HTML/lcov requeridos. Referencias: [Jest Configuration](https://jestjs.io/docs/configuration), [Jest CLI](https://jestjs.io/docs/cli).
- **Ignorado de artefactos**: AÃ±adir `server/coverage/` a `.gitignore` raÃ­z; el reporte se inspecciona localmente y no forma parte de cambios versionados.

## Compatibilidad de `node:sqlite` con Jest

- **Entorno observado**: Node v24.16.0. Se ejecutÃ³ `DatabaseSync(':memory:')`, creaciÃ³n/inserciÃ³n/consulta y cierre directamente en Node con Ã©xito.
- **DocumentaciÃ³n primaria**: Node v24.16.0 incluye `DatabaseSync` en el mÃ³dulo integrado [`node:sqlite`](https://nodejs.org/download/release/v24.16.0/docs/api/sqlite.html). Jest usa `node` como entorno predeterminado ([Jest Test Environment](https://jestjs.io/docs/test-environment)). Estas referencias no prueban por sÃ­ solas que el sandbox VM de Jest permita cargar el mÃ³dulo nativo.
- **Prueba real bajo Jest**: Aprobada en un directorio temporal: se instalÃ³ `jest@30.5.2`, se ejecutÃ³ una suite con entorno `node` y sin transforms, se importÃ³ `node:sqlite`, se creÃ³ una base `:memory:`, se creÃ³ una tabla, se insertÃ³ y leyÃ³ el valor `{ x: 7 }` y se cerrÃ³ la conexiÃ³n. Resultado: 1 suite y 1 test pasaron bajo Node v24.16.0. La instalaciÃ³n y los archivos de prueba temporales se eliminaron; el repositorio quedÃ³ intacto.
- **Gate antes de migrar**: Repetir la prueba smoke desde `server/` con la versiÃ³n fijada en package-lock y configuraciÃ³n del proyecto. Aunque la compatibilidad base ya fue verificada, confirmar que la configuraciÃ³n real no difiere; solo despuÃ©s migrar fixtures.
- **Plan B si falla**: No usar `DatabaseSync` en fixtures. Crear las mismas tablas/filas en un archivo `file:` temporal mediante `PrismaClient` y el `PrismaLibSql` ya instalado; ejecutar DDL/semillas con las APIs SQL de Prisma, cerrar el cliente y borrar el archivo temporal. Esto conserva SQLite real, no cambia mÃ³dulos productivos y no aÃ±ade dependencias. Prisma documenta SQLite y consultas raw en [SQLite connector](https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite) y [Raw queries](https://docs.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries). No elegir `@libsql/client` porque serÃ­a una segunda dependencia nueva, prohibida por el alcance. Como la combinaciÃ³n probada pasÃ³, el Plan B queda Ãºnicamente para diferencias futuras de runtime/configuraciÃ³n.

## DecisiÃ³n: organizaciÃ³n y aislamiento de pruebas

- **DecisiÃ³n**: Dejar inicialmente `solicitudes.test.js` y `catalogo-grados.test.js` junto a sus mÃ³dulos; crear las nuevas suites junto a mÃ³dulos o en `server/tests/`. Preferir `server/tests/` para helpers reutilizables si se necesita setup comÃºn. Cada caso de integraciÃ³n debe obtener base y directorio de archivos propios, Express en puerto `0`, y cleanup en `afterEach`/`afterAll` equivalente.
- **JustificaciÃ³n**: Los casos independientes no deben depender del orden ni compartir estados mutables. La prueba de carreras del legacy conserva su `Promise.all` como un caso explÃ­cito. Los archivos actuales ya usan API HTTP real, Prisma/libSQL y SQLite temporal. Cada historia tendrÃ¡ su propio archivo de prueba para que una tarea corresponda a un archivo y no haya colisiones.
- **LÃ­mite**: No modificar `server/src/*.js` de producciÃ³n ni `client/`; los cambios en `package.json` son configuraciÃ³n de test, y de los scripts solo cambia `test`.

## Fuentes de comportamiento

`specs/009-pruebas-servidor-jest/spec.md` conserva la matriz de aserciones legacy S-01â€“S-57/C-01â€“C-07 y describe respuestas observadas. `specs/008-documentacion-arquitectura/spec.md` FR-016 y `docs/01-analisis-de-sistema/03-requisitos-funcionales.md` fijan el inventario de endpoints. OpenSpec (`docs/legacy/openspec/api-contracts.md`, `data-models.md`) es antecedente contractual; el cÃ³digo actual determina expectativas.
## Línea base de cobertura P1 (21-11-2026)

Ejecución final de `npm test -- --runInBand` en `server/` (Jest 30.5.2, sin umbral): 2 suites aprobadas y 6 casos aprobados; se conservaron las aserciones S-01–S-57 y C-01–C-07. Cobertura inicial global: statements 59.62%, branches 48.65%, functions 71.42% y lines 63.34%. Reportes producidos en `server/coverage/`: `index.html`, `lcov-report/index.html` y `lcov.info`.