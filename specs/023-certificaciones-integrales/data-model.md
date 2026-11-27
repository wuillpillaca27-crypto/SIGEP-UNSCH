# Modelo de datos

## Modelo existente reutilizado

- **Programa**: tipo, nombre, estado y configuración del trámite. Una oferta de demostración se marca como tal y se filtra fuera de producción.
- **Estudiante**: relación titular-programa, estado académico, rango de matrícula, habilitación y agregados académicos existentes. No representa módulos cursados ni calificaciones individuales.
- **PlantillaRequisito**: tipo de trámite, programa, obligatoriedad, clase, publicación/estado y texto.
- **Solicitud**: usuario, estudiante/matrícula, programa, tipo, código y estado.
- **ValidacionRequisito**: requisitos congelados en la solicitud, resultado, observación y responsable.
- **DocumentoSolicitud**: archivo privado, MIME, tamaño, propietario, versión/reemplazo y retiro.
- **Revision e HistorialEstado**: revisión, actor, transiciones y fechas.

## Historial académico no modelado

El esquema vigente carece de entidades para diplomado cursado, módulo/curso, matrícula por periodo, nota, créditos/horas de cada módulo y reglas de selección individual/múltiple. No se debe inferir aprobación desde `creditosAprobados`, `promedioGeneral` o un nombre de programa. La implementación de validación granular queda bloqueada hasta definir una fuente institucional o un modelo de fixture demo claramente separado.

## Integridad y seguridad

El servidor obtiene usuario y matrículas de la sesión, verifica programa/tipo/estado y filtra datos ajenos. Los documentos conservan almacenamiento privado. Cualquier futura entidad de cursado debe relacionarse con estudiante/programa, guardar periodo y resultado normalizados y tener prueba de acceso cross-user denegado.
