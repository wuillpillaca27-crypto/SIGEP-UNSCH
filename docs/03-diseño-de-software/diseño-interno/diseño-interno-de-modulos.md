# Diseño interno de módulos

## Resumen

El cliente organiza páginas y responsabilidades compartidas bajo `client/app/`. El servidor usa módulos funcionales CommonJS que registran rutas y realizan lógica de aplicación y acceso Prisma. Esta descripción refleja archivos observados; no representa una arquitectura por capas.

## Implementado hoy

### Cliente

| Módulo/ubicación | Responsabilidad observada | Origen funcional / fuente |
|---|---|---|
| `client/app/` y `page.tsx` | Rutas de aplicación y portada. | `specs/005-redisenar-secciones-inferiores-home/spec.md`, FR-001–FR-005; fuente `client/app/page.tsx`. |
| `client/app/login/` | Pantalla de acceso local/institucional. | `specs/004-login-institucional/spec.md`, FR-001–FR-005; fuente `client/app/login/page.tsx`. |
| `client/app/mis-tramites/` | Páginas de trámites personales, solicitudes, historial y subsanación. | `specs/001-mis-tramites/spec.md`, necesidades 1–5; fuentes bajo `client/app/mis-tramites/`. |
| `client/app/admin/` | Vistas de administración y gestión. | `specs/003-acceso-y-panel/spec.md`, FR-002–FR-004; fuentes bajo `client/app/admin/`. |
| `client/app/verificar-documento/` | Vista de consulta pública de documentos. | `specs/002-verificar-documento/spec.md`, FR-001–FR-005; fuente `client/app/verificar-documento/page.tsx`. |
| `client/app/components/` | Componentes de interfaz compartidos, incluyendo `components/ui/`. | Evidencia: fuentes bajo `client/app/components/`; necesidades de interfaz en `specs/001`–`006`. |
| `client/app/hooks/` | Hooks reutilizables de estado y consulta. | Evidencia: archivos bajo `client/app/hooks/`; interacción de Mis Trámites en `specs/001-mis-tramites/spec.md`. |
| `client/app/services/` y `client/app/lib/` | Servicios de dominio y utilidades de comunicación/dominio según los archivos presentes. | Evidencia: fuentes bajo esas carpetas; necesidades de acceso en `specs/001`–`004`. |

La tabla asocia cada responsabilidad con una especificación o, cuando la especificación no identifica ese módulo por separado, con la fuente que acredita su existencia. No implica que todos los criterios visuales de cada spec estén implementados.

### Servidor

El punto de composición es `server/src/index.js`. Importa los módulos siguientes y entrega a cada función sus dependencias reales. Rutas, reglas y acceso a Prisma se mantienen juntos según el dominio.

| Archivo/módulo | Organización y función comprobable | Origen funcional / fuente |
|---|---|---|
| `server/src/index.js` | Configura Express, Prisma/SQLite, middleware transversal, registro de módulos y manejo global de errores. | Evidencia de composición: `server/src/index.js`; contexto de login y API, `specs/003-acceso-y-panel/spec.md`, `specs/004-login-institucional/spec.md`. |
| `server/src/catalogo-grados.js` | Expone consultas de catálogo y contiene lectura/parsing de normativa. | Fuente `server/src/catalogo-grados.js`; soporte a trámites de `specs/001-mis-tramites/spec.md`. |
| `server/src/identidad.js` y `identidad-google.js` | Autenticación local, cookie de sesión, perfil y flujo OAuth Google; el primer módulo entrega `autenticar` a otros. | `specs/003-acceso-y-panel/spec.md` FR-001 y `specs/004-login-institucional/spec.md` FR-001–FR-005; ambos archivos fuente. |
| `server/src/solicitudes.js` | Rutas y operaciones de solicitudes propias, documentos y subsanación; incluye reglas de titularidad/etapa y transacciones Prisma. | `specs/001-mis-tramites/spec.md`, necesidades 1–5; archivo fuente. |
| `server/src/revision-grados.js` | Consulta/reporte de expedientes, acceso a archivos y acciones de revisión; comprueba rol. | `specs/003-acceso-y-panel/spec.md`, FR-001–FR-004; archivo fuente. |
| `server/src/administracion.js` | Configuración, consultas y operaciones de programas, estudiantes, usuarios, requisitos y auditoría; parte de las operaciones limita por rol. | `specs/003-acceso-y-panel/spec.md`, FR-003–FR-004; archivo fuente. |
| `server/src/verificacion-documentos.js` | Consulta pública acotada a documentos emitidos. | `specs/002-verificar-documento/spec.md`, FR-001–FR-004; archivo fuente. |

Las firmas de registro observadas son específicas: `registrarCatalogo(app, prisma, normativa)`, `registrarIdentidad(app, prisma, secreto)`, `registrarSolicitudes(app, prisma, autenticar, directorio)`, `registrarRevision(app, prisma, autenticar, directorio)`, `registrarAdministracion(app, prisma, autenticar)` y `registrarVerificacion(app, prisma, opciones)`. Google se monta desde identidad. No hay un contrato de función uniforme.

## Objetivo Sprint 2

La separación futura en módulos de transporte, aplicación/dominio e infraestructura es una opción de evolución, no una descripción del servidor actual. Si se decide refactorizar, deberá conservar rutas, titularidad, etapas, respuestas, transacciones y persistencia existentes, con la documentación arquitectónica actualizada antes del cambio.

## Trazabilidad y fuentes

Historias y requisitos: `specs/001-mis-tramites/spec.md` a `specs/006-banner-autoridades/spec.md`; requisitos derivados: `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`. Evidencia de cliente: archivos bajo `client/app/`. Evidencia de servidor y firmas: `server/src/index.js` y los módulos listados. Modelo: `server/prisma/schema.prisma`.
