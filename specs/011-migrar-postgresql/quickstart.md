# Guía rápida de validación PostgreSQL

Esta guía comprueba el esquema y el servidor localmente, todas las suites de integración, el rechazo de una configuración insegura y la siembra de carga. No contiene secretos reales.

## Requisitos

- Node.js 24 y npm, Docker Desktop con Docker Compose.
- Puerto PostgreSQL local elegido disponible.
- Para el runtime, una base PostgreSQL de desarrollo separada. Para Jest, una base exclusiva desechable. No reutilizar datos institucionales.
- Consultar [contratos operacionales](contracts/operaciones-base-datos.md) y [modelo de datos](data-model.md).

## PostgreSQL local para Jest

Desde la raíz:

```powershell
docker compose -f server/docker-compose.test.yml up -d --wait
```

Configurar la URL de test en la sesión de PowerShell, con la contraseña local definida en Compose:

```powershell
$env:SIGEP_TEST_DATABASE_URL = "postgresql://sigep_test:local_test_only@localhost:5432/sigep_test"
```

La variable `DATABASE_URL` institucional no debe ser igual a esta URL. Ejecutar todas las suites:

```powershell
Set-Location server
npm test
```

**Esperado**: las ocho suites y todas sus aserciones pasan en PostgreSQL; cada contexto usa su propio schema aleatorio y lo elimina al finalizar. El reporte de cobertura sigue generándose con Jest.

## Crear/revisar una base PostgreSQL de desarrollo

Apuntar `DATABASE_URL` a una base nueva y vacía de desarrollo. La variable es un secreto local y no se agrega al repositorio.

```powershell
$env:DATABASE_URL = "postgresql://sigep_dev:local_dev_only@localhost:5432/sigep_dev"
npm run db:init
npm run db:generate
npm start
```

**Esperado**: las migraciones pendientes se aplican y la API inicia. Una URL ausente o que no comience por `postgresql://` produce error antes de abrir el servidor. La segunda aplicación de `db:init` no recrea ni duplica objetos. No se prueba contra una base con datos preexistentes no descartables.

## Rechazo de URL de pruebas no segura

En un proceso de prueba nuevo, asignar valores iguales a `DATABASE_URL` y `SIGEP_TEST_DATABASE_URL`, luego ejecutar una suite:

```powershell
$env:DATABASE_URL = "postgresql://sigep:secret@db.example:5432/sigep"
$env:SIGEP_TEST_DATABASE_URL = $env:DATABASE_URL
npx jest src/catalogo-grados.test.js --runInBand
```

**Esperado**: el helper aborta antes de conectar, crear schemas, migrar o limpiar. El mensaje no imprime URL ni credenciales.

## Siembra independiente de Jest

Usar una base vacía no institucional destinada a carga, con `DATABASE_URL` apuntando a ella:

```powershell
$env:DATABASE_URL = "postgresql://sigep_load:local_load_only@localhost:5432/sigep_load"
npm run db:init
npm run db:seed:load -- --count 20000
```

**Esperado**: el script informa creación de 20.000 cuentas, conteo final y verificación CRUD sin relaciones inválidas ni datos duplicados. El proceso no corre dentro de Jest ni expresa un objetivo de concurrencia.

## CI

En el job Linux de GitHub Actions, el servicio PostgreSQL debe alcanzar el health check `pg_isready`; el paso de tests recibe `SIGEP_TEST_DATABASE_URL` y ejecuta `cd server && npm test`. **Esperado**: mismas suites/aserciones y reporte de cobertura que en Docker local. GitHub elimina el servicio al terminar el job.

## Limpieza local

```powershell
docker compose -f server/docker-compose.test.yml down
```

La limpieza termina el servicio de pruebas. No ejecutar comandos de limpieza contra la instancia institucional.
