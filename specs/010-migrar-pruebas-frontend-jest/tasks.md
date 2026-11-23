# Tareas: Migrar pruebas frontend a Jest

**Documentos de entrada**: `specs/010-migrar-pruebas-frontend-jest/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`)

**Pruebas**: Se incluyen tareas de pruebas porque la especificación exige un smoke test P1 y casos de regresión P2–P6, además de reportes de cobertura.

**Alcance**: Tareas de implementación limitadas a configuración, dependencias y pruebas dentro de `client/`. No modificar código de producción, `server/` ni la base de datos.

## Fase 1: Preparación

**Propósito**: Migrar las dependencias y el comando del runner en el frontend.

- [X] T001 Reemplazar Vitest por Jest 30.5.2 y `jest-environment-jsdom` 30.5.2, actualizar el script `test` y sincronizar el lockfile en `client/package.json` y `client/package-lock.json`; retirar la dependencia directa `jsdom` solo si no tiene otros consumidores en `client/`.

---

## Fase 2: Fundamentos

**Propósito**: Configurar el runner común que necesitan todas las historias.

- [X] T002 [P] Crear `client/jest.config.js` con `next/jest`, entorno jsdom, alias `@/*` según `client/tsconfig.json`, `TZ=America/Lima` antes de los workers y cobertura `text`, `html` y `lcov` sin umbral.
- [X] T003 [P] Crear `client/jest.setup.ts` para importar `@testing-library/jest-dom` y configurar MSW con `beforeAll`, `afterEach` y `afterAll`; conservar `/coverage` en `client/.gitignore`.

**Punto de control**: Jest carga desde `client/`, resuelve alias y setup, intercepta `fetch` sin servicios reales y genera los formatos de cobertura requeridos.

---

## Fase 3: Historia 1 - Ejecutar la suite frontend con Jest (Prioridad: P1, MVP)

**Objetivo**: Ejecutar pruebas con un solo comando, reportar cada caso, producir cobertura y retirar Vitest del entorno.

**Prueba independiente**: Ejecutar `npm test` desde `client/`; confirmar el smoke test, resultado identificable por caso, código 0 al pasar, código distinto de 0 ante una falla y reportes de cobertura. Verificar las aserciones del alias y la zona horaria.

- [X] T004 [US1] Migrar `client/app/__tests__/lib/runner.test.ts` a Jest, conservando sus comprobaciones del runner, del alias `@/*` y de `America/Lima`.
- [X] T005 [US1] Validar el smoke test con Next 16.4.3, React 19.3.0, Jest 30.5.2 y `jest-environment-jsdom` 30.5.2 desde `client/app/__tests__/lib/runner.test.ts`; comprobar el código de salida ante una ejecución correcta y una falla controlada, y resolver cualquier incompatibilidad antes de continuar.

**Punto de control**: `npm test` ejecuta el smoke test en Jest y produce cobertura sin depender de `server/`.

---

## Fase 4: Historia 2 - Verificar utilidades puras (Prioridad: P2)

**Objetivo**: Caracterizar fechas, estados, nombres y truncado según el comportamiento frontend actual.

**Prueba independiente**: Ejecutar el archivo de utilidades y comprobar resultados válidos, inválidos, desconocidos y límites bajo `America/Lima`.

- [X] T006 [P] [US2] Crear `client/app/__tests__/lib/utils.test.ts` para `formatearFecha`, `formatearFechaHora`, `infoEstado`, `nombreCompleto` y `truncar`, incluidos los casos límite definidos en `specs/010-migrar-pruebas-frontend-jest/spec.md`.

**Punto de control**: Las utilidades quedan verificadas sin modificar código de producción.

---

## Fase 5: Historia 3 - Verificar el cliente HTTP (Prioridad: P3)

**Objetivo**: Comprobar métodos, cabeceras, cuerpos, respuestas y errores del cliente HTTP aislando `fetch` con MSW.

**Prueba independiente**: Ejecutar el archivo de API y observar con MSW las solicitudes GET, POST, PUT, PATCH y DELETE, junto con respuestas exitosas, errores y fallos de red.

