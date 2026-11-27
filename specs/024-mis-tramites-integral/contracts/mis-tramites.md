# Contratos de Mis Trámites

Todas las rutas requieren cookie de sesión; las operaciones de estudiante filtran por `req.usuario.id`.

- `GET /api/solicitudes`: solicitudes propias, filtros opcionales y paginación documentada.
- `DELETE /api/solicitudes/{id}`: elimina solamente un borrador propio, con su metadata en transacción. No acepta otros estados.
- `GET /api/solicitudes/notificaciones`: bandeja propia ordenada, con contador no leído.
- `PATCH /api/solicitudes/notificaciones/{id}/leer`: marca una notificación propia como leída.
- `PATCH /api/solicitudes/notificaciones/leer-todas`: marca las notificaciones propias no leídas; operación idempotente.
- Transiciones administrativas conservan los endpoints existentes; eventos de notificación se agregan dentro de sus transacciones.
- `GET /api/solicitudes/{id}/documentos/{documento}` conserva acceso solo para titular o personal autorizado.

Respuestas de error distinguen sesión ausente (401), permiso/titularidad (404 para recurso ajeno), estado incompatible (409), entrada inválida (400) y servicio no disponible (503).
