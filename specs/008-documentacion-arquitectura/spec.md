# Especificación de funcionalidad: Documentación de análisis y arquitectura de SIGEP-UNSCH

**Rama de funcionalidad**: `008-documentacion-arquitectura`

**Creada**: 2026-11-21

**Estado**: Borrador

**Entrada**: Descripción del usuario: Documentar en Sprint 1 el análisis del sistema y su arquitectura tal como existen en SIGEP-UNSCH, separando hechos implementados de objetivos Sprint 2 y sin modificar código de cliente ni servidor.

## Escenarios de usuario y pruebas

### Historia 1 - Revisar análisis del sistema (Prioridad: P1)

Como integrante del equipo SIGEP-UNSCH, quiero consultar un análisis de actores, historias, requisitos, atributos de calidad, restricciones y decisiones arquitectónicas, para entender qué existe, qué está solicitado y qué queda como propuesta.

**Por qué esta prioridad**: El análisis proporciona el origen y contexto verificable para los documentos de arquitectura y diseño.

**Prueba independiente**: Revisar los ocho archivos de `docs/01-analisis-de-sistema/` y comprobar nombres, fuentes citadas, separación entre implementación actual y objetivos, y trazabilidad de sus afirmaciones.

**Escenarios de aceptación**:

1. **Dado** el repositorio y las especificaciones 001–007, **cuando** se redacta el análisis, **entonces** los actores, historias y requisitos se derivan de esos artefactos y del código señalado, con referencias identificables.
2. **Dado** un atributo de calidad, **cuando** se describe, **entonces** el documento separa la evidencia actual del objetivo propuesto y marca las métricas como `propuestas, pendientes de validación del equipo`.
3. **Dado** que el sistema actual carece de documentación arquitectónica en `docs/01-analisis-de-sistema` a `docs/04-modelo-c4`, **cuando** se crea esta entrega, **entonces** el análisis registra lo que muestran las fuentes sin atribuir al sistema capas o capacidades aún no implementadas.

### Historia 2 - Consultar la arquitectura del software (Prioridad: P2)

Como desarrollador, quiero consultar la arquitectura inicial, sus componentes, enfoque y estilo con el estado actual claramente diferenciado de Sprint 2, para planificar cambios compatibles con el sistema existente.

**Por qué esta prioridad**: Hace explícita la estructura real antes de proponer cambios arquitectónicos.

**Prueba independiente**: Comprobar los cuatro documentos en `docs/02-arquitectura-software/` contra `server/src/`, `client/app/`, el esquema Prisma y los contratos de referencia.

**Escenarios de aceptación**:

1. **Dado** el servidor actual, **cuando** se describe su arquitectura, **entonces** se indica que los módulos de ruta y lógica están en archivos directamente bajo `server/src/`, con operaciones Prisma integradas en esos módulos, y que `lib/`, `middleware/` y `routes/` están vacías en el estado observado.
2. **Dado** una capacidad propuesta para Sprint 2, **cuando** se documenta, **entonces** aparece como objetivo futuro y no como componente, capa o comportamiento operativo actual.
3. **Dado** cada componente documentado, **cuando** se revisa, **entonces** indica su requisito funcional, historia de usuario o escenario de origen, o cita la fuente que acredita su existencia actual.

### Historia 3 - Entender el diseño interno (Prioridad: P3)

Como desarrollador, quiero consultar el diseño interno de módulos, patrones y principios, para distinguir las prácticas observadas de las recomendaciones aún no implementadas.

**Por qué esta prioridad**: Evita presentar como vigente una arquitectura futura y permite que el equipo evalúe las propuestas con conocimiento del código actual.

**Prueba independiente**: Revisar los tres documentos de diseño y verificar que cada patrón o principio esté clasificado como observado o propuesto, con trazabilidad a fuentes.

**Escenarios de aceptación**:

1. **Dado** un módulo existente en `server/src/` o `client/app/`, **cuando** se describe su diseño, **entonces** se citan sus archivos fuente y no se le atribuyen responsabilidades no encontradas en el código.
2. **Dado** una recomendación de capas, caché, Swagger, SOLID o patrones, **cuando** aparece en el diseño, **entonces** se etiqueta como propuesta u objetivo futuro salvo que una fuente verifique que ya está implementada.

### Historia 4 - Visualizar el sistema con C4 (Prioridad: P4)

Como integrante técnico o interesado institucional, quiero visualizar el contexto, contenedores, componentes y un nivel de código del sistema actual, para compartir un modelo arquitectónico consistente y trazable.

**Por qué esta prioridad**: Los diagramas consolidan el análisis y la arquitectura en una vista navegable por nivel.

