# Investigación: Certificaciones integrales

## Decisiones

1. **Reutilizar catálogos y solicitudes existentes.** `client/app/certificaciones/[seccion]/page.tsx` enruta diplomados, módulos, requisitos y programas al catálogo de Grados y Títulos; `server/src/catalogo-grados.js` filtra por programa activo, configuración y plantillas vigentes. La implementación debe cubrir huecos con pruebas focalizadas y no duplicar el flujo.
2. **Conservar la autorización en servidor.** `server/src/solicitudes.js` valida estudiante, matrícula, estado, programa, tipo de trámite y plantillas antes de crear/presentar. La interfaz no concede elegibilidad.
3. **No inventar historial académico.** `Estudiante` solo contiene créditos/promedio agregados; no hay tablas de módulos, cursos, calificaciones o diplomados cursados. Registrar este requisito como dependencia, no simularlo como datos institucionales.
4. **No emitir documentos oficiales.** La aplicación incluye revisión y verificación existentes; los documentos generados para tests serán marcados como demostración. Firma y autorización de emisión requieren dependencia institucional.
5. **Sin migración inicialmente.** El esquema de solicitudes cubre tipos de diplomado/módulos y los módulos de configuración/requisitos; no se justifica una modificación de schema hasta identificar el origen contractual del historial académico.

## Hallazgo funcional

El menú abre una ruta dinámica funcional. Hay filtro de requisitos y enlaces de inicio de solicitud; existen rutas administrativas de revisión por tipo y carga de requisitos. Falta demostrar con pruebas reales que catálogo, filtros, solicitudes, backoffice y certificación de módulos cumplen el alcance solicitado. La spec no declara estas capacidades completas solo por tener una página.

## Dependencias externas

- Historial académico estructurado (diplomados aprobados y módulos con nota/periodo/créditos/horas) y sus reglas de elegibilidad.
- Catálogo de programas, requisitos, costos, plazos, normativa y formatos publicados por la UNSCH.
- Plantillas autorizadas, firma y reglas de emisión oficial, integración QR y política de anulación.

## Seguridad

Pruebas con la suite PostgreSQL aislada. Semillas solo desarrollo/loopback. Credenciales quedan en `.sigep-local` ignorado. No mostrar secretos ni inspeccionar/copiar respaldos. No migrar SQLite sin la confirmación separada requerida.
