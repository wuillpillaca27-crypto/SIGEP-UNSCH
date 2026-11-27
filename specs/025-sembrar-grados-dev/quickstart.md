# Quickstart y verificación

Consulta [README de server](../../server/README.md) para crear `sigep_dev`, correr la siembra con `NODE_ENV=development`, configurar contraseñas opcionales y arrancar API y cliente con `SIGEP_DEMOSTRACION=1`.

## Resultados de esta implementación

- Prueba específica: 1 suite, 8 pruebas aprobadas.
- `npx jest` desde `server/`: 14 suites y 82 pruebas aprobadas.
- Guardias comprobadas para PostgreSQL local `sigep_dev`, otros nombres de base, hosts remotos, parámetros de URL que podrían redirigir y modo producción.
- Prueba de reconciliación repetida: conteos estables para 3 programas, 3 estudiantes/matrículas, 5 usuarios y 3 requisitos; no cambian los hashes al repetir con la misma contraseña (aserción interna booleana, sin mostrarlos).
- Verificación operativa actual: el host es loopback y el usuario de conexión es `sigep_app`, pero la instancia/puerto configurados responden SQLSTATE `3D000` para `sigep_dev`. `prisma migrate deploy` terminó con código 1; no se sembró ni se imprimió la URL.
- La sesión de ejecución no contiene `SIGEP_DEV_PASSWORD` ni variables individuales de cuentas. Para esta ejecución se solicitó usar contraseña de sesión; por eso el seeder no se ejecutó ni generó contraseñas.
- Estado esperado indicado por la solicitud: 11 suites/55 pruebas. El repositorio tenía 13 suites/74 pruebas antes de esta feature; esta agrega una suite con ocho pruebas, para un total actual de 14/82.
- `specs/013` y `specs/015` no fueron modificadas.

No se muestran contraseñas, hashes ni URL. La prueba de credenciales usa una carpeta temporal fuera del repositorio y la limpia al terminar.
