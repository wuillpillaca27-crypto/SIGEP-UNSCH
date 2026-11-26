# Especificación de funcionalidad: Documentación Swagger de la API

**Rama**: `012-swagger-api-docs`  
**Entrada**: Solicitud «Spec 012 (Swagger en /api-docs con los endpoints del inventario FR-016). Plan mínimo: solo documentación OpenAPI y la ruta /api-docs, sin cambiar la lógica de negocio».

## Alcance

Incorporar una especificación OpenAPI que describa las rutas HTTP del inventario FR-016 de `specs/008-documentacion-arquitectura/spec.md` y exponer su interfaz Swagger UI en `/api-docs`.

La implementación se limita a documentación OpenAPI, dependencias necesarias para servirla y montaje de la ruta de documentación. No se modificarán respuestas, validaciones, permisos, persistencia, transiciones ni ninguna otra lógica de negocio. Las operaciones documentadas reflejarán las rutas actualmente declaradas, incluyendo sus prefijos y archivos fuente.

## Historias de usuario

### US1 (P1): Consultar la documentación de la API

Como desarrollador o integrador, quiero abrir `/api-docs` y consultar el contrato OpenAPI de las rutas vigentes del inventario FR-016, para conocer los métodos, parámetros y respuestas documentados sin cambiar el comportamiento de la API.

## Requisitos funcionales

- **FR-001**: El servidor DEBE publicar Swagger UI en `GET /api-docs` y la interfaz DEBE cargar una especificación OpenAPI válida.
- **FR-002**: La especificación DEBE documentar todas las operaciones HTTP del inventario FR-016 de `specs/008-documentacion-arquitectura/spec.md`, componiendo prefijos y rutas locales como rutas completas.
- **FR-003**: Cada operación DEBE incluir método, ruta, resumen, parámetros aplicables, tipo de contenido y respuestas documentadas con base en los contratos y el comportamiento observado; los aspectos no confirmados por las fuentes NO DEBEN presentarse como hechos.
- **FR-004**: La documentación y el montaje de Swagger NO DEBEN cambiar la lógica de negocio, la autenticación/autorización ni las respuestas de los endpoints existentes.
- **FR-005**: La documentación OpenAPI DEBE mantenerse en un artefacto identificable dentro de `server/`, separado de los módulos funcionales.

## Criterios de éxito

- **SC-001**: Con el servidor iniciado, `GET /api-docs` entrega la interfaz de Swagger UI y esta carga el documento OpenAPI.
- **SC-002**: El documento incluye todas las rutas y métodos enumerados en FR-016 de Spec 008.
- **SC-003**: La revisión de cambios confirma que las modificaciones de servidor se limitan a documentación, dependencias y montaje de `/api-docs`, sin cambios de lógica de negocio.

## Referencias

- Inventario autoritativo de operaciones: `specs/008-documentacion-arquitectura/spec.md`, FR-016.
- Montaje actual de Express: `server/src/index.js`.
- Contratos históricos: `docs/legacy/openspec/api-contracts.md`.
