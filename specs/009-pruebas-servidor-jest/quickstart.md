# Guía rápida de validación: pruebas Jest del servidor

## Requisitos previos

- Node.js del proyecto (en el entorno revisado: v24.16.0).
- Dependencias instaladas en `server/`, incluida la única dependencia nueva `jest` después de implementar el plan.
- No se requieren credenciales reales, `.env`, Google disponible ni servicio de base externo.

## Gate previo a la migración: probar `node:sqlite` dentro de Jest

La combinación ya se verificó en una instalación temporal de Jest 30.5.2 sobre Node v24.16.0: `DatabaseSync` abrió `:memory:`, ejecutó DDL, insertó/leyó un valor y cerró; Jest reportó 1 suite y 1 test aprobados. La instalación temporal y el fixture se eliminaron.

Antes de migrar las pruebas, repetir el smoke con la versión Jest instalada en el proyecto:

1. Crear temporalmente una prueba Jest con entorno `node` que use `require("node:sqlite")`, `new DatabaseSync(":memory:")`, cree una tabla, inserte y lea un valor, y cierre la conexión.
2. Ejecutarla desde `server/` con Jest en modo serial y confirmar que aparece aprobada.
3. Borrar la prueba temporal si no se conserva como test de compatibilidad.
4. Si falla al cargar o usar `node:sqlite`, detener la migración. Sustituir solo la inicialización del fixture por `PrismaClient` + `PrismaLibSql` y SQL sobre un archivo temporal `file:` real. No agregar `@libsql/client`, otra dependencia ni modificar producción. Repetir la validación del fixture antes de seguir.

## Ejecutar la suite

Desde PowerShell:

```powershell
Set-Location server
npm ci
npm test
```

En instalación de desarrollo sin lock actualizado todavía, `npm install` se usará al implementar la dependencia; una vez versionado `package-lock.json`, CI y validación limpia usarán `npm ci`.

## Resultado esperado

- Jest lista cada caso con su nombre y estado, seguido por el resumen.
- La consola muestra el reporter `text`.
- Se generan `coverage/index.html` y `coverage/lcov.info` bajo `server/coverage/`.
- No hay mínimo de cobertura que haga fallar la ejecución.
- Las bases/directorios temporales y los puertos de Express quedan liberados al terminar.

## Revisión de la línea base

1. Comprobar todas las aserciones del inventario S-01–S-57 y C-01–C-07 de [spec.md](spec.md).
2. Verificar que el escenario monolítico de solicitudes se dividió en casos independientes y que permanecen las comprobaciones concurrentes como un caso explícito.
3. Revisar filtros, paginación, transiciones, errores, roles, cookies y operaciones administrativas contra el código actual, registrando diferencias como hallazgos.
4. Revisar el reporte de cobertura como línea base; no fijar ni inferir umbral.
5. Revisar `git diff`: `server/package.json` cambia solo `devDependencies.jest`, configuración Jest y `scripts.test`; `server/package-lock.json` incorpora Jest; `.gitignore` incluye `server/coverage/`; pruebas nuevas/migradas solo están bajo `server/`. No debe haber diffs en código de producción de `server/` ni en `client/`.

## Fuente de endpoints

El inventario HTTP observado está en `specs/008-documentacion-arquitectura/spec.md` (FR-016) y `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`. La prueba se dirige a los registradores actuales; no requiere una suite de contrato HTTP separada.