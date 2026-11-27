# Verificación integral de SIGEP-UNSCH

## Causa y alcance

El rechazo de Doctorado era correcto cuando la sesión correspondía a la cuenta individual de Maestría. El asistente vigente consulta todas las matrículas y conserva el trámite seleccionado en el retorno desde el login. La semilla agrega `estudiante.integral@demo.test` con los cinco programas de demostración. Conservar las cuentas individuales permite probar también el rechazo académico.

El retiro de adjuntos carecía de una operación. Ahora solo el titular de un borrador puede retirar el adjunto vigente. El archivo y la auditoría se conservan, el requisito vuelve a pendiente y el adjunto queda fuera de la lista y de la descarga estudiantil. La constancia interna de recepción se genera desde un expediente presentado y se descarga en texto plano.

El enlace de orientación llevaba a una página informativa. Ahora el formulario persiste la consulta, devuelve un código de atención y permite recuperar la respuesta mediante código y correo. Los administradores y operadores responden desde la bandeja privada. El enlace de recuperación de contraseña lleva a esta atención, donde el personal debe verificar la identidad.

## Arranque local

En `server/`, con PostgreSQL local y `NODE_ENV=development`:

```powershell
npm run db:generate
npm run db:init
npm run db:seed:demo
npm run local -- -Demostracion
```

En `client/` ejecutar `npm run dev`. Para probar una compilación estable, ejecutar `npm run build` y luego `npm start -- --hostname 127.0.0.1 --port 3000`. Usar una sola instancia de Next.js en ese puerto.

Las credenciales generadas se guardan en `server/.sigep-local/cuentas-academicas.tsv`. En `server/`, instalar el navegador de prueba en el entorno local ignorado por Git. La prueba usa Chrome instalado.

```powershell
npm install --prefix .sigep-local/e2e playwright@1.65.1
npm run test:e2e
```

Las pruebas de navegador presentan expedientes y dejan registros de demostración en la base local. El archivo PDF de evidencia se genera en el script.

## Inventario verificado

| Superficie | Evidencia |
|---|---|
| Catálogo y acceso | Playwright abrió los cinco catálogos y sus enlaces Iniciar solicitud. En Doctorado verificó retorno al trámite desde el login. |
| Asistente | Playwright completó los cinco trámites con la misma sesión. En Doctorado probó salir y retomar, avanzar y retroceder, adjuntar, visualizar, reemplazar y retirar PDF, presentar y descargar el acuse. |
| Mis Trámites | Los cinco expedientes se localizaron desde el enlace de confirmación. Jest verificó que el acuse es privado y exige presentación. |
| Orientación y administración | Playwright registró una consulta, comprobó el rechazo del acceso del estudiante, publicó la respuesta como operador e inició la revisión de un expediente. |
| Verificación pública | Playwright consultó un código de documento emitido de demostración. Las pruebas de integración cubrieron emisión y control de acceso. |
| Navegación | Chrome en vistas de 1440 y 390 px. En la vista móvil se probó el menú desplegable, filtro de requisitos, permanencia de documentos, preguntas frecuentes, cambio de tema y apertura y cierre del panel de accesibilidad. |
| Sesión | Playwright comprobó el cierre de sesión y la respuesta 401 posterior. Una prueba adicional comprobó el enlace de recuperación asistida, la visibilidad de contraseña y el estado de Google sin configuración. |

Pasaron 73 pruebas de cliente, 69 de servidor, la compilación de Next.js y la validación estricta de OpenSpec. Las pruebas de integración verificaron la persistencia y los casos de permisos con PostgreSQL real.

## Acciones e integraciones que requieren verificación o configuración adicional

- Los vínculos sociales de la portada incluyen destinos provisionales y se conservan por la restricción de diseño.
- La recuperación automática de contraseña, Google real, el correo saliente y la exportación oficial requieren integraciones autorizadas. La ruta de ayuda admite seguimiento manual.
- Los formatos y requisitos oficiales requieren publicación institucional. El acuse es una constancia interna de presentación. La firma digital institucional no se configura en este cambio.
- El código público admite enlaces QR. La captura mediante cámara y la revisión de todos los controles y enlaces en hardware móvil siguen pendientes.
