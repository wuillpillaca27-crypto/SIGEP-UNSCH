# Especificación de funcionalidad: Pruebas automatizadas del servidor con Jest

**Rama de funcionalidad**: `009-pruebas-servidor-jest`

**Creada**: 2026-11-21

**Estado**: Borrador

**Entrada**: Pruebas automatizadas con Jest del servidor (`server/`) y reporte de cobertura antes de cualquier refactor. Las pruebas deben describir el comportamiento actual sin cambiar código de producción.

## Historias de usuario y pruebas

### Historia 1 - Ejecutar pruebas y consultar la línea base (Prioridad: P1)

Como desarrollador, quiero ejecutar las pruebas del servidor y consultar los resultados y la cobertura, para conocer el comportamiento actual antes de iniciar un refactor.

**Por qué esta prioridad**: Una línea base repetible permite comprobar que un cambio posterior conserva el comportamiento cubierto.

**Prueba independiente**: Ejecutar `npm test` desde `server/` y comprobar el resultado individual de cada caso, el resumen y los reportes de cobertura de texto, HTML y lcov dentro de `server/coverage/`.

**Escenarios de aceptación**:

1. **Dado** que están instaladas las dependencias del servidor, **cuando** se ejecuta `npm test` en `server/`, **entonces** Jest ejecuta la suite y muestra nombre y resultado de cada caso.
2. **Dado** que termina una ejecución, **cuando** se revisan sus artefactos, **entonces** hay cobertura de texto, HTML y lcov bajo `server/coverage/`, sin umbral mínimo de aprobación.
3. **Dado** que las pruebas existentes cubren solicitudes y catálogo, **cuando** se migran, **entonces** se conserva cada aserción inventariada en esta especificación y el escenario largo de solicitudes queda dividido en casos independientes.
4. **Dado** que las pruebas de integración necesitan persistencia y HTTP, **cuando** se ejecutan, **entonces** usan SQLite temporal real con Prisma/libSQL y Express en puerto aleatorio, sin sustituir esas dependencias por dobles.

**Inventario de aserciones existentes que debe conservarse**

Cada comprobación numerada abajo debe seguir representada al migrar. Las llamadas a `pedir` comprueban el código HTTP mediante su aserción interna de igualdad; los resultados JSON/binarios indicados son comprobaciones adicionales separadas.

