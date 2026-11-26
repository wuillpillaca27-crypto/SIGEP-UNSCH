---
description: "Tareas para un workflow CI independiente por paquete con Jest y artefactos de cobertura"
---

# Tareas: CI con GitHub Actions

**Entrada**: Documentos de diseño de `/specs/014-ci-github-actions/`  
**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/github-actions.md`, `quickstart.md`

**Pruebas**: No se agregan suites nuevas. La migración conserva la prueba actual del cliente; la validación ejecuta los scripts Jest existentes o migrados y revisa sus salidas de cobertura.

**Organización**: Las tareas se agrupan por historia de usuario. El job del cliente no puede cumplir el contrato hasta que el paquete ejecute Jest.

## Fase 1: Preparación del runner de cliente

**Propósito**: Hacer que el paquete `client/` tenga un comando reproducible de Jest con cobertura, requisito previo para el workflow.

- [X] T001 Añadir Jest 30.5.2, `jest-environment-jsdom` 30.5.2 y `@types/jest` como dependencias de desarrollo del cliente, retirar Vitest y actualizar el script `test` a Jest con cobertura en `client/package.json` y `client/package-lock.json`; añadir `coverage/**` a los patrones globales de `client/eslint.config.mjs`.

---

## Fase 2: Fundamentos de configuración Jest

**Propósito**: Preparar el entorno Jest de Next.js antes de migrar la suite y conectarla a CI.

- [X] T002 [P] Crear `client/jest.config.js` con la integración `next/jest`, entorno `jsdom`, resolución del alias `@/` desde `client/`, cobertura en `coverage/`, carga de `client/jest.setup.ts` y asignación de `process.env.TZ = "America/Lima"` trasladada desde `client/vitest.config.ts`; retirar `client/vitest.config.ts`.
- [X] T003 [P] Crear `client/jest.setup.ts` con `@testing-library/jest-dom` y retirar `client/vitest.setup.ts`. La suite actual no usa handlers MSW y la importación de MSW en Jest falla por su dependencia ESM `rettime`; no se carga MSW en el setup mientras no haya pruebas que lo requieran.

**Checkpoint**: `client/` ya dispone de configuración y setup Jest compatibles con Next.js; aún falta adaptar la suite existente y crear el workflow.

---

## Fase 3: US1 — Revisar CI del servidor y del cliente (Prioridad: P1) 🎯 MVP

**Meta**: Cada push y pull request muestra resultados independientes de Jest para ambos paquetes y publica cobertura identificada por paquete.

**Criterio de prueba independiente**: Ejecutar el script `npm test` desde `server/` y `client/`; ambos deben ejecutar Jest y generar `coverage/`. En un push o pull request, comprobar que aparecen los jobs independientes `server` y `client`, usan Node 24, y ofrecen los artefactos `server-coverage` y `client-coverage` cuando hay reportes generados. Si Jest falla después de producir cobertura, el job conserva el fallo y sube el reporte disponible.

- [X] T004 [US1] Adaptar `client/app/__tests__/lib/runner.test.ts` a Jest quitando la importación de Vitest y conservando las aserciones sobre el alias `@/`, `POR_PAGINA` y `America/Lima`.
- [X] T005 [P] [US1] Crear `.github/workflows/ci.yml` para `push` y `pull_request` con exactamente dos jobs independientes (`server` y `client`) sin `needs` ni matriz; en cada job configurar Node 24, ejecutar `npm ci` y `npm test` desde el paquete correspondiente y subir `server/coverage/` o `client/coverage/` con nombres `server-coverage` y `client-coverage`, usando `if: ${{ !cancelled() }}` e `if-no-files-found: warn` para conservar reportes tras fallos sin crear artefactos vacíos. El server genera Prisma Client con una URL SQLite temporal antes de probar; limitar permisos a `contents: read`, no referenciar `secrets` y no incluir despliegue ni publicación.

**Checkpoint**: La historia está implementada: el runner de cliente es Jest y el workflow reporta por separado pruebas y cobertura por paquete.

---

## Fase 4: Pulido y validación

**Propósito**: Verificar que la entrega satisface el contrato y la guía de ejecución.

- [X] T006 Ejecutar los pasos locales de `specs/014-ci-github-actions/quickstart.md` desde `server/` y `client/`; confirmar que cada paquete ejecuta Jest y genera su reporte en `coverage/`, y revisar `.github/workflows/ci.yml` contra los dos jobs, Node 24, los dos nombres/rutas de artefactos, permisos mínimos, ausencia de referencias a secretos y ausencia de despliegue.

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: T001 habilita Jest y el comando `npm test` del cliente.
- **Fundamentos (Fase 2)**: T002 y T003 dependen de T001 y pueden ejecutarse en paralelo porque cambian archivos distintos.
- **US1 (Fase 3)**: T004 depende de T002 y T003. T005 depende de T001 para invocar el comando Jest del cliente; puede escribirse en paralelo con T004 después de completar los fundamentos.
- **Pulido (Fase 4)**: T006 depende de T004 y T005.

### Dependencias de la historia

- **US1 (P1)**: Después de T001–T003; T004 adapta la suite; T005 define el workflow. No hay otras historias.

### Oportunidades de paralelismo

- T002 y T003 pueden realizarse en paralelo después de T001.
- T004 y T005 pueden realizarse en paralelo después de completar los fundamentos: actualizan `client/app/__tests__/lib/runner.test.ts` y `.github/workflows/ci.yml`, respectivamente.
- T006 es secuencial y debe seguir a ambas tareas.

## Ejemplo de ejecución paralela

```text
Tras T001:
  T002: configurar client/jest.config.js y retirar vitest.config.ts
  T003: crear client/jest.setup.ts y retirar vitest.setup.ts

Tras T002 y T003:
  T004: adaptar la prueba TypeScript existente a Jest
  T005: crear el workflow con los dos jobs independientes y upload de cobertura
```

## Estrategia de implementación

1. Completar T001 para disponer del comando Jest del cliente.
2. Completar T002 y T003 para sustituir la infraestructura Vitest del cliente.
3. Completar T004 y T005 para entregar US1 como MVP.
4. Completar T006 para validar los dos paquetes y revisar el workflow contra el contrato.

**MVP sugerido**: US1 completa (T001–T005); proporciona dos jobs independientes de Jest y dos artefactos diferenciados de cobertura. T006 constituye la validación de aceptación.
