# Orientación académica

## Purpose

Dar acceso público a la orientación verificable para grados de Maestro y Doctor y títulos de Segunda Especialidad.

## ADDED Requirements

### Requirement: Navegación y páginas académicas
El sistema SHALL ofrecer cinco rutas independientes desde el menú y compartir el diseño institucional, ruta de navegación, tarjetas informativas, etapas, preguntas frecuentes y accesos al asistente y seguimiento según corresponda.

#### Scenario: Consulta desde el menú
- **WHEN** se elige una opción de Grados y Títulos
- **THEN** se abre la ruta correspondiente y los enlaces llevan a requisitos, solicitud o expediente según su función.

### Requirement: Catálogo y requisitos por programa
El sistema SHALL filtrar la información por trámite y programa y mostrar los requisitos académicos, documentos, modalidades, pagos, plazos y observaciones que tengan configuración institucional válida. El selector y buscador SHALL actualizar el checklist sin asignar cumplimiento personal.

#### Scenario: Catálogo pendiente de publicación
- **WHEN** no existen datos aprobados para la selección
- **THEN** se indica qué información falta sin asignar montos, plazos ni requisitos supuestos.

#### Scenario: Consulta con teclado
- **WHEN** el estudiante selecciona el trámite, busca requisitos o abre preguntas frecuentes utilizando el teclado
- **THEN** puede consultar el contenido y las acciones sin depender de un dispositivo apuntador.
