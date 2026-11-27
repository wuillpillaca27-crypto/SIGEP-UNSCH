# Validación local de Mis Trámites

Desde `server/`: `npx jest --runInBand --coverage`. Desde `client/`: `npm test -- --runInBand` y `npm run build`.

## Ejecución de esta implementación

- Cliente: 26 suites y 76 pruebas aprobadas, cobertura activada.
- Servidor: 13 suites y 74 pruebas aprobadas, cobertura activada; las suites PostgreSQL usan esquemas temporales de prueba.
- Build de Next.js: completado. Presenta la advertencia existente de múltiples archivos lock en la raíz.
- Pruebas UI añadidas para resumen/centro de notificaciones y filtros/paginación.
- Los casos CP01–CP45 aún no se han ejecutado como recorrido E2E integral.

Nunca mostrar `.env`, URL de base de datos, contraseñas, hashes ni tokens. Las suites de servidor apuntan a PostgreSQL de prueba; no se debe usar `sigep` para pruebas.

Recorridos pendientes de E2E: sesión y retorno; panel con conteos desde DB; catálogo; borrador crear/recuperar/cancelar propio; presentación y constancia; timeline; observación/subsanación con versiones; revisión administrativa; notificaciones y lectura; historial/descargas; ownership denegado; regresión de Grados y Certificaciones.

La cancelación de borradores conserva el registro y la auditoría. No se accedió al origen SQLite ni se migraron datos durante esta feature.
