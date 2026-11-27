# Modelo de datos de fixtures

Solo se administran filas con identificadores naturales reservados por el prefijo `SIGEP-DEV-` o correo `@sigep-dev.local`.

| Entidad | Clave natural | Relaciones/datos de desarrollo |
|---|---|---|
| Programa | nombre estable y tipo único del fixture | activo, facultad demostrativa |
| PlantillaRequisito | `codigo` `SIGEP-DEV-*` | `programaId`, `tipoTramite`, clase documental, obligatorio, descripción explícita de prueba |
| ConfiguracionTramite | `programaId` | habilitada y `tipoTramite` correspondiente |
| Usuario | correo sintético y DNI reservado | rol estudiante, administrador u operador; contraseña bcrypt |
| Estudiante | `codigoUniv` `SIGEP-DEV-*` y par `usuarioId/programaId` | estado activo y trámites habilitados |

Un estudiante se asocia a un solo programa para que cada cuenta pruebe exactamente un flujo de grado/título. El administrador y operador no tienen perfil de estudiante. No se insertan solicitudes ni archivos automáticamente.
