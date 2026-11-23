# Investigación: Migrar base de datos a PostgreSQL

**Fecha**: 2026-11-22  
**Alcance**: resolver decisiones técnicas de Prisma 7.8.0, PostgreSQL, fixtures Jest y CI sin cambiar la lógica de dominio.

## Prisma 7 y conexión PostgreSQL

- **Decisión**: mantener `prisma.config.ts`, `dotenv/config` y `env("DATABASE_URL")`; configurar el datasource del schema como `postgresql`; crear `PrismaClient` con `PrismaPg` de `@prisma/adapter-pg@7.8.0`. Instalar `pg@8.22.0` como driver, alineando `prisma`, `@prisma/client` y el adaptador en 7.8.0.
- **Razón**: el repositorio ya está en Prisma 7.8.0 y usa Prisma Config. Prisma ORM 7 exige driver adapter al construir Prisma Client. La guía oficial instala el adaptador de la serie 7 y su documentación PostgreSQL lo vincula al driver `pg`. Prisma no publica un pin de patch obligatorio para `pg`; 8.22.0 es el pin de proyecto establecido por la spec, no un requisito oficial de versión.
- **Alternativas consideradas**: mantener libSQL incumple la migración; `db push` no deja historial reproducible; usar adapter-pg de otra versión mayor mezcla generaciones incompatibles.
- **Consecuencia**: `index.js` y `inicializar-base.js` dejan de aceptar rutas `file:`. La variable Prisma continúa siendo `DATABASE_URL`, ahora validada por prefijo literal `postgresql://`.
- **Fuentes primarias**: [Prisma Config v7](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference), [PostgreSQL con Prisma v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql), [guía de actualización v7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [conexión por URL](https://www.prisma.io/docs/orm/v7/reference/connection-urls).

## Esquema e historial de migraciones

- **Decisión**: cambiar el provider Prisma a PostgreSQL, generar SQL inicial revisable a partir del modelo actual y aplicar instalaciones/actualizaciones con `prisma migrate deploy`. Conservar el directorio de migraciones como historial versionado.
- **Razón**: `migrate deploy` aplica migraciones pendientes sin resetear ni crear una base de datos; el servicio PostgreSQL debe existir antes. La migración inicial debe comprobarse contra todas las entidades y enums. Después de aplicar el schema, un flujo de datos separado importa el origen SQLite real y copia sus documentos; ambos orígenes se mantienen intactos.
- **Alternativas consideradas**: `db push` no registra migraciones; `migrate reset` destruye datos y no es apropiado para inicialización operativa; mezclar creación de schema e importación en un flujo opaco dificulta reconciliar conteos.
- **Consecuencia**: el inicializador valida URL y destino, luego invoca el historial de migraciones; no ejecuta `PRAGMA` ni `node:sqlite` sobre el destino. `db:migrar-datos` es un comando independiente del inicializador y de Jest.
- **Fuentes primarias**: [Prisma Migrate v7](https://www.prisma.io/docs/orm/v7/prisma-migrate/getting-started), [`migrate deploy` v7](https://www.prisma.io/docs/cli/v7/migrate/deploy), [despliegue de migraciones](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/deploy-migrations-from-a-local-environment).

## Migraci?n de datos y archivos

- **Origen**: `server/.runtime-local/.sigep-local/grados.sqlite`; respaldo previo: `server/.runtime-local/.sigep-local/grados.respaldo.sqlite`. El script recibe la fuente seleccionada con `--origen <ruta>` y los adjuntos con `--origen-archivos <directorio>`.
- **Orden de carga**: `usuarios`, `programas`, `estudiantes`, `plantillas_requisito`, `solicitudes`, `validaciones_requisito`, `documentos_solicitud`, `revisiones`, `historial_estados`, `auditoria`. Respeta dependencias de claves for?neas.
- **Conteos esperados**: usuarios 7; programas 6; estudiantes 6; plantillas_requisito 6; solicitudes 12; validaciones_requisito 11; documentos_solicitud 17; revisiones 34; historial_estados 56; auditoria 68. El informe compara esperado con origen e insertado y enumera tablas/filas discrepantes.
- **Conversiones**: `activo` y `obligatorio` pasan de 0/1 a boolean; texto ISO 8601 con zona se convierte a timestamp, normalizando a UTC si el tipo destino no conserva zona.
- **IDs y secuencias**: inserta cada ID de origen expl?citamente y usa `setval` para sincronizar la secuencia correspondiente al mayor ID importado y dejar segura la siguiente inserci?n.
- **Adjuntos**: se verifican los 17 nombres de `server/.runtime-local/.sigep-local/documentos`. Se copian, no se mueven, a la carpeta de subidas configurada (por defecto `server/uploads/documentos`); `rutaArchivo` contiene solo el nombre. Si falta un archivo, se incluye su nombre en el informe sin descartar filas/documentos ni borrar originales.
- **Alternativa considerada**: reconstruir solo el schema PostgreSQL contradice el conjunto de datos real confirmado y pierde continuidad de expedientes; por eso se conserva schema-migrate e importaci?n como pasos distinguibles y verificables.

## PostgreSQL por archivo Jest

- **Decisión**: un helper común obtiene `SIGEP_TEST_DATABASE_URL`, compara con `DATABASE_URL` institucional antes de conectarse, genera un nombre `test_<hex aleatorio>`, crea ese schema, fija el parámetro `schema` en la URL usada por Prisma, aplica las migraciones con `migrate deploy`, y elimina con `DROP SCHEMA ... CASCADE` solo el schema creado. Debe cerrar el cliente Prisma y el pool antes del drop, también al fallar la preparación.
- **Razón**: los archivos Jest pueden ejecutarse en paralelo contra un servicio/base compartido y cada uno necesita aislamiento. Prisma documenta la selección de schema mediante URL y el despliegue de migraciones. PostgreSQL permite borrar el schema y su contenido de forma atómica a nivel de namespace.
- **Alternativas consideradas**: base de datos independiente por suite requiere provisioning/cleanup más pesado; compartir `public` mezcla fixtures y vuelve insegura la limpieza; usar `migrate reset` borraría datos de todo el test database.
- **Controles**: la comparación literal solicitada ocurre antes de cualquier conexión; solo se interpolan identificadores generados en hexadecimal por el helper; el usuario PostgreSQL de pruebas necesita permisos para crear/eliminar schemas y objetos; el helper solo borra el schema que creó. Un schema compartido no debe albergar objetos con dependencias externas a él.
- **Fuentes primarias**: [URL PostgreSQL y schema Prisma](https://www.prisma.io/docs/orm/v7/reference/connection-urls), [PostgreSQL schema URL/adapter](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql), [Jest setup/teardown](https://jestjs.io/docs/setup-teardown), [PostgreSQL DROP SCHEMA](https://www.postgresql.org/docs/18/sql-dropschema.html).

## Driver, servidor y volumen

- **Decisión**: fijar `pg@8.22.0` de la serie mayor 8 y mantener Node.js 24. Prisma documenta `pg` como driver requerido, pero no establece un rango/pin de patch. La compatibilidad exacta queda cubierta por `server/package-lock.json` y la ejecución integral de las ocho suites en el mismo entorno de PostgreSQL.
- **Razón**: el paquete actual tiene Node.js 24.16.0 y Prisma 7.8.0. Un reporte de PostgreSQL 19 existe en la tabla de versiones vigente, pero Prisma ORM 7 lista PostgreSQL hasta 18; se fija PostgreSQL 18.7 por compatibilidad documentada y soporte activo.
- **Alternativas consideradas**: PostgreSQL 19 es más reciente pero no aparece como soportado en la matriz Prisma v7 consultada; 17 también está soportado, pero tiene una ventana de soporte menor. El driver pg 9 no se selecciona porque la integración debe permanecer en la serie pg 8 elegida.
- **Medición**: la siembra de 20.000 cuentas se corre como script autónomo, no como prueba Jest; comprueba cantidad e integridad CRUD. No implica sesiones simultáneas ni SLA.
- **Fuentes primarias**: [versiones soportadas por Prisma v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/supported-databases), [política de versiones de PostgreSQL](https://www.postgresql.org/support/versioning/), [Prisma PostgreSQL v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql).

## Docker local y GitHub Actions

- **Decisión**: usar la misma imagen `postgres:18.7` localmente y en CI. En local, un archivo Compose publica el puerto para Jest ejecutado en Windows; en GitHub Actions, un servicio PostgreSQL se inicia por job en runner Ubuntu, se comprueba con `pg_isready` y la tarea de pruebas recibe `SIGEP_TEST_DATABASE_URL`.
- **Razón**: GitHub-hosted service containers requieren runner Linux; el servicio tiene ciclo de vida por job y desaparece al finalizar. Igualar la versión mayor/patch local y CI reduce divergencia.
- **Alternativas consideradas**: ejecutar tests dentro de Compose permitiría conectar por nombre de servicio, pero el repo no tiene contenedor de aplicación existente; se usa el host y puerto publicado para minimizar infraestructura nueva.
- **Fuentes primarias**: [servicio PostgreSQL en GitHub Actions](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers), [red de service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers), [orden de arranque de Compose](https://docs.docker.com/compose/how-tos/startup-order).

## Diferencias del proveedor que se registran como hallazgos

- PostgreSQL usa comparación sensible a mayúsculas por defecto; los filtros Prisma compatibles pueden pedir `mode: "insensitive"`, pero esta feature no altera la búsqueda de negocio. Se documentan las diferencias realmente observadas en las suites.
- SQLite almacena enums como texto y Prisma valida los valores; PostgreSQL crea tipos enum nativos y restringe los valores en el motor. La migración conserva los miembros y estados vigentes.
- Los resultados finales de búsqueda y conversión enum dependen del modelo y datos de fixtures actuales. Las pruebas deben registrar la conducta observada y conservar todas las aserciones, ajustando solo las expectativas cuya diferencia de proveedor esté comprobada.

## Verificación del origen de datos local

- `server/.gitignore` ignora `.runtime-local/`, pero el archivo de origen real confirmado para esta feature es `server/.runtime-local/.sigep-local/grados.sqlite`; su respaldo es `grados.respaldo.sqlite` en esa carpeta. Los archivos están ignorados por ser locales, pero sus filas y los 17 adjuntos sí se migran por instrucción funcional.
- El respaldo previo es obligatorio antes de ejecutar la carga. Esto no autoriza borrar tablas o datos preexistentes en PostgreSQL; la inicialización rechaza destinos incompatibles y `migrate deploy` aplica solo migraciones pendientes.
