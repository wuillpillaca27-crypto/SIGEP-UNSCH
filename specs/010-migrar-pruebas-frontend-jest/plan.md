# Plan de implementación: Migrar pruebas frontend a Jest

**Rama**: `010-migrar-pruebas-frontend-jest` | **Fecha**: 2026-11-22 | **Spec**: [spec.md](spec.md)

## Resumen

Migrar el entorno de pruebas de `client/` de Vitest a Jest usando la integración `next/jest`, configurar Jest DOM, alias `@/*`, `TZ=America/Lima`, MSW y reportes de cobertura de texto, HTML y lcov. Completar las pruebas de las historias P2–P6 de la spec 007 y conservar el comportamiento de producción. El alcance se limita a configuración, dependencias, documentación de pruebas y archivos de prueba dentro de `client/`; no se modifica `server/` ni la base de datos.

## Contexto técnico

**Lenguaje/versión**: TypeScript y JavaScript en Node.js 24; Next.js 16.4.3 y React/React DOM 19.3.0.

**Dependencias principales**: `next/jest` provisto por Next.js; Jest 30.5.2 y `jest-environment-jsdom` 30.5.2; Testing Library existente (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`); MSW 2.15.0. Retirar Vitest y su configuración. Revisar si `jsdom` directo sigue siendo necesario después de adoptar `jest-environment-jsdom`.

**Almacenamiento**: No aplica; la suite no usa persistencia.

**Pruebas**: Jest ejecutado desde `client/` mediante `npm test`; cada ejecución completa genera summary de texto y reportes HTML y lcov. No se impone umbral mínimo.

**Plataforma objetivo**: Node.js 24 en los entornos de desarrollo y CI; entorno DOM provisto por `jest-environment-jsdom`.

**Tipo de proyecto**: Aplicación frontend Next.js con pruebas unitarias y de integración de módulos cliente.

**Objetivos de rendimiento**: No se define un SLA de duración. El runner debe terminar con código 0 cuando pasan los casos y no cero cuando falla uno.

**Restricciones**: Cambios exclusivamente dentro de `client/` y en artefactos de especificación autorizados. No cambiar código de producción, `server/` ni la base de datos. Mantener `/coverage` en `client/.gitignore`. Ejecutar build y pruebas de la capa frontend para verificar la implementación.

**Escala/alcance**: Una prueba de humo P1 y las capas P2–P6 de utilidades, cliente HTTP, servicios, hooks y componentes; carpetas `lib`, `services`, `hooks` y `components` bajo `client/app/__tests__/`.

## Revisión de constitución

| Principio | Estado | Aplicación en el diseño |
|---|---|---|
| Especificaciones primero | Cumple | La implementación sigue la spec 010, este plan, sus tareas y validación. |
| Contratos y titularidad | Cumple | Solo se caracterizan contratos observables existentes; no se cambia la API ni el servidor. |
| Datos y diseño institucional | Cumple | No se usan datos institucionales ni persistencia. |
| Evidencia | Cumple | Cada capa se valida con Jest y sus reportes; se registra la evidencia en quickstart. |
| Cambios mínimos | Cumple | Se migra el runner y se añaden archivos de prueba; el código de producción no se cambia. |
| Stack y dependencias | Cumple | Next/React se conservan; Jest y su entorno se justifican como herramientas de desarrollo en el alcance frontend. |
| Seguridad | Cumple | MSW aísla `fetch`; no se usan secretos ni servicios externos reales. |
| Base de datos | Cumple | No se modifica el esquema ni se requiere migración de datos. |
| Verificación | Cumple | Se ejecutan `npm test` y `npm run build` desde `client/`. |
| Pruebas | Cumple | Jest genera reportes de cobertura según la constitución. |
| Arquitectura documentada e idioma | Cumple | El cambio no altera arquitectura productiva; los artefactos se redactan en español. |

**Puerta previa**: APROBADA. La propuesta está acotada al entorno de prueba frontend y no requiere cambios de producción.

**Puerta posterior al diseño**: APROBADA. Los únicos cambios de código previstos están dentro de `client/`; `server/` y la base de datos quedan fuera del diff.

## Decisiones de arquitectura

1. Usar `next/jest` desde una configuración CommonJS en `client/jest.config.js`, con `nextJest({ dir: "./" })`, para obtener transformaciones compatibles con Next.js y la configuración de `client/`.
2. Usar `jest-environment-jsdom` para los casos que necesitan DOM. Mantener Jest y su entorno en versiones alineadas 30.5.2; retirar `vitest` y eliminar `jsdom` directo solo si el árbol de dependencias confirma que no tiene otro consumidor directo.
3. Migrar `client/vitest.setup.ts` a `client/jest.setup.ts`: importar `@testing-library/jest-dom` y configurar MSW con hooks Jest (`beforeAll`, `afterEach`, `afterAll`), sin imports de Vitest.
4. Mapear `@/*` a la raíz de `client/` en `moduleNameMapper` conforme a `client/tsconfig.json`; establecer `TZ=America/Lima` antes de que Jest inicie los workers.
5. Configurar en Jest `coverageReporters` para `text`, `html` y `lcov`, habilitar cobertura para la ejecución completa y no fijar umbrales. Conservar la regla `/coverage` de `client/.gitignore`.
6. Migrar la prueba de humo `runner.test.ts` y conservar sus verificaciones de alias y zona horaria. Ejecutar este smoke test con Next 16.4.3, React 19.3.0, Jest 30.5.2 y el entorno DOM antes de migrar P2–P6.
7. Implementar las pruebas P2–P6 según los comportamientos observables en la spec 010 y la referencia 007. MSW interceptará `fetch`; los servicios pueden aislar el cliente HTTP. Ninguna prueba llamará a un backend real.
8. Cambiar `client/package.json` para que `npm test` invoque Jest y retirar Vitest de scripts y dependencias; sincronizar `client/package-lock.json`.
9. No se define contrato externo nuevo ni se modifica la API. No se crea `contracts/`, porque el cambio afecta herramientas internas de prueba, no interfaces ofrecidas a otros sistemas.

## Estructura del proyecto

### Documentación de esta funcionalidad

```text
specs/010-migrar-pruebas-frontend-jest/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Código y pruebas frontend

```text
client/
├── package.json                         # comando test y dependencias Jest
├── package-lock.json                    # lockfile sincronizado
├── .gitignore                           # conservar /coverage
├── jest.config.js                       # next/jest, jsdom, alias, TZ y cobertura
├── jest.setup.ts                        # jest-dom y ciclo de MSW
├── app/__tests__/
│   ├── lib/                             # runner, utils y api
│   ├── services/                        # servicios de dominio
│   ├── hooks/                           # hooks
│   └── components/                      # componentes UI
└── app/                                 # código de producción sin cambios
```

**Estructura de pruebas**: El smoke test P1 se valida antes de migrar las capas P2–P6. Las pruebas se agrupan en subcarpetas `lib`, `services`, `hooks` y `components`, cada una con casos aislables y sin servicios externos.

## Complejidad y riesgos

- La combinación exacta Next 16.4.3 / React 19.3.0 / Jest 30.5.2 no tiene una matriz oficial cerrada en las fuentes consultadas; el smoke test P1 es la puerta de compatibilidad antes de continuar.
- Las pruebas caracterizan el comportamiento actual, incluso las discrepancias históricas anotadas en la spec. No se deben corregir desde los tests cambios de producción.
- Coverage debe quedar ignorado y los resultados se guardan como artefactos locales, no como cambios de fuente.

| Riesgo | Mitigación |
|---|---|
| Incompatibilidad de la combinación Jest/Next | Ejecutar smoke test P1 antes de migrar las demás suites. |
| MSW o matchers aún importan utilidades de Vitest | Migrar setup e imports de forma conjunta; buscar referencias residuales a Vitest en `client/`. |
| Diferencias de zona horaria entre máquinas | Establecer `TZ=America/Lima` antes de iniciar Jest y conservar las pruebas del alias y la TZ. |
| Cambios accidentales fuera de alcance | Revisar el diff final; solo aceptar rutas bajo `client/` y documentos de `specs/010-migrar-pruebas-frontend-jest/`. |
