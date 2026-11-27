# Especificación: Trámites académicos con matrículas compatibles

**Rama de funcionalidad**: `022-unificar-demostracion-matriculas`  
**Creada**: 2026-11-26  
**Estado**: En implementación  
**Entrada**: Corrección integral de Grado de Doctor y Título de Segunda Especialidad usando la experiencia funcional de Grado de Maestro, selección por matrículas compatibles, cuenta integral de demostración y verificación real de los recorridos.

## Escenarios de usuario y pruebas

### Historia 1: Elegir una matrícula compatible (Prioridad: P1)

Como estudiante con más de un programa académico, quiero iniciar cada trámite usando la matrícula que corresponde, para que el sistema no asuma que mi primer programa es el único.

**Prueba independiente**: Consultar las matrículas del usuario autenticado y crear una solicitud por cada tipo de trámite permitido, además de comprobar que una cuenta solo-maestría no puede iniciar Doctorado.

**Criterios de aceptación**:

1. Maestría habilita Grado de Maestro; Doctorado habilita Grado de Doctor; Segunda Especialidad habilita Título de Segunda Especialidad. La relación se determina por el tipo e identificador del programa registrado, no por comparar nombres visibles.
2. Se listan únicamente matrículas del usuario autenticado. Con una sola matrícula elegible se selecciona automáticamente; con varias se exige elegir el programa compatible.
3. El borrador y expediente conservan el ID de la matrícula y el programa elegidos. Una matrícula suspendida, retirada, futura o deshabilitada no permite crear ni presentar la solicitud.
4. Sin matrícula compatible se informa el motivo real y se muestran solo los trámites disponibles para esa cuenta.

### Historia 2: Completar los tres asistentes (Prioridad: P1)

Como estudiante, quiero completar el mismo flujo de cinco pasos para los tres trámites, para adjuntar requisitos, retomar borradores y consultar expedientes sin inconsistencias.

**Prueba independiente**: Para cada trámite, abrir el asistente, consultar requisitos del programa seleccionado, adjuntar/ver/reemplazar/retirar archivos en borrador, guardar y recuperar un borrador, presentarlo y consultarlo en Mis Trámites.

**Criterios de aceptación**:

1. Los pasos cubren datos personales, información académica, requisitos, documentos y confirmación/presentación.
2. Los requisitos corresponden a la matrícula y tipo de trámite seleccionados; los requisitos de demostración se identifican como pruebas y no como normativa oficial.
3. Los botones de navegación, consulta, descarga, orientación, selección, adjuntos, guardado, cancelación, presentación y consulta de expediente ejecutan una acción real y dan retroalimentación comprensible.
4. Cada solicitud persiste con un código único y aparece en Mis Trámites después de cerrar e iniciar sesión de nuevo.
5. Se preservan titularidad, controles académicos, publicación de requisitos y estados del expediente.

### Historia 3: Preparar datos integrales aislados para desarrollo (Prioridad: P2)

Como equipo de desarrollo, quiero una semilla repetible que prepare una cuenta con matrículas de Maestría, Doctorado y Segunda Especialidad, para comprobar los tres flujos con la misma sesión.

**Prueba independiente**: Ejecutar la semilla dos veces en PostgreSQL local de desarrollo, confirmar tres matrículas y requisitos habilitados para la cuenta integral, y comprobar que el comando rechaza producción y hosts remotos.

**Criterios de aceptación**:

1. La semilla es idempotente, mantiene los registros académicos existentes y no modifica usuarios reales ni expedientes no identificados como demostración.
2. Solo se ejecuta con `NODE_ENV=development` y PostgreSQL local; las cuentas y programas de prueba permanecen ocultos fuera del modo de demostración y en producción.
3. Cada programa de prueba tiene trámite compatible, configuración habilitada y requisitos documentales/académicos identificados como demostración.
4. Las credenciales seed no se imprimen en consola, se guardan fuera de Git y el seed no sobrescribe contraseñas preexistentes.

### Historia 4: Verificar el comportamiento de extremo a extremo (Prioridad: P2)

Como responsable de la aplicación, quiero evidencia reproducible de los recorridos y sus límites, para confirmar la corrección sin declarar aprobaciones no ejecutadas.

**Prueba independiente**: Ejecutar los 14 casos definidos en `quickstart.md` contra el portal y API locales conectados a PostgreSQL de desarrollo y registrar resultados reales.

**Criterios de aceptación**:

1. Los casos CP01–CP12 comprueban autenticación, consulta de matrículas, los tres trámites, sus requisitos, adjuntos, borradores, presentación, expedientes y persistencia tras una nueva sesión.
2. CP13 confirma el bloqueo de una cuenta sin matrícula compatible; CP14 confirma que Grado de Maestro conserva su funcionamiento.
3. Las capturas muestran las vistas relevantes de los tres asistentes y no incluyen contraseñas, tokens ni datos personales reales.
4. Un caso solo se marca aprobado después de ejecutarse y conservar evidencia verificable.

