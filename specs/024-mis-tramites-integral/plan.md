# Plan: Mis Trámites integral

**Feature Branch**: `024-mis-tramites-integral` | **Fecha**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Resumen

Completar los seis destinos reutilizando `Solicitud` como fuente única. Las páginas y varias operaciones ya existen; las brechas detectadas incluyen resumen reducido, filtros/acciones incompletos y ausencia de notificaciones persistentes. Los borradores se cancelan conservando auditoría; se mantienen las validaciones administrativas y los documentos versionados.

## Contexto técnico

- Frontend: Next.js 16, React 19, TypeScript, Jest/MSW.
- Backend: Express 5 CommonJS, Prisma 7/PostgreSQL, JWT en cookie HttpOnly.
- Persistencia existente: solicitudes, requisitos, documentos, revisiones, historial y auditoría.
- Cambio previsto: añadir entidad aditiva de notificación interna, API de lectura/acuse y emisión de eventos desde transiciones existentes; cancelación de borrador solo si `estado=borrador` y titularidad coincide; filtros del cliente sin confiar en permisos del cliente.
- Verificación realizada: Jest cliente 26 suites/76 pruebas; Jest servidor 13 suites/74 pruebas; build Next.js exitoso. Los 45 recorridos E2E siguen pendientes.
- Restricciones: no cambiar el menú institucional, portada, login ni módulos de Grados/Certificaciones; no tocar `specs/013` y `specs/015`; no imprimir secretos; no migrar SQLite; no reset/db push.

## Constitución

- Spec, plan, tareas y evidencias en español: PASS.
- Reutiliza el modelo común de expediente y ownership en servidor: PASS.
- La única tabla nueva propuesta es una notificación interna, sin correo externo: PASS, requiere migración aditiva.
- Ninguna área/plazo/notificación externa se inventa: PASS.
- Tests Jest y build obligatorios: PASS en ambas capas (resultados indicados arriba).

## Investigación

Los hallazgos se documentan en [research.md](research.md). Entidades y restricciones están en [data-model.md](data-model.md); endpoints en [contracts/mis-tramites.md](contracts/mis-tramites.md). Los recorridos están en [quickstart.md](quickstart.md).

## Fases

1. Pruebas de regresión y matriz de estados/permisos.
2. Migración aditiva de notificaciones y endpoints propiedad-scoped.
3. Integrar notificaciones con transiciones de solicitud/revisión de manera transaccional.
4. Completar tablero, filtros, paginación y acciones de solicitudes/expedientes.
5. Asegurar observaciones, subsanación, versiones, historial y enlaces de descarga.
6. Ejecutar cobertura y build; los E2E sintéticos CP01–CP45 quedan pendientes de automatización/ejecución.

## Riesgos

- La tabla `Revision` puede carecer de área institucional; la interfaz no inventa esa información.
- No existe proveedor de correo configurado; el alcance es notificación interna persistente.
- Cancelar borrador conserva integridad de auditoría y archivos sin destruir registros ni borrar archivos subidos.
- Historial, timeline y progreso se derivan de `HistorialEstado`, nunca de porcentajes arbitrarios.
