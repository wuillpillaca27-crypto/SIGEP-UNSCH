# Investigación: documentación Markdown y diagramas Mermaid

## Decisiones

### Markdown como formato de entrega

- **Decisión**: Entregar los 19 artefactos como archivos Markdown en sus rutas especificadas.
- **Justificación**: Cumple FR-001, permite revisar cambios en Git y ofrece lectura directa en GitHub sin instalar herramientas.
- **Alternativas consideradas**: HTML o formatos de oficina. No se eligen porque la especificación exige archivos `.md` y diagramas Mermaid integrados.

### Mermaid `flowchart` para los cuatro diagramas

- **Decisión**: Cada documento C4 contendrá un bloque cercado con el identificador `mermaid` y sintaxis `flowchart` básica.
- **Justificación**: GitHub renderiza diagramas Mermaid incluidos en Markdown; la documentación de Mermaid define la sintaxis flowchart. Mantener la sintaxis básica reduce incompatibilidades y satisface la restricción explícita de la solicitud.
- **Alternativas consideradas**: PlantUML, imágenes estáticas o una dependencia CLI de Mermaid. Se descartan porque no son necesarias para el alcance y agregarían formatos o dependencias no solicitados.
- **Verificación**: Abrir cada archivo C4 en la vista previa Markdown de GitHub y confirmar que el bloque se presenta como diagrama, no como texto de código. Si hubiera un problema de sintaxis, la documentación oficial de GitHub sugiere validarla en Mermaid Live Editor.

## Fuentes consultadas

- GitHub Docs, [Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams): soporte de diagramas Mermaid en Markdown de GitHub.
- Mermaid Docs, [Flowcharts](https://mermaid.js.org/syntax/flowchart.html): sintaxis de diagramas flowchart.
- GitHub Docs, [Working with non-code files](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files): lectura y vista previa de archivos en el repositorio.

La recomendación es mantener los diagramas C4 autocontenidos en sus respectivos documentos y revisar su renderizado en el entorno de destino. No se requiere investigación adicional de tecnologías de implementación porque la entrega no cambia el sistema ni selecciona dependencias.
