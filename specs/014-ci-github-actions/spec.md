# Especificación de funcionalidad: CI con GitHub Actions

**Feature Branch**: `014-ci-github-actions`  
**Creada**: 2026-11-26  
**Estado**: Borrador  
**Entrada**: Workflow de GitHub Actions que instala dependencias, ejecuta las pruebas Jest del `server` y del `client`, y sube los reportes de cobertura como artefactos. Node 24, un job por paquete, sin secretos ni despliegue.

## Escenarios de usuario y pruebas

### Historia de usuario 1: Revisar CI del servidor y del cliente (Prioridad: P1)

Como persona que contribuye al repositorio, quiero que cada cambio en una rama o pull request ejecute por separado las pruebas del servidor y del cliente, para detectar regresiones en cualquiera de los dos paquetes antes de integrar los cambios.

**Por qué es prioridad**: La validación de ambos paquetes es el objetivo central del workflow y da una señal verificable por cada parte principal de la aplicación.

**Prueba independiente**: Abrir un pull request o actualizar una rama y comprobar que aparecen dos jobs separados, cada uno instala las dependencias bloqueadas de su paquete y ejecuta sus pruebas con cobertura.

**Escenarios de aceptación**:

1. **Dado** un cambio enviado a una rama o pull request, **cuando** inicia el workflow, **entonces** se ejecutan dos jobs independientes, uno para `server` y otro para `client`, usando Node 24.
2. **Dado** que las pruebas de un paquete fallan, **cuando** el otro job aún no ha terminado, **entonces** ese otro job se ejecuta y reporta su propio resultado.
3. **Dado** que un job genera un reporte de cobertura, **cuando** concluye la ejecución de pruebas, **entonces** el reporte de ese paquete queda disponible como artefacto descargable, incluso si sus pruebas fallaron después de generar el reporte.
4. **Dado** un workflow terminado, **cuando** una persona revisa sus pasos, **entonces** no encuentra uso de secretos ni pasos de despliegue.

### Casos límite

- Si una suite falla después de producir cobertura, el job sube el reporte generado y mantiene estado fallido para bloquear una integración que requiera CI exitoso.
- Si un paquete no produce su directorio de cobertura, el workflow no debe aparentar que el artefacto de ese paquete está disponible.
- Si la instalación bloqueada de un paquete falla, su job debe fallar y el job del otro paquete debe continuar de forma independiente.

## Requisitos

### Requisitos funcionales

- **FR-001**: El workflow DEBE ejecutarse ante pushes y pull requests.
- **FR-002**: El workflow DEBE declarar exactamente dos jobs de validación independientes: uno para `server/` y otro para `client/`; ningún job DEBE depender del resultado del otro.
- **FR-003**: Ambos jobs DEBEN usar Node.js 24.
- **FR-004**: Cada job DEBE instalar de forma reproducible las dependencias del paquete correspondiente usando su archivo de bloqueo y su directorio de trabajo.
- **FR-005**: El job de `server/` DEBE ejecutar las pruebas Jest del paquete con generación de cobertura.
- **FR-006**: El job de `client/` DEBE ejecutar las pruebas con Jest y generar cobertura. La configuración actual usa Vitest; la entrega DEBE adaptar el comando y la suite existente a Jest, preservando su propósito, para cumplir este requisito.
- **FR-007**: Cada job DEBE subir su propio reporte de cobertura como artefacto con un nombre que identifique el paquete. La subida DEBE ejecutarse aunque falle la suite, cuando exista un reporte generado.
- **FR-008**: El workflow NO DEBE requerir secretos configurados en el repositorio o la organización para instalar o ejecutar las pruebas. Puede usar el token automático de solo lectura de GitHub únicamente para obtener el código; NO DEBE exponerlo a los comandos de instalación o prueba.
- **FR-009**: El workflow NO DEBE incluir despliegues, publicación de paquetes ni cambios de infraestructura de producción.
- **FR-010**: El workflow DEBE tener permisos de repositorio limitados a los necesarios para obtener el código fuente y ejecutar las validaciones.

### Entidades clave

- **Ejecución de CI**: Resultado de validar un cambio; contiene un resultado independiente para cada paquete.
- **Job de paquete**: Ejecución aislada de instalación, pruebas y generación de cobertura para `server` o `client`.
- **Artefacto de cobertura**: Reporte descargable producido por un job, identificado por el paquete que lo generó.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Cada push o pull request inicia dos jobs claramente identificados, uno por paquete, y el resultado de uno no impide que el otro comience o finalice.
- **SC-002**: Los dos jobs informan que usaron Node.js 24 e instalaron las dependencias desde el lockfile del paquete respectivo.
- **SC-003**: Una ejecución que genera cobertura termina con dos artefactos separados y descargables, uno del servidor y otro del cliente.
- **SC-004**: Al inspeccionar el workflow no aparecen referencias a secretos ni pasos de despliegue.
- **SC-005**: El job del cliente ejecuta realmente Jest; no basta con que su comando siga ejecutando Vitest.

## Supuestos

- El workflow se ejecutará en pushes y pull requests de las ramas del repositorio; no se limita a una rama específica.
- Cada paquete dispone de su propio `package-lock.json`, y `npm ci` es la instalación reproducible prevista.
- La adecuación del cliente a Jest forma parte de esta funcionalidad porque el usuario solicitó expresamente pruebas Jest en ambos paquetes. La prueba existente conserva su intención y sus aserciones relevantes.
- La cobertura que produzca cada runner queda en el directorio `coverage/` propio del paquete y se sube como un artefacto independiente.
- No se requieren servicios externos, base de datos, credenciales ni secretos configurados por el equipo para ejecutar las suites CI; el checkout puede usar el token automático de solo lectura de GitHub.
