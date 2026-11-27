# Plan: Certificaciones integrales para desarrollo

**Feature Branch**: `023-certificaciones-integrales` | **Fecha**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Resumen

Completar de forma incremental los cuatro destinos de Certificaciones reutilizando el catálogo público, las solicitudes y expedientes existentes, la revisión administrativa y el seed local. Prioridad de implementación: descubrir huecos comprobables en páginas/APIs/tests; cerrar errores de navegación y catálogo; validar los flujos persistidos para diplomado y módulos con fuentes disponibles; habilitar revisión y documentos demo únicamente en desarrollo. No trasladar SQLite, no tocar la base `sigep` fuera del seed local ya autorizado y no publicar datos oficiales inventados.

## Contexto técnico

- Cliente: Next.js 16, React 19, TypeScript, Jest y Playwright existente.
- Servidor: Node.js/CommonJS, Express 5, Prisma 7, PostgreSQL, JWT/bcryptjs.
- Persistencia existente: Programa, Estudiante, PlantillaRequisito, Solicitud, ValidacionRequisito, DocumentoSolicitud, Revision e HistorialEstado.
- Verificación: suites Jest afectadas en servidor/cliente, build de cliente y pruebas E2E CP01–CP30 solo donde el modelo e integraciones existentes permitan observar el resultado.
- Restricciones: datos de prueba aislados; nunca escribir SQLite ni usar `sigep_test` para seed manual; migraciones aditivas versionadas; conservar auth/roles/ownership y navegación global.
- Hallazgo que limita la cobertura de historial académico: el esquema no tiene entidades de cursado por diplomado, módulo o nota. La semilla no debe falsificar ese historial. Antes de diseñar esa parte se debe decidir el modelo con registros fuente institucionales o una fixture de desarrollo claramente aislada.

## Revisión de constitución

- Spec Kit en español y verificación trazable: PASS.
- Reutilización de contratos/modelo y cambio mínimo: PASS como estrategia.
- No hay fuentes institucionales verificadas para costos, plazos, normativa, cursos o notas: no se atribuirá carácter oficial.
- Cambios de esquema requieren migración aditiva; no se usará `db push`, reset ni SQLite: PASS.
- Pruebas y build obligatorios antes de cerrar cambios funcionales: pendiente de implementación.

## Investigación y diseño

Los hallazgos, decisiones y límites están en [research.md](research.md). Las relaciones persistentes se describen en [data-model.md](data-model.md), y los contratos de catálogo, solicitud y administración están en [contracts/](contracts/). Casos ejecutables: [quickstart.md](quickstart.md).

## Organización de cambios

1. Auditar pruebas y endpoints actuales; establecer rutas y dataset demo seguros.
2. Implementar correcciones pequeñas a catálogo/UX y contrato según pruebas que fallen.
3. Verificar los flujos de solicitud existentes para certificación de diplomado y módulos y cerrar gaps sin aceptar parámetros del cliente como autorización.
4. Probar revisión, observaciones, emisión demo y verificación bajo roles autorizados, si las transiciones soportadas lo permiten.
5. Registrar explícitamente requisitos bloqueados por catálogo académico real, reglas oficiales, documentos/firma o decisiones de modelo.

## Migraciones

No crear migración hasta que el análisis identifique una entidad necesaria y se acuerde su origen de datos. Si se justifica, será aditiva, tendrá prueba contra PostgreSQL y seed de desarrollo reversible/idempotente, y se documentará antes de ejecutar. La migración de datos SQLite de spec 011 queda fuera de alcance y sigue requiriendo confirmación expresa.

## Riesgos y mitigaciones

- **No existe historial de módulos/diplomados en el esquema**: no aprobar por campos inventados; usar elegibilidad real existente o dejar señalado el bloqueo.
- **No hay contenido institucional oficial**: exponer vacío y orientación; nunca crear normativa ficticia.
- **Emisión oficial**: solo documentos demo marcados; producción requiere aprobación, plantillas, firma e integración institucional.
- **Árbol de trabajo con cambios previos**: revisar diffs por archivo; no revertir ni incluir cambios ajenos.
