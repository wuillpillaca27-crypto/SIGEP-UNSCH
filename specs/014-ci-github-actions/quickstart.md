# Guía de validación

## Requisitos

- Node.js 24 y npm instalados localmente.
- Dependencias públicas disponibles.
- Los lockfiles `server/package-lock.json` y `client/package-lock.json`.

## Ejecutar los paquetes localmente

Desde la raíz del repositorio:

1. `cd server`
2. `npm ci`
3. `npm test`
4. Volver a la raíz y entrar a `client/`.
5. `npm ci`
6. `npm test`

**Resultado esperado**: las dos suites ejecutan Jest y producen el directorio `coverage/` de su paquete. La cobertura del servidor usa su configuración Jest vigente; la cobertura del cliente usa la configuración Jest integrada con Next.js.

## Validar la ejecución hospedada

1. Enviar un push a una rama o abrir/actualizar un pull request.
2. Abrir la ejecución del workflow CI en GitHub Actions.
3. Confirmar los dos jobs independientes (`server` y `client`), Node 24 y el resultado de `npm ci` y `npm test` en cada uno.
4. Descargar `server-coverage` y `client-coverage` y confirmar que cada archivo pertenece al paquete que indica su nombre.
5. Revisar el workflow y confirmar que solo declara permisos mínimos, no referencias a secretos y ningún paso de despliegue.

## Comportamiento ante fallo

Si Jest falla después de generar reportes, el job debe conservar el estado fallido y aun así subir los archivos de cobertura disponibles. Si no se genera cobertura, no debe aparecer un reporte vacío como artefacto.
