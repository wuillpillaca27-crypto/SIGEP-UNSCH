# Modelo de pruebas: frontend Jest

Este cambio no agrega ni altera entidades de negocio. Describe los artefactos de prueba que implementan las historias P1–P6.

| Artefacto | Contenido | Regla de validación |
|---|---|---|
| Suite | Casos de una capa (`lib`, `services`, `hooks` o `components`) bajo `client/app/__tests__/` | Cada caso conserva el comportamiento observable descrito por la spec; una falla identifica esperado y recibido. |
| Caso de prueba | Verificación nombrada de una utilidad, cliente HTTP, servicio, hook o componente | Se ejecuta con Jest y no cambia código de producción. |
| Solicitud interceptada | Petición `fetch` capturada por MSW | Se comprueban método, URL, cabeceras, cuerpo y respuesta sin contactar servicios reales. |
| Reporte de cobertura | Resumen de líneas/ramas visitadas por la ejecución | Cada ejecución completa genera texto, HTML y lcov; no hay umbral mínimo y `client/coverage/` permanece ignorado. |

## Organización

- `client/app/__tests__/lib/`: smoke test, utilidades y cliente HTTP.
- `client/app/__tests__/services/`: contratos observables de servicios frontend.
- `client/app/__tests__/hooks/`: transiciones y efectos asíncronos.
- `client/app/__tests__/components/`: renderizado, accesibilidad e interacciones.

Las pruebas existentes y nuevas se ejecutan desde `client/` con el comando único `npm test`.
