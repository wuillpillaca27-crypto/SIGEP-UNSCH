# Tareas

## 1. Orientación pública

- [x] 1.1 Crear las tres rutas académicas y la ruta de requisitos con componentes compartidos, selector, búsqueda, etapas y preguntas frecuentes. Actualizar destinos del menú sin cambiar estilos.
- [x] 1.2 Implementar el catálogo público de programas, plantillas, documentación y datos oficiales, con estados de carga, error y publicación pendiente.

## 2. Solicitud y seguimiento

- [x] 2.1 Habilitar la API Express sobre Prisma y conectar identidad activa, perfil, sesión y roles con la interfaz.
- [x] 2.2 Implementar la quinta ruta con asistente de cuatro pasos, persistencia de borradores, validación por programa y presentación transaccional.
- [x] 2.3 Implementar subida, vista y reemplazo de archivos privados, con controles de formato, tamaño y autorización.
- [x] 2.4 Integrar expedientes, historial, próxima acción, avisos y subsanaciones en Mis Trámites.

## 3. Administración y verificación

- [x] 3.1 Conectar revisión, validación, observaciones, aprobación, reportes y auditoría con roles y transiciones explícitas.
- [x] 3.2 Ejecutar las pruebas disponibles y verificar en entorno local las cinco rutas, navegación móvil y de teclado, borradores, documentos, presentación repetida, permisos, seguimiento y subsanación. Identificar las integraciones pendientes.

## Verificación

- Edge en escritorio y a 390 px verificó las cinco rutas, los destinos del menú, el selector de programa, el recorrido del asistente con PDF, la apertura de la vista del archivo, el registro y el expediente. La apertura de preguntas frecuentes con teclado se comprobó por separado.
- Dos pruebas de integración con SQLite temporal cubrieron el catálogo, sesión, borradores, validación de PDF, titularidad, presentación concurrente, subsanación, permisos administrativos, aprobación, auditoría y reporte.
- TypeScript y ESLint pasaron en los archivos del módulo. El lint general reportó seis errores preexistentes fuera del cambio. Prisma validó el esquema y generó el cliente. La migración nativa sigue pendiente en el entorno de despliegue.
