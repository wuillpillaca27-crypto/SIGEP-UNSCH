# Plan: Siembra local de trámites académicos

**Feature Branch**: `025-sembrar-grados-dev` | **Fecha**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Resumen

Crear una entrada `db:seed:grados-dev` separada de las siembras existentes. Valida estrictamente `NODE_ENV=development`, PostgreSQL local y el nombre de base exacto `sigep_dev` antes de conectar; si falta la base, crea únicamente `sigep_dev` mediante una conexión local de mantenimiento; aplica `prisma migrate deploy`; y reconcilia cuentas, matrículas, programas, configuración y requisitos con claves naturales reservadas. Las credenciales faltantes se generan al azar y se guardan en un archivo local fuera del repo.

## Arquitectura y decisiones

- Mantener Node.js/CommonJS, Prisma 7 con `PrismaPg`, bcryptjs y Jest.
- No reutilizar ni modificar `sembrar-demo.js` o `sembrar-carga.js`; compartir solo el patrón de validación y adaptación del cliente.
- Hacer validación de URL como función pura y probar destinos permitidos/rechazados sin conexión.
- Ejecutar migraciones solo después de validar destino; no usar `db push`, reset ni crear otra base que no sea `sigep_dev`.
- Sembrar en transacción serializable con advisory lock. Usar correos, DNIs, códigos universitarios y códigos de requisitos con prefijo `SIGEP-DEV-`.
- Guardar contraseñas generadas bajo `%LOCALAPPDATA%\SIGEP-UNSCH\` (o `$XDG_CONFIG_HOME`/directorio seguro equivalente) con permisos de usuario, fuera del repositorio. Nunca imprimir secretos/hash.
- Marcar requisitos como documentos de prueba sintéticos sin validez institucional.

## Contratos y estructura

- Script: `server/scripts/sembrar-grados-dev.js`.
- Comando: `npm run db:seed:grados-dev`.
- Pruebas: `server/scripts/sembrar-grados-dev.test.js`, sin conexión real para pruebas de guardia.
- Documentación de arranque: `server/README.md` o sección específica enlazada desde la guía local.
- Migraciones ejecutadas por el CLI Prisma en el directorio `server/` con el `DATABASE_URL` ya validado.

## Seguridad y límites

- Solo loopback IPv4, IPv6 o `localhost`; rechazar producción y toda base distinta a `sigep_dev`.
- En salida de error, informar nombre/código de error sin imprimir URL, variables de entorno, contraseñas ni hashes.
- Las credenciales por entorno tienen prioridad; las generadas se conservan entre ejecuciones y se rotan solo si el usuario las reemplaza mediante variables.
- Nunca modificar bases `sigep`, `sigep_test` ni datos no reservados para estas fixtures.
- No tocar `specs/013-analisis-bd-cache/` ni `specs/015-pruebas-carga-api/`.

## Verificación

- Pruebas unitarias puras de validación, credenciales, datos clave/idempotencia y redacción de errores.
- Validación de salida con Jest completo (`npx jest` desde `server/`), sin imprimir secretos.
- Revisión final de `git diff --check`, `.gitignore`, estado y rutas protegidas antes del commit dedicado.
