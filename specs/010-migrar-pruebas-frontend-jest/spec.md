# Especificación de funcionalidad: Migrar pruebas frontend a Jest

**Rama de funcionalidad**: `010-migrar-pruebas-frontend-jest`

**Creada**: 2026-11-22

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Migrar el entorno de pruebas de `client/` de Vitest a Jest con `next/jest`, `jest-environment-jsdom` y Testing Library; completar las pruebas unitarias P2 a P6 de la spec 007 con reporte de cobertura. Sin cambiar código de producción. Usar TZ `America/Lima`, alias `@/*` a `./*`, MSW para `fetch` y retirar Vitest."

## Clarificaciones

### Sesión 2026-11-22

- Q: ¿Qué resultado debe comprobarse para textos iguales al límite de `truncar` y para textos que lo superan? → A: Los textos de longitud igual o inferior al límite se devuelven sin cambios; los que lo superan devuelven los primeros `max` caracteres seguidos de `…`.
- Q: ¿Qué comportamiento debe describir la cobertura P2–P6? → A: El comportamiento leído en los módulos actuales de `client/app`; el inventario y las discrepancias observadas quedan documentados en Casos límite y no habilitan cambios de producción.
- Q: ¿Es compatible `next/jest` con Next 16.4 y React 19.3, y qué versiones de Jest y jsdom deben usarse? → A: El `client/package.json` fija Next 16.4.3 y React/React DOM 19.3.0; Next 16.4.3 incluye `next/jest` y su peer range `^19.0.0` admite React 19.3. Se recomienda la pareja alineada `jest@30.5.2` y `jest-environment-jsdom@30.5.2`, ambas con soporte declarado para Node 24. La documentación oficial actual de Next documenta `next/jest`, pero no publica una matriz cerrada Next/Jest; por eso la combinación exacta se confirma con la prueba de humo P1 antes de migrar el resto.
- Q: ¿Qué archivos de P1 deben migrarse y dónde se ignora la cobertura? → A: Sustituir `vitest.config.ts` por la configuración Jest con `next/jest`; migrar `vitest.setup.ts` a setup de Jest, incluyendo `jest-dom` y el ciclo de MSW sin imports de Vitest; migrar `runner.test.ts` a Jest conservando sus comprobaciones de alias y zona horaria. Retirar Vitest del script, dependencias y lockfile. `client/.gitignore` ya contiene `/coverage`, que ignora `client/coverage/`; conservar y verificar esa regla.

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
5. **Dado** un texto de longitud igual o inferior al límite de truncado, **cuando** se trunca, **entonces** se devuelve sin cambios; si su longitud supera el límite, se devuelven los primeros `max` caracteres seguidos de `…`.

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
4. **Dado** el cierre de sesión en navegador, **cuando** se invoca `authService.logout`, **entonces** envía POST `/auth/logout` con `{}` y propaga la respuesta del cliente HTTP; el servicio actual no elimina datos de `localStorage`.

---

### Historia 5 - Verificar hooks (Prioridad: P5)

Como desarrollador, quiero verificar los valores y transiciones de los hooks de paginación, búsqueda y carga, para detectar regresiones en estado y efectos asíncronos.

**Por qué esta prioridad**: Los hooks comparten comportamiento entre varias vistas y requieren comprobar interacciones temporales y solicitudes concurrentes.

**Prueba independiente**: Renderizar los hooks, controlar el tiempo del debounce y resolver solicitudes en distintos órdenes o después del desmontaje.

**Escenarios de aceptación**:

