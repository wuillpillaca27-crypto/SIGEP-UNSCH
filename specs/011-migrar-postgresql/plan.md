# Plan de implementación: Migrar base de datos a PostgreSQL

**Rama**: `011-migrar-postgresql` | **Fecha**: 2026-11-22 | **Spec**: [spec.md](spec.md)

## Resumen

Cambiar la persistencia del servidor de SQLite/libSQL a PostgreSQL 18.7, alineando `@prisma/adapter-pg` con Prisma 7.8.0 y usando `pg` 8.22.0. Generar una migración inicial versionada y un inicializador basado en `prisma migrate deploy`; importar el SQLite local con `db:migrar-datos` desde su ruta explícita y copiar los documentos vinculados. Adaptar las ocho suites Jest a schemas aleatorios creados y eliminados por un helper compartido, y añadir una siembra de carga independiente de Jest para 20.000 cuentas. Mantener intactas las rutas y reglas de negocio y `client/`; actualizar documentación arquitectónica y constitución a v1.3.0.

## Contexto técnico

**Lenguaje/versión**: JavaScript CommonJS en Node.js 24.16.0 local; Prisma 7.8.0. Prisma 7 requiere Node.js 20.19+, 22.12+ o 24.0+; CI y Docker usarán Node.js 24.

**Dependencias principales**: Express 5.3, `@prisma/client` 7.8.0, `prisma` 7.8.0, `@prisma/adapter-pg` 7.8.0, `pg` 8.22.0, Jest 30.5.2. Se elimina `@prisma/adapter-libsql` al completar la migración.

**Almacenamiento**: PostgreSQL 18.7 para Docker local y GitHub Actions, fijando la misma versión en ambos entornos. Prisma declara `provider = "postgresql"`; `DATABASE_URL` se obtiene en Prisma 7 desde `prisma.config.ts`.

**Pruebas**: Ocho archivos Jest existentes en `server/src/*.test.js`, conservando todas las aserciones. PostgreSQL de prueba se selecciona con `SIGEP_TEST_DATABASE_URL`; helper compartido usa schema aleatorio por archivo, ejecuta las migraciones versionadas y elimina solo su schema. Script de carga de 20.000 cuentas separado de Jest.

**Plataforma objetivo**: Servidor Node.js; desarrollo en Windows/Docker y CI en runner Ubuntu de GitHub Actions con servicio PostgreSQL y health check `pg_isready`.

**Tipo de proyecto**: API web Express con persistencia Prisma y suites de integración Jest.

**Objetivo de rendimiento**: La base debe admitir una población total de al menos 20.000 cuentas y permitir CRUD actual. No se define concurrencia ni SLA de latencia.

**Restricciones**: `DATABASE_URL` debe iniciar con `postgresql://`; sin fallback SQLite. No modificar `client/`, rutas o lógica de negocio. Migrar el SQLite real `server/.runtime-local/.sigep-local/grados.sqlite`, conservando su copia previa `grados.respaldo.sqlite` en la misma carpeta; el usuario pasa la ruta por `--origen`. Las migraciones no borran tablas/datos existentes. No usar `db push` ni `migrate reset`. Rechazar URL de prueba ausente o igual a la institucional antes de cualquier conexión/DDL. No exponer secretos. Dejar cerradas las conexiones Prisma antes de `DROP SCHEMA ... CASCADE`.

**Escala/alcance**: 10 modelos (`Usuario`, `Programa`, `Estudiante`, `PlantillaRequisito`, `Solicitud`, `ValidacionRequisito`, `DocumentoSolicitud`, `Revision`, `HistorialEstado`, `Auditoria`), 8 enums, 223 filas esperadas y 17 archivos; ocho suites Jest, esquema/inicialización, transferencia de datos/archivos, siembra de carga y documentación docs/01 a docs/04 y constitución.

## Revisión de constitución

| Principio | Estado | Aplicación en el diseño |
|---|---|---|
| Especificaciones primero | Cumple | La implementación queda gobernada por esta spec, plan, tareas y verificación. |
| Contratos y titularidad | Cumple | No cambian contratos HTTP, titularidad, permisos ni reglas de dominio. |
| Datos y diseño institucional | Cumple | No se introduce información de demostración en producción; la carga de 20.000 cuentas es una comprobación separada. |
| Evidencia | Cumple | Cada tarea se vinculará a migración aplicada, suites, carga o revisión documental. |
| Cambios mínimos | Cumple | Se limita a persistencia, migraciones, scripts, fixtures y documentos autorizados. |
| Stack y dependencias | Enmienda prevista | Se reemplaza libSQL por PostgreSQL y se añaden adaptador/driver requeridos, justificados en esta feature y en la constitución v1.3.0. |
| Seguridad | Cumple | URLs por entorno, validación previa del destino de pruebas y secretos fuera de logs/repositorio. |
| Base de datos | Enmienda prevista | La migración institucional preserva datos preexistentes; la base SQLite verificada es desechable de desarrollo y no se importa. La constitución v1.3.0 explicitará esta distinción. |
| Verificación y pruebas | Cumple | Las ocho suites Jest y la cobertura se ejecutan en el servidor con PostgreSQL. |
| Arquitectura documentada e idioma | Cumple | Se actualizan docs/01–04 y se redactan artefactos en español. |