- [X] T007 [P] [US3] Crear `client/app/__tests__/lib/api.test.ts` para métodos, URL, JSON, `Content-Type`, prioridad de errores, parseo fallido, error de red y ausencia de lectura de token o `Authorization`, usando MSW desde `client/jest.setup.ts`.

**Punto de control**: Los casos HTTP pasan sin llamadas a servicios reales.

---

## Fase 6: Historia 4 - Verificar servicios de dominio (Prioridad: P4)

**Objetivo**: Verificar método, ruta, parámetros opcionales, cuerpo y propagación de respuestas por servicio.

**Prueba independiente**: Ejecutar cada archivo de servicio aisladamente con el cliente HTTP simulado y comparar las llamadas con los módulos del servicio vigentes.

- [X] T008 [P] [US4] Crear `client/app/__tests__/services/auth.service.test.ts` para login, perfil y logout según `client/app/services/auth.service.ts`.
- [X] T009 [P] [US4] Crear `client/app/__tests__/services/estudiantes.service.test.ts` para rutas, paginación, búsqueda, obtención, creación, edición y eliminación según `client/app/services/estudiantes.service.ts`.
- [X] T010 [P] [US4] Crear `client/app/__tests__/services/expedientes.service.test.ts` para listado, parámetros opcionales, obtención, creación y cambio de estado según `client/app/services/expedientes.service.ts`.
- [X] T011 [P] [US4] Crear `client/app/__tests__/services/usuarios.service.test.ts` para listado, filtro de rol, CRUD y cambio de estado según `client/app/services/usuarios.service.ts`.
- [X] T012 [P] [US4] Crear `client/app/__tests__/services/programas.service.test.ts` para listado, filtro opcional, obtención, creación y edición según `client/app/services/programas.service.ts`.
- [X] T013 [P] [US4] Crear `client/app/__tests__/services/documentos.service.test.ts` para listado, obtención, verificación QR, exportación SUNEDU y parámetros opcionales según `client/app/services/documentos.service.ts`.
- [X] T014 [P] [US4] Crear `client/app/__tests__/services/auditoria.service.test.ts` para listado, paginación y búsqueda según `client/app/services/auditoria.service.ts`.

**Punto de control**: Los siete servicios cubiertos conservan sus contratos observables y no contactan un backend.

---

## Fase 7: Historia 5 - Verificar hooks (Prioridad: P5)

**Objetivo**: Verificar el estado inicial y las transiciones de paginación, búsqueda y carga asíncrona.

**Prueba independiente**: Ejecutar cada hook con renderizado de hooks, temporizadores controlados y solicitudes resueltas en distintos órdenes.

- [X] T015 [P] [US5] Crear `client/app/__tests__/hooks/usePaginacion.test.tsx` para valores iniciales, `porPagina`, asignación directa de `irA` y reinicio según `client/app/hooks/usePaginacion.ts`.
- [X] T016 [P] [US5] Crear `client/app/__tests__/hooks/useBuscar.test.tsx` para actualización síncrona de texto, debounce de 300 ms y espera personalizada según `client/app/hooks/useBuscar.ts`.
- [X] T017 [P] [US5] Crear `client/app/__tests__/hooks/useFetch.test.tsx` para estado inicial, éxito, error, recarga, solicitudes obsoletas y desmontaje según `client/app/hooks/useFetch.ts`.

**Punto de control**: Los hooks quedan caracterizados sin corregir discrepancias del comportamiento productivo.

---

## Fase 8: Historia 6 - Verificar componentes de interfaz (Prioridad: P6)

**Objetivo**: Verificar contenido, variantes, accesibilidad e interacciones de los componentes compartidos.

**Prueba independiente**: Ejecutar cada archivo de componente en jsdom y comprobar roles, etiquetas, estados y acciones de usuario.

