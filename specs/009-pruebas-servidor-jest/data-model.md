# Modelo de datos de prueba: Jest en el servidor

La funcionalidad no agrega entidades ni modifica el esquema de negocio. Este modelo describe datos temporales usados por pruebas de integración y artefactos de cobertura.

## Entidades

### Caso de prueba

| Campo | Regla |
|---|---|
| Nombre | Describe una conducta concreta y aparece individualmente en la salida Jest. |
| Preparación | Crea datos sintéticos y aislados para ese caso. |
| Acción | Llama una ruta real del registrador Express o comprueba el runner/cobertura. |
| Resultado esperado | Conserva aserciones S-01–S-57/C-01–C-07 o verifica un comportamiento actual descrito en P2–P5. |
| Limpieza | Cierra servidor/Prisma/SQLite y elimina archivos creados aun si falla la aserción. |

### Base SQLite temporal

| Campo | Regla |
|---|---|
| Archivo | Ruta única bajo el directorio temporal del sistema, no bajo la base persistente del producto. |
| Esquema | Tablas mínimas equivalentes a las que consumen los módulos ejercitados; se crean dentro del archivo temporal. |
| Semillas | Usuarios sintéticos por rol, catálogos y expedientes específicos para el escenario. Nunca datos personales reales. |
| Conexión de aplicación | Prisma Client con `PrismaLibSql` y URL `file:` para ejercitar el adaptador real. |
| Preparación inicial | `DatabaseSync` puede crear el esquema si pasa la prueba de compatibilidad en Jest; de lo contrario, el SQL se ejecuta mediante Prisma/libSQL. |
| Ciclo de vida | Una base por caso/suite aislada; desconectar Prisma y borrar archivo/directorio temporal al finalizar. |

### Servidor Express temporal

| Campo | Regla |
|---|---|
| Aplicación | Express real con funciones `registrarX` necesarias por caso. |
| Puerto | `0`, para que el sistema operativo asigne un puerto libre. |
| Cliente HTTP | `fetch` nativo de Node; no se instala Supertest. |
| Autenticación | Secretos sintéticos de prueba; sesiones/cookies verificadas como en el código actual. |
| Cierre | El servidor se cierra en hook de limpieza incluso si el test falla. |

### Reporte de cobertura

| Campo | Regla |
|---|---|
| Directorio | `server/coverage/`, ignorado por Git. |
| Salidas | Texto en consola, HTML e `lcov.info`. |
| Fuente | Archivos `server/src/**/*.js` de producción; excluir `*.test.js`. |
| Umbral | Ninguno; el porcentaje es la línea base observada. |

### Hallazgo

Resultado observado que podría no coincidir con la expectativa funcional. Se documenta con caso/endpoint, respuesta y fuente; no se corrige en el alcance de esta suite.

## Relaciones y ciclo de vida

```text
Caso de prueba 1 ── prepara ── 1 Base SQLite temporal
Caso de prueba 1 ── invoca ── 1 Servidor Express temporal
Servidor Express temporal ── consulta/escribe ── Base SQLite temporal
Ejecución Jest 1 ── genera ── 1 conjunto de Reportes de cobertura
Caso de prueba 0..* ── puede registrar ── 0..* Hallazgos
```

## Reglas de integridad

1. Cada caso es independiente; no se apoya en el orden de otros casos ni comparte una base mutable.
2. La aplicación bajo prueba siempre usa Prisma/libSQL y archivo SQLite real.
3. La preparación puede usar `node:sqlite` solo después del gate Jest; el Plan B usa SQL del Prisma ya instalado, sin nuevo paquete.
4. Datos sintéticos y cookies/secretos efímeros no se guardan en archivos `.env` ni se envían a servicios externos.
5. Los archivos de prueba, configuración Jest, script `test`, lockfile por Jest y `.gitignore` son los únicos artefactos de implementación esperados; ningún archivo productivo o de `client/` se modifica.