**Prueba independiente**: Revisar los cuatro documentos C4, validar que cada uno contiene el nivel indicado en Mermaid, que sus elementos coinciden con las fuentes y que no mezcla el objetivo de Sprint 2 con el sistema desplegado hoy.

**Escenarios de aceptación**:

1. **Dado** cada nivel C4 requerido, **cuando** se abre su documento, **entonces** incluye un diagrama Mermaid del nivel y una explicación textual con sus límites y fuentes.
2. **Dado** cada componente representado, **cuando** se inspecciona, **entonces** se identifica el RF, HU o escenario de origen; los componentes sin una función de usuario directa citan la fuente que demuestra su existencia.
3. **Dado** que capas, caché y Swagger son objetivos de Sprint 2, **cuando** aparecen en diagramas o notas, **entonces** se muestran como propuesta separada y no dentro del contenedor actual.

### Casos límite

- Una especificación solicita un comportamiento de interfaz que no se encuentra en el código actual; se marca como solicitado o pendiente, no como implementado.
- Una entidad está en `schema.prisma` pero no tiene un flujo activo confirmado; se describe como entidad del modelo, sin inferir una capacidad operativa.
- Una decisión o diagrama histórico de OpenSpec contradice el código actual; se conservan ambos datos con su fecha y estado, y se identifica el código actual como evidencia del estado implementado.
- Un atributo de calidad no tiene mediciones disponibles; se documenta que no está medido y cualquier meta se etiqueta como propuesta pendiente de validación.
- Un módulo no se puede atribuir a un único RF o HU; se vincula al escenario comprobable o se deja constancia explícita de la fuente de su existencia.
- Una capa, mecanismo de caché o contrato Swagger solo aparece en una propuesta; no se dibuja como parte implementada.

## Requisitos

### Requisitos funcionales

- **FR-001**: La entrega DEBE crear estos 19 documentos Markdown en las rutas indicadas:
  - `docs/01-analisis-de-sistema/01-actores.md`
  - `docs/01-analisis-de-sistema/02-historias-del-usuario.md`
  - `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`
  - `docs/01-analisis-de-sistema/04-atributos-de-calidad.md`
  - `docs/01-analisis-de-sistema/05-restricciones.md`
  - `docs/01-analisis-de-sistema/06-driver-arquitectonicos.md`
  - `docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md`
  - `docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md`
  - `docs/02-arquitectura-software/arquitectura-inicial.md`
  - `docs/02-arquitectura-software/componentes-arquitectonicos.md`
  - `docs/02-arquitectura-software/enfoque-aquitectonico.md`
  - `docs/02-arquitectura-software/estilo-arquitectonico.md`
  - `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md`
  - `docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md`
  - `docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md`
  - `docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md`
  - `docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`
  - `docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`
  - `docs/04-modelo-c4/Nivel4-Diagrama-de-Codigo.md`
