# Contrato del comando de pruebas del frontend

## Invocación

- **Directorio de trabajo**: `client/`.
- **Comando público**: `npm test`.
- **Expansión del script**: `vitest --run`.
- **Cobertura**: suite completa de pruebas agrupada en `app/__tests__/{lib,services,hooks,components}/`.

## Resultado observable

- Código de salida `0` cuando todas las pruebas pasan.
- Código de salida distinto de `0` si una o más pruebas fallan.
- La salida identifica el nombre y estado de cada caso.
- Para los fallos se informa el error y el valor esperado frente al recibido.

## Entorno

- Entorno DOM simulado `jsdom`.
- Zona horaria de las pruebas `America/Lima`.
- Alias `@/*` apunta a la raíz de `client/`, en correspondencia con `client/tsconfig.json`.
- MSW intercepta `fetch`; sus handlers se restablecen entre pruebas.