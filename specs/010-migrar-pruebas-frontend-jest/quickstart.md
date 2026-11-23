# Guía rápida de validación: Jest frontend

Esta guía valida la migración de Vitest a Jest en `client/`, los reportes de cobertura y el build de Next. No utiliza servidor ni servicios externos.

## Requisitos

- Node.js 24 y npm.
- Dependencias instalables desde `client/package-lock.json`.
- No se requiere `server/`, base de datos, secretos ni conexión de red de la aplicación.

## Instalar dependencias

Desde la raíz del repositorio:

```powershell
Set-Location client
npm ci
```

**Esperado**: instalación reproducible de las dependencias de frontend; Vitest deja de formar parte del árbol de dependencias.

## Smoke test del runner

```powershell
npx jest app/__tests__/lib/runner.test.ts --runInBand
```

**Esperado**: Jest carga con `next/jest`, ejecuta el caso de humo, resuelve el alias `@/*` y usa `America/Lima`. Si la configuración de Jest no puede ejecutarse con las versiones instaladas, detener la migración P2–P6 y resolver la compatibilidad antes de continuar.

## Suite completa y cobertura

```powershell
npm test
```

**Esperado**: se muestran los resultados individuales; el proceso termina con código 0 si pasan o distinto de 0 si falla algún caso. Cada ejecución completa emite resumen de cobertura de texto y archivos HTML y lcov en `client/coverage/`. No se exige porcentaje umbral y `coverage/` sigue ignorado por Git.

## Build frontend

```powershell
npm run build
```

**Esperado**: el build de Next.js finaliza correctamente sin cambios en código de producción.

## Verificar alcance del cambio

Desde la raíz:

```powershell
git diff --name-only
```

**Esperado**: todos los cambios de implementación pertenecen a `client/`; no hay rutas bajo `server/` ni cambios en la base de datos. Los artefactos de planificación pertenecen únicamente a `specs/010-migrar-pruebas-frontend-jest/`.
