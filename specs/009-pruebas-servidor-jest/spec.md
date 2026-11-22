# Feature Specification: Pruebas automatizadas con Jest del servidor

**Feature Branch**: `009-pruebas-servidor-jest`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: Pruebas automatizadas con Jest del servidor (`server/`) con reporte de cobertura, antes de cualquier refactor. Las pruebas describen el comportamiento actual; no se cambia código de producción.

## User Scenarios & Testing

### User Story 1 - Ejecutar y consultar la línea base de pruebas (Priority: P1)

Como desarrollador, quiero ejecutar las pruebas automatizadas del servidor y consultar sus resultados y cobertura, para conocer el comportamiento actual antes de iniciar cualquier refactor.

**Why this priority**: Sin un comando repetible y una línea base visible no se puede demostrar que los cambios posteriores conservan el comportamiento existente.

**Independent Test**: Ejecutar `npm test` desde `server/` y comprobar resultado por prueba, resumen de ejecución y reportes de cobertura de texto, HTML y lcov en `server/coverage/`.

**Acceptance Scenarios**:

1. **Given** el entorno de dependencias del servidor está instalado, **When** se ejecuta `npm test` en `server/`, **Then** se ejecutan las pruebas con Jest y el resultado muestra el nombre y estado de cada caso.
2. **Given** la suite termina, **When** se revisan sus artefactos, **Then** existen el resumen de cobertura de texto, el reporte HTML y el reporte lcov bajo `server/coverage/`, sin umbral de cobertura configurado como requisito de aprobación.
3. **Given** las pruebas existentes cubren solicitudes y catálogo, **When** se migran, **Then** permanecen todas sus aserciones y el escenario largo de solicitudes queda dividido en casos independientes.
4. **Given** las pruebas de integración requieren persistencia y HTTP, **When** se ejecutan, **Then** usan una base SQLite temporal real con Prisma/libSQL y una instancia Express en puerto aleatorio; no sustituyen esas dependencias por dobles.

---

### User Story 2 - Verificar listados y reportes de revisión (Priority: P2)

Como operador de revisión, quiero que las pruebas cubran los filtros y la paginación del listado y el reporte agrupado, para que los expedientes se consulten con el comportamiento vigente.

**Why this priority**: La revisión depende de localizar expedientes y consultar resúmenes consistentes antes de realizar acciones.

**Independent Test**: Ejecutar los casos de listado y reporte sobre SQLite temporal y verificar respuestas para filtros, límites, roles y agrupaciones.

**Acceptance Scenarios**:

1. **Given** expedientes con distintos tipos y estados, **When** se filtra por tipo o estado, **Then** el listado contiene solo las coincidencias correspondientes.
2. **Given** expedientes con distintos datos de búsqueda, **When** se envía un término de búsqueda, **Then** el resultado refleja el alcance de búsqueda implementado actualmente.
3. **Given** hay más de 20 resultados, **When** se solicita una página, **Then** la respuesta incluye como máximo 20 elementos y un indicador correcto de existencia de página siguiente.
4. **Given** se solicita un número de página fuera del límite aceptado, **When** se consulta el listado, **Then** la respuesta refleja la validación y el límite actualmente implementados.
5. **Given** usuarios con roles diferentes, **When** acceden al listado o reporte, **Then** los permisos y respuestas coinciden con las reglas vigentes del servidor.
6. **Given** expedientes que pertenecen a diferentes grupos, **When** se consulta el reporte, **Then** los totales y grupos devueltos corresponden a los datos persistidos.

---

### User Story 3 - Verificar acciones y transiciones de revisión (Priority: P3)

Como operador o administrador, quiero que las pruebas cubran las acciones permitidas, sus restricciones y sus efectos registrados, para detectar cambios incompatibles en el flujo de expedientes.

**Why this priority**: Estas acciones modifican estados y registros asociados; su comportamiento requiere evidencia antes de refactorizar.

**Independent Test**: Ejecutar casos de acción contra la API real y consultar en SQLite el estado final, historial, revisiones y auditoría relacionados.

**Acceptance Scenarios**:

1. **Given** un expediente en cada estado habilitado, **When** se envían acciones de revisar, observar, validar, aprobar o emitir, **Then** las transiciones aceptadas y rechazadas coinciden con las reglas actuales.
2. **Given** un identificador no entero o una acción/datos no válidos, **When** se solicita una acción, **Then** la API rechaza la entrada según su validación existente.
3. **Given** un comentario supera 1500 caracteres, **When** se envía una acción que lo admite, **Then** la entrada se rechaza conforme al límite vigente.
4. **Given** faltan requisitos obligatorios de un expediente, **When** se intenta aprobarlo, **Then** la aprobación queda bloqueada y no se registra una transición exitosa.
5. **Given** un usuario operador y uno administrador, **When** intentan aprobar o emitir, **Then** solo el rol permitido por el comportamiento actual puede completar cada acción.
6. **Given** una ruta de documento inválida o ajena al expediente autorizado, **When** se intenta descargarla, **Then** la API responde con el rechazo o error vigente y no expone el archivo.
7. **Given** el estado del expediente cambia concurrentemente antes de persistir la acción, **When** se intenta una transición basada en el estado anterior, **Then** se informa el conflicto actual y no se aplica una transición duplicada o inválida.
8. **Given** una acción válida genera cambios relacionados, **When** termina la operación, **Then** los registros presentes hoy en historial, revisión y auditoría concuerdan con el resultado persistido.