| ID | Archivo y línea | Aserción individual que debe conservarse |
|---|---|---|
| S-01 | `solicitudes.test.js:83`, login auxiliar llamado en `:98–101` (4 ejecuciones) | En cada uno de los cuatro logins, el estado HTTP es 200. |
| S-02 | `solicitudes.test.js:92`, login auxiliar llamado en `:98–101` (4 ejecuciones) | En cada login, el cuerpo no tiene propiedad `token`. |
| S-03 | `solicitudes.test.js:94`, login auxiliar llamado en `:98–101` (4 ejecuciones) | En cada respuesta de login, la cookie contiene `HttpOnly`. |
| S-04 | `solicitudes.test.js:95`, login auxiliar llamado en `:98–101` (4 ejecuciones) | En cada respuesta de login, la cookie contiene `SameSite=Lax`. |
| S-05 | `solicitudes.test.js:83`, invocación `:102` | GET `/solicitudes` sin sesión tiene estado 401. |
| S-06 | `solicitudes.test.js:83`, invocación `:103` | GET `/administracion/configuracion` sin sesión tiene estado 401. |
| S-07 | `solicitudes.test.js:83`, invocación `:104` | GET `/administracion/configuracion` con estudiante tiene estado 403. |
| S-08 | `solicitudes.test.js:83`, invocación `:105` | GET `/administracion/configuracion` con operador tiene estado 200. |
| S-09 | `solicitudes.test.js:83`, invocación `:106` | GET `/administracion/usuarios` con operador tiene estado 403. |
| S-10 | `solicitudes.test.js:107` | El perfil del estudiante tiene `estudiante.codigoUniv === "TEST1"`. |
| S-11 | `solicitudes.test.js:83`, invocación `:108` | Crear la solicitud de `grado_doctor` tiene estado 200. |
| S-12 | `solicitudes.test.js:83`, invocación `:110` | Crear nuevamente la misma solicitud tiene estado 200. |
| S-13 | `solicitudes.test.js:110` | El ID de la segunda creación es igual al ID de la primera. |
| S-14 | `solicitudes.test.js:83`, invocación `:111` | Presentar sin documento requerido tiene estado 422. |
| S-15 | `solicitudes.test.js:83`, invocación `:112` | Cargar contenido que no tiene cabecera PDF tiene estado 415. |
| S-16 | `solicitudes.test.js:83`, invocación `:114` | Cargar el PDF de prueba tiene estado 200. |
| S-17 | `solicitudes.test.js:83`, invocación `:116` | Descargar como otro estudiante el documento ajeno tiene estado 404. |
| S-18 | `solicitudes.test.js:83`, invocación `:117` | Descargar el documento propio tiene estado 200. |
| S-19 | `solicitudes.test.js:117` | Los bytes descargados del documento propio son idénticos al PDF enviado. |
| S-20 | `solicitudes.test.js:83`, primera invocación de `Promise.all` en `:118–120` | La primera presentación concurrente tiene estado 200. |
| S-21 | `solicitudes.test.js:83`, segunda invocación de `Promise.all` en `:118–120` | La segunda presentación concurrente tiene estado 200. |
| S-22 | `solicitudes.test.js:122` | La respuesta de presentación tiene estado `presentado`. |
| S-23 | `solicitudes.test.js:123` | Ambas respuestas concurrentes contienen el mismo código. |
| S-24 | `solicitudes.test.js:83`, invocación `:124` | La presentación repetida tiene estado HTTP 200. |
| S-25 | `solicitudes.test.js:124` | La presentación repetida conserva el código anterior. |
| S-26 | `solicitudes.test.js:125` | El conteo de historial con `estadoDespues: presentado` es exactamente 1. |
| S-27 | `solicitudes.test.js:83`, invocación `:126` | GET `/revision-grados` con estudiante tiene estado 403. |
| S-28 | `solicitudes.test.js:83`, invocación `:128` | Aprobar con operador tiene estado 403. |
| S-29 | `solicitudes.test.js:83`, invocación `:129` | La acción `revisar` con operador tiene estado 200. |
| S-30 | `solicitudes.test.js:83`, invocación `:131` | La acción `observar` con requisito y comentario tiene estado 200. |
| S-31 | `solicitudes.test.js:83`, invocación `:132` | Subsanar antes de reemplazar el documento tiene estado 409. |
| S-32 | `solicitudes.test.js:83`, invocación `:133` | Reemplazar el PDF del requisito tiene estado 200. |
| S-33 | `solicitudes.test.js:83`, invocación `:134` | Subsanar luego del reemplazo tiene estado 200. |
| S-34 | `solicitudes.test.js:135` | La solicitud subsanada tiene estado `en_revision`. |
| S-35 | `solicitudes.test.js:83`, invocación `:136` | La acción `validar` con operador tiene estado 200. |
| S-36 | `solicitudes.test.js:83`, invocación `:137` | Aprobar con administrador tiene estado 200. |
| S-37 | `solicitudes.test.js:137` | La solicitud aprobada tiene estado `aprobado`. |
| S-38 | `solicitudes.test.js:138` | El número de registros de auditoría asociados es exactamente 8. |
| S-39 | `solicitudes.test.js:83`, invocación `:139` | GET `/revision-grados/reporte` con administrador tiene estado 200. |
| S-40 | `solicitudes.test.js:139–141` | El reporte es exactamente `[{ tipoTramite: "grado_doctor", estado: "aprobado", total: 1 }]`. |
| S-41 | `solicitudes.test.js:83`, invocación `:143` | Verificar antes de emitir tiene estado 404. |
| S-42 | `solicitudes.test.js:83`, invocación `:144` | Verificar un código no registrado tiene estado 404. |
| S-43 | `solicitudes.test.js:83`, invocación `:145` | Verificar el código inválido `%3F` tiene estado 400. |
| S-44 | `solicitudes.test.js:83`, invocación `:146` | Emitir con operador tiene estado 403. |
| S-45 | `solicitudes.test.js:83`, invocación `:147` | Emitir sin comentario/referencia con administrador tiene estado 409. |
| S-46 | `solicitudes.test.js:83`, invocación `:148` | Emitir con administrador y referencia tiene estado 200. |
| S-47 | `solicitudes.test.js:83`, invocación `:149` | Verificar luego de emitir tiene estado 200. |
| S-48 | `solicitudes.test.js:150` | Las únicas claves de la respuesta, ordenadas, son `codigo`, `demostracion`, `emitidoEn`, `programa` y `tipoTramite`. |
| S-49 | `solicitudes.test.js:151` | El código verificado coincide con el código de la solicitud. |
| S-50 | `solicitudes.test.js:152` | El tipo de trámite verificado es `grado_doctor`. |
| S-51 | `solicitudes.test.js:153` | `emitidoEn` tiene un valor verdadero. |
| S-52 | `solicitudes.test.js:83`, invocación `:154` | Verificar el código con tipo de trámite distinto tiene estado 404. |
| S-53 | `solicitudes.test.js:83`, invocación `:156` | Verificar después de anular la solicitud tiene estado 404. |
| S-54 | `solicitudes.test.js:83`, invocación `:157` | GET `/auth/google/estado` tiene estado 200. |
| S-55 | `solicitudes.test.js:83`, invocación `:158` | GET `/auth/google/iniciar` sin configuración tiene estado 503. |
| S-56 | `solicitudes.test.js:83`, invocación `:159` | POST `/auth/logout` tiene estado 200. |
| S-57 | `solicitudes.test.js:83`, invocación `:160` | GET `/auth/perfil` con la cookie cerrada tiene estado 401. |
| C-01 | `catalogo-grados.test.js:50` | GET del catálogo tiene estado 200. |
| C-02 | `catalogo-grados.test.js:51` | El catálogo es exactamente `{ datos: [{ id: 1, nombre: "Programa de prueba" }] }`. |
| C-03 | `catalogo-grados.test.js:54` | GET del detalle tiene estado 200. |
| C-04 | `catalogo-grados.test.js:55–62` | El detalle contiene exactamente un requisito activo con los campos/valores indicados, fuente `Referencia de prueba` y observaciones `Observación de prueba`. |
| C-05 | `catalogo-grados.test.js:66`, iteración `id="2"` | Ese ID produce estado 404 y se consume el cuerpo como JSON. |
| C-06 | `catalogo-grados.test.js:66`, iteración `id="3"` | Ese ID produce estado 404 y se consume el cuerpo como JSON. |
| C-07 | `catalogo-grados.test.js:66`, iteración `id="1e0"` | Ese ID produce estado 404 y se consume el cuerpo como JSON. |

