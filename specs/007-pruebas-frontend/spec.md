# Especificación de funcionalidad: Pruebas unitarias del frontend

**Rama de funcionalidad**: `007-pruebas-frontend`

**Creada**: 2026-11-21

**Estado**: Borrador

**Entrada**: Descripción del usuario: "$speckit-specify Pruebas unitarias del frontend (client/) para describir y verificar el comportamiento existente en seis capas independientes, sin modificar comportamiento de producción ni tocar server/ o la base de datos. Requisitos detallados de referencia en docs/legacy/kiro-pruebas-unitarias/requirements.md."

## Escenarios de usuario y pruebas

### Historia 1 - Ejecutar la suite completa (Prioridad: P1)

Como desarrollador del equipo, quiero ejecutar todas las pruebas del frontend con un único comando y ver el resultado de cada caso, para detectar regresiones rápidamente y saber qué comportamiento falló.

**Por qué esta prioridad**: Es la base para que el equipo pueda ejecutar y aprovechar las capas de pruebas posteriores.

**Prueba independiente**: Ejecutar el comando único desde `client/` con todos los casos correctos y comprobar código de salida 0 y resultado por caso; provocar un fallo controlado en una prueba y comprobar código distinto de 0 y el detalle esperado frente al recibido.

**Escenarios de aceptación**:

1. **Dado** que todas las pruebas registradas pasan, **cuando** el desarrollador ejecuta el comando único desde `client/`, **entonces** la suite informa el nombre y estado de cada prueba y termina con código 0.
2. **Dado** que al menos una prueba falla, **cuando** se ejecuta la suite, **entonces** informa el caso fallido, el valor esperado y el recibido, y termina con código distinto de 0.
3. **Dado** el conjunto de pruebas del frontend, **cuando** se consulta su organización, **entonces** los casos están agrupados en subcarpetas `lib`, `services`, `hooks` y `components`.

### Historia 2 - Verificar utilidades puras (Prioridad: P2)

Como desarrollador, quiero verificar las utilidades de formato y presentación para detectar cambios accidentales en sus resultados.

**Por qué esta prioridad**: Son funciones reutilizables y aislables, por lo que ofrecen una primera capa de regresión de bajo costo.

**Prueba independiente**: Probar cada función con entradas válidas, límites y entradas inválidas, y comparar resultados con el comportamiento vigente.

**Escenarios de aceptación**:

1. **Dado** una fecha válida, **cuando** se formatea como fecha o fecha y hora, **entonces** el resultado conserva el formato `dd/mm/aaaa` y la hora de 24 horas según corresponda.
2. **Dado** una fecha inválida, vacía o arbitraria, **cuando** se formatea, **entonces** el resultado es `Fecha inválida`.
3. **Dado** uno de los estados conocidos, **cuando** se consulta su información, **entonces** etiqueta y clase corresponden a la configuración vigente; **dado** un estado desconocido, **entonces** se devuelve ese valor como etiqueta y la clase `badge-pendiente`.
4. **Dado** nombres y apellidos no vacíos, **cuando** se obtiene el nombre completo, **entonces** se devuelve `<apellidos>, <nombres>`.
5. **Dado** un texto de longitud igual o inferior al límite, **cuando** se trunca, **entonces** se devuelve sin cambios; si lo supera, se devuelven los primeros `max` caracteres y una elipsis Unicode (`…`).

### Historia 3 - Verificar el cliente HTTP (Prioridad: P3)

Como desarrollador, quiero verificar cómo el cliente HTTP construye solicitudes y comunica resultados, para proteger el contrato observable de red.

**Por qué esta prioridad**: Los servicios y hooks dependen de que este comportamiento se mantenga.

**Prueba independiente**: Simular respuestas exitosas, respuestas de error y fallos de conexión; inspeccionar método, URL, cabeceras y cuerpo enviados en cada solicitud.

**Escenarios de aceptación**:

1. **Dado** una respuesta exitosa con JSON, **cuando** se consulta el cliente, **entonces** se devuelve `{ ok: true, datos: cuerpo }` sin alterar el cuerpo.
2. **Dado** un error HTTP 4xx o 5xx con JSON, **cuando** el cuerpo presenta `detail`, `error` o ningún campo de error, **entonces** se selecciona el mensaje con prioridad `detail`, luego `error` y finalmente `Error del servidor`.
3. **Dado** un fallo de red o un error HTTP cuyo cuerpo no se puede interpretar como JSON, **cuando** se realiza la solicitud, **entonces** se devuelve `{ ok: false, error: "No se pudo conectar con el servidor" }`.
4. **Dado** un token almacenado, **cuando** se realiza una solicitud en navegador, **entonces** se envía `Authorization: Bearer <token>`; sin token o sin `window`, no se añade esa cabecera ni se accede a almacenamiento del navegador.
5. **Dado** cada método GET, POST, PUT, PATCH y DELETE, **cuando** se realiza la solicitud, **entonces** el método y cuerpo observados coinciden con el contrato actual, los métodos con cuerpo serializan JSON y todas las solicitudes incluyen `Content-Type: application/json`.