---

### User Story 4 - Verificar operaciones administrativas (Priority: P4)

Como administrador u operador autorizado, quiero que las pruebas cubran las consultas y operaciones administrativas, para preservar sus permisos y validaciones actuales.

**Why this priority**: Estas funciones administran catálogos, usuarios y parámetros que condicionan otros flujos del sistema.

**Independent Test**: Ejecutar casos por recurso administrativo contra Express y SQLite temporales y verificar código de respuesta y datos persistidos.

**Acceptance Scenarios**:

1. **Given** una solicitud de configuración, **When** accede un usuario con el rol permitido o no permitido, **Then** la respuesta respeta el control actual de acceso.
2. **Given** datos de programas, **When** se consulta o crea un programa, **Then** listado, validación y persistencia corresponden al comportamiento actual y el rol se aplica correctamente.
3. **Given** datos de estudiantes, **When** se consulta el listado, **Then** filtros o paginación implementados devuelven los resultados esperados y protegen el acceso según rol.
4. **Given** usuarios del sistema, **When** se consultan o crean cuentas, **Then** validaciones, permisos y campos devueltos coinciden con la implementación vigente.
5. **Given** requisitos de programas, **When** se consultan o crean, **Then** la API valida entradas y permisos según las reglas actuales.
6. **Given** registros de auditoría, **When** se consulta el historial, **Then** la paginación, permisos y campos expuestos coinciden con el comportamiento actual.
7. **Given** entradas ausentes, mal formadas o en conflicto, **When** se invocan operaciones administrativas, **Then** se verifican sus respuestas de validación sin modificar código de producción.

---

### User Story 5 - Verificar identidad y sesión (Priority: P5)

Como persona que inicia sesión o consulta su perfil, quiero que las pruebas cubran la sesión y sus condiciones de error, para mantener evidencia sobre autenticación y acceso vigente.

**Why this priority**: La autenticación protege las operaciones personales, de revisión y administración cubiertas por las historias anteriores.

**Independent Test**: Ejecutar casos de login, perfil y logout en el servidor Express conectado a SQLite temporal y verificar cookie, respuestas y estado de sesión.

**Acceptance Scenarios**:

1. **Given** credenciales correctas de una cuenta activa, **When** inicia sesión, **Then** se establece una cookie HttpOnly con las propiedades vigentes y la respuesta no expone un token de sesión en el cuerpo.
2. **Given** una cookie válida, **When** consulta el perfil, **Then** recibe el perfil permitido para la cuenta autenticada.
3. **Given** credenciales erróneas o una cuenta inactiva, **When** intenta iniciar sesión, **Then** la API rechaza el acceso sin exponer secretos ni hashes.
4. **Given** no hay sesión o la cookie es inválida, **When** se consulta un recurso protegido o el perfil, **Then** el acceso se rechaza según las respuestas actuales.
5. **Given** una sesión activa, **When** se cierra sesión, **Then** la cookie se invalida de acuerdo con el comportamiento vigente.
6. **Given** Google OAuth no tiene configuración disponible, **When** se consulta su estado, **Then** la respuesta informa el estado no configurado que implementa actualmente el servidor.

### Edge Cases

- Base SQLite temporal no disponible, conexión fallida o cierre/limpieza tras una prueba: los casos fallan claramente y los recursos temporales se liberan.
- Dos acciones concurrentes intentan cambiar el mismo expediente: se comprueba el control de concurrencia actual sin introducir una regla nueva.
- Filtros vacíos, página inicial, página final y página fuera de rango: se registran las respuestas vigentes, incluso si difieren del comportamiento deseado.
- Entradas límites de longitudes, identificadores y campos obligatorios: se prueba rechazo o aceptación conforme al código observado.
- Google OAuth sin credenciales: se prueba el estado informativo sin iniciar un flujo externo.
- Si la línea base revela comportamiento no cubierto o diferente de lo esperado, se documenta como hallazgo; esta funcionalidad no cambia la implementación para corregirlo.

## Requirements

### Functional Requirements

