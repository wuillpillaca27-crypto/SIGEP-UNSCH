# Plan de implementación: Documentación de análisis y arquitectura de SIGEP-UNSCH

**Rama**: `008-documentacion-arquitectura` | **Fecha**: 2026-11-21 | **Especificación**: [spec.md](spec.md)

**Entrada**: `specs/008-documentacion-arquitectura/spec.md`

## Resumen

Crear en `docs/` los 19 documentos Markdown de análisis, arquitectura, diseño interno y modelo C4 descritos en FR-001. La redacción se basará en las especificaciones 001–007 y en las fuentes reales de `client/`, `server/`, Prisma y `docs/legacy/`; distinguirá lo implementado hoy de los objetivos de Sprint 2 y mantendrá trazabilidad a requisitos, historias, escenarios o archivos fuente. Los cuatro diagramas C4 usarán Mermaid `flowchart` compatible con GitHub. No se cambiará código de producción ni se añadirán dependencias.

## Contexto técnico

**Lenguaje/versión**: Markdown en español; Mermaid `flowchart` para diagramas.

**Dependencias principales**: Ninguna nueva. Las vistas previas de GitHub y Mermaid Live Editor son herramientas de revisión, no dependencias del proyecto.

**Almacenamiento**: Archivos Markdown versionados bajo `docs/`; no se modifican datos persistentes ni el esquema.

**Verificación**: Comprobar los 19 nombres y rutas exactos de FR-001; revisar referencias y trazabilidad contra las fuentes; abrir cada uno de los cuatro diagramas en la vista previa Markdown compatible con GitHub y confirmar renderizado. No corresponde ejecutar build o pruebas de client/server para una entrega exclusivamente documental.

**Plataforma objetivo**: Repositorio GitHub y lectores del equipo SIGEP-UNSCH.

**Tipo de proyecto**: Documentación de un sistema web existente.

**Metas de rendimiento**: No aplica a la entrega documental. Toda meta de calidad del sistema descrita en los documentos será identificada según la especificación como propuesta pendiente de validación, no como resultado medido.

**Restricciones**: Limitar cambios de producto a `docs/`; no modificar `client/`, `server/` ni la base de datos; no instalar dependencias; no atribuir comportamiento sin evidencia. Cada documento distingue `Implementado hoy` y `Objetivo Sprint 2` y está redactado en español.

**Alcance**: 19 documentos entregables en cuatro grupos; cuatro diagramas C4; fuentes principales: `specs/001`–`specs/007`, `server/src/`, `server/prisma/schema.prisma`, `client/app/` y `docs/legacy/openspec/`.

## Revisión de constitución

| Principio | Evaluación | Aplicación al plan |
|---|---|---|
| Especificaciones primero | Cumple | Esta entrega está definida por `spec.md` y se desglosará en tareas antes de redactar los documentos. |
| Contratos y titularidad | Cumple | La documentación reflejará controles observados y antecedentes contractuales; no cambiará el comportamiento del sistema. |
| Datos y diseño institucional | Cumple | Se documentarán fuentes institucionales y datos de demostración solo cuando las fuentes los acrediten. |
| Evidencia | Cumple | Los hechos actuales citarán archivos o especificaciones; se registrará la verificación de rutas y renderizado. |
| Cambios mínimos | Cumple | El alcance es solo documental; no se refactoriza ni modifica código funcional. |
| Stack y dependencias | Cumple | No se cambia stack ni se agrega dependencia; Markdown y Mermaid son formatos de documentación. |
| Seguridad | Cumple | No se incluirán secretos, hashes ni datos personales innecesarios; la descripción de controles se limitará a evidencia. |
| Base de datos | Cumple | No se altera el esquema ni los datos; se describe SQLite/libSQL según las fuentes observadas. |
| Verificación | Cumple | La verificación propia de esta capa consiste en nombres exactos, referencias y renderizado Mermaid. |
| Pruebas | Cumple | No se introducen suites ni herramientas de pruebas; se documenta únicamente el estado respaldado por fuentes. |
| Referencias | Cumple | Se consultarán los contratos y modelos heredados de `docs/legacy/openspec/`. |
| Arquitectura documentada | Cumple | La funcionalidad crea la documentación arquitectónica antes de cualquier implementación arquitectónica futura. |
| Idioma | Cumple | Todos los documentos del entregable se redactan en español. |

No hay excepciones constitucionales ni decisiones que requieran justificar dependencias.

## Estructura del proyecto

### Artefactos de planificación

```text
specs/008-documentacion-arquitectura/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md                 # Se genera en la fase de tareas
```

No se crea `contracts/`: esta funcionalidad produce documentación interna y no expone una interfaz nueva a usuarios o sistemas externos.

### Documentación de producto (esta funcionalidad)

```text
docs/
├── 01-analisis-de-sistema/
│   ├── 01-actores.md
│   ├── 02-historias-del-usuario.md
│   ├── 03-requisitos-funcionales.md
│   ├── 04-atributos-de-calidad.md
│   ├── 05-restricciones.md
│   ├── 06-driver-arquitectonicos.md
│   ├── 07-decisiones-arquitectonicas.md
│   └── 08-escenarios-atributos-calidad.md
├── 02-arquitectura-software/
│   ├── arquitectura-inicial.md
│   ├── componentes-arquitectonicos.md
│   ├── enfoque-aquitectonico.md
│   └── estilo-arquitectonico.md
├── 03-diseño-de-software/
│   └── diseño-interno/
│       ├── diseño-interno-de-modulos.md
│       ├── patrones-de-diseño.md
│       └── principios-de-diseño.md
└── 04-modelo-c4/
    ├── Nivel1-DiagramadeContextodelSistema.md
    ├── Nivel2-DiagramadeContenedores.md
    ├── Nivel3-Diagrama-de-Componentes.md
    └── Nivel4-DiagramadeCodigo.md
```

**Decisión de estructura**: Se conservan literalmente las rutas requeridas por FR-001, incluida la grafía `enfoque-aquitectonico.md` y el nombre sin guiones `Nivel4-DiagramadeCodigo.md`. Las carpetas reflejan el agrupamiento de historias de usuario de la especificación. `docs/legacy/` permanece como referencia existente.

## Estrategia de diseño

1. Consolidar una matriz de fuentes: cada historia de usuario se extrae de `specs/001` a `specs/006`; los RF se derivan de requisitos y rutas verificadas y conservan IDs fuente o reciben IDs locales con su origen. OpenSpec se cita como antecedente y no como inventario completo de RF.
2. Contrastar el estado actual con `server/src/index.js`, los módulos funcionales directamente bajo `server/src/`, `server/prisma/schema.prisma` y las rutas bajo `client/app/`. Describir la composición real de `registrarX` con las dependencias que muestre cada firma; señalar las carpetas vacías verificadas y el uso de SQLite local con adaptador libSQL.
3. Redactar análisis, arquitectura y diseño separando hechos observados y objetivos Sprint 2. Etiquetar toda métrica literalmente como `propuesta, pendiente de validación del equipo` y declarar las métricas actuales no medidas cuando corresponda.
4. Construir los cuatro niveles C4 con bloques Mermaid `flowchart`, usando solo elementos y relaciones respaldados por fuentes. Añadir debajo de cada diagrama límites, explicación y trazabilidad.
5. Validar el inventario exacto de 19 rutas, español, referencias, separación de estados y renderizado de los cuatro diagramas. No instalar herramientas ni dependencias para la validación.

## Seguimiento de complejidad

No hay violaciones de constitución ni complejidad adicional que justificar.