1. **Dado** `usePaginacion`, **cuando** se inicializa, navega o reinicia, **entonces** expone página inicial 1 y `porPagina` recibido o predeterminado, asigna directamente el valor de `irA(p)` y reinicia la página sin cambiar `porPagina`.
2. **Dado** `useBuscar`, **cuando** cambia el texto, **entonces** `texto` se actualiza sincrónicamente y `busqueda` adopta el último valor después de 300 ms por defecto o del intervalo configurado.
3. **Dado** `useFetch`, **cuando** inicia, resuelve éxito o error, o se recarga, **entonces** los estados publicados reflejan el comportamiento actual: una respuesta de error establece `error` y termina la carga sin borrar datos previos; una promesa rechazada no se captura y puede dejar `cargando=true`.
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
4. **Dado** `Campo` con etiqueta, identificador y error opcional, **cuando** se representa, **entonces** asocia etiqueta y control, agrega la clase de error y muestra el texto de error con `role="alert"`; no agrega `aria-describedby` ni `aria-invalid`.
5. **Dado** `Boton` en variantes habilitada, deshabilitada o de carga, **cuando** se representa o interactúa, **entonces** muestra clases, texto y atributos adecuados y solo ejecuta la acción si está habilitado.
6. **Dado** `Modal` abierto o cerrado, **cuando** se representa o se solicita su cierre, **entonces** expone sus relaciones accesibles vigentes y llama a la acción de cierre cuando corresponde.
7. **Dado** `Alerta` o `CargandoSpinner`, **cuando** se representa cada tipo o texto, **entonces** expone contenido, clases y atributos de estado accesibles correspondientes.

### Casos límite

- Fechas vacías o inválidas, cambio de día por zona horaria, estado desconocido y texto exactamente en el límite o por encima de este.
- Errores HTTP con distintas combinaciones de `detail` y `error`, cuerpo no JSON, fallo de red y métodos con cuerpo vacío u omitido.
- Token almacenado presente o ausente, parámetros opcionales vacíos y ejecución de los servicios sin servidor externo.
- Cambios rápidos de búsqueda antes del debounce, respuestas concurrentes en orden inverso, recarga durante una solicitud y desmontaje con respuesta pendiente.
- Listas vacías, cero páginas, límites de paginación, campo sin error, botón cargando/deshabilitado y modal cerrado.

Inventario del comportamiento actual contrastado en `client/app` (base de las pruebas; no son cambios de producción):