**Puerta previa**: APROBADA. La migración de datos cumple el principio vigente de preservar datos; la copia del origen y los conteos esperados permiten revisar la integridad antes del corte.

**Puerta posterior al diseño**: APROBADA. No hay cambios de contratos ni lógica de negocio; la única excepción al stack vigente es el cambio solicitado de motor de persistencia. La configuración de pruebas queda aislada por schema y variable dedicada.

## Decisiones de arquitectura

1. Mantener el formato de `prisma.config.ts` existente y exigir `DATABASE_URL`; el proceso de inicialización usa `prisma migrate deploy` sobre el historial de migraciones versionadas.
2. Crear SQL PostgreSQL inicial a partir del schema actual migrado a `postgresql`, inspeccionando el diff para preservar nombres físicos, relaciones, índices y enums. La creación del schema es independiente del traslado de los datos locales, que se realiza con `db:migrar-datos`.
3. Mantener un contenedor PostgreSQL 18.7 para desarrollo y CI, con `pg_isready`. CI usa servicio PostgreSQL por job; Docker local publica un puerto para Jest en el host.
4. `db:migrar-datos` exige `--origen` y `--origen-archivos`, carga las diez tablas en orden de dependencias, conserva los IDs y llama `setval` para sincronizar secuencias. Convierte 0/1 a boolean y fechas ISO 8601 con zona a timestamp, normalizando a UTC cuando la columna destino no mantiene zona. Verifica conteos por tabla y emite informe con discrepancias. Admite `--dry-run` para leer el origen, validar conversiones y conteos esperados y emitir el informe sin escribir en PostgreSQL ni copiar archivos. La carga normal es idempotente: repetirla con el mismo origen no duplica datos.
5. Para documentos, verifica los 17 nombres, copia desde `server/.runtime-local/.sigep-local/documentos` al directorio de subidas configurado (por defecto `server/uploads/documentos`), deja en `rutaArchivo` solo el nombre y conserva los originales; lista en el informe los faltantes.
6. El helper de pruebas genera nombres de schema con prefijo `test_` más bytes hex aleatorios, crea el schema con la conexión base y aplica `migrate deploy` con una URL derivada que fija `schema=<nombre>`. Cierra los clientes/pools y elimina solo el schema que creó en `finally`.
7. Rechazar `SIGEP_TEST_DATABASE_URL` ausente o literalmente igual a `DATABASE_URL` antes de conectar. El schema SQL procede solo del generador interno hexadecimal, nunca de una entrada arbitraria.
8. Mantener la API REST tal como está. El contrato nuevo de esta feature es operacional: variables de entorno, inicializador, helper de prueba y siembra de carga.

## Estructura del proyecto

### Documentación de esta funcionalidad

```text
specs/011-migrar-postgresql/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── operaciones-base-datos.md
└── tasks.md                 # Fase posterior: speckit-tasks
```

### Código existente y puntos previstos de cambio

```text
server/
├── prisma/
│   ├── schema.prisma                  # provider PostgreSQL
│   └── migrations/                    # SQL inicial y posteriores
├── prisma.config.ts                   # DATABASE_URL de Prisma 7
├── scripts/
│   ├── inicializar-base.js            # migrate deploy
│   └── sembrar-carga.js               # 20.000 cuentas (nuevo)
├── test-support/
│   └── postgres-schema.js             # helper Jest compartido (nuevo)
├── src/*.test.js                      # ocho suites con fixtures PG
├── src/index.js                       # adapter PostgreSQL
├── docker-compose.test.yml            # PostgreSQL local (nuevo)
└── package.json                       # scripts y dependencias

.github/workflows/                    # workflow CI PostgreSQL (nuevo)
docs/01-analisis-de-sistema/
docs/02-arquitectura-software/
docs/03-diseno-detallado/              # nueva capa documental
docs/04-modelo-c4/
.specify/memory/constitution.md        # versión 1.3.0
```

**Decisión de estructura**: No se crea una nueva capa de aplicación. El helper pertenece a `server/test-support/` porque lo consumen varias suites; scripts de operación y carga permanecen en `server/scripts/`. La API productiva sigue en `server/src/` y no se modifican módulos de dominio.

## Seguimiento de complejidad

No hay violaciones sin justificar. La dependencia `pg` y el adaptador Prisma son requisitos directos del proveedor elegido. La copia previa y el informe de reconciliación aportan evidencia de preservación de los datos importados; no se elimina el SQLite original ni su respaldo.
