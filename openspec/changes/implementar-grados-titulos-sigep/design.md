# Diseño

## Context

Next.js y React proporcionan `LayoutPublico`, un catálogo informativo con anclas y pantallas de trámites sin conexión real. El cliente HTTP consume JSON con Bearer, mientras que el ingreso actual guarda una sesión de demostración distinta. `server/src` carece de una API ejecutable. El esquema Prisma local modela usuarios, estudiantes, programas, plantillas, solicitudes, documentos, revisiones, estados y auditoría.

## Goals / Non-Goals

- Conectar las páginas informativas, el asistente, Mis Trámites y el panel administrativo.
- Mantener la identidad visual, la navegación compartida y el diseño de la portada.
- Usar la misma base de datos y excluir la publicación de valores sin aprobación institucional.

## Decisions

- Usar rutas canónicas bajo `/grados-titulos`. Mantener las anclas antiguas y reutilizar el asistente desde Mis Trámites. Las entradas del menú cambian únicamente de destino.
- Ofrecer un contrato público de lectura por tipo y programa. Diferenciar catálogo vacío, información pendiente de publicación y servicio inaccesible. Incorporar fuente y vigencia al publicar reglas y tasas. No mostrar el checklist público como una evaluación personal.
- Resolver identidad y permiso en el servidor, a partir de la cuenta activa. Asociar al estudiante con el programa registrado y redirigirlo al asistente tras autenticarse usando un destino interno permitido.
- Reutilizar `Solicitud` como expediente. Crear el borrador con una clave única persistente, publicar su código al presentar y registrar cambios de estado e historial de forma transaccional. La evaluación pendiente se mantiene explícita hasta disponer de evidencia.
- Autorizar cada descarga por expediente y rol. Validar archivo y tamaño en servidor, usar identificadores generados y almacenamiento privado, y registrar reemplazos para mantener trazabilidad. Las observaciones deben identificar requisitos o documentos subsanables.
- Reutilizar pantallas administrativas y componentes UI. Usar historial persistido como fuente de avisos dentro del sistema y limitar el canal externo a servicios configurados.

## Risks / Trade-offs

- El conector del esquema local es SQLite. Verificar proveedor, migraciones, adaptador y versión de Prisma antes de desplegar contra la base institucional.
- Las fuentes aprobadas, la identidad institucional y las credenciales operativas de almacenamiento y mensajería requieren coordinación con la UNSCH. Se mantienen estados explícitos cuando falten.
- Probar concurrencia en presentación, sustitución y cambios de etapa para impedir duplicados y transiciones perdidas.

## Puesta en marcha y dependencias institucionales

- El servidor se verificó con Node.js 24, Express y Prisma 7.8. En Windows, `npm --prefix server run local` prepara y arranca una base de demostración persistente en `server/.runtime-local/.sigep-local`. El catálogo de demostración y las cuentas aleatorias quedan aislados del entorno institucional. Con la API iniciada, el cliente se ejecuta con `npm --prefix client run dev`.
- Para una base SQLite institucional nueva, configurar `DATABASE_URL` y ejecutar `npm run db:init` en `server`. Este comando aplica el SQL inicial sin depender del motor nativo y se detiene ante un esquema preexistente de otra versión. Luego ejecutar `npm run db:generate` y `npm start`. En una base con datos, revisar el esquema antes de incorporarla. El entorno local y el entorno institucional usan las mismas tablas.
- El ingreso del módulo requiere `SIGEP_JWT_SECRET` de al menos 32 bytes y cuentas activas con contraseñas bcrypt. No se crean cuentas ni se reutiliza la sesión de demostración. Integrar el proveedor institucional y confirmar la asignación de roles antes del despliegue.
- La API escucha en `127.0.0.1:8000` por defecto. Configurar `HOST`, `PORT`, `CLIENT_ORIGINS` y `NEXT_PUBLIC_API_URL` según el entorno. `SIGEP_UPLOAD_DIR` debe apuntar a almacenamiento privado con permisos del proceso y respaldo. La modalidad inicial acepta PDF de hasta 10 MB.
- El panel permite al operador iniciar revisión, observar documentos y registrar validaciones. La aprobación corresponde al administrador y exige que los requisitos obligatorios estén validados. La subsanación documentaria retorna el expediente a revisión. Los avisos de cambio se muestran mientras el seguimiento está abierto. La mensajería externa depende de un canal institucional.
- El catálogo lee programas y plantillas activos. Antes de activarlos, la Escuela debe verificar su vigencia y reglas. Para tasas, plazos y observaciones aprobar una fuente e indicar `SIGEP_NORMATIVA_PATH`, un JSON local con una lista de registros con `tramite`, `programaId` y `fuente`, y los campos de texto opcionales `costos`, `plazos` y `observaciones`. Las pruebas usan datos desechables y no publican reglas oficiales.
