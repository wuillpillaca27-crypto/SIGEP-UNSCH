# Modelo de datos del workflow

La funcionalidad no introduce datos de dominio ni almacenamiento persistente. Los elementos siguientes representan la información que GitHub Actions produce durante una ejecución.

## Ejecución de CI

- **Atributos**: evento que la inicia (`push` o `pull_request`), revisión validada y estado global.
- **Relación**: agrupa los jobs `server` y `client` en una ejecución.
- **Regla**: el resultado de un job no bloquea el inicio del otro.

## Job de paquete

- **Atributos**: paquete (`server` o `client`), versión de Node, resultado de instalación, resultado Jest y ruta de cobertura.
- **Reglas**: usa el lockfile dentro del directorio del paquete; ambos jobs usan Node 24; el job termina fallido cuando falla instalación o pruebas.
- **Relación**: un job puede producir un artefacto de cobertura del paquete.

## Artefacto de cobertura

- **Atributos**: nombre identificador del paquete y archivos del reporte generado desde `coverage/`.
- **Reglas**: un artefacto independiente para cada paquete cuando existe salida de cobertura; se intenta subir después de un fallo de Jest si la salida existe.
- **Relación**: pertenece a un job y a su ejecución de CI.
