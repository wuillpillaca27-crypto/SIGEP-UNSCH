# Validación rápida: Certificaciones

## Requisitos

- PostgreSQL de desarrollo con migraciones ya aplicadas.
- `server/.env` y dependencias instaladas en `server/` y `client/`.
- Programa y plantilla de certificación solo si provienen de una fuente aprobada. Para pruebas, usar el fixture aislado ya empleado por `server/src/test/postgres-suite.js`; marcar sus filas como datos de prueba y limpiar su esquema al terminar.

## Comprobaciones

1. Sin cookie, solicitar `GET /api/solicitudes/opciones-certificacion`: debe responder 401.
2. Iniciar sesión con estudiante cuyo programa no es de certificación: debe recibir solo el motivo apropiado y ningún programa seleccionable; la UI ofrece Ayuda.
3. Iniciar sesión con fixture elegible y consultar opciones: debe devolver únicamente la matrícula del titular y sus requisitos activos.
4. Intentar crear solicitud con otro programa o tipo: debe responder 422.
5. Crear borrador válido, adjuntar un PDF de fixture válido, presentar y consultar la solicitud en `/api/solicitudes`; verificar código e historial.
6. Ejecutar Jest con cobertura en `server/` y `client/`, y `npm run build` en `client/`.

Los fixtures de esta guía no constituyen programas ni requisitos institucionales habilitados.

## Diagnóstico local

La consulta en modo de solo lectura a PostgreSQL encontró un programa activo de maestría y una cuenta activa de estudiante vinculada a ese programa. La base local carece de diplomados y programas modulares, así como de sus plantillas activas de certificación. Los datos institucionales requieren matrícula y catálogo aprobados.

El asistente anterior mostraba el mensaje genérico al recibir un perfil autenticado sin coincidencia entre `perfil.estudiante.programa.tipo` y los tipos del catálogo de Certificaciones. El asistente compartido seleccionaba el catálogo correcto, pero el filtro local no distinguía ausencia de matrícula, tipo incompatible, programa inactivo y requisitos sin publicar.

El retorno a la solicitud usa el parámetro `continuar` del inicio de sesión con credenciales. El flujo existente de Google, si está configurado, redirige a Mis Trámites.

## Verificación ejecutada

- Cliente: 63 pruebas Jest en 22 suites con cobertura. Se comprobó la redirección con retorno, el motivo de inelegibilidad, la ayuda y el recorrido de cuatro pasos.
- Servidor: 59 pruebas Jest en 11 suites con cobertura. La integración con PostgreSQL comprobó sesión, rol, elegibilidad, titularidad, retoma del borrador, desactivación de catálogo, PDF obligatorio, presentación e historial.
- Compilación de Next.js y verificación de TypeScript completadas. Next.js informó que encontró dos archivos de bloqueo al detectar la raíz del proyecto.
- El servicio local en el puerto 8000 respondió 401 al consultar el perfil sin cookie. La sesión personal del navegador y la revisión visual en un navegador móvil quedan sin verificar.
