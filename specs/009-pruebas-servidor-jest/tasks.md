# Tareas: Pruebas automatizadas del servidor con Jest

**Entrada**: documentos de diseÃ±o en `specs/009-pruebas-servidor-jest/`.

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md` y `quickstart.md`.

**Alcance**: tareas agrupadas por historia P1â€“P5. No cambiar cÃ³digo de producciÃ³n de `server/` ni `client/`. Los cambios permitidos en `server/` son dependencias/configuraciÃ³n de pruebas y archivos de prueba.

## Fase 1: ConfiguraciÃ³n inicial

**Objetivo**: incorporar el runner exigido y preparar la salida de cobertura sin alterar scripts ajenos a pruebas.

- [X] T001 Agregar Ãºnicamente `jest@30.5.2` a `devDependencies` de `server/package.json` y actualizar `server/package-lock.json`; no agregar Supertest, transformadores ni otra dependencia.
- [X] T002 Crear `server/jest.config.js` con entorno `node`, `verbose: true`, `coverageDirectory: "coverage"`, reporters `text`, `html`, `lcov`, recolecciÃ³n de `src/**/*.js` excluyendo `*.test.js` y sin `coverageThreshold`; cambiar solo `scripts.test` en `server/package.json` a `jest --coverage` y agregar `server/coverage/` a `.gitignore` raÃ­z, conservando los demÃ¡s scripts.

---

## Fase 2: Prerrequisito para las historias

**Objetivo**: comprobar el runtime Jest/SQLite antes de tocar cualquiera de las pruebas existentes.

- [X] T003 Ejecutar y luego retirar `server/tests/node-sqlite-jest-probe.test.js` temporal con Jest instalado en `server/`: importar `node:sqlite`, abrir `DatabaseSync(":memory:")`, crear tabla, insertar, leer el valor y cerrar. Confirmar el gate antes de migrar fixtures; si falla, usar solo Prisma/libSQL existente para preparar el archivo SQLite temporal segÃºn Plan B de `research.md`, sin nueva dependencia. Aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`; `Base SQLite temporal.Archivo`, `Base SQLite temporal.PreparaciÃ³n inicial`, `Base SQLite temporal.Ciclo de vida`; `Servidor Express temporal.Cierre`.

**Checkpoint**: el gate de SQLite bajo Jest pasa, o el Plan B estÃ¡ configurado y probado, antes de migrar las suites legacy.

---

## Fase 3: Historia 1 â€” Ejecutar las pruebas y consultar la lÃ­nea base (Prioridad: P1, MVP)

**Objetivo**: migrar las dos suites actuales conservando todas las aserciones, separar los casos de solicitudes y obtener el primer reporte de cobertura.

**Prueba independiente**: desde `server/`, ejecutar `npm test`; comprobar nombre/estado de cada caso, todas las comprobaciones S-01â€“S-57 y C-01â€“C-07, y reportes text, HTML y lcov, sin umbral.

- [X] T004 [P] [US1] Migrar `server/src/solicitudes.test.js` de `node:test` a Jest y dividir su escenario largo en casos independientes con nombres descriptivos; mantener SQLite real, Prisma/libSQL, Express en puerto dinÃ¡mico, las 57 comprobaciones S-01â€“S-57 y cleanup por caso. Aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`; `Base SQLite temporal.Archivo`, `Base SQLite temporal.Esquema`, `Base SQLite temporal.Semillas`, `Base SQLite temporal.ConexiÃ³n de aplicaciÃ³n`, `Base SQLite temporal.Ciclo de vida`; `Servidor Express temporal.AplicaciÃ³n`, `Servidor Express temporal.Puerto`, `Servidor Express temporal.Cliente HTTP`, `Servidor Express temporal.AutenticaciÃ³n`, `Servidor Express temporal.Cierre`.
- [X] T005 [P] [US1] Migrar `server/src/catalogo-grados.test.js` de `node:test` a Jest y conservar individualmente C-01â€“C-07, SQLite real, Prisma/libSQL, Express en puerto dinÃ¡mico y cleanup. Aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`; `Base SQLite temporal.Archivo`, `Base SQLite temporal.Esquema`, `Base SQLite temporal.Semillas`, `Base SQLite temporal.ConexiÃ³n de aplicaciÃ³n`, `Base SQLite temporal.Ciclo de vida`; `Servidor Express temporal.AplicaciÃ³n`, `Servidor Express temporal.Puerto`, `Servidor Express temporal.Cliente HTTP`, `Servidor Express temporal.AutenticaciÃ³n`, `Servidor Express temporal.Cierre`.
- [X] T006 [US1] Ejecutar `npm test` en `server/`; confirmar que pasan las dos suites migradas, que los casos se listan individualmente, que aparecen `server/coverage/index.html` y `server/coverage/lcov.info`, que texto se imprime en consola y que no se impone threshold. Registrar porcentajes iniciales de statements, branches, functions y lines como lÃ­nea base en `specs/009-pruebas-servidor-jest/research.md`. Aplicar `data-model.md`: `Reporte de cobertura.Directorio`, `Reporte de cobertura.Salidas`, `Reporte de cobertura.Fuente`, `Reporte de cobertura.Umbral`.