- **FR-001**: El comando de pruebas del servidor DEBE ejecutar Jest, mostrar el nombre y estado de cada prueba y terminar con un resultado agregado identificable.
- **FR-002**: La ejecución DEBE generar reportes de cobertura de texto, HTML y lcov dentro de `server/coverage/`; no DEBE establecer un umbral de aprobación de cobertura.
- **FR-003**: La migración de `solicitudes.test.js` y `catalogo-grados.test.js` DEBE conservar todas las aserciones existentes. Los casos del escenario largo de solicitudes DEBEN quedar divididos en pruebas independientes con nombres descriptivos.
- **FR-004**: Las pruebas de integración DEBEN usar SQLite temporal real mediante Prisma y el adaptador libSQL, y levantar Express en un puerto aleatorio; no se reemplazarán estas integraciones con dobles.
- **FR-005**: La suite DEBE cubrir los filtros por tipo, estado y búsqueda del listado de revisión, su paginación de 20 elementos e indicador de página siguiente, el límite de página, los permisos vigentes y la agrupación del reporte.
- **FR-006**: La suite DEBE cubrir las transiciones válidas e inválidas de revisar, observar, validar, aprobar y emitir; entradas inválidas (incluido id no entero y comentario superior a 1500 caracteres); bloqueo de aprobación por requisitos obligatorios faltantes; permisos de aprobación/emisión; descarga con ruta inválida; conflicto por cambio concurrente y registros actuales de historial, revisión y auditoría.
- **FR-007**: La suite DEBE cubrir configuración, programas, estudiantes, usuarios, requisitos y auditoría, incluyendo permisos por rol y validación de entradas observados en la implementación actual.
- **FR-008**: La suite DEBE cubrir login y logout con cookie HttpOnly, consulta de perfil, credenciales erróneas, usuario inactivo, sesión ausente o inválida y estado de Google sin configurar.
- **FR-009**: Las pruebas DEBEN describir el comportamiento presente y registrar como hallazgo cualquier diferencia o comportamiento no cubierto; no DEBEN modificar código de producción para cambiar el resultado observado.
- **FR-010**: No se añadirán secretos reales ni archivos `.env`; todos los datos y credenciales de prueba serán sintéticos y locales a la ejecución.
- **FR-011**: El alcance de cambios queda limitado a pruebas del servidor, configuración/documentación estrictamente necesarias para ejecutarlas y artefactos de planificación Spec Kit; no se modificará `client/` ni código de producción de `server/`.
- **FR-012**: La cobertura se reportará como línea base sin umbral mínimo. La especificación, plan o reporte identificarán brechas como observaciones y no como defectos corregidos dentro de este alcance.
- **FR-013**: Los casos de prueba conservarán trazabilidad a los endpoints y módulos de `server/src/`, usando el inventario de FR-016 de `specs/008-documentacion-arquitectura/spec.md` y las referencias de análisis y contratos heredados pertinentes.

### Key Entities

- **Caso de prueba**: Ejercicio independiente con nombre descriptivo, preparación, acción y resultado comprobable del comportamiento actual.
- **Base de prueba temporal**: Almacenamiento SQLite efímero con datos sintéticos, aislado por ejecución y eliminado al terminar.
- **Línea base de cobertura**: Reporte cuantitativo generado por la suite, sin umbral de aprobación establecido en esta funcionalidad.
- **Hallazgo de comportamiento**: Diferencia entre expectativa documentada y resultado observado, registrada sin corregir producción en este alcance.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Desde `server/`, una ejecución de `npm test` finaliza correctamente cuando los casos pasan y presenta individualmente el nombre y resultado de todos los casos ejecutados.
- **SC-002**: Cada ejecución exitosa produce los tres formatos de cobertura solicitados en `server/coverage/`, sin aplicar umbral mínimo.
- **SC-003**: El 100 % de las aserciones de las dos suites existentes permanece representado después de la migración, y los casos que antes estaban agrupados en un único escenario de solicitudes aparecen como pruebas independientes.
- **SC-004**: Cada alcance P2–P5 indicado en los requisitos tiene al menos un caso de prueba asociado a cada comportamiento enumerado y trazable a módulo o endpoint fuente.
- **SC-005**: Las pruebas de integración usan una base SQLite temporal real y Express con puerto asignado dinámicamente; no dependen de servicios de base de datos externos ni credenciales reales.
- **SC-006**: La cobertura generada permite identificar líneas/código ejercitado y brechas actuales, sin tratar el porcentaje como garantía ni objetivo de calidad aprobado.
- **SC-007**: No se modifican archivos del cliente ni código de producción del servidor.

## Assumptions

- La base temporal puede prepararse con el esquema mínimo que los módulos actuales requieren; no se introduce una migración de producto ni se altera el esquema Prisma como parte de la suite.
- Las pruebas pueden usar datos sintéticos, secretos desechables generados dentro del caso y callbacks/condiciones locales sin conectarse a Google.
- Los permisos y respuestas esperados se determinarán inspeccionando el código actual y las pruebas existentes durante la planificación; si el código no respalda una expectativa, se documentará la conducta encontrada en vez de convertir la expectativa en requisito de producción.
- La integración de Jest y cualquier ajuste de configuración quedan limitados al entorno de pruebas del servidor, conforme a la constitución v1.2.0.
- Las referencias funcionales principales son `specs/008-documentacion-arquitectura/spec.md` (FR-016), `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`, `docs/02-arquitectura-software/componentes-arquitectonicos.md`, los módulos de `server/src/` y `docs/legacy/openspec/api-contracts.md` / `data-models.md`.