- **FR-002**: Cada documento DEBE distinguir explícitamente entre `Implementado hoy` y `Objetivo Sprint 2`; lo no confirmado por fuentes DEBE quedar identificado como propuesta, pendiente o decisión por validar.
- **FR-003**: El análisis DEBE derivar actores, historias y requisitos de `specs/001` a `specs/007`, contrastando el estado implementado con `server/prisma/schema.prisma`, `server/src/`, `client/app/` y `docs/legacy/openspec/`.
- **FR-004**: Los documentos de historias y requisitos DEBEN preservar los identificadores RF, HU y de escenarios que existan en las fuentes. Si una fuente no tiene identificadores estables, DEBEN asignar identificadores locales y citar el archivo, sección y número de historia/escenario de origen. Toda afirmación sobre implementación actual DEBE señalar archivo o documento fuente.
- **FR-005**: El análisis de actores DEBE distinguir roles definidos en el modelo de datos de actores/roles con operaciones verificadas en el código; no DEBE inferir permisos por el nombre de un rol.
- **FR-006**: `04-atributos-de-calidad.md` y `08-escenarios-atributos-calidad.md` DEBEN cubrir rendimiento, seguridad, disponibilidad, mantenibilidad y trazabilidad/auditoría. El objetivo de rendimiento debe indicar hasta 2.000 usuarios virtuales concurrentes como propuesta pendiente de validación, no como capacidad medida o garantizada.
- **FR-007**: Toda métrica de atributo de calidad DEBE llevar literalmente la marca `propuesta, pendiente de validación del equipo`; las métricas actuales no disponibles deben declararse como no medidas.
- **FR-008**: La descripción de seguridad DEBE reflejar las pruebas disponibles en fuentes para JWT/sesión, roles y titularidad, distinguiendo controles observados de objetivos. La trazabilidad DEBE describir auditoría solo al nivel confirmado por código y esquema.
- **FR-009**: La documentación de arquitectura DEBE describir el servidor implementado como módulos JavaScript bajo `server/src/` donde se mezclan registro de rutas, lógica y acceso Prisma; DEBE indicar que `lib/`, `middleware/` y `routes/` están vacías en el estado inspeccionado.
- **FR-010**: Capas separadas, caché y Swagger DEBEN identificarse como objetivos de Sprint 2 o propuestas solo donde las fuentes los sostengan; no pueden presentarse como existentes hoy sin evidencia.
- **FR-011**: Los tres documentos de diseño interno DEBEN describir módulos y patrones observados con sus fuentes, y separar claramente los patrones o principios recomendados para futuro.
- **FR-012**: Los cuatro documentos C4 DEBEN contener un diagrama Mermaid del nivel correspondiente (contexto, contenedores, componentes y código), una leyenda o explicación de sus límites y referencias a las fuentes usadas.
- **FR-013**: Cada componente de software documentado o representado DEBE indicar su RF, HU o escenario de origen; si no tiene un origen funcional directo, DEBE citar el artefacto o archivo que acredita su existencia.
- **FR-014**: La entrega DEBE limitar cambios a documentación y artefactos Spec Kit de esta funcionalidad; no DEBE modificar archivos de `client/` ni `server/`.
- **FR-015**: Cada documento DEBE incluir un resumen claro en español para lectores no especializados; los términos técnicos y acrónimos DEBEN explicarse en su primera aparición o en un glosario compartido. Los diagramas técnicos DEBEN acompañarse de una explicación textual.

### Entidades clave

- **Documento de arquitectura**: Archivo Markdown entregable con estado actual, objetivo futuro, fuente y trazabilidad aplicables.
- **Componente**: Parte identificable del sistema observada en el cliente, servidor o modelo de datos, asociada a un RF/HU/escenario o a una fuente verificable.
- **Escenario de atributo de calidad**: Situación con contexto, estímulo, respuesta esperada y medida propuesta; el valor propuesto queda pendiente de validación del equipo.
- **Elemento de arquitectura C4**: Sistema, contenedor, componente o unidad de código incluida en el nivel de diagrama correspondiente y asociada con su fuente/origen.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Existen exactamente los 19 archivos Markdown enumerados en FR-001, en sus rutas correspondientes.
- **SC-002**: El 100 % de esos documentos distingue `Implementado hoy` de `Objetivo Sprint 2` y cita las fuentes pertinentes para los hechos actuales.
- **SC-003**: El 100 % de los componentes descritos o diagramados tiene trazabilidad a RF, HU, escenario o fuente de existencia, según FR-013.
- **SC-004**: Los cuatro documentos C4 contienen cada uno un diagrama Mermaid del nivel requerido y ninguna capacidad solo planificada se presenta como implementada.
- **SC-005**: Los atributos de calidad requeridos están documentados; toda métrica está marcada como propuesta pendiente de validación y el objetivo de 2.000 usuarios concurrentes no se describe como resultado medido.
- **SC-006**: Ningún archivo de `client/` o `server/` cambia como resultado de esta funcionalidad.

## Supuestos

- Sprint 1 produce únicamente documentación; no incluye crear capas, caché, Swagger, cambios de infraestructura ni cambios funcionales.
- Las especificaciones 001–007 son fuentes de intención/requisitos; el código y el esquema determinan qué está implementado hoy. Las propuestas OpenSpec se conservan como antecedentes, no como evidencia de implementación actual.
- El estado de carpetas verificado al preparar esta especificación muestra `server/src/lib/`, `server/src/middleware/` y `server/src/routes/` vacías; los módulos funcionales se encuentran en la raíz de `server/src/`.
- El código de cliente ya organiza páginas, componentes, hooks, servicios y utilidades bajo `client/app/`; la documentación reflejará esa estructura observada.
- La selección y umbrales concretos para métricas de disponibilidad, mantenibilidad, seguridad y auditoría son propuestas editoriales para revisión, no compromisos aprobados ni resultados medidos.
- El principio constitucional nuevo menciona Jest en ambas capas, mientras el estado inspeccionado presenta Vitest en `client/` y `node --test` en `server/`; la documentación debe consignar lo observado y señalar la diferencia sin declarar implementada la política objetivo.
- Se conserva en el nombre de archivo la grafía solicitada `enfoque-aquitectonico.md` para mantener la ruta especificada por el usuario.