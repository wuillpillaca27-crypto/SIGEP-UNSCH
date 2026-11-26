# Feature Specification: Pruebas de carga de la API

**Feature Branch**: `015-pruebas-carga-api`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Spec 015: pruebas de carga con k6 y colección Postman para SIGEP. Postman: importar el OpenAPI de /api-docs (spec 012). k6: etapas progresivas (10, 25, 50, 100 usuarios), umbrales p95 < 500 ms y errores < 1 %, contra el servidor local con SQLite y datos de prueba. Guardar resultados como evidencia y documentar el límite real medido. Sin cambiar la lógica de negocio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar y reutilizar las operaciones documentadas (Priority: P1)

Como persona que integra o valida SIGEP, quiero una colección Postman creada a partir del contrato OpenAPI publicado en `/api-docs`, para explorar y ejecutar las operaciones documentadas en un entorno local.

**Why this priority**: La colección ofrece una forma directa de revisar el contrato y las operaciones antes de someterlas a carga.

**Independent Test**: Importar el documento servido por `/api-docs` en Postman y comprobar que la colección resultante representa todas las operaciones del inventario definido por Spec 012.

**Acceptance Scenarios**:

1. **Given** el servidor local inicia y publica el contrato de Spec 012, **When** una persona importa ese contrato en Postman, **Then** la colección contiene todos los métodos y rutas documentados.
2. **Given** la colección importada, **When** se selecciona el entorno local, **Then** sus solicitudes apuntan al servidor local y no requieren editar el contrato fuente.

---

### User Story 2 - Medir el comportamiento bajo carga creciente (Priority: P1)

Como responsable de calidad, quiero ejecutar una prueba reproducible contra el servidor local con SQLite y datos de prueba, para observar latencia y errores a medida que crece la concurrencia.

**Why this priority**: La prueba permite conocer cómo responde la API bajo una carga definida antes de considerar un entorno con más capacidad.

**Independent Test**: Iniciar el servidor sobre una base SQLite de prueba, ejecutar la prueba de carga y revisar métricas separadas para las etapas de 10, 25, 50 y 100 usuarios virtuales.

**Acceptance Scenarios**:

1. **Given** una base SQLite aislada con datos de prueba y el servidor local disponible, **When** se ejecuta el perfil de carga, **Then** se recorren progresivamente las etapas de 10, 25, 50 y 100 usuarios virtuales.
2. **Given** que termina cada etapa, **When** se revisan sus métricas, **Then** se informa p95 de duración de solicitud y proporción de errores y se compara cada valor con p95 menor que 500 ms y errores menores que 1 %.
3. **Given** que una etapa supera uno o ambos umbrales, **When** concluye la ejecución, **Then** la prueba conserva ese resultado como incumplimiento y no lo presenta como una etapa aprobada.

---

### User Story 3 - Conservar evidencia y el límite medido (Priority: P1)

Como equipo que mantiene SIGEP, quiero guardar los resultados junto con el contexto de la ejecución y documentar la carga máxima que cumplió los umbrales, para que otras personas puedan interpretar y repetir la medición.

**Why this priority**: Una cifra sin condiciones de ejecución no permite comparar resultados ni delimitar lo que realmente se midió.

**Independent Test**: Revisar la evidencia guardada y comprobar que identifica el entorno, los datos de prueba, la fecha, la revisión probada, las métricas por etapa y la mayor etapa que cumplió ambos umbrales.

**Acceptance Scenarios**:

1. **Given** una ejecución completada, **When** se guarda su evidencia, **Then** quedan disponibles los resultados crudos y un resumen legible con p95, errores y veredicto por etapa.
2. **Given** las cuatro etapas medidas, **When** se documenta el límite real, **Then** se indica la etapa más alta que cumplió simultáneamente los dos umbrales; si ninguna los cumple, se declara explícitamente que no se encontró una etapa aprobada.
3. **Given** un resultado de carga, **When** otra persona lo interpreta, **Then** puede identificar las características del equipo, versiones de herramientas, duración, configuración de SQLite y volumen de datos de prueba usados.

---

### Edge Cases

