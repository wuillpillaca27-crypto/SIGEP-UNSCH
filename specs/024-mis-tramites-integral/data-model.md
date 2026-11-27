# Modelo de datos

## Entidades existentes

- `Usuario` tiene rol e identidad; `Estudiante` vincula usuario y programa.
- `Solicitud` tiene propietario, programa, tipo y estado.
- `DocumentoSolicitud` conserva archivos privados, metadatos de reemplazo y retiro.
- `ValidacionRequisito` conserva resultado/observación por plantilla.
- `Revision`, `HistorialEstado` y `Auditoria` conservan actor, acción, estado y fecha.

## Entidad aditiva: Notificacion

- `id`: identificador autogenerado.
- `usuarioId`: destinatario estudiante, requerido.
- `solicitudId`: expediente relacionado, opcional si el evento no aplica.
- `tipo`: código interno de evento permitido.
- `mensaje`: texto breve, sin secretos ni datos innecesarios.
- `leida`: booleano, inicialmente false.
- `creadoEn`, `leidaEn`: fechas persistidas.
- Índice `(usuarioId, leida, creadoEn, id)` para bandeja ordenada.
- FK al usuario; FK a solicitud con borrado nulo o cascada definida por la migración, preservando consistencia.

## Reglas

- El destinatario se deriva de la solicitud/usuario autenticado, nunca del payload.
- Lectura y marcado requieren `usuarioId` de la sesión.
- Marcar leída es idempotente y solo registra `leidaEn` la primera vez.
- El borrado de solicitud se permite únicamente para borradores propios; historial de solicitudes presentadas permanece inmutable.
