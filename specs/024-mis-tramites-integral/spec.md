# Especificación: Mis Trámites integral

**Feature Branch**: `024-mis-tramites-integral`  
**Creada**: 2026-11-26  
**Estado**: En implementación  
**Entrada**: Completar los seis módulos de Mis Trámites con información persistida, acciones reales, seguridad y pruebas en desarrollo.

## Historias de usuario y pruebas

### Historia 1: Consultar un panel personal (P1)

Como estudiante autenticado quiero ver mi nombre, conteos reales de solicitudes por estado, observaciones pendientes, certificados disponibles, actividad y accesos rápidos.

**Prueba independiente**: comparar los indicadores con filas propias en PostgreSQL de pruebas; confirmar estado vacío, error reintentable y ausencia de datos de otro usuario.

1. Dadas solicitudes en varios estados, al abrir el panel los indicadores reflejan exactamente las del usuario.
2. Dada una sesión vencida o una caída de red, se informa la causa y se permite reintentar o iniciar sesión.

### Historia 2: Crear y administrar solicitudes (P1)

Como estudiante quiero elegir un trámite habilitado por mis matrículas, crear y recuperar borradores, administrar documentos y presentar la solicitud.

**Prueba independiente**: recorrer Maestro, Doctor, Segunda Especialidad, Diplomado y Módulos con cuentas/fixtures elegibles; verificar persistencia, expediente único y bloqueo de programa ajeno.

1. El catálogo deriva opciones de programas/matrículas reales y no preselecciona una opción incompatible.
2. El borrador se conserva al cambiar de ruta o sesión; documentos reemplazados conservan historial.
3. El estudiante puede eliminar solo un borrador propio; solicitudes presentadas se modifican solo por flujos autorizados.
4. La presentación valida requisitos y previene duplicados conforme a las reglas actuales.

### Historia 3: Consultar solicitudes y expedientes (P1)

Como estudiante quiero buscar, filtrar, ordenar y paginar mis solicitudes, y consultar el estado y movimientos reales de cada expediente.

**Prueba independiente**: varios expedientes propios y ajenos, distintas fechas/programas/estados; comprobar filtros, acciones por estado, timeline y progreso derivado de movimientos reales.

1. La lista incluye códigos, trámite, programa, fechas, estado y acciones permitidas.
2. Los filtros por texto, tipo, estado, programa y fecha se combinan, limpian y conservan propiedad.
3. El progreso se calcula desde el historial registrado; no aparecen porcentajes/fechas estimadas inventadas.

### Historia 4: Resolver observaciones y subsanar (P1)

Como estudiante quiero entender cada observación, consultar documentos y cargar una corrección versionada; el personal revisa y decide el resultado.

**Prueba independiente**: registrar observación con usuario administrativo, verla solo en la cuenta titular, enviar archivo/comentario, conservar versión anterior y comprobar que el expediente vuelve a revisión sin autoaprobación.

1. La bandeja muestra requisito, motivo, fecha, etapa y acción requerida.
2. Archivo, tipo, tamaño, titularidad y estado se validan en servidor.
3. Las versiones previas no se sobrescriben; el envío crea movimiento y el personal debe revisar.

### Historia 5: Consultar historial y documentos (P2)

Como estudiante quiero consultar todos mis movimientos, observaciones resueltas, constancias y documentos emitidos, con filtros por año/tipo/estado.

**Prueba independiente**: recorrer expedientes en estados distintos y verificar orden, filtros, descargas con permisos y códigos de verificación.

1. El historial es inmutable para el estudiante y deriva sus movimientos de los registros persistidos.
2. Solo documentos emitidos/autorizados se descargan como certificados; la verificación no revela datos personales innecesarios.

### Historia 6: Recibir notificaciones internas (P2)

Como estudiante quiero recibir y marcar notificaciones asociadas a mis expedientes cuando cambia su estado o requiere acción.

**Prueba independiente**: generar eventos desde presentación, observación, subsanación, decisión y emisión; comprobar destinatario, contador, lectura y enlace seguro.

