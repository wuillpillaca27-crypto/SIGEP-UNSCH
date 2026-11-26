---
description: "Lista de tareas para publicar Swagger UI y documentar las rutas actuales de la API"
---

# Tareas: Swagger para la API

**Entrada**: Documentos de diseño en `/specs/012-swagger-api-docs/`  
**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.md`, `quickstart.md`

**Organización**: Las tareas se agrupan por historia de usuario. No se incluyen tareas de pruebas automatizadas porque la especificación no solicita TDD ni una suite nueva; la validación manual está descrita en `quickstart.md`.

## Fase 1: Preparación

**Propósito**: Instalar el componente de presentación Swagger UI en el servidor existente.

- [ ] T001 [P] Añadir una versión compatible de `swagger-ui-express` como dependencia de producción y actualizar el lockfile desde `server/` en `server/package.json` y `server/package-lock.json`.

---

## Fase 2: Fundamentos

**Propósito**: Cotejar la lista contractual de operaciones antes de redactar el documento OpenAPI.

- [ ] T002 [P] Cotejar método, prefijo y ruta de cada operación FR-016 de `specs/008-documentacion-arquitectura/spec.md` con los registradores `server/src/catalogo-grados.js`, `server/src/identidad.js`, `server/src/identidad-google.js`, `server/src/solicitudes.js`, `server/src/revision-grados.js`, `server/src/administracion.js` y `server/src/verificacion-documentos.js`; resolver cualquier discrepancia en favor del código actual y registrar la correspondencia en `specs/012-swagger-api-docs/contracts/openapi.md`.

**Checkpoint**: Inventario de rutas verificado; la especificación OpenAPI puede elaborarse con fuentes trazables.

---

## Fase 3: US1 — Consultar la documentación de la API (Prioridad: P1) 🎯 MVP

**Meta**: Abrir `/api-docs` y consultar una definición OpenAPI fiel a las rutas de la API actual.

**Criterio de prueba independiente**: Iniciar el servidor y abrir `GET /api-docs`; Swagger UI debe cargar el documento y mostrar todos los métodos y rutas cotejados en T002, con sus detalles respaldados por los módulos de ruta o contratos existentes. La revisión del diff debe confirmar que no cambiaron handlers ni reglas de negocio.

- [ ] T003 [P] [US1] Crear `server/openapi.json` como documento OpenAPI válido con metadatos, rutas completas, operaciones, parámetros, esquemas de solicitud/respuesta y respuestas únicamente cuando estén sustentados por el código actual y `docs/legacy/openspec/api-contracts.md`; incluir todo el inventario conciliado en T002.
- [ ] T004 [US1] Cargar `server/openapi.json` y montar `swagger-ui-express` en `GET /api-docs` desde `server/src/index.js`, sin modificar el registro ni el comportamiento de los endpoints funcionales.

**Checkpoint**: La UI de documentación está disponible y representa el inventario actualizado sin cambios funcionales.

---

## Fase 4: Pulido

**Propósito**: Mantener el procedimiento de comprobación y los límites del cambio claros para quien implemente o revise.

- [ ] T005 [US1] Actualizar `specs/012-swagger-api-docs/quickstart.md` si el nombre de paquete, URL efectiva o pasos de arranque difieren de la configuración implementada; conservar la comprobación del inventario FR-016 y el límite de no alterar lógica de negocio.

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)** y **Fundamentos (Fase 2)** no dependen entre sí.
- **US1 (Fase 3)** depende de T001 para disponer del paquete de UI y T002 para usar el inventario reconciliado.
- **Pulido (Fase 4)** depende de T003 y T004, porque refleja el montaje y artefacto definitivos.

### Oportunidades de trabajo paralelo

- T001 y T002 pueden ejecutarse en paralelo: cambian/inspeccionan archivos separados.
- T003 puede escribirse en paralelo con T001 después de completar T002; toca `server/openapi.json`, mientras T001 toca el manifiesto y lockfile.
- T004 debe esperar a T001 y T003, ya que importa el paquete y carga el documento.
- T005 se realiza tras completar US1.

## Ejemplo de ejecución paralela

```text
Después de iniciar las tareas:
  T001: instalar swagger-ui-express y actualizar manifiesto/lockfile
  T002: verificar inventario de rutas contra los registradores y actualizar el contrato

Después de T002:
  T003: redactar server/openapi.json

Después de T001 y T003:
  T004: montar /api-docs en server/src/index.js
  T005: al finalizar T004, alinear la guía quickstart con los pasos reales
```

## Estrategia de implementación

1. Completar T001 y T002 como preparación independiente.
2. Completar T003 y T004 para entregar el MVP de US1.
3. Aplicar T005 y seguir la guía `quickstart.md` para la validación de aceptación antes de cerrar la implementación.

**MVP sugerido**: US1 completa (T001–T004); ofrece Swagger UI con las rutas documentadas. T005 mantiene la guía de ejecución alineada con la entrega.
