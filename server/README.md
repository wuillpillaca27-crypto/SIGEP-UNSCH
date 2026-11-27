# Siembra local de Grados y Títulos

Esta siembra es solo para desarrollo. Se niega a ejecutar migraciones o escrituras si `NODE_ENV` no es `development`, el host no es loopback o la base PostgreSQL no se llama exactamente `sigep_dev`. No cambia `.env`. Si la base falta, intenta crear únicamente `sigep_dev` con el rol local configurado.

## Preparar y sembrar

1. Inicia PostgreSQL local. El comando de siembra crea `sigep_dev` si no existe y el rol tiene permiso `CREATEDB`. Si no lo tiene, créala manualmente con una cuenta local autorizada:

   ```powershell
   createdb -h 127.0.0.1 -U <administrador_local> -O <usuario_de_Database_URL> sigep_dev
   ```

2. Desde PowerShell, entra a `server/` y configura la sesión local con una URL que apunte únicamente a `sigep_dev`:

   ```powershell
   $env:NODE_ENV = "development"
   $env:DATABASE_URL = "postgresql://<usuario_local>:<clave_local>@127.0.0.1:5432/sigep_dev?schema=public"
   npm run db:seed:grados-dev
   ```

   El comando aplica las migraciones Prisma pendientes y siembra los datos. No uses una URL de `sigep`, `sigep_test` ni de un host remoto.

3. Las cuentas se identifican por DNI o correo:

   | Uso | DNI | Correo |
   |---|---|---|
   | Estudiante de maestría | `98000101` | `estudiante.maestria@sigep-dev.test` |
   | Estudiante de doctorado | `98000102` | `estudiante.doctorado@sigep-dev.test` |
   | Estudiante de segunda especialidad | `98000103` | `estudiante.especialidad@sigep-dev.test` |
   | Administrador | `98000901` | `administrador@sigep-dev.test` |
   | Operador de revisión | `98000902` | `operador@sigep-dev.test` |

   Puedes definir `SIGEP_DEV_PASSWORD` en la sesión para usar la misma contraseña de desarrollo en las cinco cuentas, o configurar las variables individuales `SIGEP_DEV_PASSWORD_ESTUDIANTE_MAESTRIA`, `SIGEP_DEV_PASSWORD_ESTUDIANTE_DOCTORADO`, `SIGEP_DEV_PASSWORD_ESTUDIANTE_SEGUNDA_ESPECIALIDAD`, `SIGEP_DEV_PASSWORD_ADMINISTRADOR` y `SIGEP_DEV_PASSWORD_OPERADOR` para contraseñas distintas. Cada una debe tener entre 12 y 72 bytes UTF-8. Si falta una contraseña, se genera al azar y se conserva fuera del repo en `%LOCALAPPDATA%\SIGEP-UNSCH\credenciales-sigep-dev.json`. La salida informa la ubicación, nunca el contenido.

La siembra se puede repetir. Solo actualiza entidades reservadas por estas cuentas, nombres, programas y códigos `SIGEP-DEV-*`; aborta si un DNI/correo/código está asociado a otra identidad. Los requisitos son datos sintéticos sin validez oficial.

## Arrancar la aplicación

En la misma sesión de PowerShell que ya tiene `NODE_ENV` y `DATABASE_URL` configurados:

```powershell
$env:SIGEP_DEMOSTRACION = "1"
npm start
```

En otra terminal, desde `client/`, ejecuta `npm run dev`. El cliente local reenvía `/api/sigep` al servidor en `127.0.0.1:8000`. `SIGEP_DEMOSTRACION=1` habilita en el catálogo local los programas y requisitos marcados como fixtures.

## Pruebas

Desde `server/`, ejecuta `npx jest`. Las pruebas de esta siembra cubren la validación local de destino y el manejo externo de credenciales; no requieren conexión a `sigep_dev`.
