# Investigación: entorno de pruebas frontend

## Decisiones

### Vitest como runner

- **Decisión**: usar Vitest y ejecutar su modo de una sola corrida mediante `vitest --run`.
- **Justificación**: proporciona ejecución y reportería de pruebas TypeScript/JavaScript y configuración de entorno DOM; satisface el comando único requerido sin reemplazar el build de Next.js.
- **Alternativa considerada**: adoptar un runner distinto. Se descarta porque el equipo seleccionó Vitest y ya pidió compatibilidad con el entorno Vite de pruebas.
- **Compatibilidad**: la guía oficial actual de Vitest requiere Node.js 22.12 o superior. El entorno revisado tiene Node.js 24.16. Confirmar la versión usada por CI/desarrolladores al implementar.
- **Fuente**: [Vitest: guía y requisitos](https://vitest.dev/guide/), [Vitest: entornos](https://vitest.dev/config/environment).

### jsdom como DOM simulado

- **Decisión**: establecer `jsdom` como entorno de Vitest para pruebas que consultan DOM y APIs de navegador.
- **Justificación**: habilita renderizar componentes y simular capacidades DOM en Node sin navegador real.
- **Alternativa considerada**: entorno Node sin DOM; no permite validar componentes e interacciones visuales requeridas.
- **Fuente**: [Proyecto jsdom](https://github.com/jsdom/jsdom).

### `@testing-library/react`

- **Decisión**: usar sus utilidades para montar componentes React y observar el DOM.
- **Justificación**: la capa UI se verifica por contenido y comportamiento accesible, no por detalles privados de implementación.
- **Alternativa considerada**: inspección aislada de funciones de render; insuficiente para interacciones y relaciones accesibles.
- **Fuente**: [React Testing Library: introducción](https://testing-library.com/docs/react-testing-library/intro/).

### `@testing-library/user-event`

- **Decisión**: usarlo para clics, escritura y otras acciones de usuario en pruebas de componentes.
- **Justificación**: ofrece interacciones más cercanas a las acciones reales que despachar eventos individuales.
- **Alternativa considerada**: limitarse a invocar manejadores directamente; no valida el flujo observable desde el DOM.
- **Fuente**: [user-event: introducción](https://testing-library.com/docs/user-event/intro/), [configuración por prueba](https://testing-library.com/docs/user-event/setup/).

### `@testing-library/jest-dom`

- **Decisión**: cargar el adaptador de Vitest y sus matchers DOM desde el archivo común de setup.
- **Justificación**: permite aserciones legibles sobre estados y atributos de elementos en las pruebas UI.
- **Alternativa considerada**: aserciones manuales sobre cada propiedad DOM; más repetitivas y menos claras.
- **Fuente**: [jest-dom](https://testing-library.com/docs/ecosystem-jest-dom/).

### MSW

- **Decisión**: usar MSW con `setupServer` para interceptar `fetch` en pruebas del cliente HTTP, con reset de handlers entre casos.
- **Justificación**: verifica solicitudes y respuestas a través del límite de red sin modificar la implementación ni depender de servicios reales.
- **Alternativa considerada**: mock directo de `fetch`; no cubre tan claramente el ciclo de solicitud HTTP y el aislamiento de handlers.
- **Fuente**: [MSW Quick Start](https://mswjs.io/docs/quick-start), [API setupServer](https://mswjs.io/docs/api/setup-server/).

## Notas de compatibilidad y alcance

- Mantener todas estas dependencias en `devDependencies` de `client/`; producción no importa ni carga el entorno de pruebas.
- La suite cubre comportamiento del frontend existente. MSW es para pruebas del cliente HTTP; los servicios se pueden probar con el módulo `api` aislado para afirmar ruta, método y argumentos.
- `client/tsconfig.json` define `@/*` como `./*`; Vitest debe declarar la misma equivalencia desde la raíz de `client/`.
- Fijar `TZ=America/Lima` al cargar la configuración de Vitest antes de iniciar workers mantiene deterministas las funciones `Date` que usan zona local. No se requiere agregar `cross-env`.
- El adaptador de `jest-dom` para Vitest se importa desde `@testing-library/jest-dom/vitest`.
- `@testing-library/react` puede declarar `@testing-library/dom` como peer dependency. Revisar el manifiesto/árbol de dependencias de la versión que se instale; npm debe resolver el peer compatible. No añadir otra dependencia directa salvo que la instalación seleccionada lo requiera, documentándolo.