Las aserciones de estado S-01 y S-05–S-57 corresponden a la aserción del helper `pedir` en la línea 83; las cuatro comprobaciones S-02–S-04 se ejecutan por cada llamada auxiliar de login. Los nombres de archivo y números de línea son los observados antes de migrar.
### Historia 2 - Verificar listados y reportes de revisión (Prioridad: P2)

Como operador de revisión, quiero que se prueben los filtros, la paginación y el reporte agrupado para que la consulta de expedientes conserve su comportamiento actual.

**Por qué esta prioridad**: La revisión requiere localizar expedientes y consultar resúmenes antes de realizar acciones.

**Prueba independiente**: Ejecutar los casos de listado y reporte contra la API real y SQLite temporal; comprobar filtros, límites, roles y agrupaciones.

**Escenarios de aceptación**:

1. **Dado** que hay expedientes presentados de varios tipos y estados, **cuando** se usa `tipos` (lista separada por comas) o `estado`, **entonces** el listado filtra por los tipos de grado reconocidos y por `en_revision`, `observado`, `aprobado` o `emitido`; los tipos desconocidos se descartan y un estado no reconocido se ignora.
2. **Dado** expedientes con códigos, DNI, nombres y apellidos distintos, **cuando** se envía `buscar`, **entonces** el texto se recorta, se limita a 100 caracteres y se busca en esos cuatro campos.
3. **Dado** que existen resultados, **cuando** se solicita una página, **entonces** se omiten `(pagina - 1) * 20`, se consultan hasta 21 filas, se devuelven como máximo 20 y `siguiente` indica si llegó la fila adicional; `puedeAprobar` es verdadero solo para administrador.
4. **Dado** un número de página, **cuando** se consulta el listado, **entonces** `parseInt` lo normaliza al rango 1–10000 y valores no convertibles usan 1; sufijos como `2x` se aceptan parcialmente como página 2 y se registran como hallazgo.
5. **Dado** usuarios de roles distintos, **cuando** consultan listado o reporte, **entonces** se comprueban los permisos actuales.
6. **Dado** expedientes de varios grupos, **cuando** se solicita el reporte, **entonces** los totales agrupados coinciden con los datos persistidos.

