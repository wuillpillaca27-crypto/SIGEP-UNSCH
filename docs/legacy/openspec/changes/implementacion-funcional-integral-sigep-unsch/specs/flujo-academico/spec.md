## ADDED Requirements
### Requirement: Flujo integral de demostración
El sistema SHALL permitir solicitar los cinco trámites de demostración desde una cuenta con matrículas compatibles en un entorno autorizado.
#### Scenario: Adjuntos y acuse
- **WHEN** el titular retira un PDF de un borrador y presenta después de completar los requisitos
- **THEN** el expediente conserva la auditoría del retiro y ofrece el acuse al titular autenticado
### Requirement: Orientación rastreable
El sistema SHALL guardar la consulta y su respuesta, y limitar la vista pública al código y correo registrados.
#### Scenario: Respuesta autorizada
- **WHEN** un operador publica una respuesta
- **THEN** el solicitante puede leerla usando su código y correo
