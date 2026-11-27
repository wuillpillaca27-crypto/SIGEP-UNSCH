# Investigación: matrículas compatibles y flujo integral

## Decisión 1: Elegibilidad por matrícula y tipo de programa

**Decisión**: Reutilizar `Estudiante` como una matrícula por usuario y programa; resolver trámite desde `Programa.tipo` mediante una tabla central de correspondencias ya usada por el servidor.  
**Motivo**: La migración 020 ya permite varios registros por estudiante y conserva `Solicitud.estudianteId`. La causa reportada es consistente con la proyección heredada de una sola matrícula en la sesión o con una ruta que omite el programa elegido.  
**Alternativa descartada**: Comparar `Programa.nombre` o asignar Maestría como valor predeterminado. Los nombres pueden cambiar y el valor por defecto puede autorizar un programa incorrecto.

## Decisión 2: La autorización vive en el servidor

**Decisión**: Consultar las matrículas del usuario autenticado para opciones y volver a verificar programa, estado, fechas, configuración y requisitos al crear/presentar solicitudes.  
**Motivo**: Evita confiar en un `programaId` controlado por el navegador y conserva los controles académicos existentes.  
**Alternativa descartada**: Filtrar solo en frontend, que no protege la API.

## Decisión 3: Un asistente compartido

**Decisión**: Mantener una ruta común que recibe el trámite seleccionado; mostrar programa y requisitos procedentes de la API, y reutilizar operaciones existentes para borrador, archivo y expediente.  
**Motivo**: Reduce divergencia entre Maestro, Doctor y Segunda Especialidad sin rediseñar el portal.

## Decisión 4: Datos de demostración protegidos

**Decisión**: El seed solo permite PostgreSQL local (`localhost`, loopback IPv4/IPv6) con `NODE_ENV=development`, no sobrescribe contraseñas, no borra datos y usa marcas de demostración.  
**Motivo**: Permite preparar una cuenta integral en desarrollo sin tocar registros institucionales o producción.  
**Alternativa descartada**: Ejecutar seeds contra cualquier URL configurada en `.env` o eliminar/recrear tablas.

## Decisión 5: Evidencia de navegador reproducible

**Decisión**: Extender/reutilizar `server/scripts/verificar-integral.cjs` y registrar CP01–CP14 con éxito solo tras ejecutar los pasos. Las capturas se limitan a las vistas necesarias y no incluyen secretos.  
**Motivo**: El repositorio ya contiene un flujo Playwright/Chrome y evidencia de Doctorado; duplicar una segunda infraestructura de browser sería innecesario.

## Hallazgo causal a verificar

El asistente puede recibir una sola matrícula de `req.usuario.estudiante`, aunque el endpoint de opciones ahora consulta una colección `req.usuario.estudiantes`. La creación debe enviar tanto `tipoTramite` como `programaId` y el middleware de autenticación debe cargar todas las matrículas con sus programas. El plan comprueba los tres puntos en código y mediante CP02–CP05, sin asumir que un solo fragmento explica cada entorno.

## Supuestos

- Las migraciones existentes de specs 018/020/021 son la fuente de decisiones anteriores; se preservan sus datos y tablas.
- Si el PostgreSQL local no está disponible, no se ejecuta una alternativa que escriba en `sigep_test` ni se informa como seed exitoso.
- Las pruebas del navegador pueden crear expedientes de demostración nuevos; la ejecución guardará sus IDs en el artefacto local de evidencia.