### Historia 3 - Verificar acciones de revisión (Prioridad: P3)

Como operador o administrador, quiero que las pruebas cubran acciones, restricciones y registros asociados, para conservar evidencia del flujo actual de expedientes.

**Por qué esta prioridad**: Las acciones cambian estados y registros relacionados y deben quedar cubiertas antes de un refactor.

**Prueba independiente**: Ejecutar las acciones en Express conectado a SQLite temporal y consultar estado, historial, revisiones y auditoría persistidos.

**Escenarios de aceptación**:

1. **Dado** un expediente en cada estado preparado, **cuando** se intenta revisar, observar, validar, aprobar o emitir, **entonces** se registran tanto las transiciones aceptadas como las rechazadas que existan hoy.
2. **Dado** un ID no entero o datos de acción inválidos, **cuando** se envía la acción, **entonces** se comprueba la respuesta actual de validación.
3. **Dado** un ID no entero, comentario recortado de más de 1500 caracteres o acción fuera del conjunto permitido, **cuando** se envía una acción, **entonces** la API responde 400 antes de procesar la transición (`revision-grados.js`). Una transición incompatible con la etapa o evidencia devuelve 409.
4. **Dado** que faltan validaciones obligatorias, **cuando** se intenta aprobar, **entonces** la API responde 409 por etapa, evidencia o datos de acción inválidos.
5. **Dado** un operador y un administrador, **cuando** intentan aprobar o emitir, **entonces** se comprueban los permisos vigentes por acción.
6. **Dado** un documento con ruta inválida o no autorizado, **cuando** se intenta descargarlo, **entonces** se comprueba el rechazo o error actual sin exponer el archivo.
7. **Dado** que otra acción cambia el estado concurrentemente, **cuando** el `updateMany` condicional no encuentra la etapa previamente leída, **entonces** la API responde 409 con el conflicto de cambio durante revisión.
8. **Dado** que una acción válida genera registros asociados, **cuando** termina, **entonces** historial, revisión y auditoría se contrastan con el resultado persistido.

### Historia 4 - Verificar operaciones administrativas (Prioridad: P4)

Como operador o administrador, quiero que las pruebas cubran las consultas y operaciones administrativas, para preservar permisos y validaciones actuales.

**Por qué esta prioridad**: Estas operaciones administran parámetros, usuarios y catálogos usados por otros flujos.

**Prueba independiente**: Ejecutar cada recurso administrativo con usuarios de distintos roles, entradas válidas e inválidas y SQLite temporal; comparar respuestas y datos persistidos.

**Escenarios de aceptación**:

