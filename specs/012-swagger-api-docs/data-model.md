# Modelo de datos y contrato documentado

Esta funcionalidad no introduce tablas, persistencia ni entidades de dominio. Su artefacto principal es un documento OpenAPI que describe operaciones HTTP existentes.

## Entidades del documento

### Documento OpenAPI

- **Campos**: versión OpenAPI, metadatos (`info`), servidores (`servers`), rutas (`paths`), operaciones (`get`, `post`, `put`) y componentes compartidos (`components`).
- **Reglas**: incluir todas las operaciones del inventario FR-016 de Spec 008; las rutas deben estar completas; parámetros, cuerpos, respuestas y seguridad deben corresponder al código y a los contratos disponibles.
- **Relación**: cada operación apunta a una ruta actual y a su módulo fuente en `server/src/`.

### Operación HTTP

- **Campos**: método y ruta, resumen/etiqueta, parámetros de ruta o query aplicables, tipo de cuerpo cuando corresponda, respuestas y requisito de seguridad cuando se confirme.
- **Validación**: ninguna propiedad no sustentada se afirmará como comportamiento actual. Autenticación o rol se documentan según las rutas y helpers observados.

## Catálogo de operaciones

Las rutas canónicas están definidas en [FR-016 de Spec 008](../008-documentacion-arquitectura/spec.md) y la lista cotejada de sus 28 operaciones (método + ruta) está en [el contrato OpenAPI](contracts/openapi.md). El conteo anterior de 19 operaciones era incorrecto.
