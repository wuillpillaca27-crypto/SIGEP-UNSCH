# Investigación: CI de dos paquetes con Jest

## Decisión 1: dos jobs explícitos e independientes

- **Decisión**: Declarar jobs separados para `server` y `client`, sin `needs` ni matriz.
- **Rationale**: GitHub Actions ejecuta los jobs sin dependencias en paralelo; `needs` introduce dependencia/orden. Dos identificadores explícitos cumplen el requisito de mostrar resultados independientes por paquete.
- **Alternativas consideradas**: Una matriz de paquete (menos directa para ofrecer dos jobs nombrados y concretos); un único job con dos pasos de pruebas (un fallo puede ocultar el estado separado de cada paquete).
- **Fuente**: [GitHub Docs: jobs en un workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs), [GitHub Docs: ejecución de workflows](https://docs.github.com/en/actions/get-started/understand-github-actions).

## Decisión 2: Node 24 y lockfile propio por job

- **Decisión**: Fijar Node 24 en ambos jobs y ejecutar `npm ci` desde `server/` o `client/` respectivamente, usando el package-lock correspondiente.
- **Rationale**: El repositorio tiene dos paquetes y dos lockfiles separados; `npm ci` hace la instalación a partir del lockfile. `actions/setup-node` permite seleccionar Node 24 y configurar cache con la ruta del lockfile en subdirectorios, aunque la caché no es necesaria para este workflow mínimo.
- **Alternativas consideradas**: Instalar desde la raíz (no existe un workspace npm común); usar rangos de Node del runner (no garantiza major 24); añadir cache (optimización que no es necesaria para satisfacer la solicitud).
- **Fuentes**: [README oficial de actions/setup-node](https://github.com/actions/setup-node/blob/main/README.md), [npm ci](https://docs.npmjs.com/cli/commands/npm-ci/).

## Decisión 3: conservar Jest en server y pasar client a Jest integrado con Next.js

- **Decisión**: Mantener `server/` sin cambios de runner. En `client/`, sustituir Vitest por Jest con `next/jest`, entorno `jsdom`, `moduleNameMapper` para el alias `@/` y un setup de Jest que mantenga `jest-dom`, la zona horaria Lima y el lifecycle de MSW.
- **Rationale**: `server/package.json` ya ejecuta `jest --coverage`; la suite TypeScript del cliente hoy importa Vitest y requiere su adaptación. Next.js documenta una integración Jest que configura el transformador del framework, e indica configuración de alias y setup de `jest-dom`. Esto evita agregar un transformador TypeScript separado. La constitución del proyecto establece Jest para client y server.
- **Alternativas consideradas**: Mantener Vitest en client (contradice el requisito de pruebas Jest en ambos); usar `ts-jest` (funciona con TypeScript, pero añade un transformador redundante frente a `next/jest`).
- **Fuentes**: [Guía oficial de Next.js para Jest](https://nextjs.org/docs/app/guides/testing/jest), [configuración de cobertura de Jest](https://jestjs.io/docs/configuration).

## Decisión 4: artefacto separado y posterior a Jest

- **Decisión**: En cada job, subir su directorio `coverage/` a un artefacto con nombre del paquete. Configurar la subida para ejecutarse si Jest falla y tolerar que el directorio no exista, sin declarar un artefacto vacío.
- **Rationale**: Jest genera cobertura mediante `--coverage`; los artefactos de GitHub permiten especificar nombre y ruta, y pueden conservarse para descarga por separado. Mantener los pasos de artefacto en cada job evita transferir reportes entre paquetes.
- **Alternativas consideradas**: Subir ambos reportes desde un job agregador (introduce dependencia entre jobs y reduce independencia); omitir artefactos al fallar la suite (pierde evidencia de diagnóstico).
- **Fuentes**: [Jest: opciones CLI de cobertura](https://jestjs.io/docs/cli), [actions/upload-artifact](https://github.com/actions/upload-artifact/blob/main/README.md).

## Decisión 5: permisos y ausencia de secretos

- **Decisión**: Declarar permisos mínimos `contents: read`; no referenciar el contexto `secrets`, credenciales de registro, tokens propios ni variables secretas. No pasar el token de checkout a scripts de prueba.
- **Rationale**: Checkout requiere leer el repositorio; `actions/setup-node` documenta `contents: read` como permiso suficiente para checkout e instalación. Las pruebas usan dependencias públicas y fixtures locales. La acción de checkout puede consumir el token automático, limitado por esos permisos, sin configurar un secreto de usuario.
- **Alternativas consideradas**: Permisos amplios de escritura (innecesarios); secreto PAT mantenido por el equipo (añade credencial rotatoria sin beneficio para este flujo).
- **Fuentes**: [README oficial de actions/setup-node](https://github.com/actions/setup-node/blob/main/README.md), [permisos de workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [token automático GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token).

## Decisiones pendientes

No quedan decisiones funcionales pendientes. Se utilizará `ubuntu-latest` y triggers `push` y `pull_request`, según los supuestos ya documentados en `spec.md`.
