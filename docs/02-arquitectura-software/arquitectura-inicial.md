# Arquitectura inicial de SIGEP-UNSCH

## Resumen

La arquitectura implementada hoy es una aplicación web con un cliente Next.js y una API Express. El servidor se ejecuta como un proceso monolítico que conecta módulos registradores, Prisma y PostgreSQL mediante el adaptador PrismaPg. El documento presenta la estructura observada en el repositorio; no presupone el despliegue productivo.

## Implementado hoy

### Cliente web

`client/package.json` identifica Next.js 16, React 19 y TypeScript. El código de rutas de interfaz está bajo `client/app/`, con páginas como `page.tsx`, `login/`, `mis-tramites/`, `admin/` y `verificar-documento/`. También existen grupos `components/`, `hooks/`, `services/`, `lib/` y `types/`. Esta organización acredita módulos de presentación y utilidades del cliente, pero no demuestra por sí misma dónde se ejecuta cada pantalla en producción.

### API y persistencia

`server/src/index.js` configura una instancia Express, CORS, control de origen para solicitudes de escritura, parser JSON con límite y manejo de errores. Importa y registra módulos funcionales que se encuentran directamente en `server/src/`. Los módulos registran rutas HTTP y, según el caso, validan permisos y consultan Prisma dentro del mismo archivo. La autenticación local produce el middleware utilizado en rutas protegidas.

El esquema `server/prisma/schema.prisma` configura `provider = "postgresql"`. Prisma 7 obtiene `DATABASE_URL` desde `server/prisma.config.ts`; el arranque rechaza URL ausente o distinta del prefijo `postgresql://` y configura `PrismaPg` (`@prisma/adapter-pg`) con el driver `pg`. No existe fallback a SQLite/libSQL. La inicialización ejecuta `prisma migrate deploy`; importar datos desde SQLite es un paso separado y no se activa durante el arranque.

El esquema contiene usuarios y estudiantes, programas, plantillas y validaciones de requisitos, solicitudes, documentos, revisiones, historial de estados y auditoría. Estas entidades describen el modelo; una entidad aislada no prueba que todos sus flujos estén activos.

### Organización del servidor

El servidor es un monolito Express compuesto por módulos `registrarX` desde `server/src/index.js`. Las dependencias corresponden a cada firma, no a una interfaz uniforme:

| Registro | Firma observada | Responsabilidad visible |
|---|---|---|
| Catálogo | `registrarCatalogo(app, prisma, normativa)` | Consulta catálogos por trámite y programa. |
| Identidad | `registrarIdentidad(app, prisma, secreto)` | Login/logout, perfil y registro del flujo Google. Devuelve el middleware `autenticar`. |
| Solicitudes | `registrarSolicitudes(app, prisma, autenticar, directorio)` | Rutas de solicitudes propias, carga y descarga de documentos. |
| Revisión | `registrarRevision(app, prisma, autenticar, directorio)` | Listado, reporte, documentos y acciones de revisión. |
| Administración | `registrarAdministracion(app, prisma, autenticar)` | Configuración y operaciones administrativas. |
| Verificación | `registrarVerificacion(app, prisma, opciones)` | Consulta pública de documentos emitidos. |

`registrarGoogle` se invoca desde `registrarIdentidad` con un objeto de dependencias (`server/src/identidad-google.js`). Los módulos funcionales se mantienen directamente bajo `server/src/`; las carpetas `server/src/lib/`, `server/src/middleware/` y `server/src/routes/` están vacías en el estado inspeccionado.

### Flujo de una solicitud

1. El proceso configura Express, middleware transversal, Prisma y carga de configuración local.
2. `index.js` registra las rutas de los módulos de dominio en la aplicación.
3. Las rutas públicas de catálogo/verificación responden sin sesión según su código; las rutas protegidas ejecutan `autenticar` y verifican rol, titularidad o etapa según la operación.
4. Las operaciones acceden al modelo Prisma directamente desde los módulos que las atienden.
5. Los endpoints serializan respuestas JSON o sirven documentos autorizados; la consulta QR pública devuelve una proyección limitada.

## Objetivo Sprint 2

Separar dominio, aplicación, infraestructura y transporte en capas; incorporar caché o publicar un contrato Swagger/OpenAPI son objetivos/propuestas que deben evaluarse aparte. No forman parte del proceso actual descrito arriba. Antes de implementarlos, la constitución exige actualizar la documentación arquitectónica correspondiente.

## Trazabilidad y fuentes

- Requisitos funcionales: `docs/01-analisis-de-sistema/03-requisitos-funcionales.md` (RF-DOC-001 a RF-DOC-006 y endpoints fuente).
- Historias: `docs/01-analisis-de-sistema/02-historias-del-usuario.md`.
- Cliente: `client/package.json`, `client/app/`.
- Servidor y composición: `server/src/index.js` y módulos indicados en la tabla.
- Persistencia: `server/prisma/schema.prisma`, `server/package.json`.
- Especificaciones fuente: `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`; antecedentes en `docs/legacy/openspec/`.
