# Especificación: Certificaciones integrales para entorno de desarrollo

**Feature Branch**: `023-certificaciones-integrales`  
**Creada**: 2026-11-26  
**Estado**: Borrador para implementación  
**Entrada**: Completar los cuatro accesos del menú CERTIFICACIONES para poder probar los procesos de principio a fin en desarrollo.

## Escenarios de usuario y pruebas

### Historia 1: Consultar programas y diplomados (Prioridad P1)

Como estudiante o visitante quiero explorar diplomados y programas disponibles, buscar y filtrar resultados, y consultar su información antes de iniciar un trámite.

**Por qué**: Los accesos del menú deben llevar a información persistente y utilizable, no a páginas sin acciones.

**Prueba independiente**: Abrir cada catálogo como visitante; buscar, filtrar, limpiar, abrir el detalle y seguir un enlace válido a requisitos o solicitud.

**Criterios de aceptación**:

1. Dado un catálogo con ofertas publicadas, cuando se busca por nombre o código, entonces solo aparecen coincidencias.
2. Dado que se cambia un filtro, cuando se limpia, entonces se restaura el catálogo publicado.
3. Dado un programa sin información oficial publicada, entonces no se inventan costos, plazos ni normativa y se ofrece orientación.

### Historia 2: Certificar un diplomado (Prioridad P1)

Como estudiante con una matrícula y diplomado cursado elegible quiero iniciar una solicitud, adjuntar requisitos, guardar o recuperar un borrador y presentar el trámite.

**Por qué**: Es el flujo principal anunciado por “Diplomados de Posgrado”.

**Prueba independiente**: Con cuenta demo y diplomado aprobado crear un borrador, cargar/ver/reemplazar documentos, presentarlo, obtener el expediente y verlo en Mis Trámites; rechazar a quien no tenga elegibilidad.

**Criterios de aceptación**:

1. La oferta y el historial cursado se recuperan de la base de datos y el servidor verifica titularidad y aprobación.
2. El borrador persiste al navegar y volver a iniciar sesión.
3. Una solicitud presentada conserva documentos, requisitos, historial y aparece en Mis Trámites.

### Historia 3: Certificar módulos (Prioridad P1)

Como estudiante quiero revisar módulos cursados, sus calificaciones, créditos, horas y periodo, y seleccionar módulos elegibles según las reglas autorizadas.

**Por qué**: La segunda opción debe reflejar el historial académico real y prohibir certificaciones indebidas.

**Prueba independiente**: Comparar módulos aprobados, desaprobados y pendientes; solicitar uno permitido y comprobar que el servidor rechaza módulos inexistentes, ajenos o no aprobados.

**Criterios de aceptación**:

1. Se muestran únicamente módulos asociados a programas del usuario autenticado.
2. El servidor revalida elegibilidad al crear y presentar; la selección múltiple sigue las reglas existentes.
3. La solicitud y su expediente se persisten y consultan en Mis Trámites.

### Historia 4: Consultar requisitos, formatos y procedimientos (Prioridad P2)

Como visitante quiero seleccionar tipo y programa, buscar requisitos, consultar documentos, formatos, costos y plazos publicados, y solicitar orientación cuando falte información.

**Por qué**: La página pública debe ayudar a completar trámites sin atribuir validez oficial a datos de prueba.

**Prueba independiente**: Elegir tipo/programa, filtrar, consultar detalle y FAQ, abrir un formato HTTPS publicado y seguir enlaces a orientación e inicio de trámite.

**Criterios de aceptación**:

1. Solo se muestran requisitos activos publicados para el tipo y programa seleccionados.
2. Un formato se descarga o abre desde su URL autorizada y los valores no publicados se indican claramente como no disponibles.
3. La consulta pública no expone información privada ni permite modificar datos.

### Historia 5: Revisar solicitudes y emitir certificados de demostración (Prioridad P2)

Como personal autorizado quiero revisar solicitudes, registrar observaciones, evaluar subsanaciones y avanzar estados permitidos; en desarrollo quiero emitir un documento claramente marcado como demostración y verificarlo.

**Por qué**: Permite probar el ciclo administrativo sin producir documentos oficiales.

**Prueba independiente**: Con roles autorizados ejecutar transiciones válidas; verificar rechazos por rol/estado/titularidad, historial, descarga y consulta pública del código/QR de un documento demo.

**Criterios de aceptación**:

1. Toda transición conserva las restricciones actuales y registra responsable, hora y motivo.
2. La emisión demo solo ocurre en desarrollo y el PDF indica que no es oficial.
3. La consulta por código y QR reconoce documentos emitidos, anulados y códigos inexistentes sin filtrar datos privados.

## Casos límite

