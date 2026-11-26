# Verificación del flujo académico

1. Abrir las páginas de Maestro, Doctor, Segunda Especialidad y Certificaciones sin cookie. Consultar el catálogo y abrir Verificar documento.
2. Elegir Iniciar solicitud. Desde el login, ingresar con una cuenta de estudiante y confirmar el retorno al mismo trámite.
3. Comprobar que una cuenta sin matrícula recibe el motivo y acceso a Ayuda. Si la matrícula corresponde a otro trámite, la pantalla ofrece un enlace a la opción disponible.
4. Con una matrícula habilitada, guardar un borrador, retomarlo desde Mis Trámites, adjuntar los PDF requeridos, presentar y comprobar el código y el historial. La prueba de integración utiliza PostgreSQL con fixtures aislados.

## Configuración institucional

- Publicar los programas y las plantillas aprobados en PostgreSQL. La vigencia depende de la matrícula, el tipo de trámite, el programa activo y sus plantillas activas.
- Configurar `SIGEP_NORMATIVA_PATH` con un archivo UTF-8 de registros por trámite y programa. Cada registro contiene `tramite`, `programaId` y `fuente`, además de los campos aprobados `procedimiento`, `costos`, `plazos` y `observaciones`. La interfaz indica cuándo falta la información oficial.
- Para Google, configurar `SIGEP_GOOGLE_CLIENT_ID`, `SIGEP_GOOGLE_CLIENT_SECRET`, `SIGEP_GOOGLE_REDIRECT_URI` y `SIGEP_GOOGLE_VINCULOS`. Registrar en Google la URL HTTPS del callback y mantener el archivo de vínculos autorizado. La prueba automatizada simula el proveedor.
- Los programas y plantillas marcados para demostración se habilitan con `SIGEP_DEMOSTRACION=1` fuera de producción. El catálogo los identifica y omite referencias normativas institucionales en esos programas.

## Evidencia local

- PostgreSQL de desarrollo contiene una maestría activa, una matrícula asociada y una plantilla activa. El flujo de los demás tipos se verifica con datos de prueba.
- Las páginas públicas de Maestro, Doctor, Segunda Especialidad, Diplomados y Verificar documento devolvieron HTTP 200 sin cookie.
- Jest verificó el retorno autenticado, la validación de destinos de Google, el catálogo público, la separación de fixtures, los permisos, la creación concurrente de borradores, los archivos y el seguimiento.

## Conexión local

En `server/`, el comando `npm run local` aplica las migraciones pendientes a la base configurada mediante `DATABASE_URL` y arranca la API. En `client/`, `npm run dev` arranca el portal. Los puertos predeterminados son 8000 para Express y 3000 para Next.js. Si se cambia el puerto de Express, configurar `SIGEP_API_URL` con la URL completa que termina en `/api` antes de iniciar o compilar el cliente. Los POST del portal pasan por el mismo origen y mantienen los controles de `CLIENT_ORIGINS`.

La consulta de solo lectura `GET /api/sigep/salud` desde Next.js devuelve 200 si se puede consultar PostgreSQL. Sin cookie, `GET /api/sigep/auth/perfil` devuelve 401 con `SESION_AUSENTE`. Durante la prueba de caída de Express, el proxy devolvió HTTP 500. Al dirigir una instancia auxiliar a un puerto PostgreSQL sin servicio, los registros reportaron `ECONNREFUSED` y la API devolvió 503 con `BASE_DATOS_NO_DISPONIBLE`.

El portal habitual confirmó el catálogo, el control de origen, las rutas privadas y la respuesta pública para un código de documento inexistente. Las pruebas HTTP de las cinco solicitudes usaron Next.js, Express y PostgreSQL en la base aislada. Pasaron 69 pruebas de cliente, 61 de servidor y la compilación de Next.js.
