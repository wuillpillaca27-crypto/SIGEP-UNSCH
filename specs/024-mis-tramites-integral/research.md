# Investigación: Mis Trámites

## Estado existente

- Las seis rutas están implementadas y comparten `Solicitud`/`Seguimiento`.
- `GET /api/solicitudes` filtra por titular; la API valida titularidad al acceder a documentos.
- `HistorialEstado`, `Revision` y `Auditoria` conservan los eventos del trámite.
- El panel ya calcula indicadores desde solicitudes propias y muestra actividad/notificaciones.
- La migración agrega notificaciones persistentes; las transiciones de presentación, observación, subsanación y revisión insertan avisos.
- La vista compartida ofrece filtros por texto/tipo/programa/estado/fecha, orden, paginación y progreso derivado de historial.

## Decisiones

1. Reutilizar el modelo de solicitud y sus relaciones; no duplicar expedientes ni historial.
2. Cancelar solo borradores del titular mediante la operación existente de desistimiento, con motivo e historial/auditoría; conservar registros y archivos.
3. Añadir una tabla `Notificacion` interna con referencia opcional al expediente, marca de lectura y destinatario. No integrar correo sin proveedor.
4. Crear notificaciones transaccionales dentro de la transacción del evento correspondiente.
5. No mostrar áreas ni plazos ausentes del modelo ni estimar fechas.
6. Aplicar filtros/paginación al conjunto propio; no aceptar `usuarioId` del cliente.

## Seguridad y migraciones

Las pruebas usan PostgreSQL de prueba en esquemas temporales. La migración `CREATE TABLE` es aditiva, con FK e índices; no modifica ni elimina datos existentes. No se ejecutó la migración de datos SQLite.

## Límite de verificación

Las suites Jest cliente/servidor y el build pasan. Los casos CP01–CP45 no se han ejecutado como E2E integral; permanecen como trabajo pendiente y no se consideran aprobados.
