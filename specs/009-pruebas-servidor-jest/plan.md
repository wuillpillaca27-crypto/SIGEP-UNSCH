# Plan de implementación: Pruebas automatizadas del servidor con Jest

**Rama**: `009-pruebas-servidor-jest` | **Fecha**: 2026-11-21 | **Especificación**: [spec.md](spec.md)

**Entrada**: `specs/009-pruebas-servidor-jest/spec.md`

## Resumen

Añadir Jest como única dependencia nueva de desarrollo del servidor, porque la constitución v1.2.0 lo exige como runner y Jest incluye recolección de cobertura y los reporters `text`, `html` y `lcov`. El único cambio a los scripts de arranque será reemplazar el valor de `server/package.json` para `test` por `jest --coverage`; se configurarán explícitamente entorno `node`, salida `coverage/`, reporters y detalle por caso sin threshold. Añadir `server/coverage/` al `.gitignore` raíz. No usar Supertest: las integraciones conservan Express real en puerto efímero, `fetch` de Node y SQLite temporal.

Antes de migrar las pruebas, tras instalar Jest, correr un smoke test aislado que importe `node:sqlite`, abra `DatabaseSync`, cree/consulte una tabla y cierre la base. Se comprobó en un directorio temporal que Jest 30.5.2 bajo Node v24.16.0 importa `node:sqlite`, crea/inserta/consulta una tabla en memoria y cierra `DatabaseSync`. La misma prueba deberá repetirse con el Jest del proyecto antes de migrar fixtures; si fallara por una diferencia del entorno, usar el adaptador Prisma/libSQL ya existente para crear las tablas de fixture con SQL en una base SQLite temporal, sin añadir `@libsql/client` ni cambiar producción.

## Contexto técnico

**Lenguaje/versión**: JavaScript CommonJS en Node.js v24.16.0 observado en el entorno.

**Dependencias principales**: Runtime actual sin cambios. Única dependencia nueva de desarrollo: `jest@30.5.2`, cuya prueba smoke pasó en Node v24.16.0. No se agrega Supertest, transformador, entorno DOM, `@types/jest` ni cliente de base nuevo.

**Almacenamiento**: Bases SQLite locales efímeras por prueba/suite, conectadas mediante Prisma 7 y `@prisma/adapter-libsql`; sin cambio de esquema de producto. `node:sqlite` se usa para crear fixtures solo si pasa el gate Jest.

**Pruebas**: Jest en entorno `node`; script `npm test` ejecuta exactamente `jest --coverage`. Configuración de Jest en `server/package.json`: `verbose`, `testEnvironment: node`, `coverageDirectory: coverage`, reporters `text`, `html`, `lcov`, e inclusión de módulos `src/**/*.js` excluyendo pruebas. No definir `coverageThreshold`.

**Plataforma objetivo**: Desarrollo local y CI del servidor en Node; el repositorio se trabaja en Windows y usa npm.

**Tipo de proyecto**: API web Express con pruebas de integración HTTP/SQLite.

**Objetivos de rendimiento**: No aplica como SLO del producto. La suite debe terminar y limpiar recursos efímeros; no se establece umbral de cobertura ni objetivo temporal nuevo.

**Restricciones**: No modificar código de producción en `server/src/` ni archivos de `client/`. En `server/package.json`, cambiar solo el campo del script `test` entre los scripts existentes; conservar `start`, `local`, `db:init` y `db:generate`. La adición de Jest actualizará `devDependencies` y `server/package-lock.json`; no habrá otra dependencia nueva. No guardar secretos ni usar `.env`. Mantener SQLite real, Express y puerto aleatorio; reportar hallazgos sin corregirlos. Añadir `server/coverage/` al `.gitignore` raíz.

**Alcance**: Suite migrada de `server/src/solicitudes.test.js` y `catalogo-grados.test.js`, dividida y con todas las comprobaciones S-01–S-57/C-01–C-07 preservadas; cobertura nueva para revisión P2–P3, administración P4 e identidad P5. Los archivos de prueba se ubicarán en `server/tests/` para nuevos casos y los dos archivos existentes se mantendrán junto a sus módulos durante la migración, salvo que una necesidad técnica demostrada requiera moverlos. Contratos públicos y producción no cambian.

## Revisión constitucional

| Principio | Resultado | Aplicación |
|---|---|---|
| Especificaciones primero | Cumple | Se planifica desde la spec 009 y su inventario de aserciones. |
| Contratos y titularidad | Cumple | Se cubren permisos, titularidad, transiciones y errores observados sin cambiarlos. |
| Evidencia | Cumple | Reportes de cobertura y resultados individuales dejan evidencia reproducible. |
| Cambios mínimos | Cumple | No se toca código de producción ni `client/`; config limitada a Jest, script de prueba e ignore de coverage. |
| Stack y dependencias | Cumple | Jest es la única nueva dependencia y se justifica por constitución y cobertura integrada. |
| Seguridad | Cumple | Datos/credenciales sintéticos; no se usan secretos reales ni `.env`. |
| Base de datos | Cumple | Sin cambios de esquema ni migración de producto; SQLite temporal para fixtures. |
| Verificación | Cumple | `npm test` verificará los casos y reportes; smoke gate precede a migración. |
| Pruebas | Cumple | Jest es el runner solicitado por la constitución v1.2.0 y habilita cobertura. |
| Referencias | Cumple | Se contrastan endpoints con FR-016 y los contratos/modelos de OpenSpec. |
| Arquitectura documentada | Cumple | No hay cambio arquitectónico ni de responsabilidades de módulos. |
| Idioma | Cumple | Plan, guía y artefactos se redactan en español. |

