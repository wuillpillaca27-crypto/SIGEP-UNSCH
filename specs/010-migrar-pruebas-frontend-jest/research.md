# Investigación: migrar pruebas frontend a Jest

## Integración Jest con Next.js

- **Decisión**: usar `next/jest` incluido en Next.js 16.4.3 desde una configuración CommonJS en `client/jest.config.js`.
- **Razón**: la aplicación ya utiliza Next.js 16.4.3 y React 19.3.0; la spec confirma que `next/jest` admite esa versión de React mediante su peer range. La integración prepara las transformaciones de Next y la carga de CSS/assets necesarias para pruebas.
- **Alternativas consideradas**: mantener Vitest contradice el objetivo; configurar Babel/TypeScript manualmente duplica la configuración que ya brinda Next.
- **Verificación pendiente**: la matriz oficial no certifica el cruce exacto Next/Jest. El smoke test P1 debe confirmar con el árbol instalado que runner, alias y TZ funcionan antes de migrar P2–P6.
- **Fuente primaria**: [guía oficial de Jest en Next.js](https://nextjs.org/docs/pages/guides/testing/jest).

## Versiones de Jest y entorno DOM

- **Decisión**: fijar la pareja `jest@30.5.2` y `jest-environment-jsdom@30.5.2`, como indica la investigación de la spec.
- **Razón**: mantener versiones de la misma publicación y soporte declarado para Node 24. Next.js proporciona `next/jest`; no se necesita otro transformador.
- **Alternativas consideradas**: elegir versiones distintas sin evidencia de compatibilidad aumenta el riesgo; el paquete `jsdom` directo solo se conserva si algún consumidor del proyecto lo requiere tras retirar Vitest.
- **Fuentes primarias**: [paquete Jest 30.5.2](https://github.com/jestjs/jest/blob/main/packages/jest/package.json), [paquete jest-environment-jsdom 30.5.2](https://github.com/jestjs/jest/blob/main/packages/jest-environment-jsdom/package.json), [metadatos Next 16.4.3](https://github.com/vercel/next.js/blob/v16.4.3/packages/next/package.json).

## Configuración de cobertura

- **Decisión**: activar cobertura para la ejecución de `npm test` y producir `text`, `html` y `lcov` sin umbral obligatorio.
- **Razón**: satisface FR-007 y SC-003; la regla `/coverage` ya existe en `client/.gitignore`, por lo que no se deben versionar esos artefactos.
- **Alternativas consideradas**: generar cobertura solo con un comando separado no cumple el requisito de cobertura por ejecución completa; imponer un umbral no está aprobado por la spec.

## Zona horaria, alias y MSW

- **Decisión**: establecer `TZ=America/Lima` antes de ejecutar Jest; mapear `@/*` a la raíz de `client/`; configurar MSW en el setup de Jest con `listen`, `resetHandlers` y `close`.
- **Razón**: conserva el comportamiento temporal y de resolución de módulos que verifica el smoke test Vitest actual, y mantiene las pruebas de `fetch` aisladas del backend.
- **Alternativas consideradas**: alias distinto al `tsconfig` o llamadas de red reales producirían resultados divergentes y pruebas dependientes del entorno.
