# Expedientes académicos

## Purpose

Permitir a estudiantes y personal autorizado tramitar expedientes con evidencia y trazabilidad.

## ADDED Requirements

### Requirement: Asistente y borrador autenticados
El sistema SHALL precargar el perfil y guiar datos personales, requisitos, documentos y confirmación. SHALL guardar y recuperar borradores del propio estudiante, aplicar el catálogo por programa y calcular estados en servidor con evidencia.

#### Scenario: Retomar borrador
- **WHEN** el estudiante regresa al asistente con un borrador
- **THEN** recupera el programa, el tipo, los documentos y las validaciones guardados en la base de datos.

### Requirement: Documentos privados y presentación única
El sistema SHALL aceptar, visualizar y reemplazar archivos según la política del requisito. SHALL validar autenticación, titularidad, tipo y tamaño en servidor y almacenar los archivos fuera de rutas públicas. SHALL presentar de forma transaccional con un código único e historial.

#### Scenario: Reintento concurrente
- **WHEN** se repite una presentación válida del mismo borrador
- **THEN** se devuelve el mismo expediente y no se duplica el movimiento de presentación.

#### Scenario: Archivo ajeno
- **WHEN** una cuenta sin autorización intenta acceder al archivo
- **THEN** el sistema rechaza el acceso sin revelar la ubicación de almacenamiento.

### Requirement: Seguimiento y subsanación
El sistema SHALL mostrar código, tipo, fechas, estado, documentos, observaciones, próximos pasos e historial en Mis Trámites. SHALL aceptar una subsanación autorizada y notificar al estudiante de cambios u observaciones persistidos.

#### Scenario: Corrección solicitada
- **WHEN** el estudiante reemplaza los documentos observados y presenta la corrección
- **THEN** se conserva el historial y el expediente retorna a revisión.

### Requirement: Gestión administrativa y auditoría
El sistema SHALL permitir consultar, revisar, observar, validar, aprobar y reportar según el permiso de la cuenta y la etapa vigente. SHALL auditar las mutaciones con actor, entidad y fecha.

#### Scenario: Acción administrativa sin permiso
- **WHEN** una cuenta sin el permiso correspondiente intenta aprobar un expediente
- **THEN** se rechaza la transición sin modificar expediente ni historial.
