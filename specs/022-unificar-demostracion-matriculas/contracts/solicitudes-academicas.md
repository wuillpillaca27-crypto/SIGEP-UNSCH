# Contratos: solicitudes con selección de matrícula

Las rutas se consumen bajo el prefijo de API existente (`/api/sigep` en Next.js local); Express conserva `/api/solicitudes`.

## `GET /solicitudes/opciones`

Requiere sesión de estudiante. Devuelve las matrículas propias con programa, tipo, fechas, estado, elegibilidad y trámites publicados.

```json
{
  "programas": [{
    "id": 8,
    "nombre": "Doctorado de demostración",
    "tipo": "doctorado",
    "matriculaId": 24,
    "codigoUniv": "DEMO-INTEGRAL-2",
    "motivo": null,
    "tramites": [{
      "clave": "doctor",
      "nombre": "Grado de Doctor",
      "tipoTramite": "grado_doctor",
      "requisitos": [{ "id": 31, "nombre": "PDF de prueba", "tipo": "documental", "obligatorio": true }]
    }]
  }],
  "matriculas": [],
  "programaRegistrado": null,
  "motivo": null
}
```

`motivo` diferencia `sin_matricula`, `programa_inactivo`, `matricula_no_habilitada`, `tipo_no_certificable`, `tramite_deshabilitado`, `plantilla_no_publicada` y `sin_requisitos_activos`. No se retornan matrículas de otro usuario.

## `POST /solicitudes`

Requiere sesión de estudiante. Cuerpo: `{ "tipoTramite": "grado_doctor", "programaId": 8 }`. `programaId` debe pertenecer a una matrícula elegible del titular; el backend deriva compatibilidad de `Programa.tipo`, vuelve a comprobar elegibilidad y requisitos, y crea o retoma borrador asociado a la matrícula. Sin programaId solo se permite resolver automáticamente una única opción compatible. Los errores conservan status HTTP y mensaje específico.

## Operaciones del expediente

Las rutas existentes de `POST /solicitudes/:id/presentar`, `POST /solicitudes/:id/documentos/:plantilla`, `GET /solicitudes/:id/documentos/:documento`, `DELETE /solicitudes/:id/documentos/:documento`, `GET /solicitudes/:id/constancia`, `GET /solicitudes` y las operaciones de desistimiento/consulta mantienen autenticación, ownership y estado del borrador. Ninguna ruta acepta IDs de matrícula ajenos ni vuelve público un documento.

## Errores esperados

| Situación | Resultado |
|---|---|
| Sin sesión | HTTP 401 |
| Rol distinto de estudiante en opciones/creación | HTTP 403 |
| Tipo no reconocido o programa de otra matrícula | HTTP 422 |
| Matrícula o trámite ya no elegible al crear/presentar | HTTP 409 |
| Solicitud/documento ajeno o inexistente | HTTP 404 |
| Error de red | El cliente preserva el borrador y muestra aviso recuperable |
