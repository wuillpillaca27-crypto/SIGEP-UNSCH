# Requirements Document

## Introduction

Este documento describe los requisitos para establecer un entorno de pruebas unitarias completo en el frontend del sistema SIGEP-UNSCH (Sistema de Gestión de Egresados de Posgrado – UNSCH). El proyecto es una aplicación Next.js 16 con TypeScript y React 19 que actualmente carece de cualquier framework de testing.

El objetivo es cubrir con pruebas verificables las seis capas del frontend: configuración del entorno, utilidades puras, cliente HTTP, servicios de dominio, hooks personalizados y componentes de interfaz de usuario.

El stack de testing seleccionado es: **Vitest** como runner, **@testing-library/react** para componentes, **@testing-library/user-event** para interacciones de usuario, **jsdom** como entorno DOM y **msw** (Mock Service Worker) para interceptar llamadas `fetch` en los servicios.

---

## Glossary

- **SUT** (*System Under Test*): Unidad de código que se está probando en un caso de prueba dado.
- **Suite**: Agrupación de pruebas relacionadas bajo un mismo archivo o bloque `describe`.
- **Vitest**: Runner de pruebas compatible con Vite/Next.js 16 que ejecuta TypeScript de forma nativa.
- **RTL**: React Testing Library — librería que permite renderizar componentes React en jsdom y consultar el DOM resultante mediante selectores accesibles.
- **MSW**: Mock Service Worker — biblioteca que intercepta llamadas `fetch` a nivel de red sin modificar el código de producción.
- **jsdom**: Implementación de DOM en Node.js que simula el entorno del navegador durante los tests.
- **Propiedad de ida y vuelta** (*round-trip*): Propiedad que verifica que aplicar una transformación y su inversa devuelve el valor original.
- **Propiedad metamórfica**: Relación entre dos entradas/salidas que debe cumplirse independientemente de los valores concretos.
- **Propiedad de idempotencia**: Propiedad donde aplicar la misma operación más de una vez produce el mismo resultado que aplicarla una sola vez.
- **Hook**: Función de React que encapsula lógica con estado reutilizable.
- **Fetcher**: Función sin argumentos que retorna `Promise<RespuestaApi<T>>`, pasada como parámetro a `useFetch`.
- **API_URL**: Constante `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"`.
- **RespuestaApi**: Tipo `{ ok: boolean; datos?: T; error?: string; mensaje?: string }` definido en `types/index.ts`.
- **Pagina**: Tipo genérico `{ datos: T[]; total: number; pagina: number; porPagina: number }` definido en `types/index.ts`.
- **EstadoExpediente**: Unión de literales `"en_revision" | "observado" | "aprobado" | "rechazado" | "pendiente"`.
- **Variante**: Propiedad del componente `Boton` con valores `"primario" | "secundario" | "peligro" | "borde"`.

---

## Requirements

### Requirement 1: Configuración del entorno de pruebas

**User Story:** Como desarrollador del equipo SIGEP-UNSCH, quiero un entorno de pruebas unitarias completamente configurado, de modo que pueda ejecutar tests con un único comando sin configuración manual adicional.

#### Acceptance Criteria

1. THE Suite_de_Pruebas SHALL incluir Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom y msw como dependencias de desarrollo declaradas en `client/package.json`.
2. THE Suite_de_Pruebas SHALL proporcionar un archivo `vitest.config.ts` en la raíz de `client/` que establezca `environment: "jsdom"`, el alias de path `@/` apuntando a `./app/`, e importe el setup desde `vitest.setup.ts`.
3. THE Suite_de_Pruebas SHALL proporcionar un archivo `vitest.setup.ts` que extienda los matchers de Vitest con `@testing-library/jest-dom`, inicie el servidor MSW (`server.listen()`) antes de ejecutar cualquier test, restablezca los handlers (`server.resetHandlers()`) tras cada test individual y cierre el servidor (`server.close()`) al finalizar toda la suite.
4. WHEN el desarrollador ejecuta `vitest --run` desde `client/`, THE Suite_de_Pruebas SHALL completar la ejecución con código de salida `0` cuando todos los tests pasan, y con código de salida distinto de `0` cuando al menos un test falla.
5. WHEN el desarrollador ejecuta `vitest --run` desde `client/`, THE Suite_de_Pruebas SHALL reportar el nombre de cada test y su estado (passed/failed) en la salida estándar.
6. THE Suite_de_Pruebas SHALL organizar los archivos de test bajo `client/app/__tests__/` con subdirectorios `lib/`, `services/`, `hooks/` y `components/`.
7. IF un test falla, THEN THE Suite_de_Pruebas SHALL mostrar el nombre del test, el mensaje de error y la diferencia entre el valor esperado y el recibido.

