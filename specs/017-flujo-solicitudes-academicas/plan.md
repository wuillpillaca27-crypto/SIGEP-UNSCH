# Plan técnico
Reutilizar PostgreSQL, Prisma, la cookie de sesión, los expedientes y el catálogo público. Generalizar las opciones autenticadas y el asistente de Certificaciones. Conservar el contrato anterior de Certificaciones. Validar el retorno de Google en el servidor y guardarlo en la transacción OAuth firmada. Conservar una matrícula por estudiante según el modelo vigente.
Probar catálogo público, retorno, permisos, elegibilidad, PDF, borrador y seguimiento. Ejecutar Jest con cobertura en ambas capas y compilar Next.js.
Reiniciar la consulta inicial desde el propio asistente ante fallos de servicio. Conservar la redirección inmediata al login cuando la API responde 401.
Conservar el estado HTTP incluso cuando el proxy no devuelve JSON. Diagnosticar el acceso a PostgreSQL mediante una consulta de disponibilidad y actualizar el arranque local para usar las migraciones vigentes.
