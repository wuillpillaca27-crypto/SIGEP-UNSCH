# Especificación de funcionalidad: Migrar pruebas frontend a Jest

**Rama de funcionalidad**: `010-migrar-pruebas-frontend-jest`

**Creada**: 2026-11-22

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Migrar el entorno de pruebas de `client/` de Vitest a Jest con `next/jest`, `jest-environment-jsdom` y Testing Library; completar las pruebas unitarias P2 a P6 de la spec 007 con reporte de cobertura. Sin cambiar código de producción. Usar TZ `America/Lima`, alias `@/*` a `./*`, MSW para `fetch` y retirar Vitest."

## Escenarios de usuario y pruebas

### Historia 1 - Ejecutar la suite frontend con Jest (Prioridad: P1)

Como desarrollador del equipo, quiero ejecutar las pruebas del frontend con un único comando y recibir resultados individuales y cobertura, para detectar regresiones en las seis capas de pruebas.

**Por qué esta prioridad**: El runner y su configuración habilitan y unifican las pruebas P2–P6.

**Prueba independiente**: Ejecutar `npm test` desde `client/`, observar una suite identificable con código de salida cero y reportes de cobertura; verificar que una prueba fallida produce código distinto de cero y muestra el caso que falló.

**Escenarios de aceptación**:

1. **Dado** el conjunto de pruebas frontend, **cuando** se ejecuta el comando de pruebas desde `client/`, **entonces** Jest ejecuta los casos y muestra el resultado de cada uno.
2. **Dado** un caso fallido, **cuando** termina la ejecución, **entonces** la salida identifica el caso, el resultado esperado y el recibido, y el proceso termina con código distinto de cero.
3. **Dado** una ejecución completa, **cuando** se revisan sus artefactos, **entonces** existe un resumen de cobertura de texto y reportes HTML y lcov, sin umbral mínimo obligatorio.
4. **Dado** la configuración frontend, **cuando** se resuelven módulos y fechas, **entonces** el alias `@/*` conserva el destino `./*` relativo a `client/` y las pruebas usan la zona horaria `America/Lima`.
5. **Dado** el entorno tras la migración, **cuando** se inspeccionan scripts, dependencias y configuración de pruebas, **entonces** Jest es el runner configurado y Vitest ya no se instala ni se invoca.

---

### Historia 2 - Verificar utilidades puras (Prioridad: P2)

Como desarrollador, quiero comprobar los resultados de las utilidades de formato y presentación para detectar regresiones en valores, fechas y límites.

**Por qué esta prioridad**: Son funciones reutilizables que pueden verificarse independientemente del navegador y la red.

**Prueba independiente**: Ejecutar los casos de utilidades y comparar fechas, estados, nombres y textos límite con el comportamiento actual bajo `America/Lima`.

**Escenarios de aceptación**:

1. **Dado** fechas válidas, **cuando** se formatean como fecha o fecha y hora, **entonces** se conserva el formato local `dd/mm/aaaa` y la hora correspondiente a `America/Lima`.
2. **Dado** una fecha vacía, arbitraria o inválida, **cuando** se formatea, **entonces** se conserva la salida observada `Invalid Date`.
3. **Dado** un estado conocido o desconocido, **cuando** se consulta su etiqueta y clase, **entonces** los estados conocidos usan su configuración y el desconocido se devuelve como etiqueta con clase `badge-pendiente`.
4. **Dado** nombres y apellidos, **cuando** se obtiene el nombre completo, **entonces** se devuelve `<apellidos>, <nombres>`.
5. **Dado** un texto igual o superior al límite de truncado, **cuando** se trunca, **entonces** se mantiene íntegro hasta el límite y se agregan los primeros `max` caracteres más `…` si lo supera.

---

### Historia 3 - Verificar el cliente HTTP (Prioridad: P3)

Como desarrollador, quiero comprobar cómo el cliente frontend construye las solicitudes y procesa respuestas y errores, para preservar el contrato observable con el servidor.

**Por qué esta prioridad**: Los servicios de dominio y hooks dependen del comportamiento de este cliente.

**Prueba independiente**: Interceptar `fetch` con MSW, inspeccionar método, URL, cabeceras y cuerpo, y responder con éxito, errores y fallos de red sin servicios externos.

**Escenarios de aceptación**:

1. **Dado** una respuesta exitosa JSON, **cuando** se consulta el cliente, **entonces** devuelve `{ ok: true, datos: cuerpo }` sin alterar el cuerpo.
2. **Dado** un error HTTP con JSON, **cuando** el cuerpo incluye `detail`, `error` o ninguno, **entonces** selecciona el mensaje en prioridad `detail`, luego `error` y finalmente `Error del servidor`.
3. **Dado** un fallo de red o un cuerpo de error que no se puede interpretar como JSON, **cuando** se realiza la solicitud, **entonces** devuelve `{ ok: false, error: "No se pudo conectar con el servidor" }`.
4. **Dado** cada método GET, POST, PUT, PATCH y DELETE, **cuando** se envía una solicitud, **entonces** método, URL, serialización del cuerpo y `Content-Type: application/json` reflejan el contrato vigente.
5. **Dado** que hay o no un token en almacenamiento del navegador, **cuando** se realiza una solicitud, **entonces** el comportamiento actual no lee almacenamiento local ni agrega `Authorization`.

