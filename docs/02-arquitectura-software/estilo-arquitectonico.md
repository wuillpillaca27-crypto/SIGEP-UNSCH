# Estilo arquitectónico

## Resumen

El sistema no usa un único estilo homogéneo en todas sus partes. El cliente tiene una organización de aplicación web por rutas y áreas; el servidor se observa como monolito Express con módulos funcionales registradores. Este documento describe esos estilos sin atribuir aislamiento de capas que el código no muestra.

## Implementado hoy

### Cliente: aplicación web organizada por rutas

El `app/` del cliente contiene páginas y layouts de Next.js, entre ellas portada, acceso, trámites, administración y verificación pública. Las carpetas `components/`, `hooks/`, `services/`, `lib/` y `types/` reúnen elementos reutilizables por responsabilidad. Stack: Next.js 16, React 19, TypeScript y Tailwind CSS 4 (`client/package.json`). La existencia de estas convenciones no acredita que toda página cumpla los mismos patrones de composición.

### Servidor: monolito modular basado en Express

Un proceso crea `app` y Prisma y monta módulos funcionales desde `server/src/index.js`. Algunos módulos declaran rutas directamente en `app`; otros montan un `express.Router()` con prefijos como `/api/solicitudes`, `/api/revision-grados` y `/api/administracion`. Las reglas de acceso, el manejo del flujo y las llamadas Prisma conviven en esos módulos. Es razonable llamarlo monolito modular por su proceso único y módulos por responsabilidad, pero no arquitectura en capas.

### Persistencia: acceso mediante Prisma

Los módulos importan/reciben la instancia Prisma y ejecutan operaciones de modelos directamente. El esquema declara SQLite, y el runtime configura `PrismaLibSql` con una URL local `file:`. La nota de comentario del esquema que menciona PostgreSQL no coincide con la configuración activa.

### Integraciones y protocolos

La interfaz de servidor es HTTP/JSON en las rutas API, con carga de PDF en una ruta que configura parser binario. La autenticación usa JWT en cookie HttpOnly y hay integración Google OAuth opcional según configuración. El código observado no establece un contrato Swagger/OpenAPI vigente.

## Objetivo Sprint 2

La propuesta de capas, caché y contrato Swagger/OpenAPI queda fuera del estilo actualmente implementado. Si se acepta, debe representarse como arquitectura futura y no mezclarse en el diagrama o descripción del estado actual. La arquitectura futura deberá decidir cómo conservar las rutas, permisos, transacciones, almacenamiento y compatibilidad de datos existentes.

## Trazabilidad y fuentes

- Cliente: `client/package.json`, `client/app/`.
- Servidor: `server/src/index.js` y módulos de `server/src/`.
- Esquema y adaptador: `server/prisma/schema.prisma`, `server/package.json`.
- Historias y criterios: `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`; `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`.
