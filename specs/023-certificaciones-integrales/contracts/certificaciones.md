# Contrato de Certificaciones

## Catálogo público

- `GET /api/catalogo-grados/{tipoTramite}` lista programas activos y habilitados.
- `GET /api/catalogo-grados/{tipoTramite}/{programaId}` entrega plantillas activas del programa y, si existen, información normativa publicada y formatos HTTPS.
- Los registros demo son visibles solo con modo de desarrollo y se identifican; no se mezclan con publicaciones oficiales.

## Solicitudes autenticadas

- `GET /api/solicitudes/opciones-certificacion` requiere rol estudiante; devuelve únicamente programas/matrículas del usuario y causas de inelegibilidad.
- `POST /api/solicitudes` requiere tipo permitido y programa propio elegible; la autorización se recalcula en el servidor.
- Las operaciones de borrador, documentos, presentación, subsanación y desistimiento respetan propietario, estado y requisitos.
- La respuesta de catálogo académico individual no existe todavía; no aceptar una selección de módulo/diplomado como prueba de aprobación.

## Revisión y emisión

- Las acciones administrativas requieren roles existentes y transiciones admitidas por el backend.
- La emisión demo debe ser explícitamente no oficial y limitada a desarrollo. El acceso público por código no devuelve datos personales innecesarios.