---

### Requirement 2: Pruebas unitarias de utilidades puras (lib/utils.ts)

**User Story:** Como desarrollador, quiero pruebas exhaustivas de las utilidades puras, de modo que pueda refactorizarlas con confianza y detectar regresiones de inmediato.

#### Acceptance Criteria

1. WHEN `formatearFecha` recibe una cadena ISO válida, THE Utilidades SHALL retornar una cadena con formato `"dd/mm/aaaa"` bajo el locale `es-PE`.
2. WHEN `formatearFecha` recibe `"2024-01-05T00:00:00.000Z"`, THE Utilidades SHALL retornar `"05/01/2024"`.
3. WHEN `formatearFechaHora` recibe `"2024-01-05T14:30:00.000Z"`, THE Utilidades SHALL retornar una cadena que comience con `"05/01/2024"` y contenga la hora en formato de 24 horas `"14:30"` bajo el locale `es-PE`.
4. WHEN `infoEstado` recibe cualquiera de los cinco valores de `EstadoExpediente` (`en_revision`, `observado`, `aprobado`, `rechazado`, `pendiente`), THE Utilidades SHALL retornar un objeto con las propiedades `label` y `clase` coincidentes con las entradas de `ESTADOS_EXPEDIENTE`.
5. WHEN `infoEstado` recibe un valor desconocido, THE Utilidades SHALL retornar `{ label: <valor_recibido>, clase: "badge-pendiente" }`.
6. WHEN `nombreCompleto` recibe `nombres` y `apellidos` no vacíos, THE Utilidades SHALL retornar la cadena `"<apellidos>, <nombres>"`.
7. WHEN `truncar` recibe un texto con longitud menor o igual a `max`, THE Utilidades SHALL retornar el texto sin modificar.
8. WHEN `truncar` recibe un texto con longitud mayor a `max`, THE Utilidades SHALL retornar los primeros `max` caracteres seguidos del carácter de elipsis Unicode `"…"` (U+2026, longitud JS 1).
9. IF `truncar` recibe un texto con longitud mayor a `max`, THEN THE Utilidades SHALL retornar una cadena cuya propiedad `.length` sea igual a `max + 1`, donde el `+1` corresponde al carácter de elipsis Unicode `"…"` (U+2026).
10. FOR ALL valores válidos de `EstadoExpediente`, `infoEstado(estado).clase` SHALL comenzar con `"badge-"` (propiedad metamórfica de nomenclatura CSS).
11. IF `formatearFecha` o `formatearFechaHora` reciben una cadena que no representa una fecha válida (por ejemplo cadena vacía o texto arbitrario), THEN THE Utilidades SHALL retornar la cadena `"Fecha inválida"`.

---

### Requirement 3: Pruebas unitarias del cliente HTTP (lib/api.ts)

**User Story:** Como desarrollador, quiero pruebas del cliente HTTP `api`, de modo que pueda verificar que todas las llamadas incluyen las cabeceras correctas y transforman las respuestas al tipo `RespuestaApi<T>`.

#### Acceptance Criteria