**Checkpoint**: P1 queda aceptada como incremento MVP cuando todas las aserciones legacy pasan y se genera cobertura sin umbral.

---

## Fase 4: Historia 2 â€” Verificar listados y reportes de revisiÃ³n (Prioridad: P2)

**Objetivo**: cubrir bÃºsqueda/filtros, paginaciÃ³n y agrupaciones de revisiÃ³n vigentes.

**Prueba independiente**: ejecutar la suite P2 con SQLite temporal real y verificar tipos, estado, bÃºsqueda, pÃ¡gina de 20, indicador `siguiente`, lÃ­mites, permisos y reporte agrupado.

- [ ] T007 [US2] Crear `server/src/revision-grados-listado.test.js` para GET `/api/revision-grados/` y `/reporte`: comprobar filtro `tipos`, estado, bÃºsqueda por cÃ³digo/DNI/nombres/apellidos, mÃ¡ximo 20 con consulta de 21 e indicador `siguiente`, lÃ­mite/normalizaciÃ³n de pÃ¡gina, permisos de administrador/operador y agrupaciÃ³n. Usar un archivo por caso y recursos reales temporales; aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`, `Base SQLite temporal.Archivo`, `Base SQLite temporal.Semillas`, `Base SQLite temporal.ConexiÃ³n de aplicaciÃ³n`, `Servidor Express temporal.AplicaciÃ³n`, `Servidor Express temporal.Puerto`, `Servidor Express temporal.Cliente HTTP`, `Servidor Express temporal.AutenticaciÃ³n`, `Servidor Express temporal.Cierre`.

---

## Fase 5: Historia 3 â€” Verificar acciones de revisiÃ³n (Prioridad: P3)

**Objetivo**: cubrir validaciones, permisos, transiciones y registros de acciones de expediente.

**Prueba independiente**: ejecutar la suite P3 contra Express/SQLite temporal y contrastar tanto respuesta como datos persistidos.

- [X] T008 [US3] Crear `server/src/revision-grados-acciones.test.js` para POST `/api/revision-grados/:id/acciones` y descarga de documentos: comprobar transiciones vÃ¡lidas e invÃ¡lidas de revisar/observar/validar/aprobar/emitir; ID no entero, acciÃ³n/datos invÃ¡lidos y comentario mayor de 1500 con sus errores actuales; aprobaciÃ³n bloqueada por requisitos obligatorios faltantes; aprobar y emitir solo por administrador; ruta de documento invÃ¡lida; conflicto concurrente 409 y efectos en historial, revisiÃ³n y auditorÃ­a. Registrar entradas no validadas como hallazgos sin cambiar producciÃ³n. Aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`, `Base SQLite temporal.Archivo`, `Base SQLite temporal.Semillas`, `Base SQLite temporal.ConexiÃ³n de aplicaciÃ³n`, `Servidor Express temporal.AplicaciÃ³n`, `Servidor Express temporal.Puerto`, `Servidor Express temporal.Cliente HTTP`, `Servidor Express temporal.AutenticaciÃ³n`, `Servidor Express temporal.Cierre`, `Hallazgo`.

---

## Fase 6: Historia 4 â€” Verificar administraciÃ³n (Prioridad: P4)

**Objetivo**: comprobar configuraciÃ³n, programas, estudiantes, usuarios, requisitos y auditorÃ­a con sus validaciones, permisos y errores actuales.

**Prueba independiente**: ejecutar la suite P4 con usuarios de roles distintos y SQLite temporal; comparar cÃ³digos HTTP y datos.

