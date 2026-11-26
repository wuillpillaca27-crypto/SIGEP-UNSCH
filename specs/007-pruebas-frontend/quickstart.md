# Guía rápida de validación

## Requisitos previos

- Node.js compatible con la versión de Vitest instalada (la documentación actual requiere Node.js 22.12 o superior).
- Dependencias de `client/` instaladas mediante `npm install`.

## Ejecutar la suite

Desde la carpeta `client/`:

```sh
npm test
```

El comando ejecuta `vitest --run`. Resultado esperado: cada prueba informa su estado; el proceso termina con código 0 si todas pasan y con código distinto de 0 si falla alguna. Los fallos muestran el caso y la diferencia entre esperado y recibido.

## Verificar el build

Desde `client/`:

```sh
npm run build
```

Resultado esperado: build de Next.js completado sin errores. Este control comprueba que los cambios de configuración de desarrollo no rompan la compilación de la aplicación.

## Zona horaria

Vitest fuerza `America/Lima`. Las fechas ISO con sufijo `Z` se muestran según UTC-5; por ejemplo `2024-01-05T00:00:00.000Z` corresponde a `04/01/2024` en las utilidades que usan la zona local.

## Alcance

Estas validaciones no inician servicios externos, no modifican `server/` ni la base de datos y no deben requerir cambios en comportamiento de producción.