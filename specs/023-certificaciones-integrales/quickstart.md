# Validación local

## Preparación

1. Usar el servidor de desarrollo conectado a PostgreSQL local. No imprimir `.env` ni `DATABASE_URL`.
2. Ejecutar el seed demo existente solo si se confirma modo de desarrollo loopback. No correr la migración SQLite de spec 011.
3. Abrir `/certificaciones` y verificar los cuatro enlaces del menú.

## Verificación automatizada

Desde `server/`: `npx jest --runInBand`.

Desde `client/`: `npm test -- --runInBand` y `npm run build`.

Los tests deben usar la base aislada `sigep_test`. Para navegador, usar Playwright local existente y registrar casos solo tras ejecutarlos. Nunca guardar contraseñas, tokens o datos personales en evidencias.

## Recorridos

- Navegación de cada ruta; consulta y búsqueda de requisitos; enlaces a ayuda, verificación e inicio.
- Login y elegibilidad; borrador, documentos y presentación cuando existan requisitos activos de demo.
- Denegación de programa/módulo ajeno o no elegible.
- Revisión con roles permitidos y transiciones válidas; emisión/verificación solo como demostración.

La evidencia debe indicar dependencias académicas u oficiales pendientes y no llamar “aprobado” a ningún caso no ejecutado.

## Ejecución de esta iteración

- Suite focalizada del catálogo: `1` suite y `1` prueba en verde (incluye búsqueda de programas sin distinguir acentos, cero coincidencias, requisitos y formatos).
- Cliente: `npm test -- --runInBand`: 24 suites y 74 pruebas en verde.
- Servidor: `npx jest --runInBand`: 13 suites y 73 pruebas en verde.
- Build cliente: `npm run build`: compilación y generación de 49 páginas correctas. Next.js avisó que encontró lockfiles raíz y de `client/`; no impidió el build.
- E2E CP01–CP30 de esta especificación: pendiente; no se atribuyen resultados previos de otros casos a este conjunto.
- Pendiente funcional: el esquema no contiene historial granular de diplomados/módulos aprobados (notas, periodos, horas y créditos por módulo). No es válido afirmar que la elegibilidad real de módulos está lista hasta incorporar una fuente académica o un modelo demo separado y autorizado. No se creó migración ni se escribieron nuevos registros de negocio como parte de esta iteración.
