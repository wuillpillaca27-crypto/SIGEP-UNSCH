# Modelo de datos de pruebas

La funcionalidad no introduce datos persistentes ni cambia entidades de negocio. Las entidades siguientes son conceptos temporales usados durante una ejecución de pruebas.

## Entidades

### Caso de prueba

- **Identidad**: nombre del caso en la salida del runner.
- **Grupo**: una de las capas `lib`, `services`, `hooks` o `components`.
- **Entrada**: valores, eventos, respuestas o estados simulados.
- **Resultado esperado**: comportamiento visible del código actual.
- **Resultado recibido**: salida observada durante la ejecución.
- **Estado**: aprobado o fallido.
- **Regla**: en caso de fallo, la salida identifica el caso y presenta esperado frente a recibido.

### Suite

- **Composición**: conjunto de casos de las historias P1–P6.
- **Ejecución**: una llamada `npm test` desde `client/` inicia una corrida completa.
- **Estado agregado**: código de salida 0 si todos los casos pasan; distinto de 0 si alguno falla.

### Respuesta HTTP simulada

- **Solicitud observada**: URL, método, cabeceras y cuerpo enviados por el cliente.
- **Respuesta**: estado HTTP y cuerpo usados para ejercitar el cliente.
- **Aislamiento**: los handlers simulados se restablecen entre casos y el servidor de pruebas se cierra tras la suite.

### Entorno DOM

- **Zona**: `America/Lima`, definida para la ejecución de pruebas.
- **Alias**: `@/*` resuelve desde `client/` igual que el alias de TypeScript.
- **Ciclo de vida**: matchers DOM y servidor MSW se preparan una vez para la suite con limpieza entre pruebas.

## Relaciones y reglas

- Una suite contiene casos; cada caso pertenece a una capa.
- Una prueba HTTP puede asociar una solicitud observada con una respuesta simulada y aserciones sobre el resultado.
- Las pruebas no guardan datos entre casos ni escriben en la base de datos.
- Ningún caso debe requerir modificar fuentes de producción para adecuarlas a expectativas históricas.