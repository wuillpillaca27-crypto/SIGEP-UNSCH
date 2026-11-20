# Puesta en marcha

## Acceso local

Iniciar la API con `npm.cmd --prefix server run local` y el cliente con `npm.cmd --prefix client run dev`. Abrir `http://127.0.0.1:3000/login` y usar una cuenta local de demostración. El cliente usa `/api/sigep` para enviar las solicitudes al mismo origen. El servidor interno se puede configurar mediante `SIGEP_API_URL`, con la ruta base `/api`. `CLIENT_ORIGINS` debe contener los orígenes autorizados del cliente.

La cookie `sigep_sesion` es HttpOnly, SameSite=Lax y dura una hora. Fuera del lanzador local requiere HTTPS y lleva Secure. El cierre borra la cookie y revoca el identificador de sesión en la instancia activa. La revocación entre múltiples instancias requiere un almacén compartido. El servicio registra el método, el resultado y la referencia de cuenta en los eventos de acceso exitoso o cierre. 

## Google OAuth

Para probar en Windows, copiar `server/.env.google.example` como `server/.env.google.local`. El lanzador local lee ese archivo al iniciar. Registrar `http://127.0.0.1:3000/api/sigep/auth/google/callback` en el cliente web de prueba y abrir SIGEP desde `http://127.0.0.1:3000/login` para conservar el mismo origen. En `SIGEP_GOOGLE_VINCULOS` indicar la ruta absoluta de un archivo privado, por ejemplo `server/.google-vinculos.local.json` resuelto en la máquina. Ambos archivos locales están excluidos de Git.

1. En Google Cloud, configurar la pantalla de consentimiento institucional y crear un cliente OAuth de tipo aplicación web.
2. Autorizar como URI de redirección la URL pública HTTPS de SIGEP terminada en `/api/sigep/auth/google/callback`.
3. Configurar en el servidor `SIGEP_GOOGLE_CLIENT_ID`, `SIGEP_GOOGLE_CLIENT_SECRET` y `SIGEP_GOOGLE_REDIRECT_URI`. Mantener el secreto fuera del repositorio y del frontend.
4. Configurar `SIGEP_GOOGLE_VINCULOS` con la ruta de un JSON privado que asocie el identificador estable `sub` verificado de Google con el correo de una cuenta SIGEP activa. Obtener y verificar cada vínculo mediante el proceso institucional antes de incluirlo. Por ejemplo, el formato es `{"123456789": "cuenta@ejemplo.test"}`.
5. Si se restringe el acceso a dominios gestionados de Google Workspace, configurar `SIGEP_GOOGLE_DOMINIOS` como una lista separada por comas. Mantener la lista de vínculos aprobados también en ese caso.
6. Reiniciar la API. Confirmar que el botón esté disponible y probar una cuenta vinculada y una ajena.

Sin esos datos Google permanece deshabilitado. La configuración de dominios es opcional cuando la política permite cuentas personales previamente vinculadas.
