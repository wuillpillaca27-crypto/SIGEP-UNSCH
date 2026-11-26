# Conexión y operación de PostgreSQL

## Estado y alcance

El servidor usa PostgreSQL mediante Prisma 7 y el adaptador `@prisma/adapter-pg` (`PrismaPg`). La migración versionada define el esquema; el inicializador aplica solo migraciones pendientes con `prisma migrate deploy`. La creación del esquema y la transferencia de datos desde SQLite son operaciones distintas. `npm start` no inicializa, borra ni importa datos.

## Configuración de conexión

- `DATABASE_URL` es obligatoria para Prisma CLI, inicialización y runtime; debe usar el esquema `postgresql://`.
- El valor se define en `server/.env` para desarrollo local o en el gestor de secretos del entorno desplegado. No se copia a documentación versionada, logs, argumentos visibles ni archivos de configuración compartidos.
- El arranque rechaza URL ausente o no PostgreSQL y no hace fallback a SQLite/libSQL.
- La base y rol que se usen para desarrollo, integración y operación institucional deben estar separados. La API no requiere privilegios de creación de base/esquema durante el uso normal.

## Migraciones y creación del esquema

1. Revisar la URL objetivo y confirmar el nombre de la base en el entorno local o de despliegue, sin publicar credenciales.
2. Ejecutar `npm run db:generate` cuando cambie el schema Prisma o se prepare una instalación limpia.
3. Ejecutar `npm run db:init` para aplicar migraciones versionadas pendientes.
4. Si la base contiene tablas sin historial Prisma, detenerse y revisar el estado; no usar `db push`, `migrate reset`, ni borrado manual para “hacer que coincida”. Resolver el baseline con una decisión explícita y respaldo verificado.
5. Ejecutar Jest contra la URL exclusiva de pruebas `SIGEP_TEST_DATABASE_URL`; el helper usa schemas temporales aislados y nunca debe igualar `DATABASE_URL`.

## Transferencia desde SQLite

La base SQLite y su carpeta de documentos son el origen de datos de Spec 011; el inicializador PostgreSQL no las lee. Antes de la transferencia:

1. Identificar el archivo SQLite origen y detener escrituras; crear y verificar una copia de la base y copia completa de adjuntos.
2. Confirmar los conteos esperados por tabla y los documentos de origen: usuarios 7, programas 6, estudiantes 6, plantillas 6, solicitudes 12, validaciones 11, documentos 17, revisiones 34, historial 56 y auditoría 68.
3. Preparar un destino PostgreSQL exclusivo de desarrollo, desplegar el esquema y ejecutar `db:migrar-datos -- --origen <ruta> --origen-archivos <directorio> --dry-run`.
4. Revisar discrepancias, conversiones boolean/fecha y hashes antes de la carga real. Detenerse si hay errores; conservar la fuente intacta.
5. Ejecutar la transferencia aprobada, reconciliar conteos/hashes, IDs y secuencias, y comprobar los nombres y rutas internas de los adjuntos.
6. Realizar pruebas funcionales y de autenticación sobre la base destino antes de acordar el corte. La migración no cambia reglas de API para ocultar diferencias entre proveedores.

Los conteos de esta guía son valores de referencia de Spec 011; la base exacta se debe consultar y reconciliar en cada migración. Los adjuntos se copian, no se mueven, y la tabla no contiene una URL pública de archivo.

## Recuperación y rollback

Mantener el origen y sus respaldos hasta aceptar reconciliación, autenticación y pruebas. Ante discrepancias o fallo de servicio, detener el corte, conservar ambos destinos para análisis y volver al servicio anterior conforme al procedimiento operativo aprobado. No borrar ni sobrescribir el SQLite como parte del rollback. La URL de conexión no debe cambiarse al origen SQLite mientras el runtime sea PostgreSQL-only; la recuperación requiere restaurar una versión de aplicación compatible con el origen y seguir un procedimiento probado.

## Límites y referencias

Esta guía no declara que los datos ya se hayan importado ni que una base institucional esté aprovisionada. Fuentes: `specs/011-migrar-postgresql/{spec,plan,research,data-model,quickstart}.md`, `specs/011-migrar-postgresql/contracts/operaciones-base-datos.md`, `server/prisma/schema.prisma`, `server/prisma.config.ts`, `server/src/index.js` y `server/scripts/inicializar-base.js`.