- Si `/api-docs` no está disponible o su contrato no es válido, la importación Postman debe reportar el problema y no usar una colección manual presentada como sincronizada.
- Si una operación requiere autenticación, la ejecución debe usar exclusivamente identidades y credenciales de prueba locales, sin guardar secretos reales en la colección ni en la evidencia.
- Si una operación crea o modifica datos, las pruebas deben ejecutarse en una base de prueba descartable y permitir repetir la corrida sin afectar datos reales.
- Si el servidor o SQLite no soporta alguna etapa, se debe guardar el fallo y las métricas disponibles, e identificar esa etapa como no completada.
- Si la prueba se interrumpe antes de completar las etapas, la evidencia debe indicar cuáles se completaron y no inferir un límite superior a la última etapa válida.
- Si ninguna etapa satisface ambos umbrales, el informe debe declarar que no se midió una capacidad aprobada y conservar todos los valores observados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La entrega DEBE incluir una colección Postman importada del contrato OpenAPI que SIGEP sirve en `/api-docs` conforme a Spec 012.
- **FR-002**: La colección DEBE incluir todas las operaciones y métodos del inventario documentado en Spec 012, con una variable de entorno para la URL base local.
- **FR-003**: La entrega DEBE incluir un perfil de carga k6 que ejecute de forma progresiva las etapas de 10, 25, 50 y 100 usuarios virtuales contra el servidor local.
- **FR-004**: La carga DEBE usar SQLite local y datos de prueba identificables, reproducibles y separados de datos institucionales o de producción.
- **FR-005**: Para cada etapa, la prueba DEBE reportar la latencia p95 y la tasa de errores y evaluar los umbrales p95 < 500 ms y tasa de errores < 1 %.
- **FR-006**: Las operaciones de escritura incluidas en el perfil DEBEN poder repetirse sin afectar datos reales; la preparación y el reinicio de datos DEBEN limitarse al entorno de prueba.
- **FR-007**: Cada ejecución completada DEBE guardar como evidencia el resultado crudo y un resumen que incluya métricas y estado de cada etapa.
- **FR-008**: El resumen DEBE documentar el límite real medido: la etapa de mayor concurrencia que cumplió ambos umbrales. Si ninguna etapa los cumple o la ejecución se interrumpe, DEBE indicarlo sin estimar capacidad no observada.
- **FR-009**: La evidencia DEBE identificar fecha, revisión del código, versiones de Node.js y k6, equipo/entorno local, configuración y volumen de los datos de prueba, duración y umbrales utilizados.
- **FR-010**: La colección y las pruebas DEBEN evitar secretos reales, credenciales institucionales, datos personales reales y destinos de producción.
- **FR-011**: Esta funcionalidad NO DEBE cambiar la lógica de negocio ni modificar el comportamiento de las rutas de API para hacerlas pasar la prueba.
- **FR-012**: La documentación DEBE incluir instrucciones para preparar la base de prueba, iniciar el servidor local, importar la colección, ejecutar la carga y entender el límite medido.

### Key Entities *(include if feature involves data)*

- **Colección Postman**: Representación ejecutable de operaciones HTTP, métodos y rutas procedentes del contrato OpenAPI.
- **Perfil de carga**: Descripción de operaciones y niveles de concurrencia ejercitados contra el servidor local.
- **Ejecución de carga**: Corrida identificada por revisión y condiciones locales, con resultados por etapa.
- **Etapa**: Intervalo de una corrida asociado a uno de los niveles de usuarios virtuales y sus métricas de p95 y errores.
- **Evidencia de rendimiento**: Resultado crudo y resumen contextualizado que sustenta el límite real medido.
- **Datos de prueba**: Registros sintéticos o explícitamente identificados, aislados de bases de datos institucionales o productivas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La colección importada contiene el 100 % de las operaciones documentadas en Spec 012 y puede apuntar al servidor local mediante su URL base.
- **SC-002**: Una corrida completa informa p95 y tasa de errores para cada una de las cuatro etapas: 10, 25, 50 y 100 usuarios virtuales.
- **SC-003**: Cada etapa queda marcada aprobada solo cuando registra p95 estrictamente menor que 500 ms y tasa de errores estrictamente menor que 1 %.
- **SC-004**: El informe identifica una única etapa máxima aprobada o declara que ninguna etapa aprobó; no extrapola por encima de la carga observada.
- **SC-005**: Una tercera persona puede reproducir la ejecución siguiendo las instrucciones y usando la base de prueba local, sin secretos ni datos reales.
- **SC-006**: La revisión del cambio confirma que no se alteró la lógica de negocio ni el comportamiento de los endpoints.

## Assumptions

- La referencia de rutas y métodos es el contrato OpenAPI publicado en `/api-docs` por Spec 012; si el contrato cambia, la colección debe regenerarse o actualizarse desde esa fuente.
- Los cuatro valores representan usuarios virtuales concurrentes al final de cada etapa; el perfil define una duración explícita y reporta el tiempo medido por nivel.
- El servidor local puede prepararse con una base SQLite descartable y registros sintéticos que cubren las operaciones ejercitadas.
- Para operaciones protegidas se preparan identidades locales exclusivas de prueba; no se incorporan credenciales ni secretos al repositorio.
- El límite documentado describe únicamente el equipo y la configuración registrados en esa ejecución y no constituye una garantía de capacidad para producción.
- Las evidencias guardadas en el repositorio no incluyen tokens, contraseñas, datos personales reales ni otros valores sensibles.