1. **Dado** un operador o administrador autenticado, **cuando** solicita configuración, **entonces** obtiene `SIGEP-UNSCH`, la descripción de ingreso DNI/correo y contraseña, tamaño máximo PDF de `10 MB` y vigencia de sesión de `1 hora`; estudiante recibe 403 y usuario sin sesión recibe 401 cuando la sesión está habilitada.
2. **Dado** los programas existentes, **cuando** operador o administrador consulta el listado, **entonces** recibe la lista ordenada por nombre e ID. **Cuando** se crea, **entonces** solo administrador puede hacerlo; nombre y facultad deben ser texto no vacío de hasta 160 caracteres y el tipo debe ser una clave existente en `tipoPorPrograma`. Datos inválidos dan 400 y una creación válida 201.
3. **Dado** estudiantes existentes, **cuando** operador o administrador consulta, **entonces** se devuelve como máximo 25 filas, el indicador `siguiente` se deriva de hasta 26 filas y la página se normaliza al rango 1–10000 mediante `parseInt` con valor predeterminado 1.
4. **Dado** usuarios existentes, **cuando** consulta un operador, **entonces** recibe 403; administrador puede listar hasta 25 por página. Solo administrador puede crear usuarios. Se validan nombres y apellidos no vacíos de hasta 100 caracteres, DNI de ocho dígitos, correo de hasta 254 caracteres con formato validado, rol entre `estudiante`, `operador` y `administrador`, y contraseña de al menos 10 caracteres y no más de 72 bytes. Datos inválidos dan 400, duplicados Prisma `P2002` dan 409 y la respuesta no incluye contraseña. Otros errores se delegan al manejador global (503). Para rol estudiante también se exige código universitario no vacío (máximo 40 caracteres) y programa activo con ID entero seguro.
5. **Dado** requisitos existentes, **cuando** operador o administrador consulta, **entonces** puede listar. Solo administrador puede crear. Se validan programa activo con ID entero seguro, código no vacío de hasta 50 caracteres, nombre hasta 160, descripción hasta 2000, referencia normativa hasta 100 y tipo en `academico`, `documental`, `pago`, `idioma` o `otro`. La entrada inválida da 400, programa inactivo/inexistente da 400, creación válida da 201 y duplicado `P2002` da 409.
6. **Dado** registros de auditoría, **cuando** consulta un operador, **entonces** recibe 403; administrador obtiene hasta 25 filas ordenadas por fecha e ID descendentes, con indicador basado en hasta 26 filas.
7. **Dado** un error Prisma distinto de `P2002`, **cuando** falla una operación de creación, **entonces** no se inventa una respuesta local: se registra la respuesta del manejador global bajo `server/src/index.js` (503 para error no reconocido).

### Historia 5 - Verificar identidad y sesión (Prioridad: P5)

Como persona usuaria, quiero que las pruebas cubran el inicio y cierre de sesión y la consulta del perfil, para mantener evidencia de los controles de identidad actuales.

**Por qué esta prioridad**: La autenticación protege las operaciones personales, de revisión y administración.

**Prueba independiente**: Ejecutar casos de login, perfil y logout con Express y SQLite temporal; comprobar cookie, respuestas y revocación de sesión.

**Escenarios de aceptación**:

1. **Dado** credenciales válidas de una cuenta activa, **cuando** inicia sesión, **entonces** obtiene cookie `sigep_sesion` HttpOnly, SameSite=Lax, Secure salvo modo demostración, duración de una hora, y el cuerpo no incluye el token.
2. **Dado** una cookie de sesión válida, **cuando** consulta el perfil, **entonces** recibe la proyección de perfil permitida, sin contraseña.
3. **Dado** un correo o DNI mal formado, contraseña vacía o superior a 72 bytes, **cuando** intenta iniciar sesión, **entonces** recibe 400. Credenciales incorrectas y cuenta inactiva reciben 401 con mensaje genérico.
4. **Dado** más de diez intentos por IP dentro de la ventana de un minuto, **cuando** intenta otro login, **entonces** se comprueba el 429 vigente; también se cubre el límite de 4096 IP guardadas cuando resulte comprobable.
5. **Dado** que falta el secreto de sesión, **cuando** se intenta login o acceso autenticado, **entonces** la API responde 503. Cookie ausente, inválida, vencida, revocada o perteneciente a usuario inactivo da 401 en autenticación.
6. **Dado** cualquier cookie de sesión, incluso ausente o inválida, **cuando** llama logout, **entonces** se devuelve `{ ok: true }` y se limpia la cookie; si la sesión es válida, también se revoca su identificador.
7. **Dado** Google OAuth sin configuración válida, **cuando** consulta estado, inicia o llama callback, **entonces** estado informa `habilitado: false` y las rutas de iniciar/callback responden 503 con su mensaje actual.

