# Plan de implementación: Pruebas unitarias del frontend

**Rama**: `007-pruebas-frontend` | **Fecha**: 2026-11-21 | **Especificación**: [spec.md](spec.md)

**Entrada**: Especificación en `/specs/007-pruebas-frontend/spec.md`

## Resumen

Incorporar pruebas automatizadas para las seis capas descritas en la especificación, ejecutables con `npm test` desde `client/`. Vitest ejecutará la suite; Testing Library cubrirá renderizado e interacciones; jsdom proveerá el DOM; MSW aislará las solicitudes `fetch`. La configuración fijará la zona horaria de ejecución en `America/Lima` y reproducirá el alias `@/*` → `./*` de `client/tsconfig.json`. No se cambiará código de producción.

## Contexto técnico

**Lenguaje/versión**: TypeScript del proyecto; Node.js 24.16 disponible en el entorno actual.

**Dependencias principales**: Next.js 16.4.3 y React 19.3.0 existentes. Nuevas dependencias exclusivamente en `devDependencies` de `client/package.json`: Vitest, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, jsdom y MSW. Actualizar también `client/package-lock.json` para registrar el árbol reproducible.

**Almacenamiento**: No aplica; la suite no modifica persistencia ni base de datos.

**Pruebas**: `npm test` ejecuta exactamente `vitest --run`; `npm run build` comprueba el build de Next.js. Vitest se configura para `jsdom`, setup común, alias `@/*` a la raíz `client/` y zona `America/Lima` antes de iniciar los workers.

**Plataforma objetivo**: Frontend Next.js existente; ejecución de pruebas en Node con DOM simulado.

**Tipo de proyecto**: Aplicación web frontend existente en un monorepo.

**Objetivo de rendimiento**: La suite debe terminar en modo de una sola ejecución; no se añade un umbral de duración porque no está definido por los requisitos.

**Restricciones**: No modificar fuentes de producción, `server/` ni base de datos. Mantener las seis capas y ubicaciones de pruebas de la especificación. Las dependencias nuevas se limitan a dependencias de desarrollo del cliente.

**Alcance**: Seis capas P1–P6 del frontend descritas en `spec.md`; el código de producción se trata como sistema bajo prueba.

## Revisión de constitución

| Principio | Estado | Aplicación al plan |
|---|---|---|
| Especificaciones primero | Cumple | Especificación, plan y futuras tareas quedan bajo `specs/007-pruebas-frontend/`. |
| Contratos y titularidad | Cumple | Pruebas de frontend; no se cambia el contrato ni la lógica del servidor. |
| Datos y diseño institucional | Cumple | No se alteran datos ni presentación de producción; componentes se verifican mediante comportamiento accesible. |
| Evidencia | Cumple | La guía indica los comandos y resultados esperados; la implementación registrará qué se ejecutó. |
| Cambios mínimos | Cumple | Cambios limitados a configuración de pruebas, pruebas y manifiestos de dependencias. |
| Stack y dependencias | Cumple con justificación | Se mantienen Next/React/TypeScript. Cada nueva dependencia y su necesidad se documenta en `research.md`; todas son de desarrollo. |
| Seguridad | Cumple | MSW simula solicitudes; no se usan secretos ni servicios reales. |
| Base de datos | Cumple | No hay cambios de esquema ni migraciones. |
| Verificación | Cumple | `npm test` y `npm run build` en `client/`; registrar también si el gate general del repositorio requiere verificar `npm start` en `server/`, sin modificarlo. |
| Referencias | Cumple | Comportamientos se contrastan con `spec.md` y requisitos históricos de Kiro, subordinados al código observado. |
| Idioma | Cumple | Artefactos de especificación y diseño redactados en español. |

**Gate previo a diseño**: aprobado. No se identifican excepciones constitucionales.

## Estructura del proyecto

### Documentación de la funcionalidad

```text
specs/007-pruebas-frontend/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── test-command.md
└── tasks.md                  # Se genera con $speckit-tasks
```

### Fuente y pruebas

```text
client/
├── package.json              # script test y devDependencies
├── package-lock.json         # árbol de dependencias actualizado
├── vitest.config.ts          # jsdom, alias, TZ y setup
├── vitest.setup.ts           # matchers y ciclo de vida de MSW
└── app/
    └── __tests__/
        ├── lib/
        ├── services/
        ├── hooks/
        └── components/
```

**Decisión de estructura**: La estructura real es `client/app/` y ya contiene `lib/`, `services/`, `hooks/` y `components/ui/`. Las pruebas se agrupan bajo el directorio `client/app/__tests__/` pedido, con las cuatro subcarpetas indicadas. La configuración reside en la raíz de `client/`; ninguna ruta de producción se modifica.

## Diseño de implementación

1. Añadir las seis dependencias de desarrollo solicitadas y el script `"test": "vitest --run"`; sincronizar el lockfile.
2. Configurar Vitest con `environment: "jsdom"`, `setupFiles: ["./vitest.setup.ts"]`, alias `@/*` → `./*` y `process.env.TZ = "America/Lima"` al cargar la configuración, antes de iniciar la ejecución aislada.
3. En el setup, extender matchers con `@testing-library/jest-dom/vitest` y preparar MSW con `setupServer`: iniciar antes de las pruebas, restablecer handlers tras cada prueba y cerrar al terminar.
4. Implementar las pruebas por historia P1–P6 en la carpeta acordada. Usar MSW para solicitudes del cliente HTTP y dobles del módulo `api` para comprobar la construcción de rutas y argumentos de los servicios.
5. Mantener expectativas alineadas con el código inspeccionado y las aclaraciones de `spec.md`. Si una expectativa histórica no coincide con la implementación actual, documentarla; no alterar producción.
6. Ejecutar desde `client/` `npm test` y `npm run build`; corregir solo configuración, dependencias o pruebas. Registrar resultados y cualquier limitación.

## Gate constitucional posterior al diseño

Aprobado: el diseño conserva el stack de producción, justifica dependencias de desarrollo, limita cambios al cliente y no toca servidor ni base de datos. La verificación funcional solicitada es `npm test` y `npm run build` en `client/`; el principio general también exige ejecutar `npm start` en `server/` antes de cerrar una tarea, lo cual se mantendrá como evidencia de repositorio sin realizar cambios en ese proyecto.

## Seguimiento de complejidad

No hay violaciones constitucionales que requieran excepciones. Las dependencias se justifican como capacidades directas de runner, renderizado, interacción, matchers DOM, simulación de DOM e interceptación de red.