1. Las notificaciones se crean en la misma transacción lógica del evento de expediente, no mediante envíos simulados.
2. Solo el destinatario consulta o marca sus notificaciones; marcar todas como leídas es idempotente.
3. El correo solo se integra si existe un proveedor configurado; en ausencia de este, la notificación interna sigue persistiendo.

## Requisitos funcionales

- **FR-001**: Las seis páginas requieren sesión de estudiante y conservan retorno al login.
- **FR-002**: El panel calcula conteos, actividad y documentos a partir de registros propios.
- **FR-003**: Nueva Solicitud lista únicamente programas/trámites autorizados por matrícula y mantiene validación en backend.
- **FR-004**: Borradores se recuperan; solo borradores propios pueden eliminarse y toda acción destructiva pide confirmación.
- **FR-005**: Mis Solicitudes ofrece búsqueda, filtros combinables, orden y paginación, con acciones según estado.
- **FR-006**: El estado muestra timeline e hitos reales con fecha/actor/motivo disponibles; nunca inventa áreas o fechas.
- **FR-007**: Observaciones y subsanaciones filtran por titular, guardan comentarios y conservan las versiones de documentos.
- **FR-008**: El personal autorizado decide la subsanación; el servidor valida roles y transición.
- **FR-009**: Historial permite filtros por año, tipo y estado y acceso a descargas que el usuario pueda ver.
- **FR-010**: Notificaciones internas persistentes soportan listado, contador y marcado individual/masivo como leído.
- **FR-011**: Todas las rutas y operaciones verifican sesión, rol, titularidad, identificadores y estado en el backend.
- **FR-012**: Errores de conexión, sesión, validación, no encontrado y permiso tienen mensajes recuperables diferenciados.
- **FR-013**: Cambios de esquema son aditivos, versionados y transaccionales; prohibidos reset, `db push` destructivo y migración SQLite como parte de esta funcionalidad.
- **FR-014**: Cuentas, notificaciones, archivos y expedientes de demostración se limitan a desarrollo; los datos oficiales no se inventan.
- **FR-015**: La interfaz conserva el diseño institucional, navegación y comportamiento de Grados/Títulos y Certificaciones.

## Casos límite

- Sin solicitudes, historial, observaciones o notificaciones.
- Sesión ausente/expirada, API no disponible, respuesta vacía o error inesperado.
- Solicitud/documento/notificación con ID malformado, inexistente o de otro usuario.
- Expediente finalizado, borrador presentado concurrentemente, observación ya resuelta o transición obsoleta.
- Archivo inválido, excesivo, no PDF, propietario incorrecto o reemplazo durante revisión.
- Filtros sin resultados, fecha inválida y páginas fuera del rango.
- Operador sin permiso de autoridad que intenta aprobar o emitir.

## Entidades clave

Usuario/Estudiante/Matrícula, Programa, Solicitud/Expediente, Validación de requisito, Documento con versiones, Revisión, Historial de estado, Auditoría y Notificación.

## Criterios de éxito

- **SC-001**: Los seis módulos consumen datos del usuario autenticado y no exponen registros de otras cuentas.
- **SC-002**: Los conteos del panel coinciden con consultas de base de datos para todos los estados representados.
- **SC-003**: Borrador, presentación, observación, subsanación, revisión e historial persisten a través de sesión nueva.
- **SC-004**: El 100% de las acciones visibles se habilita solo cuando el estado y rol las permiten y produce respuesta comprobable.
- **SC-005**: CP01–CP45 se documentan con resultado real; ninguna prueba se marca aprobada por inferencia.
- **SC-006**: Jest del servidor/cliente y build pasan sin regresión a login, certificados, navegación o roles.

## Supuestos y límites

- Reutilizar `Solicitud`, `DocumentoSolicitud`, `ValidacionRequisito`, `Revision`, `HistorialEstado` y `Auditoria`; no crear un segundo sistema de expedientes.
- No se inventan áreas, plazos de subsanación, notificaciones por email, políticas de retención ni normativa. Si el modelo no guarda un dato, se omite o muestra “no disponible”.
- Cualquier tabla nueva se limita a lo estrictamente necesario (notificación interna) y requiere migración aditiva probada.
- “Listo para usar” aplica al entorno de desarrollo; producción depende de autorizaciones y servicios institucionales.