1. WHEN `api.get` realiza una solicitud exitosa al servidor, THE Cliente_HTTP SHALL retornar `{ ok: true, datos: <cuerpo_json> }`.
2. WHEN el servidor retorna un código de estado HTTP 4xx o 5xx con cuerpo JSON que contiene `detail` o `error`, THE Cliente_HTTP SHALL retornar `{ ok: false, error: <detail ?? error ?? "Error del servidor"> }` respetando esa prioridad de campos.
3. WHEN `fetch` lanza una excepción de red (por ejemplo, servidor no disponible), THE Cliente_HTTP SHALL retornar `{ ok: false, error: "No se pudo conectar con el servidor" }`.
4. WHEN el servidor retorna un código 4xx o 5xx y el cuerpo no es JSON parseable (lo que hace que `res.json()` lance una excepción), THE Cliente_HTTP SHALL retornar `{ ok: false, error: "No se pudo conectar con el servidor" }`.
5. WHEN existe un token en `localStorage` bajo la clave `"token"`, THE Cliente_HTTP SHALL incluir la cabecera `Authorization: Bearer <token>` en todas las solicitudes.
6. WHEN no existe token en `localStorage`, THE Cliente_HTTP SHALL enviar la solicitud sin cabecera `Authorization`.
7. WHEN la función `peticion` es invocada en un entorno sin `window` (SSR/Node.js), THE Cliente_HTTP SHALL enviar la solicitud sin cabecera `Authorization` y sin acceder a `localStorage`.
8. WHEN se invoca `api.post`, THE Cliente_HTTP SHALL enviar una solicitud HTTP con método `POST` y el cuerpo serializado como JSON.
9. WHEN se invoca `api.put`, THE Cliente_HTTP SHALL enviar una solicitud HTTP con método `PUT` y el cuerpo serializado como JSON.
10. WHEN se invoca `api.patch`, THE Cliente_HTTP SHALL enviar una solicitud HTTP con método `PATCH` y el cuerpo serializado como JSON.
11. WHEN se invoca `api.delete`, THE Cliente_HTTP SHALL enviar una solicitud HTTP con método `DELETE` sin cuerpo.
12. THE Cliente_HTTP SHALL incluir la cabecera `Content-Type: application/json` en todas las solicitudes salientes, incluyendo las de método `DELETE`.

---

### Requirement 4: Pruebas unitarias de los servicios de dominio (services/)

**User Story:** Como desarrollador, quiero pruebas de cada servicio de dominio con `api` mockeado, de modo que pueda verificar que cada método construye la URL correcta y propaga la respuesta sin alterarla.

#### Acceptance Criteria

