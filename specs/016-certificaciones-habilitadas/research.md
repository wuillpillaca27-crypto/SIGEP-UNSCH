# Investigación: Certificaciones habilitadas

## Decisiones

- **La elegibilidad se deriva de la matrícula de la sesión.** La entidad `Estudiante` tiene una relación única `usuarioId` y una sola `programaId`; no hay asociación estudiante-programas múltiples.
- **Un programa solo habilita su certificación correspondiente cuando está activo y tiene plantillas activas del tipo de trámite correspondiente.** La lista pública por tipo no autoriza por sí sola a un estudiante a iniciar el trámite.
- **Se crea un recurso autenticado de opciones para la UI.** Devuelve solo el programa de la matrícula y diferencia los motivos de no disponibilidad; el endpoint de creación vuelve a validar los datos.
- **Certificaciones usa un asistente separado.** El componente actual de Grados y Títulos solo muestra datos personales en el paso uno, cruza el tipo del único programa del perfil con opciones estáticas y emite el mensaje genérico cuando no coincide. Separar la UI evita cambios de comportamiento en Grados y Títulos.
- **La sesión se consulta en el servidor antes de cargar opciones.** Un 401 redirige a `/login?continuar=...`; el login existente ya admite como destino de retorno la ruta de solicitud de Certificaciones.
- **La falta de oferta no se arregla creando datos.** El catálogo activo del PostgreSQL local analizado no contiene una oferta oficial de certificación. Solo aparece el programa de maestría de demostración asociado a la cuenta de prueba creada anteriormente; es dato de desarrollo y no califica para Certificaciones.
- **No se requiere migración ni actualización arquitectónica.** Se usan las relaciones y las tablas de programas, requisitos, solicitudes, validaciones, documentos e historial existentes.

## Alternativas consideradas

- **Listar todos los programas activos del catálogo en el asistente**: descartado porque permitiría elegir programas sin relación con la matrícula de la identidad actual.
- **Aceptar el tipo de trámite enviado por el navegador sin validar**: descartado porque elimina el control de autorización del servidor.
- **Habilitar un programa de prueba como oferta real**: descartado por falta de fuente institucional y por la instrucción explícita de no inventar programas.
- **Añadir relación de múltiples matrículas**: diferido; requeriría una decisión de dominio, una migración y asignaciones oficiales que no existen en el alcance actual.
