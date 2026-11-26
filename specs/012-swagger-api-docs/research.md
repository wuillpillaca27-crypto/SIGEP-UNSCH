# Investigación: documentación Swagger de la API

## Decisión 1: servir Swagger UI desde Express

- **Decisión**: Montar `swagger-ui-express` en `/api-docs` con el documento OpenAPI como entrada.
- **Rationale**: El paquete documenta directamente el patrón `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))`; el servidor ya usa Express 5 en CommonJS y centraliza el montaje en `server/src/index.js`. La interfaz queda alojada en el mismo servidor.
- **Alternativas consideradas**: Servir Swagger UI desde un host externo (añade despliegue separado); generar UI en cliente (fuera del alcance y arquitectura actual).
- **Fuente**: [README oficial de swagger-ui-express](https://github.com/scottie1984/swagger-ui-express).

## Decisión 2: mantener el contrato OpenAPI separado del código funcional

- **Decisión**: Mantener el documento como archivo JSON estático `server/openapi.json` y cargarlo desde el arranque del servidor.
- **Rationale**: JSON es OpenAPI serializado directamente, no requiere parser ni generador en ejecución, y mantiene las anotaciones fuera de los módulos de rutas. Es compatible con el requisito de no modificar lógica de negocio.
- **Alternativas consideradas**: `swagger-jsdoc` con anotaciones JSDoc en los módulos funcionales (acopla documentación a archivos cuyo cambio se busca evitar); YAML (requiere parser adicional en tiempo de ejecución o convertirlo antes de servirlo).

## Decisión 3: cubrir el inventario establecido en Spec 008

- **Decisión**: Usar `specs/008-documentacion-arquitectura/spec.md` FR-016 como lista de operaciones, y comprobar método + prefijo + ruta en los registradores actuales antes de finalizar la documentación.
- **Rationale**: FR-016 es el inventario trazable solicitado por la feature; el código actual determina el estado real de cada endpoint. Respuestas y parámetros se detallan solo en la medida sustentada por código y contratos OpenSpec.
- **Alternativas consideradas**: Copiar el inventario sin cotejarlo con las rutas actuales (riesgo de documentar operaciones desactualizadas); expandir el alcance a endpoints ajenos a FR-016 (innecesario para esta feature).

## Decisión 4: montaje en el servidor

- **Decisión**: Incorporar Swagger después de middleware base y antes del manejador final de errores, sin cambiar el registro ni orden funcional de las rutas existentes.
- **Rationale**: Así `/api-docs` se sirve en el punto central de composición y no se captura como endpoint de negocio. La implementación debe confirmar el comportamiento del middleware del paquete con Express 5.
- **Alternativas consideradas**: Añadir una ruta en un módulo de negocio (difumina la frontera de documentación); alterar el router de API (amplía el cambio innecesariamente).

## Decisiones por validar durante implementación

- Fijar una versión compatible de `swagger-ui-express` en `server/package.json` y actualizar el lockfile existente.
- Determinar esquemas de entrada/salida y respuestas con evidencia directa en los handlers y `docs/legacy/openspec/api-contracts.md`; marcar en la documentación cualquier respuesta que el código no permita precisar.
- Verificar el acceso `GET /api-docs` y que la definición OpenAPI incluya todos los métodos/rutas FR-016. No se modifica el comportamiento funcional.