- `lib/utils.ts`: `formatearFecha` y `formatearFechaHora` crean `Date` y usan `toLocaleDateString`/`toLocaleString` con locale `es-PE` y zona local del proceso; en la configuración de pruebas `TZ=America/Lima`. Para fechas inválidas el runtime devuelve `Invalid Date`. `infoEstado` consulta `ESTADOS_EXPEDIENTE` y, ante desconocidos, devuelve la clave recibida como etiqueta y `badge-pendiente`. `nombreCompleto` concatena literalmente `apellidos, nombres`, sin recortar espacios. `truncar` usa `texto.length > max`, con `max=60` por defecto; igual o menor devuelve el texto original y mayor devuelve `texto.slice(0, max) + "…"`. `length` y `slice` operan sobre unidades UTF-16, no sobre grafemas Unicode.
- `lib/api.ts`: GET/POST/PUT/PATCH/DELETE delegan a `fetch` con URL `API_URL + endpoint`, `Content-Type: application/json` y `credentials: "same-origin"`; los métodos con cuerpo serializan JSON. El cliente no lee `localStorage` ni añade `Authorization`. Lee JSON en toda respuesta; los errores HTTP usan `detail`, después `error` y luego `Error del servidor`, con `estadoHttp`. Un rechazo de red o de `res.json()` cae en `{ ok: false, error: "No se pudo conectar con el servidor" }`.
- Servicios: `authService` hace login POST `/auth/login`, perfil GET `/auth/perfil` y logout POST `/auth/logout` con `{}`. `estudiantesService` lista con `pagina`/`buscar`, obtiene por ID, crea con POST, edita con PUT y elimina con DELETE. `expedientesService` lista con `pagina`/`buscar` y `estado` opcional, obtiene por ID, crea con POST y cambia estado con PATCH enviando `{ estado, observaciones }`. `usuariosService` lista con filtro `rol` opcional, obtiene, crea, edita y cambia estado con PATCH `{ activo }`. `programasService` lista con filtro `tipo` opcional, obtiene, crea y edita. `documentosService` lista y añade `expedienteId` solo si es truthy, obtiene por ID, codifica con `encodeURIComponent` el código QR y tipo opcional, y construye exportación SUNEDU con `desde`/`hasta`. `auditoriaService` lista con página predeterminada 1 y búsqueda vacía. `dashboardService` obtiene `/dashboard/resumen`. `gradosService` lista grados/títulos con página y tipo opcional, obtiene, crea y edita; no aparece en la lista de servicios que la historia P4 de la spec 007 puso en alcance.
- `hooks/usePaginacion.ts`: empieza en página 1, usa `POR_PAGINA` por defecto, `irA` asigna directamente el valor dado y `reiniciar` vuelve a 1; no conoce total de páginas. `hooks/useBuscar.ts`: actualiza `texto` sincrónicamente, programa `busqueda` tras 300 ms por defecto (o `espera`) y cancela el timer anterior; no limpia explícitamente un timer pendiente al desmontar. `hooks/useFetch.ts`: inicia con `datos=null`, `cargando=true`, `error=null`; cada efecto limpia el error y activa carga, guarda la respuesta solo si el efecto sigue activo y permite recargar aumentando una revisión. Una respuesta rechazada no tiene `catch` y deja `cargando` activo; un resultado de error no borra `datos` anterior. La bandera de actividad evita que una solicitud previa reemplace estado después de cambiar dependencias o desmontar, pero no aborta la petición.
- Componentes: `Tabla` muestra encabezados y filas por `id`, permite render por columna, convierte valores por defecto a texto y presenta `No hay registros` en vacío; región y tabla tienen etiqueta accesible. `Paginacion` no renderiza para una página o menos, muestra un botón por página, deshabilita anterior/siguiente en los extremos y marca la página con `aria-current="page"`. `Badge` presenta etiqueta y clase de `infoEstado`. `Campo` asocia `<label>` mediante `htmlFor`, agrega clase y alerta para error; no define `aria-describedby` ni `aria-invalid`. `Boton` ofrece cuatro variantes, texto `Cargando…`, `aria-busy` y queda deshabilitado durante carga o si `disabled`. `Modal` usa `<dialog>`, sincroniza `showModal`/`close` con `abierto`, etiqueta el título y llama `onCerrar` desde botón y evento `close`. `Alerta` mapea cuatro tipos a clases y usa siempre `role="alert"` (por defecto tipo `info`). `CargandoSpinner` expone `role="status"`, `aria-live="polite"` y oculta el spinner decorativo a tecnologías asistivas.

Hallazgos de discrepancias que deben registrarse en las pruebas, sin corregir producción:

- `useFetch` no cumple hoy la expectativa de la spec 007 de limpiar datos previos ante error; tampoco captura rechazos de `fetcher`, por lo que puede dejar el indicador cargando. Los tests deben afirmar el resultado real y conservar esta discrepancia como hallazgo.
- `Campo` informa el error con `role="alert"`, pero no establece `aria-describedby` ni `aria-invalid`; la accesibilidad comprobable es la relación label/control y la alerta actual.
- `documentosService.exportarSunedu` tipa el resultado como `Blob`, pero `api` intenta parsear todas las respuestas como JSON. La prueba caracteriza esta diferencia sin alterar el cliente.
- `dashboardService` y `gradosService` existen además de los siete servicios enumerados en la Historia 4 de la spec 007. Sus operaciones quedan documentadas en el inventario, pero la cobertura P4 de esta funcionalidad conserva el alcance de los siete servicios que enumeró la spec 007.
- `authService.logout` solo envía POST `/auth/logout` con `{}`; no elimina datos de `localStorage`, pese a lo que afirma el escenario histórico de la spec 007.
- Salvo el código QR y su tipo opcional en `documentosService.verificarQr`, los servicios construyen sus parámetros de consulta por interpolación directa y no aplican `encodeURIComponent` de forma general.
- `client/.gitignore` ya ignora `/coverage`, por lo que `client/coverage/` no debe aparecer en cambios versionados.

