# Contratos operacionales de base de datos

La API REST, las rutas y los contratos JSON no cambian. Este documento fija la interfaz de configuración y los comandos de persistencia y verificación que sí introduce esta feature.

## Variables de entorno

| Variable | Consumidor | Requisito |
|---|---|---|
| `DATABASE_URL` | Servidor, Prisma CLI e inicializador | Obligatoria; debe comenzar literalmente con `postgresql://`. Contiene credenciales solo en entorno/secret store y nunca se imprime. En despliegue apunta a la base institucional aprobada. |
| `SIGEP_TEST_DATABASE_URL` | Helper Jest | Obligatoria en las ocho suites. Apunta a la instancia y base desechables de pruebas. Se valida antes de abrir conexión/crear schema; debe diferir de `DATABASE_URL`. |

La URL de prueba puede incluir `schema=...` para Prisma una vez que el helper haya generado el schema aislado. La URL base recibida identifica exclusivamente el servicio de pruebas. El nombre de schema se genera internamente como `test_` + hexadecimal aleatorio y nunca se toma de entrada de usuario.

## Inicialización

- **Entrada**: `DATABASE_URL` válido, servicio PostgreSQL accesible y directorio versionado `server/prisma/migrations/`.
- **Operación**: generar cliente Prisma cuando corresponda y aplicar migraciones pendientes con `prisma migrate deploy`.
- **Éxito**: el historial de migraciones queda actualizado y el esquema puede atender el servidor.
- **Fallo**: URL ausente/no PostgreSQL, host inaccesible o migración incompatible producen salida no cero con mensaje sin secretos. No hay fallback SQLite, `db push`, reset ni borrado preventivo.
- El inicializador no importa `server/.runtime-local/` ni traslada los datos de desarrollo.

## Preparación y cierre de suites Jest

1. En `beforeAll`, validar `SIGEP_TEST_DATABASE_URL` y rechazarla si falta o coincide literalmente con `DATABASE_URL`.
2. Crear una conexión administrativa al test database y crear un schema con nombre aleatorio generado por el helper.
3. Crear/usar una URL que seleccione ese schema; ejecutar el historial de migraciones y sembrar los fixtures requeridos por el archivo.
4. Ejecutar las aserciones existentes sin debilitarlas.
5. En `afterAll`/`finally`, cerrar el PrismaClient y conexiones auxiliares; luego ejecutar `DROP SCHEMA <schema-generado> CASCADE` únicamente para el schema creado por ese contexto.

La URL institucional nunca se usa para preparar fixtures ni limpieza. No se permite `migrate reset`, borrar la base completa o compartir el schema `public` entre suites.

## Comprobación de 20.000 cuentas

La siembra de carga es un comando independiente de Jest que recibe una base PostgreSQL no institucional explícita, permite indicar 20.000 cuentas, crea identificadores sintéticos únicos, verifica el conteo y ejecuta lecturas/escrituras CRUD de control. Se reporta éxito/fallo y cantidades sin credenciales. No simula concurrencia de solicitudes.

## Infraestructura de pruebas

- Local: servicio PostgreSQL 18.7 en Docker Compose, health check `pg_isready` y puerto publicado para Jest ejecutado desde `server/`.
- GitHub Actions: job en Ubuntu con servicio PostgreSQL 18.7, health check y `SIGEP_TEST_DATABASE_URL` disponible en el paso Jest.
- Los fixtures usan únicamente schemas efímeros; el servicio/contenedor de pruebas no contiene ni necesita datos institucionales.