No hay excepción constitucional pendiente. La ejecución conjunta Jest 30.5.2/Node v24.16.0/`node:sqlite` ya pasó en una prueba aislada; la implementación la repetirá desde el paquete del servidor como primer paso antes de migrar.

## Estructura del proyecto

### Artefactos de planificación

```text
specs/009-pruebas-servidor-jest/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md                 # se genera en la fase $speckit-tasks
```

### Archivos de implementación previstos

```text
.gitignore                                      # ignorar server/coverage/
server/
├── package.json                                # editar solo devDependency jest y script test, además de configuración Jest
├── package-lock.json                           # resolver Jest como única dependencia nueva
├── src/
│   ├── solicitudes.test.js                     # migrar a Jest y dividir casos
│   ├── catalogo-grados.test.js                  # migrar a Jest; conservar aserciones
│   ├── revision-grados.test.js                  # pruebas P2/P3
│   ├── administracion.test.js                   # pruebas P4
│   └── identidad.test.js                        # pruebas P5
└── coverage/                                    # salida generada, ignorada por Git
```

Los nuevos casos podrán agruparse bajo `server/tests/` si facilita fixtures compartidos. La decisión final se toma en tasks; en ambos casos los archivos permanecen dentro de `server/`. No se reescriben módulos `registrarX`.

**Decisión de estructura**: Mantener los dos test files existentes junto a los módulos evita cambios de ruta innecesarios y conserva el punto de referencia del inventario. Agregar pruebas de módulos vecinos en `server/src/` o usar `server/tests/` para helpers/casos nuevos; Jest detecta ambos patrones por defecto. Evitar helpers productivos compartidos; el setup reutilizable, si existe, será solo de pruebas.

## Fase 0: Investigación

Decisiones documentadas en [research.md](research.md): justificación de Jest, configuración de reportes, entorno Node, resultado aprobado del smoke test, repetición previa a migración y contingencia Plan B y rechazo de Supertest/otras dependencias.

## Fase 1: Diseño

- [Modelo de datos de prueba](data-model.md): casos, fixtures SQLite temporales, servidor efímero, cobertura y registro de hallazgos.
- No se crea `contracts/`: la feature no expone ni modifica un contrato de producto; la interfaz de ejecución queda descrita en quickstart.
- [Guía de validación](quickstart.md): comprobar Node/Jest/SQLite primero; migrar y ampliar después; ejecutar suite, revisar reportes, asegurar cleanup y diff permitido.

## Estrategia de implementación

1. Agregar `jest@30.5.2` como única dependencia nueva en dev y configurar el script `test` como `jest --coverage`, con `verbose: true`, `testEnvironment: "node"`, `coverageDirectory: "coverage"`, reporters `text/html/lcov` y sin `coverageThreshold`. No cambiar los demás scripts de `server/package.json`.
2. Ejecutar primero el smoke test Jest/`node:sqlite` contra `:memory:` y verificar creación, inserción, lectura y cierre. La prueba aislada ya pasó en Node v24.16.0 con Jest 30.5.2. Repetirla desde `server/` antes de migrar; si falla allí por diferencia de configuración/runtime, detener la migración y sustituir solo la creación de fixtures por SQL ejecutado mediante el adaptador Prisma/libSQL sobre un archivo SQLite temporal. No instalar otro cliente.
3. Migrar los dos archivos actuales a Jest; extraer preparación/cleanup de integración y dividir el largo flujo de solicitudes en casos independientes. Comparar con la matriz S/C de la spec para no perder aserciones.
4. Añadir cobertura P2–P5 con un caso por permiso, validación, filtro, transición y error pedido, conforme a las ramas reales del código; no reinterpretar fallos observados como reglas nuevas.
5. Ejecutar `npm test`; comprobar reporter de texto, `server/coverage/index.html`, `server/coverage/lcov.info`, que cada caso se liste, que no exista threshold y que los temporales se eliminen.
6. Revisar `git diff`: solo package/lock, `.gitignore` y archivos de prueba; ningún módulo productivo ni archivo de `client/` cambiado.

## Seguimiento de complejidad

No se introducen capas productivas ni dependencias auxiliares. Jest es necesario para cumplir la constitución y cubrir con el mismo runner; se evita Supertest porque Node ya proporciona `fetch` y los casos pueden conversar con Express en un puerto efímero.