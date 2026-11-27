# Múltiples programas académicos

## Modelo y acceso

La migración `20261126010000_multiples_programas` conserva el identificador de cada registro académico y transforma la unicidad por usuario en unicidad por usuario y programa. La fecha inicial se recupera de la creación de cada registro. La fecha de fin registra la conclusión académica. Las reglas del servidor permiten solicitar con matrícula activa, egresada o graduada si ya inició, la matrícula y el trámite están habilitados, y existen requisitos publicados. Una suspensión o retiro, una fecha de inicio futura o una habilitación revocada impiden crear y presentar un borrador. Los expedientes presentados conservan su historial y su matrícula.

El panel `/mis-tramites/programas` lista las matrículas de la cuenta. El administrador puede asignar otra matrícula o cambiar sus fechas, estado y habilitación desde `/admin/estudiantes`. La asociación no cambia el estudiante ni programa de un expediente anterior.

## Arranque y pruebas de desarrollo

En `server/` con PostgreSQL local y `NODE_ENV=development`:

```powershell
npm run db:generate
npm run db:init
npm run db:seed:demo
npm run local -- -Demostracion
```

En `client/`, ejecutar `npm run dev`. Las credenciales se guardan en `server/.sigep-local/cuentas-academicas.tsv`. La cuenta `multiprograma` reúne los cinco programas de demostración. Los inicios de sesión de las cuentas seed se bloquean fuera del modo de demostración.

## Verificación

- Reconciliación de seis matrículas y trece solicitudes que existían antes de migrar, incluyendo identificadores, estado y relaciones. La semilla se ejecutó dos veces.
- Prueba real a través de Next.js, Express y PostgreSQL de desarrollo con una sola cuenta para los cinco trámites, incluyendo retoma de cada borrador, PDF, presentación y seguimiento por programa.
- Rechazo de Doctorado con una cuenta que solo tiene Maestría, rechazo de edición administrativa con rol estudiante y bloqueo de presentación al suspender una matrícula, seguido de reactivación.
- Verificación pública de un documento de demostración por código sin datos personales.
- Pruebas automatizadas adicionales para dos programas del mismo tipo, control de titularidad, administración y selección. Compilación del cliente completada.

Las matrículas oficiales deben asignarse desde la administración con datos autorizados. El panel se comprobó por HTTP, API y pruebas de componentes. Queda pendiente una revisión visual en el navegador del usuario.