Compatibilidad verificada por metadatos locales y fuentes oficiales: Next 16.4.3 expone el helper `next/jest` y declara React/React DOM `^19.0.0` como peer compatible; la guía oficial presenta la configuración Jest de Next. Jest y `jest-environment-jsdom` 30.5.2 son versiones de la misma publicación y declaran Node `^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0`. La combinación no tiene una matriz oficial publicada que certifique ese cruce exacto; la suite P1 debe ejecutar el humo real antes de completar la migración.

Fuentes técnicas primarias: [guía oficial Jest de Next.js](https://nextjs.org/docs/pages/guides/testing/jest), [metadatos Next 16.4.3](https://github.com/vercel/next.js/blob/v16.4.3/packages/next/package.json), [paquete Jest 30.5.2](https://github.com/jestjs/jest/blob/main/packages/jest/package.json), [paquete jest-environment-jsdom 30.5.2](https://github.com/jestjs/jest/blob/main/packages/jest-environment-jsdom/package.json).

## Requisitos

### Requisitos funcionales

- **FR-001**: El frontend DEBE ofrecer un único comando documentado para ejecutar sus pruebas y mostrar el resultado individual de cada caso; `client/coverage/` DEBE quedar ignorado mediante la regla `/coverage` de `client/.gitignore`.
- **FR-002**: La ejecución DEBE fallar con código distinto de cero si algún caso falla e identificar el caso junto con el resultado esperado y recibido.
- **FR-003**: El runner de pruebas DEBE migrar de Vitest a Jest y usar la integración `next/jest`, `jest-environment-jsdom` y Testing Library requerida para las pruebas DOM y de usuario. La pareja de versiones inicial recomendada es Jest y `jest-environment-jsdom` 30.5.2; P1 DEBE verificarla con Next 16.4.3 y React 19.3.0 mediante un smoke test real.
- **FR-004**: La migración DEBE retirar Vitest de los scripts, dependencias y configuración frontend y sincronizar el lockfile correspondiente.
- **FR-005**: El entorno DEBE resolver `@/*` con el mismo destino `./*` de `client/tsconfig.json` y establecer `TZ=America/Lima` antes de evaluar las pruebas.
- **FR-006**: Las pruebas que ejercitan `fetch` DEBEN interceptar solicitudes con MSW, aislar handlers entre casos y no depender de servicios reales.
- **FR-007**: La suite DEBE producir resumen de cobertura y reportes legibles que incluyan texto, HTML y lcov, sin imponer umbral de cobertura.
- **FR-008**: La Historia P2 DEBE cubrir `formatearFecha`, `formatearFechaHora`, `infoEstado`, `nombreCompleto` y `truncar`, incluidos valores inválidos, desconocidos y límites descritos en esta especificación.
- **FR-009**: La Historia P3 DEBE cubrir métodos GET/POST/PUT/PATCH/DELETE, cabeceras, cuerpo JSON, éxito, errores HTTP, parseo fallido, red y ausencia de lectura de token/`Authorization`.
- **FR-010**: La Historia P4 DEBE cubrir las operaciones de los servicios auth, estudiantes, expedientes, usuarios, programas, documentos y auditoría, incluidos parámetros opcionales y propagación de respuestas.
- **FR-011**: La Historia P5 DEBE cubrir estado inicial, transiciones, debounce, recarga y solicitudes obsoletas o posteriores al desmontaje de los hooks de paginación, búsqueda y carga.
- **FR-012**: La Historia P6 DEBE cubrir contenido, variantes, accesibilidad e interacciones de `Tabla`, `Paginacion`, `Badge`, `Campo`, `Boton`, `Modal`, `Alerta` y `CargandoSpinner`.
- **FR-013**: El comportamiento probado DEBE corresponder al código frontend actual; las discrepancias históricas o de accesibilidad/tipos aquí observadas se registran como hallazgos y no justifican cambios en producción.
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
