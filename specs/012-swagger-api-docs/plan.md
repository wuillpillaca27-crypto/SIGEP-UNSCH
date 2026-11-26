# Plan de implementación: Swagger para la API

**Rama**: `012-swagger-api-docs` | **Fecha**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Resumen

Documentar las operaciones HTTP del inventario FR-016 de Spec 008 mediante OpenAPI y servir Swagger UI en `/api-docs`. La solución prevista mantiene un archivo OpenAPI estático en `server/openapi.json`, instala `swagger-ui-express` como dependencia del servidor y monta el middleware de documentación en la composición central de Express. La documentación se coteja con los registradores y contratos actuales. No se cambia la lógica de negocio ni el contrato de los endpoints existentes.

## Contexto técnico

**Lenguaje/versión**: JavaScript CommonJS, Node.js 24.16.0 local.  
**Dependencias principales**: Express 5.3; `swagger-ui-express` (versión compatible por fijar en implementación).  
**Almacenamiento**: N/A; el documento OpenAPI es un archivo versionado.  
**Pruebas**: Jest 30.5.2 con cobertura mediante `npm test`; validación de UI en `/api-docs` y revisión de integridad del inventario.  
**Plataforma objetivo**: API Node.js/Express en `server/`.  
**Tipo de proyecto**: API web Express CommonJS.  
**Objetivo de rendimiento**: Sin objetivo adicional; la documentación debe estar disponible en el arranque normal del servidor.  
**Restricciones**: No alterar handlers, autenticación, permisos, validaciones, persistencia, transiciones ni respuestas de negocio. Documentar los métodos y rutas de FR-016; no afirmar detalles sin fuente. No incluir secretos. Mantener dependencias y lockfile coherentes.  
**Escala/alcance**: 19 operaciones HTTP según FR-016 de `specs/008-documentacion-arquitectura/spec.md`; una ruta Swagger UI y un documento OpenAPI.

## Revisión de constitución

| Principio | Estado | Aplicación |
|---|---|---|
| Especificaciones primero | Cumple | Spec 012, plan y artefactos de diseño dirigen la implementación posterior. |
| Contratos y titularidad | Cumple | Se documentan rutas observadas y controles existentes; no cambian titularidad ni permisos. |
| Datos y diseño institucional | Cumple | No se introducen datos nuevos ni contenido institucional. |
| Evidencia | Cumple | La integridad del inventario y la ruta UI se verifican según `quickstart.md`. |
| Cambios mínimos | Cumple | Documento OpenAPI, UI, montaje y dependencia estrictamente necesarios. |
| Stack y dependencias | Cumple con justificación | Se conserva Express/CommonJS; `swagger-ui-express` sirve el contrato OpenAPI en Express. |
| Seguridad | Cumple | No se exponen secretos; no se alteran controles ni configuración de autenticación. |
| Base de datos | Cumple | No hay cambio de esquema ni migración. |
| Verificación y pruebas | Cumple | Verificación enfocada en servidor, endpoint de documentación e inventario OpenAPI. |
| Pruebas | Cumple | Se conserva Jest y su reporte de cobertura para la capa servidor. |
| Arquitectura documentada e idioma | Cumple | El punto de montaje respeta la composición actual; artefactos en español. |

**Puerta previa**: APROBADA. El diseño no modifica lógica de negocio ni datos persistidos.  
**Puerta posterior al diseño**: APROBADA. La única dependencia nueva atiende el requisito de interfaz Swagger; el contrato OpenAPI se mantiene separado de los módulos funcionales.

## Investigación

Las decisiones y alternativas están en [research.md](research.md). `swagger-ui-express` permite montar un documento OpenAPI existente en Express; un JSON estático evita parser/generador en ejecución y mantiene la documentación separada de los handlers.

## Modelo y contratos

- [Modelo OpenAPI](data-model.md): documento y operación HTTP como artefactos de contrato; no hay entidades de persistencia.
- [Contrato de documentación](contracts/openapi.md): `/api-docs`, ubicación de la definición y límites de compatibilidad.
- [Guía de validación](quickstart.md): arranque, comprobación visual y cotejo del inventario.

## Estructura del proyecto

```text
specs/012-swagger-api-docs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.md
└── tasks.md                 # Fase posterior: speckit-tasks

server/
├── openapi.json             # Nuevo: contrato OpenAPI estático
├── package.json             # Dependencia swagger-ui-express
├── package-lock.json        # Lockfile correspondiente
└── src/index.js             # Montaje de GET /api-docs
```

**Decisión de estructura**: `server/openapi.json` queda fuera de los módulos funcionales. `server/src/index.js` es el punto central donde Express y los módulos de rutas ya se componen; allí se monta la interfaz sin insertar documentación en los handlers. Los datos precisos de cada operación se cotejan con el módulo fuente y con FR-016.

## Seguimiento de complejidad

No hay violaciones de la constitución ni nuevas capas arquitectónicas. La nueva dependencia se justifica por el servicio de Swagger UI; se mantiene una definición OpenAPI estática para evitar dependencias de generación adicionales.
