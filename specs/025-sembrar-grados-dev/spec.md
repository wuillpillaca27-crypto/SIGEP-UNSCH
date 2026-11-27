# Feature Specification: Siembra local de trámites académicos

**Feature Branch**: `025-sembrar-grados-dev`
**Created**: 2026-11-26
**Status**: Draft
**Input**: Crear un script de desarrollo idempotente para preparar `sigep_dev` con tres programas, tres estudiantes y dos usuarios administrativos de Grados y Títulos.

## User Scenarios & Testing

### User Story 1 - Preparar cuentas de prueba seguras (Priority: P1)

Como desarrollador necesito preparar una base local con cuentas y programas para verificar los trámites de maestría, doctorado y segunda especialidad.

**Why this priority**: Habilita la prueba manual de los tres recorridos sin contaminar otras bases.

**Independent Test**: En PostgreSQL local vacío `sigep_dev`, ejecutar la siembra, revisar los datos creados sin mostrar contraseñas y repetirla verificando que no duplique registros.

**Acceptance Scenarios**:

1. **Given** un `DATABASE_URL` local cuya base es exactamente `sigep_dev`, **When** se ejecuta la siembra, **Then** aplica migraciones pendientes y prepara tres programas activos con requisitos, tres matrículas/estudiantes, un administrador y un operador.
2. **Given** una base ya sembrada, **When** se repite la ejecución, **Then** conserva los mismos registros y actualiza los datos administrados sin duplicarlos.
3. **Given** una URL remota, una base distinta o una URL de `sigep`/`sigep_test`, **When** se ejecuta el script, **Then** termina con error antes de cualquier conexión de escritura.
4. **Given** que no se proporcionaron contraseñas, **When** se generan credenciales aleatorias, **Then** se muestran una sola vez o se guardan fuera del repositorio, sin imprimir hashes.

### Edge Cases

- La base `sigep_dev` no existe: crear solo esa base desde una conexión local de mantenimiento; si faltan permisos `CREATEDB`, fallar claramente para permitir creación manual.
- Una ejecución previa tiene uno de los correos reservados con un rol distinto: abortar en vez de apropiarse de la cuenta.
- La URL incluye parámetros, IPv6 o codificación: validar host/base usando componentes parseados, no búsquedas parciales.
- Fallan las migraciones o la transacción de siembra: salir con error y evitar dejar datos parciales.
- Las migraciones ya están aplicadas y existen los fixtures: repetir con resultado idempotente.

## Requirements

### Functional Requirements

- **FR-001**: El script MUST aceptar únicamente PostgreSQL no productivo en loopback y el nombre de base exacto `sigep_dev`; la validación ocurre antes de migraciones y escrituras.
- **FR-002**: Si falta `sigep_dev`, el script MUST crear únicamente esa base local; después MUST aplicar migraciones Prisma pendientes con el mecanismo versionado existente, sin `db push` ni reset.
- **FR-003**: El script MUST crear o reconciliar tres programas activos: una maestría, un doctorado y una segunda especialidad, con plantillas de requisitos compatibles con el catálogo del runtime.
- **FR-004**: El script MUST crear o reconciliar tres usuarios con rol estudiante, una matrícula por programa, un administrador y un operador de revisión.
- **FR-005**: La siembra MUST ser idempotente mediante identificadores naturales reservados para fixtures; ejecuciones sucesivas no duplican entidades ni relaciones.
- **FR-006**: Las contraseñas MUST venir de variables de entorno o generarse aleatoriamente; secretos y hashes nunca aparecen en logs ni código fuente.
- **FR-007**: Si genera contraseñas, MUST guardarlas fuera del repositorio con permisos restrictivos o mostrarlas una única vez en consola.
- **FR-008**: El script MUST salir con un resumen no sensible y códigos de error claros; no debe mostrar `DATABASE_URL` ni valores del `.env`.
- **FR-009**: La documentación MUST explicar creación de `sigep_dev`, selección de `.env` local y arranque de cliente/servidor sin apuntar a otras bases.
- **FR-010**: La prueba del script MUST demostrar rechazo de destinos no permitidos sin conectarse ni escribir en ellos.
- **FR-011**: La preparación de una base ausente MUST conectarse únicamente al PostgreSQL local de mantenimiento y crear solo `sigep_dev`.

### Key Entities

- **Programa**: Programa académico activo de uno de los tres tipos habilitados.
- **Plantilla de requisito**: Requisito de catálogo asociado a un programa/trámite.
- **Usuario y estudiante**: Identidad de acceso y perfil académico asociado uno a uno.
- **Matrícula**: Vínculo de un estudiante con uno de los programas sembrados.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Solo `sigep_dev` en loopback supera validación; las URLs a `sigep`, `sigep_test`, otros nombres y hosts remotos fallan antes de cualquier migración/escritura.
- **SC-002**: Una ejecución produce exactamente 3 programas, 3 estudiantes, 3 matrículas, 1 administrador y 1 operador, además de sus requisitos.
- **SC-003**: Dos ejecuciones sucesivas dejan los mismos conteos y claves naturales, sin duplicados.
- **SC-004**: `npx jest` termina con las 11 suites y 55 pruebas aprobadas.
- **SC-005**: Ni contraseñas, hashes ni URLs aparecen en los logs de prueba; las credenciales generadas quedan recuperables fuera del repositorio.

## Assumptions

- PostgreSQL local debe estar iniciado; el script puede crear `sigep_dev` si el rol local tiene permiso `CREATEDB`. Si no, se crea manualmente.
- La URL para la aplicación se configura en `server/.env` como `DATABASE_URL` solo durante el uso local. No se cambia el `.env` automáticamente.
- Los correos/DNI/códigos de matrícula serán datos sintéticos reservados y documentados como cuentas de desarrollo.
- Se reutilizan roles, tipos, catálogos y migraciones Prisma actuales.
