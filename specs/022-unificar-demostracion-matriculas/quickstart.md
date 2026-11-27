# Validación: tres trámites desde matrículas compatibles

## Preparación segura

1. Ejecutar desde `server/`; el archivo `.env` no se muestra ni se comparte.
2. Confirmar sin imprimir la URL que el proceso usa `NODE_ENV=development`, `DATABASE_URL` PostgreSQL local en loopback y base `sigep`. Si no cumple esas condiciones, no ejecutar el seed ni el navegador.
3. Arrancar el servidor con `npm run local`. Esta tarea no ejecuta comandos contra producción ni borra/restaura la base.
4. Ejecutar `npm run db:seed:demo` para crear o reconciliar datos demo. Las credenciales se guardan en `server/.sigep-local/cuentas-academicas.tsv`, ruta ignorada por Git; la salida de consola no debe imprimir contraseñas o hashes. Repetir el comando y confirmar que no duplica filas.
5. Arrancar el portal con `npm run dev` desde `client/` y habilitar la demostración únicamente en el proceso local.

## Validación automatizada

Desde `server/`:

```powershell
npx jest --runInBand
node scripts/verificar-integral.cjs
```

El script Playwright usa Chrome y la cuenta demo local. Para capturas, define `SIGEP_EVIDENCIA_DIR` a `specs/022-unificar-demostracion-matriculas/evidencia`; verifica que la cuenta, cookies y documentos mostrados sean sintéticos. No pasar contraseñas como argumentos ni imprimir el archivo de cuentas.

## Casos CP01–CP14

| Caso | Verificación | Evidencia requerida |
|---|---|---|
| CP01 | Iniciar sesión con la cuenta integral demo | sesión activa; no registrar contraseña/token |
| CP02 | Consultar programas/matrículas asociadas | API devuelve solo tres o más registros propios, incluidos los tres tipos solicitados |
| CP03 | Iniciar Grado de Maestro | borrador asociado a matrícula maestría |
| CP04 | Iniciar Grado de Doctor | borrador asociado a matrícula doctorado |
| CP05 | Iniciar Título de Segunda Especialidad | borrador asociado a matrícula segunda especialidad |
| CP06 | Cargar requisitos por trámite/programa | plantillas activas compatibles y marcadas como demo |
| CP07 | Adjuntar, visualizar, reemplazar y retirar PDF | respuestas exitosas y propiedad del archivo comprobada |
| CP08 | Guardar y recuperar borrador | mismo borrador tras navegación o nueva sesión según el flujo |
| CP09 | Presentar las tres solicitudes | tres transiciones a presentado con requisitos obligatorios completos |
| CP10 | Generar tres expedientes | códigos/IDs distintos asociados al tipo y programa correcto |
| CP11 | Consultar expedientes en Mis Trámites | aparecen los tres expedientes propios |
| CP12 | Cerrar sesión y volver a entrar | expedientes siguen persistidos y se vuelven a consultar |
| CP13 | Usar cuenta solo-maestría para iniciar Doctorado | rechazo con explicación de incompatibilidad; ninguna fila de solicitud nueva |
| CP14 | Repetir Grado de Maestro después de los cambios | flujo completo conserva funcionamiento |

## Construcción y reporte

- Correr `npm test` en `client/` y `npx jest --runInBand` en `server/`; ambos generan cobertura según configuración.
- Correr `npm run build` en `client/`.
- CP01–CP14 se registran como aprobados solo si el paso se ejecutó realmente. Adjuntar capturas del selector/matrícula y pantallas de los tres asistentes; guardar un reporte JSON sin datos personales.
- Las solicitudes generadas por el navegador son datos demo en PostgreSQL local. El script guarda IDs/códigos de prueba en la carpeta de evidencia configurada. No se eliminan ni modifican expedientes institucionales.
