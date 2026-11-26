# Modelo de datos: elegibilidad y solicitud de certificación

No se modifica el esquema. Este documento describe las entidades existentes usadas por el flujo.

## Cuenta (`Usuario`)

- `id`: identidad propietaria de la sesión.
- `rol`: solo una cuenta `estudiante` puede usar el asistente.
- `activo`: debe ser verdadero al autenticar.
- Relación `estudiante`: cero o un registro.

## Matrícula (`Estudiante`)

- `usuarioId`: relación única con la cuenta propietaria.
- `programaId`: relación con el programa matriculado. El modelo vigente representa un solo programa.
- `codigoUniv`: identificador académico de la matrícula.

## Programa (`Programa`)

- `id`, `nombre`, `tipo`, `activo`.
- Solo el programa de la matrícula autenticada es seleccionable.
- `tipo` solo habilita certificación si corresponde a `diplomado` o `certificacion_modulos`.

## Requisito (`PlantillaRequisito`)

- `programaId`: debe coincidir con el programa matriculado.
- `tipoTramite`: `certificado_diplomado` o `certificacion_modulos`, según el tipo de programa.
- `activo`: debe ser verdadero; cada requisito mostrado conserva su contenido y obligatoriedad registrados.
- La ausencia de una plantilla activa deshabilita la opción.

## Expediente (`Solicitud`)

- `usuarioId`, `estudianteId`, `programaId`, `tipoTramite`: se derivan y validan contra la sesión y matrícula del servidor.
- `estado`: el borrador se conserva y se presenta mediante las transiciones ya existentes.
- `codigo`, `validaciones`, `documentos` e `historial`: persisten el expediente y el seguimiento.
- Los documentos permanecen sujetos a validación PDF, límite de tamaño y autorización por titularidad.

## Regla de elegibilidad

| Programa matriculado | Tipo de trámite | Condiciones | Resultado |
|---|---|---|---|
| `diplomado` | `certificado_diplomado` | Programa activo y ≥1 plantilla activa correspondiente | Opción disponible |
| `certificacion_modulos` | `certificacion_modulos` | Programa activo y ≥1 plantilla activa correspondiente | Opción disponible |
| Otro tipo o programa inactivo | Ninguno | Cualquier otro caso | No disponible con motivo explícito |

Una plantilla de otro programa o tipo no puede habilitar una solicitud.