---

### Historia 4 - Verificar servicios de dominio (Prioridad: P4)

Como desarrollador, quiero comprobar que cada servicio construye las rutas y parámetros esperados y propaga las respuestas, para mantener coherencia entre la interfaz y los contratos vigentes.

**Por qué esta prioridad**: Estos servicios concentran las llamadas de cada dominio y pueden probarse por separado del servidor.

**Prueba independiente**: Ejecutar cada conjunto de casos aislando el cliente HTTP y contrastar operación, método, ruta, parámetros, cuerpo y respuesta.

**Escenarios de aceptación**:

1. **Dado** cada operación de autenticación, estudiantes, expedientes, usuarios, programas, documentos y auditoría, **cuando** se invoca, **entonces** usa el método y ruta vigentes del servicio.
2. **Dado** parámetros opcionales presentes u omitidos, **cuando** se construye la solicitud, **entonces** URL y cuerpo conservan el comportamiento actual para cada parámetro.
3. **Dado** una respuesta del cliente HTTP, **cuando** la devuelve un servicio, **entonces** el contenido y la forma se conservan sin alteración.
4. **Dado** el cierre de sesión en navegador, **cuando** se invoca el servicio, **entonces** elimina el token local conforme al comportamiento actual.

---

### Historia 5 - Verificar hooks (Prioridad: P5)

Como desarrollador, quiero verificar los valores y transiciones de los hooks de paginación, búsqueda y carga, para detectar regresiones en estado y efectos asíncronos.

**Por qué esta prioridad**: Los hooks comparten comportamiento entre varias vistas y requieren comprobar interacciones temporales y solicitudes concurrentes.

**Prueba independiente**: Renderizar los hooks, controlar el tiempo del debounce y resolver solicitudes en distintos órdenes o después del desmontaje.

**Escenarios de aceptación**:

1. **Dado** `usePaginacion`, **cuando** se inicializa, navega o reinicia, **entonces** expone página inicial 1 y `porPagina` recibido o predeterminado, asigna directamente el valor de `irA(p)` y reinicia la página sin cambiar `porPagina`.
2. **Dado** `useBuscar`, **cuando** cambia el texto, **entonces** `texto` se actualiza sincrónicamente y `busqueda` adopta el último valor después de 300 ms por defecto o del intervalo configurado.
3. **Dado** `useFetch`, **cuando** inicia, resuelve éxito o error, o se recarga, **entonces** los estados publicados corresponden al resultado actual y un error no conserva datos parciales.
4. **Dado** solicitudes superpuestas o pendientes al desmontar el consumidor, **cuando** terminan, **entonces** una respuesta obsoleta no sustituye el estado de la solicitud más reciente y una respuesta tardía no actualiza al consumidor desmontado.

---

### Historia 6 - Verificar componentes de interfaz (Prioridad: P6)

Como desarrollador, quiero comprobar contenido, accesibilidad e interacciones de los componentes compartidos, para conservar su uso observable en distintas variantes.

**Por qué esta prioridad**: Cierra la cobertura de las unidades visuales reutilizables después de las capas lógicas.

**Prueba independiente**: Renderizar cada componente con datos y variantes relevantes, consultar el DOM por roles y etiquetas accesibles y realizar interacciones de usuario.

**Escenarios de aceptación**:

1. **Dado** `Tabla` con filas, contenido personalizado o lista vacía, **cuando** se representa, **entonces** muestra filas, columnas, contenido y mensaje vacío pertinentes y su nombre accesible.
2. **Dado** `Paginacion` con cero o varias páginas, **cuando** se representa o se usa, **entonces** muestra los controles pertinentes, deshabilita los límites y marca accesiblemente la página actual.
3. **Dado** `Badge` con estados conocidos, **cuando** se representa, **entonces** muestra la etiqueta y clase configuradas.
4. **Dado** `Campo` con etiqueta, identificador y error opcional, **cuando** se representa, **entonces** asocia etiqueta y control y comunica el error de forma accesible.
5. **Dado** `Boton` en variantes habilitada, deshabilitada o de carga, **cuando** se representa o interactúa, **entonces** muestra clases, texto y atributos adecuados y solo ejecuta la acción si está habilitado.
6. **Dado** `Modal` abierto o cerrado, **cuando** se representa o se solicita su cierre, **entonces** expone sus relaciones accesibles vigentes y llama a la acción de cierre cuando corresponde.
7. **Dado** `Alerta` o `CargandoSpinner`, **cuando** se representa cada tipo o texto, **entonces** expone contenido, clases y atributos de estado accesibles correspondientes.

### Casos límite

