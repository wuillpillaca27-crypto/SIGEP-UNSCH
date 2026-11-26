# Contrato OpenAPI

## Superficie

- Interfaz Swagger UI: `GET /api-docs`.
- Definición OpenAPI servida por la interfaz: la interfaz carga el documento versionado en `server/openapi.json`.
- Operaciones de negocio descritas: métodos y rutas completos del inventario FR-016 en `specs/008-documentacion-arquitectura/spec.md`.

## Compatibilidad

La adición de documentación no cambia los contratos HTTP de negocio. El documento describe el comportamiento vigente; no crea endpoints, respuestas, permisos, parámetros ni validaciones nuevas. La fuente para cada detalle es el handler actual y, como antecedente, `docs/legacy/openspec/api-contracts.md`.

## Respuestas no confirmadas

Cuando código o contrato fuente no permita determinar una estructura o estado de respuesta, la documentación no debe inventar el detalle; debe describir solo lo comprobable o dejarlo explícitamente sin especificar.