### Casos límite

- La base SQLite temporal, el servidor o Prisma no pueden iniciarse: el caso debe fallar con contexto y liberar los recursos que sí alcanzó a crear.
- Dos acciones concurrentes intentan cambiar el mismo expediente: registrar el resultado observado sin presuponer un conflicto si el código no lo produce.
- Filtros vacíos, número de página inicial/final y página fuera de rango: comprobar lo que el servidor responde hoy, incluso si la normalización tolera formatos inesperados.
- Entradas que superan límites y relaciones obligatorias ausentes: registrar aceptación o rechazo del código, no convertir una expectativa de usuario en una regla nueva.
- Google sin credenciales: comprobar la respuesta informativa sin iniciar una solicitud externa.
- Toda diferencia entre la conducta observada y la esperada se registra como hallazgo; esta funcionalidad no la corrige.

**Hallazgos observados para registrar, no corregir en esta funcionalidad**:

- En `administracion.js`, `pagina` se interpreta con `Number.parseInt`; valores como `1x` o `1.5` se convierten silenciosamente en la página 1. Confirmar con casos de prueba y reportar como conducta observada.
- En `administracion.js`, estudiantes, usuarios y auditoría consultan hasta 26 filas para devolver 25 e informar `siguiente`; programas y requisitos no usan ese paginado. Es una diferencia observable entre listados, no un cambio solicitado.
- En `identidad.js`, logout devuelve `{ ok: true }` aunque la sesión no sea válida, como comportamiento deliberado de limpieza; debe preservarse y probarse, no tratarse como defecto.
- La lista de intentos de login es local al proceso y su expiración/límite depende de `req.ip`; no equivale a un límite distribuido entre instancias. Registrar esta limitación como hallazgo operativo, sin rediseñarla aquí.
- El escenario actual de solicitudes espera exactamente ocho registros de auditoría después de las acciones indicadas; debe conservarse como aserción del escenario, sin inferir que cada operación tenga auditoría universal.

## Requisitos

### Requisitos funcionales

- **FR-001**: El comando de pruebas del servidor DEBE ejecutar Jest, mostrar nombre y resultado de cada caso y presentar un resumen agregado.
- **FR-002**: Cada ejecución DEBE producir cobertura de texto, HTML y lcov dentro de `server/coverage/`; NO DEBE imponer un umbral mínimo.
- **FR-003**: La migración de `solicitudes.test.js` y `catalogo-grados.test.js` DEBE conservar todas las comprobaciones enumeradas S-01–S-57 y C-01–C-07. El escenario largo de solicitudes DEBE dividirse en casos independientes con nombres descriptivos.
- **FR-004**: Las pruebas de integración DEBEN usar SQLite temporal real mediante Prisma y libSQL, y Express en un puerto asignado dinámicamente; NO DEBEN sustituirlos por dobles.
- **FR-005**: La suite DEBE cubrir filtros por tipo, estado y búsqueda del listado de revisión; páginas de 20 elementos e indicador de siguiente página; límite de página; permisos vigentes y reporte agrupado.
- **FR-006**: La suite DEBE cubrir transiciones de revisar, observar, validar, aprobar y emitir; IDs no enteros y datos inválidos; comentario superior a 1500 caracteres rechazado con 400; bloqueo de aprobación por requisitos obligatorios faltantes; permisos de aprobación/emisión; descarga con ruta inválida; cambios concurrentes y registros actuales de historial, revisión y auditoría.
- **FR-007**: La suite DEBE cubrir configuración, programas, estudiantes, usuarios, requisitos y auditoría, con sus permisos por rol, validaciones, límites, proyecciones y errores actuales descritos en la Historia 4.
- **FR-008**: La suite DEBE cubrir login/logout con cookie HttpOnly, perfil, entradas inválidas, credenciales erróneas, cuenta inactiva, limitación de intentos, secreto ausente, sesión ausente/inválida/revocada y Google sin configuración.
- **FR-009**: Las pruebas DEBEN describir el comportamiento actual. Los defectos aparentes o diferencias se registran como hallazgos; no se cambia producción para alterar el resultado en este alcance.
- **FR-010**: No se usarán secretos reales ni archivos `.env`; credenciales y datos de prueba serán sintéticos y efímeros.
- **FR-011**: Los cambios de implementación quedan limitados a pruebas/configuración de pruebas y documentación estrictamente necesarias; no se modifica `client/` ni código de producción de `server/`.
- **FR-012**: La cobertura se presenta como línea base sin umbral. Las brechas se informan como observaciones, no como defectos corregidos.
- **FR-013**: Los casos mantienen trazabilidad a `server/src/`, al inventario FR-016 de `specs/008-documentacion-arquitectura/spec.md`, al análisis de `docs/01-analisis-de-sistema/` y a los contratos/modelos pertinentes de `docs/legacy/openspec/`.

