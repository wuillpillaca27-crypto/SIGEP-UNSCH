# Guía de validación

## Prerrequisitos

- Node.js y dependencias instaladas en `server/`.
- Variables de entorno requeridas por el servidor configuradas localmente; no registrar ni compartir secretos.
- Base de datos local inicializada conforme al procedimiento vigente del servidor.

## Validación manual

1. Desde `server/`, iniciar con `npm start`.
2. Abrir `http://127.0.0.1:8000/api-docs` (o el host/puerto configurado).
3. Confirmar que Swagger UI carga `server/openapi.json` sin errores y muestra las 28 operaciones (método + ruta) de FR-016.
4. Revisar que cada path y método coincide con los registradores actuales y que los detalles de solicitud/respuesta están respaldados por el código o los contratos.
5. Comparar el diff: los cambios en servidor deben limitarse al documento OpenAPI, dependencias/lockfile y montaje de `/api-docs`; no deben cambiar módulos funcionales ni lógica de negocio.

## Evidencia esperada

- `GET /api-docs` responde con la interfaz de documentación.
- La UI muestra el título y versión del API y carga todos los métodos/rutas del inventario FR-016.
- Los endpoints de negocio mantienen el mismo registro y comportamiento.