- [ ] T009 [US4] Crear `server/src/administracion.test.js` para GET/POST de `/api/administracion/configuracion`, `programas`, `estudiantes`, `usuarios`, `requisitos` y `auditoria`: verificar permisos administrador/operador/estudiante/sesiÃ³n ausente, validaciones y lÃ­mites de texto, DNI, correo, rol, contraseÃ±a y programa activo, duplicados P2002, paginaciÃ³n, proyecciones sin contraseÃ±a y errores Prisma delegados al manejador. Aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`, `Base SQLite temporal.Archivo`, `Base SQLite temporal.Semillas`, `Base SQLite temporal.ConexiÃ³n de aplicaciÃ³n`, `Servidor Express temporal.AplicaciÃ³n`, `Servidor Express temporal.Puerto`, `Servidor Express temporal.Cliente HTTP`, `Servidor Express temporal.AutenticaciÃ³n`, `Servidor Express temporal.Cierre`, `Hallazgo`.

---

## Fase 7: Historia 5 â€” Verificar identidad y sesiÃ³n (Prioridad: P5)

**Objetivo**: cubrir login/logout, perfil, cookie de sesiÃ³n, errores de autenticaciÃ³n y estado Google sin configuraciÃ³n.

**Prueba independiente**: ejecutar la suite P5 con secretos y usuarios sintÃ©ticos, sin red externa ni `.env`, y verificar cookies y respuestas.

- [ ] T010 [US5] Crear `server/src/identidad.test.js` para `/api/auth/login`, `/logout`, `/perfil` y `/api/auth/google/estado`/`iniciar`: comprobar cookie HttpOnly/SameSite/Secure segÃºn modo, perfil sin hash, credenciales invÃ¡lidas, usuario inactivo, entrada mal formada, limitador por IP, secreto ausente, sesiÃ³n ausente/invÃ¡lida/vencida/revocada, logout idempotente y Google sin configuraciÃ³n. Aislar variables de entorno por prueba, usar solo secretos desechables y restaurar estado. Aplicar `data-model.md`: `Caso de prueba.Nombre`, `Caso de prueba.PreparaciÃ³n`, `Caso de prueba.AcciÃ³n`, `Caso de prueba.Resultado esperado`, `Caso de prueba.Limpieza`, `Base SQLite temporal.Archivo`, `Base SQLite temporal.Semillas`, `Base SQLite temporal.ConexiÃ³n de aplicaciÃ³n`, `Servidor Express temporal.AplicaciÃ³n`, `Servidor Express temporal.Puerto`, `Servidor Express temporal.Cliente HTTP`, `Servidor Express temporal.AutenticaciÃ³n`, `Servidor Express temporal.Cierre`, `Hallazgo`.

---

## Fase 8: Pulido y verificaciÃ³n transversal

**Objetivo**: validar la lÃ­nea base completa y confirmar que el diff respeta los lÃ­mites.

- [ ] T011 Ejecutar `npm test` desde `server/`, revisar casos y reportes, actualizar los hallazgos observados en `specs/009-pruebas-servidor-jest/spec.md` y porcentajes de cobertura en `research.md`, y revisar `git diff --name-only -- server client .gitignore`: dentro de `server/` solo pueden cambiar `package.json`, `package-lock.json`, `jest.config.js` y archivos `*.test.js`; `.gitignore` solo aÃ±ade `server/coverage/`; confirmar cero cambios en cÃ³digo productivo de `server/src/` y cero cambios en `client/`.

## Dependencias y orden de ejecuciÃ³n

### Dependencias entre fases

- **Setup (Fase 1)**: T001 precede T002 porque Jest debe resolverse antes de configurar/ejecutar el script.
- **Fundacional (Fase 2)**: T003 depende de T001â€“T002 y bloquea la migraciÃ³n P1 hasta comprobar SQLite bajo Jest o activar el Plan B.
- **P1 / MVP (Fase 3)**: T004 y T005 dependen de T003 y pueden ejecutarse en paralelo porque editan archivos distintos; T006 espera ambos.
- **P2â€“P5 (Fases 4â€“7)**: cada historia parte de P1 completada (T006). T007, T008, T009 y T010 se ejecutan en orden P2â†’P3â†’P4â†’P5, aunque cada historia conserva un archivo de prueba y criterio independiente.
- **Pulido (Fase 8)**: T011 depende de T006â€“T010.

### GrÃ¡fico de dependencias

```text
T001 â†’ T002 â†’ T003 â†’ â”¬â†’ T004 â”€â”
                      â””â†’ T005 â”€â”´â†’ T006 â†’ T007 â†’ T008 â†’ T009 â†’ T010 â†’ T011
```
### Oportunidades de paralelismo

- Tras T003, T004 y T005 son paralelas: una tarea por cada archivo legacy.
- Tras T006, seguir prioridad en orden: T007, T008, T009 y T010. Cada historia usa un archivo de prueba independiente; no se marcan paralelas porque la entrega mantiene el orden P2â†’P5.
- T001/T002/T003 son secuenciales; T006 y T011 son checkpoints de integraciÃ³n.

## Estrategia de implementaciÃ³n

### MVP

Completar setup, gate SQLite y P1 (T001â€“T006): Jest ejecuta ambas suites legacy migradas, conserva todas las comprobaciones S/C y genera el primer baseline de cobertura. No empezar P2â€“P5 antes de aprobar T006.

### Entrega incremental

DespuÃ©s del MVP, completar P2, P3, P4 y P5 en ese orden de prioridad, cada historia como archivo independiente; luego ejecutar T011. La implementaciÃ³n aÃ±ade solo pruebas/configuraciÃ³n, no cambia comportamiento productivo.

## Notas

- Cada tarea tiene un ID secuencial y una ruta concreta; todo cambio a un archivo de prueba aparece en una sola tarea.
- `[P]` identifica tareas en archivos diferentes sin dependencia incompleta.
- Mantener temporales aislados y limpiar servidor, Prisma, archivos y variables de entorno aun si falla una aserciÃ³n.
- Si el gate Jest/SQLite falla, seguir el Plan B de `research.md` antes de migrar; nunca aÃ±adir `@libsql/client` como segunda dependencia nueva.