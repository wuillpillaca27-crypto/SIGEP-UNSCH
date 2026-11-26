# Feature Specification: Solicitud de certificaciones habilitadas

**Feature Branch**: `016-certificaciones-habilitadas`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Investigar y corregir el acceso y el flujo de solicitudes de Certificaciones de SIGEP-UNSCH, sin inventar programas oficiales ni retirar controles de seguridad."

## User Scenarios & Testing

### User Story 1 - Acceder a las certificaciones permitidas (Priority: P1)

Una persona estudiante inicia una solicitud de diplomado o certificación por módulos. El sistema comprueba su sesión y matrícula, presenta únicamente programas y tipos de certificación activos que correspondan a su matrícula y explica qué debe hacer si no existe una oferta autorizada.

**Why this priority**: Sin una identidad autenticada y una relación académica válida, no es posible iniciar ni autorizar una solicitud.

**Independent Test**: Probar el acceso sin sesión, con sesión de estudiante elegible, con programa inactivo y con matrícula no compatible; verificar el destino de autenticación y las opciones visibles.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión que abre la solicitud, **When** se comprueba su identidad, **Then** llega al inicio de sesión con un enlace seguro para volver a la misma solicitud después de autenticarse.
2. **Given** una persona estudiante con programa activo y requisitos activos de certificación, **When** abre la solicitud, **Then** puede elegir el programa asociado a su matrícula y la certificación autorizada para él.
3. **Given** una persona autenticada sin matrícula compatible, **When** abre la solicitud, **Then** recibe una explicación basada en su matrícula y un enlace de ayuda, sin mostrarle programas ajenos ni permitir crear una solicitud.

---

### User Story 2 - Completar y seguir una solicitud de certificación (Priority: P2)

Una persona estudiante elegible prepara una solicitud en cuatro pasos: programa y certificación, requisitos, documentos y confirmación. Puede guardar y retomar un borrador, presentarlo y consultar el expediente en Mis Trámites.

**Why this priority**: El acceso al trámite debe conducir a un expediente persistente con seguimiento y revisión autorizada.

**Independent Test**: Para un programa de prueba marcado como tal, crear un borrador, adjuntar un PDF válido, presentarlo y comprobar su titularidad, expediente e historial desde Mis Trámites y la vista de revisión.

**Acceptance Scenarios**:

1. **Given** una persona estudiante elegible, **When** avanza por los cuatro pasos, **Then** los requisitos y documentos corresponden al programa y certificación seleccionados.
2. **Given** un borrador incompleto, **When** la persona guarda, vuelve a abrirlo y completa los requisitos obligatorios, **Then** continúa el mismo borrador y puede presentarlo.
3. **Given** una solicitud presentada, **When** la persona abre Mis Trámites, **Then** consulta el código de expediente, estado, documentos e historial.
4. **Given** una cuenta sin matrícula habilitada o una selección alterada en el cliente, **When** intenta crear una solicitud directamente, **Then** el servidor la rechaza y conserva las validaciones de titularidad y permisos.

### Edge Cases

- El perfil autenticado no tiene registro de estudiante, el programa asociado está inactivo o el tipo del programa no es de certificación.
- El programa es elegible pero no tiene requisitos activos para esa certificación.
- El catálogo cambia o se desactiva entre la consulta inicial y la creación del borrador.
- La sesión vence mientras se está completando o consultando una solicitud.
- Un estudiante manipula el identificador del programa o el tipo de trámite enviado al servidor.
- El estudiante navega de regreso a un borrador ya presentado.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST determinar el estado de sesión consultando la identidad del servidor antes de permitir el flujo de solicitud.
- **FR-002**: Si no hay sesión, el sistema MUST dirigir a la persona al inicio de sesión con un destino de retorno local, limitado a rutas permitidas.
- **FR-003**: El sistema MUST obtener las opciones de certificación a partir de la matrícula real del estudiante, del estado activo del programa y de requisitos activos para el tipo de certificación correspondiente.
- **FR-004**: El sistema MUST mostrar en el selector únicamente programas asociados a la matrícula autenticada; los programas públicos o las cuentas ajenas no otorgan elegibilidad.
- **FR-005**: El sistema MUST explicar si la falta de opciones se debe a ausencia de matrícula, programa inactivo, tipo de programa no certificable o falta de requisitos activos, y MUST ofrecer el canal de ayuda institucional existente.
- **FR-006**: El sistema MUST conservar el asistente de cuatro pasos: selección del programa y certificación, requisitos, documentos y confirmación.
- **FR-007**: El sistema MUST permitir guardar y retomar borradores, validar documentos, presentar solicitudes y generar códigos de expediente persistidos.
- **FR-008**: El sistema MUST mostrar solicitudes, estados, observaciones e historial de certificación dentro de Mis Trámites.
- **FR-009**: El servidor MUST comprobar identidad, rol, titularidad, relación estudiante-programa, vigencia del programa, tipo de certificación y requisitos activos al crear y modificar expedientes.
- **FR-010**: Las acciones de revisión y emisión MUST seguir limitadas a los roles autorizados y a las transiciones de estado existentes.
- **FR-011**: Los programas, requisitos, costos o plazos sin respaldo institucional MUST permanecer ocultos o identificados como información no publicada; los datos de prueba MUST estar claramente identificados y confinados al entorno de desarrollo.
- **FR-012**: La corrección MUST limitar cambios visibles a Certificaciones y no alterar la cabecera, portada, inicio de sesión ni el comportamiento existente de Grados y Títulos.

### Key Entities

- **Cuenta**: Identidad autenticada, rol y estado habilitado para ingresar.
- **Matrícula de estudiante**: Relación del estudiante con el programa académico registrado.
- **Programa académico**: Oferta registrada con tipo y estado de habilitación.
- **Requisito de certificación**: Requisito publicado y activo para un programa y tipo de certificación.
- **Solicitud y expediente**: Borrador o trámite presentado, con documentos, validaciones, historial y responsable de revisión.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El 100% de solicitudes sin sesión conduce al inicio de sesión y puede volver a la ruta de solicitud después de autenticarse.
- **SC-002**: Ningún estudiante ve programas no asociados a su matrícula ni puede crear solicitudes con un programa o tipo no autorizado.
- **SC-003**: Una persona estudiante elegible puede crear, guardar, retomar y presentar una solicitud en los cuatro pasos, y verla en Mis Trámites con su mismo código de expediente.
- **SC-004**: Cuando no hay una opción autorizada, el sistema identifica la causa concreta y ofrece ayuda sin habilitar datos de prueba como oferta oficial.
- **SC-005**: Las pruebas de Certificaciones pasan y las pruebas y compilación de las capas afectadas no reportan regresiones en Grados y Títulos, autenticación ni navegación institucional.

## Assumptions

- La relación vigente permite una matrícula de estudiante asociada a un único programa. Las opciones se limitan a esa relación; ampliar a múltiples matrículas requiere una decisión y un cambio de modelo independiente.
- Los registros activos de programa y requisito son la fuente de habilitación; no se agregan programas oficiales ni requisitos sin fuente aprobada.
- La autenticación por cookie de sesión y los expedientes existentes se reutilizan.
- El canal de orientación disponible en el portal es la página Ayuda.
- Las pruebas de integración pueden crear fixtures aislados identificados como datos de prueba y eliminarlos al finalizar.
