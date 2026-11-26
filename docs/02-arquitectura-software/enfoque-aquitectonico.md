# Enfoque arquitectónico

## Resumen

El enfoque que puede describirse como vigente es una aplicación web con cliente separado del proceso API y un servidor Express organizado en módulos registradores. En el backend, la organización modular no equivale a una arquitectura por capas: rutas, reglas de flujo y operaciones Prisma aparecen juntas en varios módulos.

## Implementado hoy

### Frontera cliente–servidor

El cliente tiene aplicación Next.js/React bajo `client/app/` y el servidor crea una API Express desde `server/src/index.js`. El cliente cuenta con carpetas `services/`, `hooks/`, `lib/` y `components/`, además de páginas organizadas por área. El hecho de que existan esos directorios no demuestra que toda interacción pase por un cliente de servicios único; la estructura y llamadas concretas deben consultarse en cada archivo.

### Backend modular dentro de un monolito

`index.js` crea una sola aplicación Express, prepara dependencias comunes y llama a módulos `registrarX`. Cada módulo registra endpoints y varios combinan controladores, reglas de dominio y consultas Prisma. Solicitudes y revisión comparten exportaciones de `solicitudes.js`; el módulo administrativo importa reglas de tipo de trámite. Estas dependencias entre archivos acreditan modularización, no despliegues separados.

### Persistencia y límites de confianza

Prisma Client accede a PostgreSQL mediante `PrismaPg`. Los módulos autenticados usan sesión creada por identidad y aplican comprobaciones específicas de rol/titularidad. La ruta pública de verificación devuelve una proyección acotada para documentos emitidos. Los archivos se sirven a través de endpoints que consultan solicitud/documento y comprueban la ruta interna. La transferencia SQLite se realiza con un proceso explícito, después del respaldo y su ensayo sin escritura; no se ejecuta al arrancar la API.

### Trazabilidad de operaciones

El modelo registra revisión, historial de estados y auditoría. En código se observan inserciones en acciones concretas de solicitud y revisión, y un endpoint administrativo para consultar eventos. No hay evidencia en estas fuentes de que cada acción del sistema genere automáticamente un evento completo.

## Objetivo Sprint 2

La separación en capas (por ejemplo, transporte, aplicación/dominio e infraestructura), caché y publicación de Swagger/OpenAPI son objetivos/propuestas, no el enfoque implementado hoy. Su adopción requiere una decisión de arquitectura y actualización previa de esta documentación según la constitución. Tampoco se deben imponer abstracciones nuevas sin justificar el plan de implementación correspondiente.

## Trazabilidad y fuentes

- Organización del cliente: `client/app/` y `client/package.json`.
- Proceso y composición: `server/src/index.js`.
- Módulos y llamadas a Prisma: `server/src/solicitudes.js`, `revision-grados.js`, `administracion.js`, `identidad.js`, `catalogo-grados.js`, `verificacion-documentos.js`.
- Modelo: `server/prisma/schema.prisma`.
- Drivers y requisitos: `docs/01-analisis-de-sistema/06-driver-arquitectonicos.md`, `03-requisitos-funcionales.md`, `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`.
