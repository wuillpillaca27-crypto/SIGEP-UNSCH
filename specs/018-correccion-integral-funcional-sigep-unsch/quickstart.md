# Arranque y verificación académica

## Diagnóstico

La matrícula heredada apuntaba al programa 1, de tipo maestría y activo. Su plantilla de `grado_maestro` estaba activa. El código `DEMO-REQ-USUARIO-00000002` activaba el filtro de demostración y el marcador `Entorno de demostraci?n` impedía la excepción para programas de prueba. La semilla normaliza únicamente filas identificadas como demostración y conserva sus identificadores, contraseñas y expedientes.

El esquema representa la matrícula como `Estudiante.programaId` y liga los expedientes y archivos mediante claves foráneas. La migración añade configuración por programa, su historial administrativo y autorización expresa de aprobación. Antes de este cambio, el motor deducía el trámite a partir del tipo de programa y cualquier administrador podía aprobar. Las notificaciones verificadas son las actualizaciones de estado dentro de Mis Trámites.

## Arranque local y cuentas

Ejecutar en `server/`, con la base PostgreSQL local configurada en `.env`.

```powershell
npm run db:generate
npm run db:init
npm run db:seed:demo
npm run local -- -Demostracion
```

Ejecutar `npm run dev` en `client/`. Abrir `http://127.0.0.1:3000`. La semilla requiere `NODE_ENV=development`, no acepta PostgreSQL remoto y deja las credenciales en `server/.sigep-local/cuentas-academicas.tsv`.

Hay cinco cuentas de estudiante, una de administración técnica, una de revisión y una autoridad de demostración. La cuenta técnica puede editar el catálogo y la de revisión puede cotejar documentos. La autoridad tiene permiso expreso de aprobación y emisión. Fuera del modo de demostración se excluyen los programas y requisitos de ejemplo de la oferta estudiantil y pública.

## Evidencia

- La migración `20261126000000_configuracion_academica` se aplicó a PostgreSQL de desarrollo. El siguiente arranque informó que no quedaban migraciones pendientes.
- Dos ejecuciones consecutivas de la semilla finalizaron correctamente.
- Pasaron 69 pruebas de cliente y 62 de servidor con cobertura. También pasaron la compilación de Next.js y la validación estricta del cambio de OpenSpec.
- Pruebas HTTP atravesaron Next.js, Express, Prisma y PostgreSQL de desarrollo. Las cinco matrículas pudieron crear y retomar un borrador, cargar PDF, presentar y consultar el expediente.
- La demostración de Maestría comprobó creación y publicación de una plantilla, habilitación y auditoría, observación, reemplazo de PDF, subsanación, cierre de validación, remisión, rechazo de aprobación al administrador técnico, aprobación por la autoridad, emisión con PDF, descarga privada y verificación pública por código sin datos personales.

## Límites e integraciones institucionales

El catálogo configura asociaciones para los cinco tipos de trámite que soporta el motor. Los tipos adicionales requieren ampliar el modelo y sus reglas. Las versiones se crean como registros independientes con código y referencia de versión propios. Las fuentes, las resoluciones y los PDF oficiales requieren publicación autorizada. El sistema registra y conserva la emisión, y admite el PDF aportado por la autoridad. La firma digital institucional, Google y las notificaciones externas siguen pendientes de sus respectivas configuraciones o integraciones.
