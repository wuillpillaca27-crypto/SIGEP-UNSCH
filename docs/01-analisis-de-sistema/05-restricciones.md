# Restricciones del sistema

## Resumen

Las restricciones describen tecnologías, datos, operación y límites institucionales que condicionan los cambios. Se distinguen hechos constatables del repositorio de reglas de proyecto y objetivos aún por definir.

## Implementado hoy

### Plataforma y arquitectura observada

- El cliente es Next.js 16, React 19, TypeScript y Tailwind CSS 4 según `client/package.json`.
- El servidor usa Node.js, Express 5 en CommonJS, Prisma 7 y el adaptador `@prisma/adapter-libsql`, según `server/package.json` y `server/src/index.js`.
- `server/prisma/schema.prisma` declara `provider = "sqlite"`. `server/src/index.js` exige que `DATABASE_URL` comience por `file:` y crea Prisma con `PrismaLibSql`. Por ello el motor documentado es SQLite local mediante libSQL; la nota inicial del esquema que menciona PostgreSQL está desactualizada frente al provider/runtime.
- El servidor registra módulos de rutas y lógica directamente desde `server/src/index.js`. No se atribuyen capas separadas; en el estado inspeccionado `server/src/lib/`, `server/src/middleware/` y `server/src/routes/` están vacías.

### Seguridad y datos

- El servidor no debe exponer contraseñas ni hashes. `server/src/identidad.js` excluye el campo `password` de la respuesta de login y selecciona campos explícitos para el perfil.
- Las rutas personales y administrativas ejecutan controles de sesión, rol y/o titularidad según el módulo. La consulta pública de documentos retorna datos limitados y requiere que el registro esté emitido.
- El modelo de documentos conserva una ruta interna (`DocumentoSolicitud.rutaArchivo`); el esquema la comenta como nunca pública. El acceso al archivo se realiza mediante rutas del servidor.
- La configuración de OAuth Google depende de variables de entorno y del archivo de vínculos local. El secreto JWT y las credenciales no se documentan aquí ni se deben incluir en documentación versionada.
- Las operaciones de escritura bajo `/api` pasan por controles de origen y el parser JSON tiene límite configurado en `server/src/index.js`; las cargas PDF tienen límite en `server/src/solicitudes.js`.

### Gobierno de cambios

La constitución vigente exige especificaciones verificables, cambios mínimos, revisión de seguridad, migración documentada y conservación de datos ante cambios del esquema Prisma, así como documentación de arquitectura previa a cambios arquitectónicos (`.specify/memory/constitution.md`). Estas reglas gobiernan el trabajo del repositorio; no prueban que el producto tenga procesos de despliegue o cumplimiento institucional adicionales.

## Objetivo Sprint 2

- La especificación plantea una carga de hasta 2.000 usuarios virtuales concurrentes como propuesta; no es una restricción de capacidad implementada ni una garantía.
- Capas separadas, caché y Swagger son objetivos propuestos en documentación previa de Sprint 2; no se describen como partes del servidor actual.
- Umbrales de disponibilidad, desempeño, cobertura de auditoría y criterios de mantenibilidad quedan por validar por el equipo.
- Los requisitos de conformidad institucional que no estén citados en una fuente aprobada deben considerarse pendientes, no restricciones confirmadas.

## Trazabilidad y fuentes

- Gobierno: `.specify/memory/constitution.md`.
- Stack y configuración: `client/package.json`, `server/package.json`, `server/src/index.js`, `server/prisma/schema.prisma`.
- Controles: `server/src/identidad.js`, `identidad-google.js`, `solicitudes.js`, `revision-grados.js`, `administracion.js`, `verificacion-documentos.js`.
- Requisitos contextuales: `specs/001-mis-tramites/spec.md` a `specs/007-pruebas-frontend/spec.md`; referencias heredadas en `docs/legacy/openspec/`.