1. WHEN `authService.login` es invocado con credenciales válidas, THE Servicio_Auth SHALL llamar a `api.post` con el endpoint `"/auth/login"` y las credenciales recibidas.
2. WHEN `authService.perfil` es invocado, THE Servicio_Auth SHALL llamar a `api.get` con el endpoint `"/auth/perfil"`.
3. WHEN `authService.logout` es invocado en el navegador, THE Servicio_Auth SHALL eliminar la entrada `"token"` de `localStorage`.
4. WHEN `estudiantesService.listar` es invocado con `pagina=2` y `buscar="García"`, THE Servicio_Estudiantes SHALL llamar a `api.get` con la URL `"/estudiantes?pagina=2&buscar=García"`.
5. WHEN `estudiantesService.obtener` es invocado con `id=5`, THE Servicio_Estudiantes SHALL llamar a `api.get` con la URL `"/estudiantes/5"`.
6. WHEN `estudiantesService.eliminar` es invocado con `id=3`, THE Servicio_Estudiantes SHALL llamar a `api.delete` con la URL `"/estudiantes/3"`.
7. WHEN `expedientesService.listar` es invocado con `pagina=1`, `buscar=""` y `estado="aprobado"`, THE Servicio_Expedientes SHALL llamar a `api.get` con la URL `"/expedientes?pagina=1&buscar=&estado=aprobado"`.
8. WHEN `expedientesService.listar` es invocado con `pagina=1` y `buscar=""` sin parámetro `estado`, THE Servicio_Expedientes SHALL llamar a `api.get` con la URL `"/expedientes?pagina=1&buscar="` sin incluir ningún parámetro `estado`.
9. WHEN `expedientesService.actualizarEstado` es invocado con `id`, `estado` y `observaciones`, THE Servicio_Expedientes SHALL llamar a `api.patch` con la URL `"/expedientes/<id>/estado"` y el cuerpo `{ estado, observaciones }`.
10. IF `expedientesService.actualizarEstado` es invocado con `id` y `estado` pero sin `observaciones`, THEN THE Servicio_Expedientes SHALL llamar a `api.patch` con la URL `"/expedientes/<id>/estado"` y el cuerpo `{ estado }` sin la propiedad `observaciones`.
11. WHEN `usuariosService.listar` es invocado con un `rol` definido, THE Servicio_Usuarios SHALL llamar a `api.get` con la URL `"/usuarios?rol=<valor>"`.
12. WHEN `usuariosService.listar` es invocado sin `rol`, THE Servicio_Usuarios SHALL llamar a `api.get` con la URL `"/usuarios"` sin parámetros de query.
13. WHEN `usuariosService.cambiarEstado` es invocado con `id` y `activo`, THE Servicio_Usuarios SHALL llamar a `api.patch` con la URL `"/usuarios/<id>/estado"` y el cuerpo `{ activo }`.
14. WHEN `programasService.listar` es invocado con un `tipo` definido, THE Servicio_Programas SHALL llamar a `api.get` con la URL `"/programas?tipo=<valor>"`.
15. IF `programasService.listar` es invocado sin `tipo`, THEN THE Servicio_Programas SHALL llamar a `api.get` con la URL `"/programas"` sin parámetros de query.
16. WHEN `documentosService.verificarQr` es invocado con un código, THE Servicio_Documentos SHALL llamar a `api.get` con la URL `"/documentos/verificar-qr/<codigo>"`.
17. WHEN `documentosService.exportarSunedu` es invocado con fechas `desde` y `hasta`, THE Servicio_Documentos SHALL llamar a `api.get` con la URL `"/documentos/exportar-sunedu?desde=<desde>&hasta=<hasta>"`.
18. WHEN `auditoriaService.listar` es invocado con `pagina` y `buscar`, THE Servicio_Auditoria SHALL llamar a `api.get` con la URL `"/auditoria?pagina=<pagina>&buscar=<buscar>"`.
19. THE Servicio_Dominio SHALL retornar sin modificación el objeto `RespuestaApi<T>` recibido desde `api` para todos los métodos de todos los servicios.

---

### Requirement 5: Pruebas unitarias de hooks personalizados (hooks/)

**User Story:** Como desarrollador, quiero pruebas de los hooks personalizados, de modo que pueda garantizar que gestionan el estado correctamente y que los efectos secundarios se ejecutan en el momento adecuado.

#### Acceptance Criteria

##### usePaginacion

1. WHEN `usePaginacion` es inicializado, THE Hook_Paginacion SHALL exponer `pagina` con valor inicial `1`, `porPagina` con valor `10`, y las funciones `irA` y `reiniciar`.
2. WHEN `irA(5)` es invocado sobre `usePaginacion`, THE Hook_Paginacion SHALL actualizar `pagina` a `5`.
3. WHEN `reiniciar` es invocado después de haber navegado a una página distinta de 1, THE Hook_Paginacion SHALL restablecer `pagina` a `1` sin modificar `porPagina`.
4. WHEN `usePaginacion` es inicializado con `porPagina=25`, THE Hook_Paginacion SHALL exponer `porPagina` con valor `25`.
5. IF `irA` es invocado con un valor fuera del rango válido (menor que 1 o mayor que el total de páginas disponibles), THEN THE Hook_Paginacion SHALL no actualizar `pagina` y mantener su valor actual.

##### useBuscar

6. WHEN `useBuscar` es inicializado, THE Hook_Buscar SHALL exponer `texto` y `busqueda` ambos con cadena vacía `""`.
7. WHEN `onChange` recibe un nuevo valor, THE Hook_Buscar SHALL actualizar `texto` de forma síncrona en el mismo ciclo de renderizado.
8. WHEN `onChange` recibe un valor y transcurren 300 ms sin una nueva invocación de `onChange`, THE Hook_Buscar SHALL actualizar `busqueda` al mismo valor (propiedad de ida y vuelta: texto → busqueda después del debounce).
9. WHEN `onChange` es invocado 3 o más veces en un intervalo de 299 ms, THE Hook_Buscar SHALL actualizar `busqueda` únicamente con el último valor recibido.
10. WHEN `useBuscar` es inicializado con `espera=500`, THE Hook_Buscar SHALL retrasar la actualización de `busqueda` 500 ms desde la última llamada a `onChange`.