- Fechas vacías o inválidas, cambio de día por zona horaria, estado desconocido y texto exactamente en el límite o por encima de este.
- Errores HTTP con distintas combinaciones de `detail` y `error`, cuerpo no JSON, fallo de red y métodos con cuerpo vacío u omitido.
- Token almacenado presente o ausente, parámetros opcionales vacíos y ejecución de los servicios sin servidor externo.
- Cambios rápidos de búsqueda antes del debounce, respuestas concurrentes en orden inverso, recarga durante una solicitud y desmontaje con respuesta pendiente.
- Listas vacías, cero páginas, límites de paginación, campo sin error, botón cargando/deshabilitado y modal cerrado.

## Requisitos

### Requisitos funcionales

- **FR-001**: El frontend DEBE ofrecer un único comando documentado para ejecutar sus pruebas y mostrar el resultado individual de cada caso.
- **FR-002**: La ejecución DEBE fallar con código distinto de cero si algún caso falla e identificar el caso junto con el resultado esperado y recibido.
- **FR-003**: El runner de pruebas DEBE migrar de Vitest a Jest y usar la integración `next/jest`, `jest-environment-jsdom` y Testing Library requerida para las pruebas DOM y de usuario.
- **FR-004**: La migración DEBE retirar Vitest de los scripts, dependencias y configuración frontend y sincronizar el lockfile correspondiente.
- **FR-005**: El entorno DEBE resolver `@/*` con el mismo destino `./*` de `client/tsconfig.json` y establecer `TZ=America/Lima` antes de evaluar las pruebas.
- **FR-006**: Las pruebas que ejercitan `fetch` DEBEN interceptar solicitudes con MSW, aislar handlers entre casos y no depender de servicios reales.
- **FR-007**: La suite DEBE producir resumen de cobertura y reportes legibles que incluyan texto, HTML y lcov, sin imponer umbral de cobertura.
- **FR-008**: La Historia P2 DEBE cubrir `formatearFecha`, `formatearFechaHora`, `infoEstado`, `nombreCompleto` y `truncar`, incluidos valores inválidos, desconocidos y límites descritos en esta especificación.
- **FR-009**: La Historia P3 DEBE cubrir métodos GET/POST/PUT/PATCH/DELETE, cabeceras, cuerpo JSON, éxito, errores HTTP, parseo fallido, red y ausencia de lectura de token/`Authorization`.
- **FR-010**: La Historia P4 DEBE cubrir las operaciones de los servicios auth, estudiantes, expedientes, usuarios, programas, documentos y auditoría, incluidos parámetros opcionales y propagación de respuestas.
- **FR-011**: La Historia P5 DEBE cubrir estado inicial, transiciones, debounce, recarga y solicitudes obsoletas o posteriores al desmontaje de los hooks de paginación, búsqueda y carga.
- **FR-012**: La Historia P6 DEBE cubrir contenido, variantes, accesibilidad e interacciones de `Tabla`, `Paginacion`, `Badge`, `Campo`, `Boton`, `Modal`, `Alerta` y `CargandoSpinner`.
- **FR-013**: El comportamiento probado DEBE corresponder al código frontend actual; las discrepancias históricas se registran y no justifican por sí solas cambios en producción.
- **FR-014**: El alcance DEBE limitarse a dependencias, configuración, documentación de pruebas y archivos de pruebas dentro de `client/`; no se modifica código de producción, `server/` ni la base de datos.

### Entidades clave

- **Caso de prueba frontend**: Verificación nombrada de un comportamiento observable de una utilidad, cliente, servicio, hook o componente.
- **Solicitud simulada**: Intercambio `fetch` interceptado para inspeccionar método, ruta, cabeceras, cuerpo y respuesta sin servicio externo.
- **Reporte de cobertura**: Resumen de ejecución que identifica código cubierto y no cubierto en los formatos acordados.

## Criterios de éxito

### Resultados medibles

- **SC-001**: El 100 % de los casos de las Historias P2–P6 se ejecuta desde un solo comando de `client/` y se muestra individualmente.
- **SC-002**: Una ejecución sin fallos termina con código 0; una ejecución con al menos un fallo termina con código distinto de cero y señala el caso fallido.
- **SC-003**: Los reportes de cobertura de texto, HTML y lcov se generan en cada ejecución completa, sin un umbral obligatorio.
- **SC-004**: Las cinco capas P2–P6 cubren todos los elementos y escenarios listados en FR-008 a FR-012.
- **SC-005**: La revisión del diff confirma cero cambios en código de producción, `server/` y la base de datos.

## Supuestos

- La spec 007 es la referencia funcional para los casos P2–P6; este cambio conserva sus escenarios y actualiza el entorno de ejecución descrito en su Historia P1.
- El comportamiento actual de cada módulo frontend determina los resultados esperados; no se corregirán discrepancias funcionales como parte de esta migración.
- Las pruebas permanecen dentro de `client/`; configuraciones y archivos existentes de Vitest que solo sirven al runner se pueden retirar al migrar.
- MSW se usa para solicitudes `fetch`; los servicios de dominio pueden aislar el cliente HTTP para verificar sus rutas y argumentos.
- No se necesitan secretos, llamadas a servicios externos ni datos persistentes reales para ejecutar la suite.
