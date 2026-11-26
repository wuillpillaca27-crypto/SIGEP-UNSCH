# Implementation Plan: Solicitud de certificaciones habilitadas

**Branch**: `016-certificaciones-habilitadas` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Corregir la elegibilidad de Certificaciones consultando la matrícula autenticada y los requisitos activos del programa asociado. Separar este flujo visual del asistente existente de Grados y Títulos, redirigir al login cuando falte sesión y mantener persistencia y validación de expedientes en los servicios actuales. No se crea ni activa oferta académica oficial.

## Technical Context

**Language/Version**: TypeScript y React 19; Node.js CommonJS.

**Primary Dependencies**: Next.js 16, Express 5, Prisma 7, PostgreSQL, JWT, bcryptjs y Jest; dependencias existentes.

**Storage**: PostgreSQL mediante PrismaPg; documentos privados en el almacenamiento configurado.

**Testing**: Jest con cobertura en `client/` y `server/`; `npm run build` en `client/`.

**Target Platform**: Navegador web y servidor Node.js.

**Project Type**: Aplicación web con frontend y API.

**Performance Goals**: Consultar sesión y opciones de elegibilidad con una lectura por recurso y sin consultas repetidas por renderizado.

**Constraints**: No cambiar header, portada, login ni el asistente de Grados y Títulos; no exponer programas ajenos; no agregar ofertas o requisitos oficiales; no cambiar el esquema relacional; conservar seguridad, titularidad y flujo de estados.

**Scale/Scope**: Un registro de matrícula por cuenta de estudiante conforme al modelo actual; dos tipos de certificación; un asistente y un contrato de opciones autenticado.

## Constitution Check

- Especificación, plan, tareas y verificación siguen el flujo Spec Kit: PASS.
- Reutiliza contratos y titularidad del modelo de solicitudes: PASS.
- No cambia el esquema; por tanto, no requiere migración: PASS.
- No agrega programas o requisitos oficiales, y distingue fixtures de prueba: PASS.
- Evita refactorizar Grados y Títulos y mantiene accesible la navegación institucional existente: PASS.
- Ejecutará pruebas Jest con cobertura y build del frontend afectado: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/016-certificaciones-habilitadas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── opciones-certificacion.md
└── tasks.md
```

### Source Code

```text
client/app/certificaciones/iniciar-solicitud/
├── page.tsx
└── asistente.tsx
client/app/grados-titulos/solicitudes-api.ts
server/src/
├── solicitudes.js
└── solicitudes.test.js
```

**Structure Decision**: Cambio acotado al flujo de Certificaciones con un asistente propio; se reutilizan funciones de expediente y se extienden el contrato de solicitudes y sus pruebas. No se modifica el flujo de Grados y Títulos ni el esquema Prisma.

## Complexity Tracking

No hay violaciones de la constitución que necesiten justificación.