##### useFetch

11. WHEN `useFetch` es inicializado con un fetcher, THE Hook_Fetch SHALL exponer `cargando` como `true`, `datos` como `null` y `error` como `null` antes de que el fetcher resuelva.
12. WHEN el fetcher resuelve con `{ ok: true, datos: <T> }`, THE Hook_Fetch SHALL actualizar `datos` con el valor recibido, establecer `cargando` en `false` y mantener `error` como `null`.
13. WHEN el fetcher resuelve con `{ ok: false, error: "mensaje" }`, THE Hook_Fetch SHALL establecer `error` con `"mensaje"`, `cargando` en `false` y mantener `datos` como `null`.
14. WHEN `recargar` es invocado, THE Hook_Fetch SHALL volver a ejecutar el fetcher y actualizar `datos` con la respuesta más reciente.
15. WHEN el componente que usa `useFetch` es desmontado antes de que el fetcher resuelva, THE Hook_Fetch SHALL descartar la respuesta y no actualizar el estado (sin memory leaks).
16. WHEN `recargar` es invocado mientras un fetch anterior todavía está en curso, THE Hook_Fetch SHALL descartar la respuesta del fetch anterior y aplicar únicamente la respuesta del fetch más reciente.
17. IF `useFetch` es invocado con un fetcher que falla, THEN `datos` SHALL permanecer en `null` (invariante: datos nunca contiene un valor parcial tras un error).

---

### Requirement 6: Pruebas unitarias de componentes UI (components/ui/)

**User Story:** Como desarrollador, quiero pruebas de los componentes de interfaz de usuario, de modo que pueda verificar que renderizan el contenido correcto, aplican las clases adecuadas y responden correctamente a las interacciones del usuario.

#### Acceptance Criteria

##### Tabla

1. WHEN `Tabla` recibe un arreglo `datos` vacío, THE Componente_Tabla SHALL renderizar el mensaje `"No hay registros"` (o el valor de la prop `sinDatos`) en una celda que abarca todas las columnas.
2. WHEN `Tabla` recibe filas con datos, THE Componente_Tabla SHALL renderizar exactamente tantas filas `<tr>` en el `<tbody>` como elementos tenga el arreglo `datos`.
3. WHEN `Tabla` recibe columnas con la propiedad `render`, THE Componente_Tabla SHALL invocar `render` por cada fila y mostrar el nodo retornado en la celda correspondiente.
4. THE Componente_Tabla SHALL incluir el atributo `aria-label` con el valor de la prop `etiqueta` específicamente en el elemento `<table>`.
5. FOR ALL configuraciones de columnas y datos, el número de celdas `<th>` en el `<thead>` SHALL ser igual al número de columnas declaradas en la prop `columnas` (invariante: consistencia de cabecera).

##### Paginacion

6. WHEN `Paginacion` recibe `total=5` y `porPagina=10`, THE Componente_Paginacion SHALL no renderizar ningún elemento visible (total de páginas ≤ 1).
7. WHEN `Paginacion` recibe `total=25` y `porPagina=10`, THE Componente_Paginacion SHALL renderizar exactamente 3 botones numerados (páginas 1, 2 y 3).
8. WHEN el usuario hace clic en el botón de página siguiente, THE Componente_Paginacion SHALL invocar `onChange` con el número de la página siguiente al valor de `paginaActual`.
9. WHEN `paginaActual` es igual a `1`, THE Componente_Paginacion SHALL activar el atributo `disabled` en el botón con `aria-label="Página anterior"`.
10. WHEN `paginaActual` es igual al total de páginas calculado, THE Componente_Paginacion SHALL activar el atributo `disabled` en el botón con `aria-label="Página siguiente"`.
11. THE Componente_Paginacion SHALL aplicar `aria-current="page"` exclusivamente al botón que corresponde a `paginaActual`.

