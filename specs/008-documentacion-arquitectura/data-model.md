# Modelo conceptual de la entrega documental

Esta funcionalidad no agrega tablas ni persiste datos de negocio. El modelo siguiente describe las unidades editoriales que organizan los documentos y su trazabilidad.

## Entidades

### Documento de arquitectura

Archivo Markdown perteneciente a uno de los cuatro grupos de entrega.

| Campo | Regla |
|---|---|
| Ruta | Debe coincidir exactamente con una de las 19 rutas de FR-001. |
| Resumen | Explica en español el propósito del documento a lectores no especializados. |
| Estado actual | Distingue hechos `Implementado hoy` respaldados por fuentes. |
| Estado futuro | Distingue `Objetivo Sprint 2`, propuesta o decisión pendiente. |
| Referencias | Identifica especificaciones, rutas de código o documentos de legado usados. |
| Trazabilidad | Vincula las afirmaciones a RF, HU, escenario o fuente verificable. |

### Componente

Parte del sistema documentada en análisis, arquitectura, diseño o diagramas. Puede ser una aplicación, módulo, servicio, entidad del esquema o integración externa. Su inclusión no afirma por sí sola que haya un flujo operativo: debe describirse el nivel de evidencia.

| Campo | Regla |
|---|---|
| Identificador/nombre | Nombre presente en la fuente o identificador local claramente explicado. |
| Tipo | Elemento del sistema, contenedor, componente, módulo, entidad o sistema externo. |
| Estado | Implementado, solicitado, propuesto o pendiente de validación, según evidencia. |
| Origen | RF, HU o escenario relacionado; si no aplica, archivo/documento que acredita su existencia. |
| Relaciones | Solo relaciones observadas o explícitamente marcadas como propuestas. |

### Escenario de atributo de calidad

Situación que organiza la evidencia y las metas propuestas de calidad.

| Campo | Regla |
|---|---|
| Atributo | Rendimiento, seguridad, disponibilidad, mantenibilidad o trazabilidad/auditoría. |
| Contexto y estímulo | Describe condición y evento con lenguaje verificable. |
| Respuesta | Separa la respuesta observada de la deseada. |
| Medida | Si es meta, incluir literalmente `propuesta, pendiente de validación del equipo`; señalar las mediciones ausentes como no medidas. |
| Fuente | Cita código, esquema o especificación que sustenta el escenario. |

### Elemento C4

Elemento visible en uno de los cuatro diagramas: contexto, contenedor, componente o unidad de código. Cada elemento debe respetar el nivel correspondiente y tener trazabilidad a RF, HU, escenario o fuente de existencia.

## Relaciones

```text
Documento de arquitectura 1 ── contiene ── 0..* Componentes
Documento de arquitectura 1 ── cita ───── 1..* Fuentes
Componente 0..* ────────────── traza a ─── 1..* RF/HU/Escenario/Fuente
Elemento C4 1 ──────────────── representa ─ 1 Componente o sistema externo
Escenario de calidad 0..* ──── describe ─── 1 Atributo de calidad
```

## Reglas de integridad editorial

1. No presentar como implementada una capacidad que solo aparezca en una propuesta o especificación.
2. Conservar IDs de origen y asociar IDs locales con archivo, sección y HU/escenario de origen.
3. Diferenciar roles de datos de roles con operaciones confirmadas; no inferir permisos por nombre.
4. Las relaciones diagramadas deben describir estructura observada, no una arquitectura futura objetivo.
5. Este modelo es conceptual; no representa ni modifica el esquema Prisma.
