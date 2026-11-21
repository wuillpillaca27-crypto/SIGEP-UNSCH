<!-- Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles: none; all four existing principles are preserved verbatim.
Added sections: Cambios mínimos; Stack y dependencias; Seguridad; Base de datos; Verificación; Referencias; Idioma; Governance.
Removed sections: none.
Follow-up TODOs: none.
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

No reescribir ni refactorizar código que ya funciona salvo que la especificación lo requiera. Respetar la arquitectura y las convenciones actuales del proyecto para reducir regresiones y mantener la coherencia del sistema.

## Stack y dependencias

Mantener el stack existente: `client/` usa Next.js 16, React 19, TypeScript y Tailwind CSS 4; `server/` usa Node.js, Express 5 en CommonJS, Prisma 7 con libSQL, JWT, bcryptjs y Google OAuth. No cambiar el stack ni agregar dependencias sin justificarlo en el plan.

## Seguridad

Nunca incluir secretos ni archivos `.env` en commits. Validar las entradas en el servidor y no exponer hashes ni otros datos sensibles.

## Base de datos

Todo cambio del esquema Prisma requiere una migración documentada en el plan. Las migraciones deben preservar los datos existentes.

## Verificación

Antes de cerrar una tarea, ejecutar `npm run build` en `client/` y `npm start` en `server/`; ambos deben terminar sin errores. Las pruebas del servidor usan `node --test`.

## Referencias

Usar `docs/legacy/openspec/api-contracts.md` y `docs/legacy/openspec/data-models.md` como referencias para los contratos y modelos de datos.

## Idioma

Redactar las especificaciones y la documentación del proyecto en español.

## Governance

La constitución rige las decisiones y revisiones del proyecto. Toda enmienda debe conservar los principios vigentes salvo que una modificación explícita los cambie, documentar su impacto y actualizar la versión según SemVer: MAJOR para cambios incompatibles, MINOR para principios o secciones nuevas y PATCH para correcciones editoriales sin cambio de sentido. Antes de cerrar cada tarea, revisar su conformidad con estos principios y registrar la evidencia de verificación.

**Versión** 1.1.0 · **Ratificada** 2026-11-20 · **Última enmienda** 2026-11-21