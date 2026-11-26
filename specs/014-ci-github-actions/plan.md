# Plan de implementación: CI con GitHub Actions

**Rama**: `014-ci-github-actions` | **Fecha**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Resumen

Crear un workflow que se ejecute en pushes y pull requests y muestre dos resultados independientes, uno para `server/` y otro para `client/`. Cada job usará Node 24, instalará las dependencias del lockfile de su paquete, ejecutará Jest con cobertura y subirá el reporte como un artefacto con nombre propio, incluso si Jest falla después de generarlo. El servidor ya ejecuta Jest; el cliente hoy usa Vitest, por lo que se migrará su configuración y su prueba existente a la integración Jest de Next.js sin cambiar código de producto. El workflow no requiere secretos configurados ni despliega.

## Contexto técnico

**Lenguaje/versión**: Workflow YAML; Node.js 24 para los dos jobs. `server/` usa JavaScript CommonJS y `client/` usa Next.js 16, React 19 y TypeScript 5.  
**Dependencias principales**: GitHub Actions oficiales para checkout, Node, y carga de artefactos; `server/` ya tiene Jest 30.5.2; `client/` usará Jest y `jest-environment-jsdom`, con `next/jest` para transformar TypeScript y `@types/jest` para tipos. Se conserva Testing Library, `jest-dom` y MSW existentes donde se usan.  
**Almacenamiento**: N/A; GitHub Actions conserva los reportes `coverage/` como artefactos de la ejecución.  
**Pruebas**: `npm test` con cobertura en ambos paquetes; Jest del servidor ya produce `server/coverage/`, y Jest del cliente producirá `client/coverage/`. No se requiere base de datos ni servicio externo.  
**Plataforma objetivo**: GitHub Actions con runner Linux hospedado por GitHub (`ubuntu-latest`).  
**Tipo de proyecto**: Workflow de integración continua para un repositorio con dos paquetes npm independientes.  
**Objetivo de rendimiento**: Los dos jobs pueden empezar sin esperar el resultado del otro; no se define SLA de duración.  
**Restricciones**: Exactamente dos jobs sin `needs`, uno por paquete; cada instalación se ejecuta desde su directorio y lockfile con `npm ci`; no usar matrix; no referenciar secretos del repositorio; permisos `contents: read` como máximo; cargar artefactos de cobertura por separado incluso después de fallo de Jest cuando existan archivos; sin despliegue ni publicación. La migración de Vitest a Jest se limita a configuración, dependencias de prueba y la suite existente del cliente.  
**Escala/alcance**: Un workflow, dos jobs, dos paquetes, dos artefactos de cobertura. No se modifica la lógica de producto ni la suite Jest del servidor.

## Revisión de constitución

| Principio | Estado | Aplicación en el diseño |
|---|---|---|
| Especificaciones primero | Cumple | La implementación queda trazada a Spec 014, plan, tareas y verificación. |
| Contratos y titularidad | Cumple | CI solo valida el repositorio; no cambia contratos de producto, identidad ni titularidad. |
| Datos y diseño institucional | Cumple | No se incorporan ni publican datos institucionales. |
| Evidencia | Cumple | Cada job entrega su estado y artefacto de cobertura; los fallos quedan visibles. |
| Cambios mínimos | Cumple con alcance solicitado | El cliente requiere cambiar su runner actual Vitest a Jest para satisfacer el requisito explícito; se conserva el propósito de la prueba existente. El servidor conserva su configuración Jest. |
| Stack y dependencias | Cumple con dependencia justificada | Se añaden dependencias de pruebas Jest en `client/`; la constitución ya define Jest para ambos paquetes. Next.js aporta el transformador `next/jest`, por lo que no se necesita otro transformador TypeScript. |
| Seguridad | Cumple | No se usan secretos de organización/repositorio ni se pasan tokens a comandos; permisos mínimos de lectura para checkout, sin credenciales de publicación. |
| Base de datos | Cumple | No hay cambios Prisma ni acceso a una base. |
| Verificación | Cumple | El workflow ejecuta Jest con cobertura para ambos paquetes y expone el resultado de cada uno. |
| Pruebas | Cumple | Jest en server y client; cada runner genera sus reportes de cobertura. |
| Arquitectura documentada e idioma | Cumple | Solo se añade integración CI y configuración de prueba; artefactos Spec Kit en español. |

**Puerta previa**: APROBADA. El único cambio de runner es explícito en FR-006 y cumple el principio constitucional de Jest.  
**Puerta posterior al diseño**: APROBADA. Se limita el workflow a validar y publicar artefactos; no hay despliegue, publicación ni uso de secretos configurados.

## Decisiones de diseño

Las decisiones y alternativas se registran en [research.md](research.md). Los puntos principales son:

1. Definir jobs `server` y `client` por separado y sin dependencias para que ambos se ejecuten independientemente; no usar matrix porque el contrato exige dos jobs identificables por paquete.
2. Ejecutar instalación y `npm test` dentro de cada paquete para usar el lockfile y los scripts propios. Node queda fijado en la major 24.
3. Mantener Jest en `server/`. En `client/`, reemplazar la configuración Vitest por `next/jest`, entorno `jsdom`, mapa del alias `@/` y setup Jest que preserve la zona horaria y ciclo de vida MSW actuales. No modificar componentes ni servicios de producto.
4. Subir `server/coverage/` y `client/coverage/` como artefactos separados; la subida corre tras terminar la suite aunque haya fallado, pero solo representa un artefacto si el reporte existe.
5. Limitar permisos del workflow a lectura del contenido para checkout. No se configura ningún secreto; el token de lectura que GitHub administra internamente para checkout no se expone a los comandos de prueba.

## Modelo y contratos

- [Entidades del workflow](data-model.md): ejecución, jobs por paquete y artefactos de cobertura; no hay persistencia de producto.
- [Contrato del workflow](contracts/github-actions.md): eventos, jobs, ejecución, nombres y rutas de artefactos, permisos y límites.
- [Guía de validación](quickstart.md): ejecución local de los scripts y validación del workflow y artefactos en GitHub.

## Estructura del proyecto

```text
specs/014-ci-github-actions/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/github-actions.md
└── tasks.md                         # Fase posterior: speckit-tasks

.github/workflows/ci.yml             # Workflow CI; nuevo

server/
├── package.json                     # Ya ejecuta Jest con cobertura
└── jest.config.js                   # Ya dirige reportes a coverage/

client/
├── package.json                     # Script Jest con cobertura y dependencias de prueba
├── package-lock.json                # Dependencias bloqueadas
├── jest.config.js                   # Configuración next/jest
├── jest.setup.ts                    # Matcher, zona horaria y MSW
└── app/__tests__/lib/runner.test.ts # Prueba existente adaptada a Jest
```

**Decisión de estructura**: El workflow se ubica en `.github/workflows/ci.yml`. La configuración Jest pertenece al paquete `client/`; sustituye la configuración Vitest existente. El job de `server/` usa los scripts y ajustes de cobertura ya establecidos.

## Seguimiento de complejidad

No se crean nuevas capas ni servicios. La única dependencia de transformación de pruebas es la integración integrada de Next.js con Jest; se evita sumar `ts-jest` porque la suite es Next.js/TypeScript y `next/jest` ya proporciona el transformador y respeta la configuración del framework.
