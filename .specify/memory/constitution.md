<!-- Sync Impact Report
Cambio de versión: 1.1.0 → 1.2.0
Principios modificados: Cambios mínimos (refactorización dirigida explícitamente por especificación, respaldada por pruebas que preservan el comportamiento); Verificación (build y pruebas de la capa tocada).
Secciones añadidas: Pruebas; Arquitectura documentada.
Secciones eliminadas: ninguna.
Pendientes: Alinear con Jest las configuraciones existentes (Vitest en client y node --test en server); definir un comando build para server; crear los documentos actualmente ausentes de docs/01-analisis-de-sistema a docs/04-modelo-c4 antes de cambios arquitectónicos.
-->
# Constitución de SIGEP-UNSCH

## Especificaciones primero

Todo módulo o cambio funcional comienza con una especificación verificable en `specs/`, seguida por plan, tareas, implementación y verificación con Spec Kit. Conservar los artefactos previos de OpenSpec y Kiro como antecedentes del proyecto.

## Contratos y titularidad

Reutilizar los contratos y el modelo de expedientes. El servidor valida la identidad, titularidad y etapa de cada operación y protege los documentos asociados.

## Datos y diseño institucional

Usar las fuentes aprobadas por la UNSCH para publicar requisitos, plazos y montos oficiales. Identificar los datos de demostración. Mantener la navegación institucional y verificar el acceso con teclado y en móvil.

## Evidencia

Cada tarea se completa cuando existe evidencia de su criterio de aceptación. Registrar qué se probó y las integraciones pendientes.

## Cambios mínimos

No reescribir ni refactorizar código que ya funciona salvo que la especificación lo pida explícitamente. Se permite la refactorización dirigida por una especificación, incluida la aplicación de principios SOLID y patrones de diseño, cuando pruebas previas respalden el comportamiento existente y pruebas posteriores comprueben que se conserva. Respetar la arquitectura y las convenciones actuales del proyecto para reducir regresiones y mantener la coherencia del sistema.

## Stack y dependencias

Mantener el stack existente: `client/` usa Next.js 16, React 19, TypeScript y Tailwind CSS 4; `server/` usa Node.js, Express 5 en CommonJS, Prisma 7 con libSQL, JWT, bcryptjs y Google OAuth. No cambiar el stack ni agregar dependencias sin justificarlo en el plan.

## Seguridad

Nunca incluir secretos ni archivos `.env` en commits. Validar las entradas en el servidor y no exponer hashes ni otros datos sensibles.

## Base de datos

Todo cambio del esquema Prisma requiere una migración documentada en el plan. Las migraciones deben preservar los datos existentes.

## Verificación

Antes de cerrar una tarea, ejecutar el build y las pruebas de la capa tocada (`client/` o `server/`) con los comandos definidos para esa capa; ambos deben completarse sin errores.

## Pruebas

Usar Jest como framework de pruebas en `client/` y `server/`. Las ejecuciones de pruebas deben generar un reporte de cobertura.

## Referencias

Usar `docs/legacy/openspec/api-contracts.md` y `docs/legacy/openspec/data-models.md` como referencias para los contratos y modelos de datos.

## Arquitectura documentada

Respetar la arquitectura documentada en `docs/01-analisis-de-sistema` a `docs/04-modelo-c4`. Antes de implementar un cambio arquitectónico, actualizar los documentos correspondientes; si alguno todavía no existe, crearlo antes de implementar el cambio.

## Idioma

Redactar las especificaciones y la documentación del proyecto en español.

## Governance

La constitución rige las decisiones y revisiones del proyecto. Toda enmienda debe conservar los principios vigentes salvo que una modificación explícita los cambie, documentar su impacto y actualizar la versión según SemVer: MAJOR para cambios incompatibles, MINOR para principios o secciones nuevas y PATCH para correcciones editoriales sin cambio de sentido. Antes de cerrar cada tarea, revisar su conformidad con estos principios y registrar la evidencia de verificación.

**Versión** 1.2.0 · **Ratificada** 2026-11-20 · **Última enmienda** 2026-11-21