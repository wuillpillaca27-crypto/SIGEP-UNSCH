# Contrato del workflow CI

## Activación

- Eventos: push y pull request.
- Entorno: runner hospedado Linux, Node.js major 24.

## Jobs

El workflow contiene dos jobs independientes y explícitos, sin dependencia `needs` ni matriz:

| Job | Directorio | Instalación | Pruebas | Cobertura |
|---|---|---|---|---|
| `server` | `server/` | `npm ci` con `server/package-lock.json` | `npm test` ejecutando Jest | `server/coverage/` |
| `client` | `client/` | `npm ci` con `client/package-lock.json` | `npm test` ejecutando Jest | `client/coverage/` |

## Artefactos

- Un artefacto identificable como `server-coverage` desde `server/coverage/`.
- Un artefacto identificable como `client-coverage` desde `client/coverage/`.
- La subida se intenta aun cuando la ejecución Jest de ese job falla, siempre que haya archivos de cobertura.
- Si no se generaron archivos, no se presenta un artefacto vacío como reporte.

## Seguridad y alcance

- Permiso máximo del workflow: lectura de contenido para checkout.
- No requiere secretos almacenados de repositorio u organización, credenciales de registro ni variables secretas para instalar o ejecutar los tests.
- El token automático de solo lectura que pueda usar checkout no se transmite a los comandos de prueba.
- No incluye despliegue, publicación o escritura sobre producción.