### Entidades clave

- **Caso de prueba**: Comprobación independiente con nombre, preparación, acción y resultado del comportamiento actual.
- **Base temporal de integración**: SQLite efímero con datos sintéticos, aislado por ejecución y eliminado al terminar.
- **Línea base de cobertura**: Reporte de código ejercitado y no ejercitado, sin umbral de aprobación.
- **Hallazgo de comportamiento**: Resultado observado que puede diferir de la expectativa; se registra sin corregir producción en este alcance.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Desde `server/`, `npm test` ejecuta los casos y presenta individualmente el nombre y resultado de cada uno.
- **SC-002**: Una ejecución exitosa genera los tres formatos de cobertura solicitados en `server/coverage/`, sin umbral de aprobación.
- **SC-003**: El 100 % de las comprobaciones S-01–S-57 y C-01–C-07 se conserva después de migrar; las llamadas del escenario único de solicitudes quedan organizadas en casos independientes.
- **SC-004**: Cada comportamiento enumerado para P2–P5 tiene al menos un caso asociado al módulo o endpoint que lo implementa.
- **SC-005**: Las pruebas de integración usan SQLite temporal real y Express con puerto dinámico, sin servicio de datos externo ni credenciales reales.
- **SC-006**: La cobertura permite identificar el código ejercitado y las brechas actuales, sin presentarse como garantía ni objetivo aprobado.
- **SC-007**: No se modifica el cliente ni el código de producción del servidor.

## Supuestos

- La prueba puede preparar en el archivo SQLite temporal las tablas y datos sintéticos requeridos por los módulos actuales; no implica migración del esquema de producto.
- Node instalado observado para esta aclaración es v24.16.0. `node:sqlite` y `DatabaseSync` funcionan en ejecución directa de Node. Jest no está instalado en `server/node_modules`; el intento de instalarlo desde la caché npm local falló porque no había respuesta de registro disponible, por lo que la compatibilidad combinada Node/Jest queda pendiente de verificar al instalar la dependencia de pruebas.
- Si el entorno Jest no puede cargar `node:sqlite`, la alternativa sin modificar producción es preparar y consultar el SQLite temporal mediante `@libsql/client` o el adaptador Prisma ya usado por el servidor, manteniendo la base real y Express; se debe validar esa opción durante la planificación antes de migrar los fixtures.
- Las respuestas esperadas para los nuevos casos se fijan inspeccionando el código actual. Si la conducta difiere de la intención, se documenta como hallazgo.
- Esta feature añade Jest como dependencia de desarrollo/configuración de prueba según la constitución v1.2.0; no selecciona refactor de módulos ni cambios de producto.
- Fuentes: `specs/008-documentacion-arquitectura/spec.md` FR-016; `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`; `docs/02-arquitectura-software/componentes-arquitectonicos.md`; `server/src/identidad.js`, `identidad-google.js`, `solicitudes.js`, `revision-grados.js`, `administracion.js`, `catalogo-grados.js`, `verificacion-documentos.js`, `index.js`; `docs/legacy/openspec/api-contracts.md` y `data-models.md`.