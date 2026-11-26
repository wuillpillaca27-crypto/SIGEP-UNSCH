# Contrato: opciones de certificación del estudiante autenticado

## `GET /api/solicitudes/opciones-certificacion`

Requiere cookie de sesión válida. La respuesta se construye desde la matrícula del titular autenticado, no desde un `programaId` del cliente.

### Respuesta 200

```json
{
  "programas": [
    {
      "id": 12,
      "nombre": "Programa registrado",
      "tipo": "diplomado",
      "activo": true,
      "certificaciones": [
        {
          "clave": "diplomados",
          "nombre": "Diplomados de Posgrado",
          "tipoTramite": "certificado_diplomado",
          "requisitos": [
            {
              "id": 41,
              "nombre": "Documento de prueba",
              "descripcion": "Ejemplo de contrato",
              "tipo": "documental",
              "obligatorio": true,
              "versionNorm": "TEST"
            }
          ]
        }
      ]
    }
  ],
  "programaRegistrado": {
    "id": 12,
    "nombre": "Programa registrado",
    "tipo": "diplomado",
    "activo": true
  },
  "motivo": null
}
```

`programas` contiene como máximo el programa asociado a la matrícula vigente. `requisitos` representa los requisitos activos asociados al mismo programa y trámite. Si no hay opciones, devuelve `programas: []` y uno de estos motivos: `sin_matricula`, `programa_inactivo`, `tipo_no_certificable` o `sin_requisitos_activos`.

### Errores

- `401`: sesión ausente, vencida o inválida.
- `403`: cuenta autenticada que no tiene rol de estudiante.

## `POST /api/solicitudes`

Se conserva el contrato existente. El cliente puede enviar `programaId` junto con `tipoTramite`; el servidor exige que coincida con el programa de la sesión. La creación sigue comprobando rol de estudiante, programa activo, tipo correspondiente y al menos una plantilla activa. Los borradores existentes de ese titular/programa/trámite se devuelven de forma idempotente.

- `422`: programa o tipo no coincidente con la matrícula.
- `409`: el programa no tiene catálogo de requisitos activo.
- `401` / `403`: conserva los controles de autenticación y rol.

La carga de documentos y la presentación de un borrador de certificación devuelven `409` si la matrícula, el programa o el catálogo ya no autorizan el trámite.
