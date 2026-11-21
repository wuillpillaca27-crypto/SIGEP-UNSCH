---
description: "Tareas de implementación para las pruebas unitarias del frontend"
---

# Tareas: Pruebas unitarias del frontend

**Documentos de entrada**: `specs/007-pruebas-frontend/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)

**Regla de alcance**: Crear o modificar únicamente configuración, dependencias, documentación de pruebas y archivos de pruebas bajo `client/`. No cambiar código de producción, `server/` ni la base de datos.

**Formato**: Cada tarea incluye ID, marca de paralelismo cuando aplica, historia y ruta(s) exacta(s). Cada archivo de prueba tiene una tarea propia.

## Fase 1: Preparación compartida

El repositorio y el proyecto `client/` ya existen. No se requieren tareas globales fuera de las historias; el entorno compartido se implementa como la Historia P1 para mantener la trazabilidad solicitada.

## Fase 2: Fundamentos

No hay cambios de servidor, esquema o modelo de datos. El único fundamento común para las historias P2–P6 es el entorno de prueba que se entrega en P1.

---

## Fase 3: Historia 1 - Entorno de pruebas (Prioridad: P1, MVP)

**Objetivo**: Configurar un único comando de pruebas, Vitest, entorno DOM, alias, zona horaria y MSW.

**Prueba independiente**: Ejecutar `npm test` desde `client/`; la prueba de humo pasa con código 0, identifica su nombre y estado, y una aserción fallida muestra valores esperado y recibido con código distinto de 0.

- [ ] T001 [US1] Actualizar `client/package.json` con las devDependencies Vitest, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, jsdom y MSW, más el script exacto `"test": "vitest --run"`; respetar justificaciones de `specs/007-pruebas-frontend/research.md`.
- [ ] T002 [US1] Actualizar `client/package-lock.json` para sincronizar las dependencias de desarrollo declaradas en `client/package.json`.
- [ ] T003 [US1] Crear `client/vitest.config.ts` con entorno `jsdom`, reporter `verbose` para mostrar nombre y estado por caso, setup `./vitest.setup.ts`, alias `@/*` → raíz `client/` (igual a `client/tsconfig.json`) y `TZ=America/Lima` antes de iniciar la ejecución de pruebas.
- [ ] T004 [US1] Crear `client/vitest.setup.ts` para cargar `@testing-library/jest-dom/vitest` y configurar MSW: iniciar antes de la suite, restablecer handlers después de cada caso y cerrar después de la suite.
- [ ] T005 [US1] Crear `client/app/__tests__/lib/runner.test.ts` como prueba de humo del runner que verifique que ejecuta una aserción y reporta nombre/estado del caso.

**Punto de control**: `npm test` ejecuta Vitest en una sola corrida y no requiere servicios reales.

---

## Fase 4: Historia 2 - Utilidades puras (Prioridad: P2)

**Objetivo**: Caracterizar resultados actuales de formato de fechas, estado, nombre completo y truncado.

**Prueba independiente**: Ejecutar el archivo de esta historia de forma aislada y comprobar formatos bajo `America/Lima`, entradas inválidas, estados desconocidos y límites de truncado.

- [ ] T006 [P] [US2] Crear `client/app/__tests__/lib/utils.test.ts` con casos para `formatearFecha`, `formatearFechaHora`, `infoEstado`, `nombreCompleto` y `truncar`, conforme al comportamiento actual documentado en `specs/007-pruebas-frontend/spec.md`.

---

## Fase 5: Historia 3 - Cliente HTTP (Prioridad: P3)

**Objetivo**: Verificar solicitudes `fetch`, cabeceras, métodos, éxito, errores HTTP, parseo y fallos de red.

**Prueba independiente**: Ejecutar el archivo de API aisladamente; MSW observa solicitudes y simula respuestas sin llamar al servidor real.

- [ ] T007 [P] [US3] Crear `client/app/__tests__/lib/api.test.ts` para GET/POST/PUT/PATCH/DELETE, JSON, Content-Type, respuestas exitosas, prioridad de errores, JSON no parseable, red y ausencia actual de lectura de token/Authorization.

---

## Fase 6: Historia 4 - Servicios de dominio (Prioridad: P4)

**Objetivo**: Verificar por servicio el método, URL, parámetros opcionales, cuerpo y respuesta propagada.

**Prueba independiente**: Ejecutar cada archivo por separado con `api` aislado; cada caso comprueba el contrato de su servicio sin requerir red ni servidor.

- [ ] T008 [P] [US4] Crear `client/app/__tests__/services/auth.service.test.ts` para login, perfil y logout según `client/app/services/auth.service.ts`.
- [ ] T009 [P] [US4] Crear `client/app/__tests__/services/estudiantes.service.test.ts` para rutas, paginación, búsqueda, obtención y eliminación según `client/app/services/estudiantes.service.ts`.
- [ ] T010 [P] [US4] Crear `client/app/__tests__/services/expedientes.service.test.ts` para listado, estado, parámetros opcionales y cuerpo según `client/app/services/expedientes.service.ts`.
- [ ] T011 [P] [US4] Crear `client/app/__tests__/services/usuarios.service.test.ts` para listado, filtro de rol y cambio de estado según `client/app/services/usuarios.service.ts`.
- [ ] T012 [P] [US4] Crear `client/app/__tests__/services/programas.service.test.ts` para listado, filtro opcional y respuesta según `client/app/services/programas.service.ts`.
- [ ] T013 [P] [US4] Crear `client/app/__tests__/services/documentos.service.test.ts` para verificación QR, exportación SUNEDU y respuestas según `client/app/services/documentos.service.ts`.
- [ ] T014 [P] [US4] Crear `client/app/__tests__/services/auditoria.service.test.ts` para listado, paginación, búsqueda y respuesta según `client/app/services/auditoria.service.ts`.

---

## Fase 7: Historia 5 - Hooks (Prioridad: P5)

**Objetivo**: Verificar estados iniciales, transiciones, debounce y manejo de respuestas asíncronas.

**Prueba independiente**: Ejecutar cada archivo aisladamente con renderizado de hooks, temporizadores controlados y promesas resueltas en orden elegido.

- [ ] T015 [P] [US5] Crear `client/app/__tests__/hooks/usePaginacion.test.tsx` para valores iniciales, `porPagina`, asignación directa por `irA` y reinicio según `client/app/hooks/usePaginacion.ts`.
- [ ] T016 [P] [US5] Crear `client/app/__tests__/hooks/useBuscar.test.tsx` para texto sincrónico, debounce predeterminado de 300 ms y espera personalizada según `client/app/hooks/useBuscar.ts`.
- [ ] T017 [P] [US5] Crear `client/app/__tests__/hooks/useFetch.test.tsx` para inicio, éxito, error, recarga, descarte de solicitudes obsoletas y desmontaje según `client/app/hooks/useFetch.ts`.

---

## Fase 8: Historia 6 - Componentes UI (Prioridad: P6)

**Objetivo**: Verificar contenido, clases, accesibilidad e interacciones de cada componente compartido.

**Prueba independiente**: Ejecutar el archivo de cada componente aislado en jsdom; comprobar roles/atributos accesibles y acciones visibles de usuario.

- [ ] T018 [P] [US6] Crear `client/app/__tests__/components/Tabla.test.tsx` para filas, celdas, renderizadores, estado vacío y etiqueta accesible de `client/app/components/ui/Tabla.tsx`.
- [ ] T019 [P] [US6] Crear `client/app/__tests__/components/Paginacion.test.tsx` para páginas, límites deshabilitados, cambio de página y `aria-current` de `client/app/components/ui/Paginacion.tsx`.
- [ ] T020 [P] [US6] Crear `client/app/__tests__/components/Badge.test.tsx` para etiquetas y clases de estados de `client/app/components/ui/Badge.tsx`.
- [ ] T021 [P] [US6] Crear `client/app/__tests__/components/Campo.test.tsx` para asociación label/input y mensajes accesibles de error de `client/app/components/ui/Campo.tsx`.
- [ ] T022 [P] [US6] Crear `client/app/__tests__/components/Boton.test.tsx` para variantes, carga, disabled e interacción de `client/app/components/ui/Boton.tsx`.
- [ ] T023 [P] [US6] Crear `client/app/__tests__/components/Modal.test.tsx` para estado abierto/cerrado, relaciones ARIA y cierre de `client/app/components/ui/Modal.tsx`.
- [ ] T024 [P] [US6] Crear `client/app/__tests__/components/Alerta.test.tsx` para tipos, clases, contenido y rol de `client/app/components/ui/Alerta.tsx`.
- [ ] T025 [P] [US6] Crear `client/app/__tests__/components/CargandoSpinner.test.tsx` para texto y estado accesible de `client/app/components/ui/CargandoSpinner.tsx`.

---

## Fase 9: Pulido y validación cruzada

- [ ] T026 Actualizar `specs/007-pruebas-frontend/quickstart.md` con los resultados de `npm test` y `npm run build` ejecutados desde `client/`; ambos deben terminar sin errores.

---

## Dependencias y orden de ejecución

- **P1 (T001–T005)**: T001 precede T002; T001–T004 establecen manifiesto, dependencias, configuración y setup, que preceden T005. Completar P1 antes de ejecutar pruebas de P2–P6.
- **P2 (T006)** y **P3 (T007)**: dependen de P1; luego pueden desarrollarse en paralelo porque usan archivos distintos.
- **P4 (T008–T014)**: cada servicio puede probarse en paralelo tras P1; las siete tareas modifican archivos distintos.
- **P5 (T015–T017)**: cada hook puede probarse en paralelo tras P1; las tres tareas modifican archivos distintos.
- **P6 (T018–T025)**: los ocho componentes pueden probarse en paralelo tras P1; T026 registra la validación final y depende de todas las historias.
- Ninguna historia depende de cambios de producción. Ninguna tarea modifica `server/` ni la base de datos.

## Oportunidades de paralelismo

- Después de terminar P1, ejecutar en paralelo T006 y T007.
- En P4, ejecutar en paralelo T008–T014.
- En P5, ejecutar en paralelo T015–T017.
- En P6, ejecutar en paralelo T018–T025; ejecutar T026 al final para validar la suite completa y el build.

## Estrategia de implementación

1. Completar P1 como MVP: instalar y justificar dependencias, configurar Vitest/MSW/TZ/alias, y comprobar el runner con su prueba de humo.
2. Incorporar P2 y P3 para cubrir utilidades y cliente HTTP.
3. Incorporar P4, P5 y P6 en incrementos independientes, sin cambiar el comportamiento de producción.
4. Cerrar todas las historias ejecutando `npm test` y `npm run build` desde `client/`; registrar los resultados en `quickstart.md` y cualquier discrepancia entre requisitos históricos y código observado.

## Validación final

- `npm test` desde `client/` termina sin errores y ejecuta todas las pruebas.
- `npm run build` desde `client/` termina sin errores.
- No se introdujeron cambios de producción, servidor o base de datos.