### Historia 4 - Verificar servicios de dominio (Prioridad: P4)

Como desarrollador, quiero comprobar que los servicios traducen sus operaciones a las rutas y parámetros actuales y devuelven intactas las respuestas recibidas.

**Por qué esta prioridad**: Protege los contratos entre la interfaz y los servicios sin requerir cambios en el servidor.

**Prueba independiente**: Aislar cada servicio, invocar sus operaciones y comprobar método, ruta, parámetros, cuerpo y respuesta.

**Escenarios de aceptación**:

1. **Dado** cada operación de auth, estudiantes, expedientes, usuarios, programas, documentos y auditoría, **cuando** se invoca con sus argumentos, **entonces** se usa el método y la ruta descritos en los contratos vigentes y en `docs/legacy/kiro-pruebas-unitarias/requirements.md`.
2. **Dado** parámetros opcionales omitidos, **cuando** se construye una solicitud, **entonces** se omiten de la URL o del cuerpo conforme al comportamiento actual.
3. **Dado** una respuesta del cliente HTTP, **cuando** cualquier servicio la devuelve, **entonces** conserva exactamente su contenido y forma.
4. **Dado** el cierre de sesión en navegador, **cuando** se invoca, **entonces** se elimina el token local conforme al comportamiento actual.

### Historia 5 - Verificar hooks (Prioridad: P5)

Como desarrollador, quiero verificar los valores y transiciones de los hooks de paginación, búsqueda y carga de datos para detectar regresiones en estado y efectos asíncronos.

**Por qué esta prioridad**: Los hooks encapsulan comportamiento compartido por varias vistas.

**Prueba independiente**: Observar valores iniciales y cambios ante acciones, controlar el tiempo del debounce y resolver solicitudes en distinto orden o después de desmontar el consumidor.

**Escenarios de aceptación**:

1. **Dado** `usePaginacion`, **cuando** se inicializa, navega y reinicia, **entonces** expone los valores iniciales actuales, actualiza página al navegar y reinicia a 1 sin cambiar `porPagina`; los valores fuera del rango válido se ignoran.
2. **Dado** `useBuscar`, **cuando** se inicializa o recibe cambios, **entonces** `texto` se actualiza sincrónicamente y `busqueda` solo adopta el último valor tras el intervalo configurado (300 ms por defecto).
3. **Dado** `useFetch`, **cuando** se inicia, resuelve éxito o error, o se recarga, **entonces** sus estados reflejan el resultado actual y no conservan datos parciales ante error.
4. **Dado** una respuesta obsoleta o una respuesta pendiente tras desmontaje, **cuando** termina, **entonces** no reemplaza el estado correspondiente a la solicitud más reciente ni actualiza el consumidor desmontado.

### Historia 6 - Verificar componentes de interfaz (Prioridad: P6)

Como desarrollador, quiero verificar contenido, clases, accesibilidad e interacciones de los componentes de interfaz compartidos para conservar su presentación y uso observables.

**Por qué esta prioridad**: Completa la cobertura de las unidades visibles más reutilizables una vez establecidos el entorno y las capas lógicas.

**Prueba independiente**: Renderizar cada componente con sus variantes y propiedades límite, consultar el contenido y atributos accesibles, y ejecutar interacciones de usuario.

**Escenarios de aceptación**:

1. **Dado** `Tabla`, **cuando** recibe datos o una lista vacía, **entonces** representa el número correspondiente de filas, columnas, contenido personalizado y mensaje vacío, y etiqueta la tabla de forma accesible.
2. **Dado** `Paginacion`, **cuando** hay cero o varias páginas, **entonces** representa controles pertinentes, deshabilita límites y marca la página actual accesiblemente.
3. **Dado** `Badge`, **cuando** recibe un estado conocido, **entonces** presenta la etiqueta configurada y una clase de estado correspondiente.
4. **Dado** `Campo`, **cuando** recibe etiqueta, identificador y error opcional, **entonces** asocia etiqueta y control, y comunica el error accesiblemente.
5. **Dado** `Boton`, **cuando** recibe variantes, estado de carga o deshabilitado, **entonces** representa clases, texto y atributos correspondientes y solo permite la interacción cuando está habilitado.
6. **Dado** `Modal`, **cuando** está abierto o cerrado, **entonces** presenta el estado y asociación accesible actuales y al solicitar cierre invoca su acción de cierre.
7. **Dado** `Alerta` o `CargandoSpinner`, **cuando** se representa cada tipo o texto, **entonces** se exponen el contenido, clases y atributos de estado accesibles correspondientes.