##### Badge

12. WHEN `Badge` recibe `estado="aprobado"`, THE Componente_Badge SHALL renderizar el texto `"Aprobado"` y el atributo `className` del `<span>` SHALL contener el token `"badge-aprobado"`.
13. WHEN `Badge` recibe cualquier valor de `EstadoExpediente`, THE Componente_Badge SHALL renderizar un `<span>` cuyo `className` contenga un token que comience con `"badge-"`.
14. FOR ALL valores de `EstadoExpediente`, el texto renderizado por `Badge` SHALL coincidir con el campo `label` de `ESTADOS_EXPEDIENTE[estado]` (propiedad modelo-implementación).

##### Campo

15. WHEN `Campo` recibe `label="Nombre"` e `id="nombre"`, THE Componente_Campo SHALL renderizar un `<label>` con atributo `for="nombre"` y un `<input>` con `id="nombre"`.
16. WHEN `Campo` recibe la prop `error="Campo requerido"`, THE Componente_Campo SHALL renderizar un elemento con `role="alert"` que contenga el texto `"Campo requerido"`, y SHALL aplicar la clase `"campo-error"` al `<input>`.
17. WHEN `Campo` no recibe la prop `error`, THE Componente_Campo SHALL no renderizar ningún elemento con `role="alert"`.

##### Boton

18. WHEN `Boton` recibe `variante="primario"`, THE Componente_Boton SHALL renderizar un `<button>` cuyo `className` contenga `"btn"` y `"btn-rojo"`.
19. WHEN `Boton` recibe `cargando={true}`, THE Componente_Boton SHALL renderizar el texto `"Cargando…"`, establecer el atributo `aria-busy="true"` y activar el atributo `disabled` en el elemento `<button>`.
20. WHEN `Boton` recibe `cargando={false}` y el usuario hace clic sobre él, THE Componente_Boton SHALL invocar el manejador `onClick` exactamente una vez.
21. WHEN `Boton` recibe `disabled={true}`, THE Componente_Boton SHALL activar el atributo `disabled` en el `<button>` independientemente del valor de `cargando`.

##### Modal

22. WHEN `Modal` recibe `abierto={false}`, THE Componente_Modal SHALL renderizar un elemento `<dialog>` cuyo atributo `open` esté ausente (`dialog.open === false`).
23. WHEN `Modal` recibe `abierto={true}`, THE Componente_Modal SHALL renderizar el `<dialog>` con atributo `aria-modal="true"` y el valor de `titulo` en un elemento con `id="modal-titulo"`.
24. WHEN el usuario hace clic en el botón con `aria-label="Cerrar"`, THE Componente_Modal SHALL invocar la función `onCerrar` exactamente una vez.
25. THE Componente_Modal SHALL incluir el atributo `aria-labelledby="modal-titulo"` en el elemento `<dialog>`.

##### Alerta

26. WHEN `Alerta` recibe `tipo="error"` y `mensaje="Error de red"`, THE Componente_Alerta SHALL renderizar un elemento `<div>` con `role="alert"`, `className="alerta alerta-error"` y el texto `"Error de red"`.
27. WHEN `Alerta` recibe `tipo="exito"`, THE Componente_Alerta SHALL aplicar `className="alerta alerta-exito"` al elemento `<div>`.
28. WHEN `Alerta` recibe `tipo="advertencia"`, THE Componente_Alerta SHALL aplicar `className="alerta alerta-advertencia"` al elemento `<div>`.
29. WHEN `Alerta` recibe `tipo="info"` (o no recibe `tipo`), THE Componente_Alerta SHALL aplicar `className="alerta alerta-info"` al elemento `<div>`.

##### CargandoSpinner

30. WHEN `CargandoSpinner` es renderizado sin props, THE Componente_CargandoSpinner SHALL mostrar un elemento contenedor con `role="status"`, `aria-live="polite"` y el texto `"Cargando…"`.
31. WHEN `CargandoSpinner` recibe `texto="Procesando…"`, THE Componente_CargandoSpinner SHALL mostrar el texto `"Procesando…"` dentro del elemento `<span class="spinner-texto">`.