## Casos límite

- El usuario autenticado no tiene ninguna matrícula o su matrícula corresponde a otro tipo de trámite.
- Existen varias matrículas del mismo tipo, pero algunas están deshabilitadas o no tienen requisitos publicados.
- El programa está inactivo, el trámite deshabilitado, la plantilla sin publicar o faltan requisitos obligatorios.
- Se pierde la conexión al cargar un archivo, guardar un borrador o presentar.
- Un usuario intenta leer, modificar o retirar un expediente o archivo de otra persona.
- La semilla se repite, encuentra datos heredados o se intenta ejecutar fuera de PostgreSQL local de desarrollo.

## Requisitos funcionales

- **RF-001**: El sistema consultará todas las matrículas del usuario autenticado y filtrará las elegibles por tipo de programa y trámite.
- **RF-002**: El sistema resolverá la compatibilidad mediante los identificadores y tipos registrados; no dependerá de nombres de programa codificados como reglas.
- **RF-003**: El sistema mantendrá las validaciones de estado académico, vigencia, habilitación, programa activo, configuración del trámite, publicación y actividad de requisitos.
- **RF-004**: El cliente permitirá selección explícita cuando haya más de una matrícula elegible y selección automática cuando exista exactamente una.
- **RF-005**: El backend rechazará programa ajeno, tipo incompatible, titularidad no coincidente y estados académicos no habilitados.
- **RF-006**: El asistente reutilizará el flujo existente de Grado de Maestro y cargará datos, requisitos, borradores, archivos y expediente según el programa seleccionado.
- **RF-007**: Adjuntos y expedientes estarán protegidos por titularidad; retirar un documento de borrador conservará su historial y reemplazarlo mantendrá la trazabilidad.
- **RF-008**: Los mensajes diferenciarán falta de matrícula, requisitos no publicados, trámite deshabilitado, permisos insuficientes y error de conexión.
- **RF-009**: La semilla creará o reconciliará solo datos de demostración en PostgreSQL local de desarrollo, sin cambiar cuentas/expedientes reales ni ejecutar operaciones destructivas.
- **RF-010**: La demostración se excluirá en producción y se identificará como no oficial en sus datos e interfaz.
- **RF-011**: Los botones del alcance enumerado en el adjunto estarán conectados a navegación, API o acciones correspondientes; se eliminarán destinos vacíos solo cuando pertenezcan a estos flujos.
- **RF-012**: El sistema conservará los borradores y expedientes entre sesiones y mostrará cada trámite en Mis Trámites.
- **RF-013**: La guía de verificación enumerará CP01–CP14; reportará estado y evidencia solo tras la ejecución real.
- **RF-014**: La corrección no alterará el diseño institucional, inicio, header, footer, menús ni login, ni debilitará el trámite de Maestro o controles académicos.

## Entidades principales

- **Usuario**: identidad autenticada y titular de sus matrículas, borradores y expedientes.
- **Programa académico**: tipo académico, estado y configuración del trámite.
- **Matrícula**: relación del estudiante con un programa, con estado, vigencia y habilitación independiente.
- **Plantilla de requisito**: requisito publicado para un programa y tipo de trámite.
- **Solicitud/expediente**: trámite ligado al usuario, matrícula y programa seleccionados, con validaciones, documentos e historial.
- **Documento**: archivo privado adjunto a una solicitud, reemplazable o retirado durante el borrador.

## Criterios de éxito

- **CE-001**: La cuenta integral inicia y completa un trámite compatible para cada uno de los tres programas sin cambiar de usuario.
- **CE-002**: Las 14 pruebas CP01–CP14 tienen resultados registrados; todos los casos aplicables pasan y los bloqueos negativos rechazan el acceso esperado.
- **CE-003**: Los tres expedientes aparecen después de una sesión nueva y cada uno conserva su programa, matrícula y código independiente.
- **CE-004**: Grado de Maestro mantiene todos los comportamientos previos cubiertos por sus pruebas.
- **CE-005**: El seed repetido no duplica cuentas, matrículas, programas ni requisitos y no cambia datos reales.
- **CE-006**: Producción no expone usuarios, programas o requisitos de demostración.

## Supuestos

- Se reutilizan el esquema Prisma, endpoints, autenticación y modelo de expedientes existentes; solo se agregan migraciones si la comparación identifica un campo/relación faltante indispensable.
- El PostgreSQL apuntado por el servidor para esta tarea debe comprobarse como local y de desarrollo antes de ejecutar seeds o flujos que presenten solicitudes.
- Los PDFs de prueba son sintéticos y no contienen información personal.
- Las fuentes normativas oficiales quedan fuera de esta corrección; los requisitos de demostración se rotulan explícitamente y no las sustituyen.
