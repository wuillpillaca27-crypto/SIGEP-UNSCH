# Guía de validación de la documentación

## Requisitos previos

- Repositorio con las fuentes de `specs/001` a `specs/008`, `server/src/`, `server/prisma/schema.prisma`, `client/app/` y `docs/legacy/openspec/` disponibles para revisión.
- Vista previa Markdown de GitHub para comprobar el renderizado Mermaid. No se instalan dependencias ni se ejecutan scripts de aplicación.

## Comprobar los 19 archivos

Comparar la entrega contra el inventario exacto en [spec.md, FR-001](spec.md#requisitos). Confirmar que existen todas las rutas y que no se sustituyen los nombres con grafías alternativas. El inventario debe contener ocho documentos de análisis, cuatro de arquitectura, tres de diseño interno y cuatro C4.

## Revisar contenido y trazabilidad

Para cada documento, comprobar:

1. Está redactado en español e incluye un resumen comprensible.
2. Separa `Implementado hoy` de `Objetivo Sprint 2`; toda afirmación actual remite a una fuente.
3. Los RF/HU/escenarios conservan su identificador fuente o presentan el identificador local junto con archivo y ubicación de origen.
4. Los atributos cubren rendimiento, seguridad, disponibilidad, mantenibilidad y trazabilidad/auditoría. Cada métrica propuesta incluye `propuesta, pendiente de validación del equipo`; las métricas actuales no disponibles se marcan como no medidas.
5. Las rutas, firmas registradoras, carpetas vacías y el motor SQLite/libSQL reflejan las fuentes reales, no propuestas históricas.

## Verificar los diagramas Mermaid

Abrir en la vista previa de GitHub estos cuatro archivos y confirmar que cada bloque se renderiza como diagrama, contiene el nivel C4 correcto y mantiene visibles las etiquetas:

- `docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md`
- `docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`
- `docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`
- `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`

Los bloques deben usar el fence `mermaid` y comenzar con `flowchart`. Si alguno no se representa, validar su sintaxis en [Mermaid Live Editor](https://mermaid.live/) y corregir únicamente la documentación.

## Resultado esperado

- Las 19 rutas enumeradas existen con sus nombres exactos.
- Los cuatro diagramas se muestran como gráficos en GitHub Markdown.
- No se modificaron archivos de `client/` o `server/`, el esquema ni las dependencias del proyecto.