### Casos límite

- Fechas vacías, arbitrarias o inválidas; estados desconocidos; textos iguales al límite de truncado y por encima de él.
- Respuestas HTTP 4xx/5xx con campos de error en distintos órdenes de prioridad, JSON inválido y errores de red.
- Solicitudes sin token y ejecución sin entorno de navegador.
- Parámetros opcionales omitidos, incluidos explícitamente vacíos cuando el contrato actual los conserva.
- Búsquedas repetidas antes de vencer el debounce, respuestas concurrentes en orden inverso y desmontaje con solicitud pendiente.
- Listas vacías, límites de páginas, campos sin error, botones ocupados/deshabilitados y modal cerrado.

## Requisitos

### Requisitos funcionales

- **FR-001**: El equipo DEBE poder ejecutar la suite completa del frontend desde `client/` mediante un solo comando.
- **FR-002**: La ejecución DEBE informar el nombre y estado de cada prueba, devolver código 0 si todas pasan y distinto de 0 si alguna falla, e incluir esperado y recibido en el detalle de fallos.
- **FR-003**: Las pruebas DEBEN organizarse en subcarpetas `lib`, `services`, `hooks` y `components`.
- **FR-004**: La suite DEBE describir el comportamiento existente de `formatearFecha`, `formatearFechaHora`, `infoEstado`, `nombreCompleto` y `truncar`, incluidos los casos inválidos y límites indicados en la Historia 2.
- **FR-005**: La suite DEBE describir las respuestas exitosas, errores, fallos de red, autenticación, ejecución sin navegador, métodos y cabeceras actuales del cliente HTTP.
- **FR-006**: La suite DEBE cubrir los servicios auth, estudiantes, expedientes, usuarios, programas, documentos y auditoría, verificando método, URL, parámetros opcionales, cuerpo y propagación inalterada de respuestas.
- **FR-007**: La suite DEBE cubrir valores iniciales, transiciones, debounce, recarga y descarte de respuestas obsoletas o posteriores al desmontaje de `usePaginacion`, `useBuscar` y `useFetch`.
- **FR-008**: La suite DEBE cubrir el contenido, clases, accesibilidad e interacciones de `Tabla`, `Paginacion`, `Badge`, `Campo`, `Boton`, `Modal`, `Alerta` y `CargandoSpinner`.
- **FR-009**: La incorporación de pruebas NO DEBE alterar el comportamiento del código de producción. Cualquier cambio imprescindible en producción DEBE justificarse y registrarse antes de realizarlo.
- **FR-010**: El alcance DEBE limitarse al frontend `client/`; no se DEBE modificar `server/` ni la base de datos.
- **FR-011**: Los casos de prueba DEBEN contrastarse con el comportamiento realmente presente; cualquier discrepancia con requisitos históricos se documentará antes de cambiar código de producción.

### Entidades clave

- **Caso de prueba**: Verificación independiente de un comportamiento observable, con nombre, resultado y, ante fallo, valores esperado y recibido.
- **Suite del frontend**: Conjunto de casos organizados por las cuatro capas requeridas y ejecutables en una sola invocación.
- **Respuesta del cliente**: Resultado observable de éxito o error que los servicios y hooks propagan o procesan según el comportamiento actual.

## Criterios de éxito

### Resultados medibles

- **SC-001**: El 100 % de las pruebas de las seis historias se ejecuta mediante un único comando documentado desde `client/`.
- **SC-002**: En ejecuciones con todo correcto, la suite muestra un resultado individual para cada caso y devuelve código 0; ante un fallo, devuelve código distinto de 0.
- **SC-003**: Para cada fallo, la salida permite identificar el caso y comparar el valor esperado con el recibido.
- **SC-004**: Las cuatro subcarpetas requeridas contienen los grupos de pruebas de sus capas correspondientes.
- **SC-005**: La suite cubre todos los elementos enumerados en FR-004 a FR-008 sin cambios observables en producción.

## Supuestos

- La referencia `docs/legacy/kiro-pruebas-unitarias/requirements.md` aporta detalle histórico; esta especificación y el código actual determinan el alcance vigente.
- Los nombres de operaciones, propiedades, rutas, textos y casos concretos se confirman al inspeccionar el frontend durante la planificación e implementación.
- Las pruebas caracterizan el comportamiento presente. Si una afirmación histórica no coincide con el código actual, se documenta la discrepancia y no se cambia producción para forzar que pase.
- El equipo considera independientes las seis historias para planificar y entregar por capas; P1 habilita la ejecución, y P2-P6 agregan cobertura incremental.
- Se usan mecanismos de aislamiento y simulación para que las pruebas no dependan de servicios externos ni alteren datos reales.