- No hay programas, diplomados, módulos ni requisitos publicados.
- La API o PostgreSQL no responde; la interfaz diferencia error de conexión, sesión vencida y ausencia de elegibilidad, y permite reintentar.
- Matrícula, programa, módulo o documento pertenece a otro estudiante.
- Diplomado o módulo está desaprobado, pendiente, inactivo o duplicado en una solicitud.
- El formato publicado tiene URL inválida o la descarga falla.
- Una solicitud cambia de estado mientras se intenta una transición obsoleta.
- Se intenta emitir un documento demo fuera de desarrollo o un documento oficial sin autorización institucional.

## Requisitos

- **FR-001**: El menú mostrará rutas funcionales para Diplomados, Certificaciones por Módulos, Requisitos y Programas/Procedimientos.
- **FR-002**: Los catálogos consultarán la persistencia existente, con búsqueda, filtros, limpieza y navegación a detalles.
- **FR-003**: Diplomados y módulos se validarán en el servidor contra historial académico, titularidad, estado y reglas de certificación.
- **FR-004**: El estudiante elegible podrá crear, guardar, recuperar, adjuntar, visualizar, reemplazar, retirar y presentar solicitudes mediante los servicios existentes.
- **FR-005**: Cada solicitud presentada generará o conservará un expediente persistente visible únicamente al titular y a roles autorizados.
- **FR-006**: Los requisitos y formatos públicos se filtrarán por tipo/programa, y solo costos, plazos y normativa con fuente institucional publicada se presentarán como oficiales.
- **FR-007**: El panel administrativo mantendrá controles de rol, auditoría y transiciones válidas al revisar solicitudes, documentos, observaciones y subsanaciones.
- **FR-008**: La emisión de demostración y sus datos estarán confinados a desarrollo y claramente identificados como no oficiales; no se simularán firmas.
- **FR-009**: La verificación pública permitirá comprobar código y QR de documentos emitidos sin exponer datos personales no necesarios.
- **FR-010**: La cuenta integral demo será idempotente, estará separada de producción y cubrirá cinco trámites anunciados; no se alterarán matrículas reales.
- **FR-011**: Fallos de red, sesión, elegibilidad, validación y servidor tendrán mensajes distintos y recuperables.
- **FR-012**: Se probarán accesibilidad básica, disposición móvil y enlaces/acciones reales sin cambiar header, portada, login, footer ni módulos de Grados y Títulos fuera de las correcciones de elegibilidad ya especificadas.
- **FR-013**: Las migraciones serán aditivas y versionadas; nunca se ejecutará reset, `db push` destructivo ni migración desde SQLite como parte de esta funcionalidad.
- **FR-014**: No se declarará lista para producción ninguna capacidad que dependa de aprobación, datos oficiales, firma o integración institucional ausente.

## Entidades clave

- **Programa académico**: oferta, tipo, código, estado y detalle publicado.
- **Matrícula e historial académico**: relación de titular con programa, diplomados y módulos cursados, estado, periodo, créditos y horas.
- **Requisito/plantilla**: requerimiento documental o académico vigente para programa y tipo de trámite.
- **Solicitud/expediente**: titular, programa, tipo, estado, documentos, validaciones e historial.
- **Documento emitido**: certificado de demostración u oficial autorizado, código verificable, estado y metadatos.

## Criterios de éxito

- **SC-001**: Los cuatro destinos del menú cargan y sus acciones principales completan sin 404/500 inesperados.
- **SC-002**: El 100% de solicitudes de módulo/diplomado probadas se acepta o rechaza conforme a historial, matrícula y reglas del servidor.
- **SC-003**: Una solicitud elegible completa el ciclo borrador-presentación-seguimiento conservando documentos e historial.
- **SC-004**: Todos los controles interactivos cubiertos por las pruebas tienen resultado verificable y feedback accesible.
- **SC-005**: Las pruebas del cliente y servidor, build y casos E2E acordados pasan sin regresiones en autenticación, Grados y Títulos o navegación.
- **SC-006**: No se exponen secretos, documentos privados, datos de otro estudiante ni información institucional no publicada.

## Supuestos y límites

- Se reutiliza el esquema y los procesos existentes cuando satisfacen estos requisitos; cualquier cambio de esquema requiere migración aditiva.
- La cuenta integral solo se prepara mediante el seed local protegido existente. La base `sigep` de desarrollo y `sigep_test` no se confunden, y no se ejecuta la migración de SQLite pendiente sin la confirmación ya requerida.
- El catálogo de prueba se distingue de oferta oficial. Costos, plazos, normativa, emisión oficial y firma quedan sujetos a insumos/aprobaciones institucionales.
- “Completo y listo” significa listo para probar en desarrollo; no equivale a aprobación para producción.
