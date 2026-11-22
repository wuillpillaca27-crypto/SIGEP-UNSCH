# Investigación: Jest, cobertura y SQLite temporal para el servidor

## Decisión: Jest como única dependencia nueva de desarrollo

- **Decisión**: Agregar solo `jest@30.5.2` a `devDependencies` de `server/`.
- **Justificación**: La constitución v1.2.0 exige Jest en las capas del proyecto. Jest ejecuta los casos, recoge cobertura con `--coverage` y ofrece los reporters solicitados. Los tests actuales son JavaScript CommonJS, por lo que no requieren transformador, `@types/jest` ni framework adicional. La guía oficial muestra el uso del runner como dependencia de desarrollo: [Jest: Getting Started](https://jestjs.io/docs/getting-started).
- **Alternativas**: Conservar `node --test` incumpliría la constitución y el requisito de reporte; un proveedor separado de cobertura duplicaría lo que Jest ya incluye. No se agrega Supertest: `fetch` nativo de Node puede invocar la instancia Express real en un puerto asignado por el SO.

## Decisión: configuración de reporters y cobertura

- **Decisión**: En `server/jest.config.js`, fijar `coverageReporters: ["text", "html", "lcov"]`, `coverageDirectory: "coverage"`, `verbose: true`, `testEnvironment: "node"` y `collectCoverageFrom` para módulos `src/**/*.js` excluyendo `.test.js`. Mantener el script `test` exactamente como `jest --coverage` y no declarar `coverageThreshold`.
- **Justificación**: La documentación oficial especifica `coverageReporters`, `coverageDirectory` y aclara que el umbral es opcional; al establecer reporters explícitos se incluyen el resumen de texto y los archivos HTML/lcov requeridos. Referencias: [Jest Configuration](https://jestjs.io/docs/configuration), [Jest CLI](https://jestjs.io/docs/cli).
- **Ignorado de artefactos**: Añadir `server/coverage/` a `.gitignore` raíz; el reporte se inspecciona localmente y no forma parte de cambios versionados.

## Compatibilidad de `node:sqlite` con Jest

- **Entorno observado**: Node v24.16.0. Se ejecutó `DatabaseSync(':memory:')`, creación/inserción/consulta y cierre directamente en Node con éxito.
- **Documentación primaria**: Node v24.16.0 incluye `DatabaseSync` en el módulo integrado [`node:sqlite`](https://nodejs.org/download/release/v24.16.0/docs/api/sqlite.html). Jest usa `node` como entorno predeterminado ([Jest Test Environment](https://jestjs.io/docs/test-environment)). Estas referencias no prueban por sí solas que el sandbox VM de Jest permita cargar el módulo nativo.
- **Prueba real bajo Jest**: Aprobada en un directorio temporal: se instaló `jest@30.5.2`, se ejecutó una suite con entorno `node` y sin transforms, se importó `node:sqlite`, se creó una base `:memory:`, se creó una tabla, se insertó y leyó el valor `{ x: 7 }` y se cerró la conexión. Resultado: 1 suite y 1 test pasaron bajo Node v24.16.0. La instalación y los archivos de prueba temporales se eliminaron; el repositorio quedó intacto.
- **Gate antes de migrar**: Repetir la prueba smoke desde `server/` con la versión fijada en package-lock y configuración del proyecto. Aunque la compatibilidad base ya fue verificada, confirmar que la configuración real no difiere; solo después migrar fixtures.
- **Plan B si falla**: No usar `DatabaseSync` en fixtures. Crear las mismas tablas/filas en un archivo `file:` temporal mediante `PrismaClient` y el `PrismaLibSql` ya instalado; ejecutar DDL/semillas con las APIs SQL de Prisma, cerrar el cliente y borrar el archivo temporal. Esto conserva SQLite real, no cambia módulos productivos y no añade dependencias. Prisma documenta SQLite y consultas raw en [SQLite connector](https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite) y [Raw queries](https://docs.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries). No elegir `@libsql/client` porque sería una segunda dependencia nueva, prohibida por el alcance. Como la combinación probada pasó, el Plan B queda únicamente para diferencias futuras de runtime/configuración.

## Decisión: organización y aislamiento de pruebas

- **Decisión**: Dejar inicialmente `solicitudes.test.js` y `catalogo-grados.test.js` junto a sus módulos; crear las nuevas suites junto a módulos o en `server/tests/`. Preferir `server/tests/` para helpers reutilizables si se necesita setup común. Cada caso de integración debe obtener base y directorio de archivos propios, Express en puerto `0`, y cleanup en `afterEach`/`afterAll` equivalente.
- **Justificación**: Los casos independientes no deben depender del orden ni compartir estados mutables. La prueba de carreras del legacy conserva su `Promise.all` como un caso explícito. Los archivos actuales ya usan API HTTP real, Prisma/libSQL y SQLite temporal. Cada historia tendrá su propio archivo de prueba para que una tarea corresponda a un archivo y no haya colisiones.
- **Límite**: No modificar `server/src/*.js` de producción ni `client/`; los cambios en `package.json` son configuración de test, y de los scripts solo cambia `test`.

## Fuentes de comportamiento

`specs/009-pruebas-servidor-jest/spec.md` conserva la matriz de aserciones legacy S-01–S-57/C-01–C-07 y describe respuestas observadas. `specs/008-documentacion-arquitectura/spec.md` FR-016 y `docs/01-analisis-de-sistema/03-requisitos-funcionales.md` fijan el inventario de endpoints. OpenSpec (`docs/legacy/openspec/api-contracts.md`, `data-models.md`) es antecedente contractual; el código actual determina expectativas.