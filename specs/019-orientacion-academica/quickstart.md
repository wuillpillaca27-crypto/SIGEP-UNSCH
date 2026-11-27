# Verificación de la orientación académica

1. Abrir Doctorado y elegir un programa publicado. El campo de búsqueda debe empezar vacío y mostrar todos los requisitos académicos.
2. Buscar un nombre y luego un fragmento de descripción sin tildes. Los documentos obligatorios y opcionales deben seguir visibles. Cambiar de programa limpia el filtro.
3. Abrir las preguntas frecuentes y comprobar los enlaces a documentos y subsanación. Iniciar la solicitud sin sesión debe llevar al login con el trámite `doctor` como destino de retorno.
4. En un entorno de desarrollo, ejecutar `npm run db:seed:demo` y `npm run local -- -Demostracion` en `server/`. Cada programa de prueba incluye un requisito académico y documentos obligatorios y opcionales.

## Formatos y condiciones oficiales

El archivo UTF-8 indicado por `SIGEP_NORMATIVA_PATH` admite una lista `formatos` de hasta 20 entradas en cada registro de programa y trámite. Cada entrada contiene `nombre` y `url`. Publicar solo enlaces HTTPS aprobados que permitan acceder al archivo institucional. La descarga o apertura del enlace depende del servidor que publica el documento. El registro conserva el campo `fuente` para atribuir los formatos.

Las condiciones de la configuración académica tienen prioridad si cuentan con fuente. El registro normativo conserva los formatos con su propia referencia. Los programas de demostración omiten formatos y condiciones oficiales.

## Evidencia

- Las cinco páginas y sus catálogos respondieron HTTP 200 a través de Next.js y Express con PostgreSQL de desarrollo.
- Para Doctorado se comprobó la respuesta 401 sin sesión, el ingreso con la cuenta de prueba, la matrícula, la retoma del borrador, la carga de PDF obligatorios y opcionales, la presentación y el expediente listado en Mis Trámites.
- La suite del catálogo probó programas inactivos, plantillas sin publicar, formatos válidos, rechazo de enlaces inseguros y exclusión de formatos en demostración. El cliente probó el filtro y la permanencia de los documentos.