- [X] T018 [P] [US6] Crear `client/app/__tests__/components/Tabla.test.tsx` para filas, columnas, renderizadores, estado vacío y etiqueta accesible de `client/app/components/ui/Tabla.tsx`.
- [X] T019 [P] [US6] Crear `client/app/__tests__/components/Paginacion.test.tsx` para controles, límites deshabilitados y `aria-current` de `client/app/components/ui/Paginacion.tsx`.
- [X] T020 [P] [US6] Crear `client/app/__tests__/components/Badge.test.tsx` para etiquetas y clases de estado de `client/app/components/ui/Badge.tsx`.
- [X] T021 [P] [US6] Crear `client/app/__tests__/components/Campo.test.tsx` para relación etiqueta/control y mensajes de error de `client/app/components/ui/Campo.tsx`.
- [X] T022 [P] [US6] Crear `client/app/__tests__/components/Boton.test.tsx` para variantes, carga, deshabilitado e interacción de `client/app/components/ui/Boton.tsx`.
- [X] T023 [P] [US6] Crear `client/app/__tests__/components/Modal.test.tsx` para estados abierto/cerrado, relaciones accesibles y cierre de `client/app/components/ui/Modal.tsx`.
- [X] T024 [P] [US6] Crear `client/app/__tests__/components/Alerta.test.tsx` para tipos, clases, contenido y rol de `client/app/components/ui/Alerta.tsx`.
- [X] T025 [P] [US6] Crear `client/app/__tests__/components/CargandoSpinner.test.tsx` para texto y estado accesible de `client/app/components/ui/CargandoSpinner.tsx`.

**Punto de control**: Los ocho componentes quedan cubiertos en Jest sin modificar su implementación.

---

## Fase 9: Pulido y validación cruzada

**Propósito**: Comprobar la suite completa, cobertura, build y alcance final.

- [ ] T026 Ejecutar `npm test` desde `client/` y verificar que se ejecuten los casos P2–P6 y se generen reportes text, HTML y lcov ignorados por `client/.gitignore`.
- [ ] T027 Ejecutar `npm run build` desde `client/` y revisar el diff para confirmar que los cambios de implementación están limitados a configuración, dependencias y pruebas de `client/`, sin cambios en producción, `server/` o base de datos.

## Dependencias y orden de ejecución

- **Preparación (Fase 1)**: T001 establece dependencias y comando Jest.
- **Fundamentos (Fase 2)**: T002 y T003 dependen de T001; pueden ejecutarse en paralelo en archivos distintos. Bloquean las seis historias.
- **US1 (P1)**: depende de Fundamentos. Completar y validar el smoke test antes de migrar los casos P2–P6.
- **US2–US6 (P2–P6)**: dependen de US1. Después del smoke test, sus archivos de prueba son independientes y pueden desarrollarse en paralelo, respetando la secuencia por prioridad si se trabaja de forma individual.
- **Pulido**: T026 y T027 dependen de que las historias estén completas.

### Oportunidades de paralelismo

- Ejecutar T002 y T003 en paralelo después de T001.
- Tras completar T005, ejecutar T006 y T007 en paralelo.
- En US4, ejecutar T008–T014 en paralelo, una tarea por archivo de servicio.
- En US5, ejecutar T015–T017 en paralelo.
- En US6, ejecutar T018–T025 en paralelo, una tarea por componente.

## Ejemplo de paralelismo: Historia 4

```text
Con T001–T005 completadas, asignar T008–T014 en paralelo; cada tarea crea un archivo de prueba de servicio distinto.
```

## Estrategia de implementación

### MVP

Completar preparación, fundamentos y US1. Ejecutar el smoke test real con las versiones seleccionadas; continuar solo si Jest con `next/jest`, alias y TZ funciona en el proyecto.

### Entrega incremental

1. Migrar el runner y validar US1.
2. Añadir P2 y P3 para utilidades y cliente HTTP.
3. Añadir P4 y P5 para servicios y hooks.
4. Añadir P6 y cerrar con cobertura, build y revisión de alcance.

### Notas

- `[P]` marca tareas en archivos distintos que pueden ejecutarse en paralelo sin depender de trabajo pendiente.
- `[US#]` identifica la historia a la que pertenece cada tarea.
- No se realizan cambios de producción ni se modifica `server/`.
