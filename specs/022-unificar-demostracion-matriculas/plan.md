# Plan de implementación: Trámites académicos con matrículas compatibles

**Rama**: `022-unificar-demostracion-matriculas` | **Fecha**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Resumen

Corregir la selección de matrícula para que cada solicitud se vincule al programa y registro académico compatibles, reutilizar el asistente existente para Doctorado y Segunda Especialidad, mantener Maestría, y preparar una cuenta reproducible de demostración solo en PostgreSQL local de desarrollo. No se crea una migración destructiva ni se actualizan datos institucionales reales. La validación se ejecuta contra la base real del entorno local solamente después de comprobar host y `NODE_ENV`.

## Contexto técnico

**Lenguaje/versiones**: JavaScript CommonJS en Node.js 24; TypeScript/React 19 en Next.js 16.  
**Dependencias existentes**: Express 5, Prisma 7, `@prisma/adapter-pg`, PostgreSQL, Jest, Playwright del script E2E.  
**Persistencia**: PostgreSQL con migraciones versionadas; uploads locales con rutas privadas.  
**Pruebas**: Jest del servidor y cliente, build de Next.js y recorrido Playwright/Chrome existente.  
**Plataformas**: portal web y API local en Windows/Linux; navegador Chrome.  
**Alcance de rendimiento**: consultas de matrículas y catálogo deben resolverse con una consulta acotada por usuario; no hay cambio de volumen objetivo.  
**Restricciones**: conservar las validaciones de titularidad/estado, no modificar inicio/header/footer/menús/login, no mostrar datos demo como oficiales, no escribir en producción, no eliminar filas ni resetear la base.  
**Entornos**: El seed y el E2E que presenta solicitudes requieren `NODE_ENV=development`, PostgreSQL en localhost y modo de demostración habilitado. Las pruebas Jest usan schemas/bases aisladas según su configuración actual.

## Verificación de constitución

- Especificación, plan, tareas y evidencia se mantienen en esta carpeta `specs/`.
- Se reutilizan Prisma, autenticación, endpoints y componentes existentes; no se agrega dependencia.
- Una migración solo se agrega si el esquema carece de una relación/campo requerido; debe ser aditiva y estar versionada.
- El seed confirma `development` y host loopback antes de conectar, y usa upsert solo sobre identificadores de demostración.
- No se cambia el diseño institucional ni se debilita la autorización académica.
- Las pruebas Jest producen cobertura; los casos navegador registran éxito solo cuando se ejecutan.

**Gate inicial**: PASS. No hay cambio de proveedor, dependencia nueva ni requisito de esquema pendiente por inferir.  
**Gate posterior al diseño**: PASS. El modelo vigente soporta matrículas múltiples por usuario-programa y solicitudes ligadas a la matrícula; confirmar la migración existente y su aplicación antes de ejecutar seed.

## Investigación y diseño

Las decisiones y alternativas se documentan en [research.md](research.md). Los modelos y relaciones vigentes están en [data-model.md](data-model.md), los contratos REST relevantes en [contracts/solicitudes-academicas.md](contracts/solicitudes-academicas.md), y el procedimiento de validación en [quickstart.md](quickstart.md).

### Decisiones

1. El servicio de solicitudes consulta todas las matrículas del usuario y deriva el tipo compatible desde `Programa.tipo`; nunca usa el nombre visible como regla.
2. El cliente conserva `tramite` en la ruta y manda el tipo de trámite y el `programaId` elegido al crear un borrador. Cuando hay una sola opción compatible, la selecciona automáticamente.
3. El servicio vuelve a comprobar matrícula, tipo, estado, fechas, habilitación y requisitos dentro del flujo de creación/presentación. La lista del cliente no sustituye la autorización del servidor.
4. El asistente compartido recibe el trámite de la URL; los endpoints de requisitos y documentos siguen validando la propiedad de la solicitud.
5. El seed usa identificadores y dominios exclusivos de demo, es idempotente y no sobrescribe contraseñas existentes. Se rechaza en producción, remoto o cualquier entorno distinto de `development` local.
6. Se mantiene la migración de múltiples matrículas existente. No se crea migración nueva si el cotejo del modelo y PostgreSQL confirma las columnas y claves ya disponibles.

## Estructura del proyecto

```text
specs/022-unificar-demostracion-matriculas/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/solicitudes-academicas.md
├── checklists/requirements.md
└── evidencia/                 # capturas y reporte de casos, sin secretos
client/app/grados-titulos/iniciar-solicitud/
client/app/grados-titulos/solicitudes-api.ts
client/app/mis-tramites/
server/src/solicitudes.js
server/src/identidad.js
server/scripts/sembrar-demo.js
server/scripts/verificar-integral.cjs
server/src/*.test.js
```

**Decisión de estructura**: Mantener portal y API en sus capas actuales. El asistente de grados se comparte entre los trámites mediante las opciones del backend; el seed y el verificador E2E permanecen como scripts operacionales independientes.

## Complejidad

No se añade capa ni dependencia. El uso de matrícula por usuario-programa y configuración de trámite ya está documentado en specs 018 y 020; este trabajo completa su comportamiento y evidencia.
