// Tabla genérica reutilizable
interface Columna<T> {
  clave: keyof T | string;
  encabezado: string;
  render?: (fila: T) => React.ReactNode;
}

interface Props<T> {
  columnas: Columna<T>[];
  datos: T[];
  etiqueta?: string; // aria-label
  sinDatos?: string;
}

export default function Tabla<T extends { id: number }>({
  columnas,
  datos,
  etiqueta = "Tabla de datos",
  sinDatos = "No hay registros",
}: Props<T>) {
  return (
    <div className="tabla-wrap" role="region" aria-label={etiqueta} tabIndex={0}>
      <table className="exp-table" aria-label={etiqueta}>
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={String(col.clave)}>{col.encabezado}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="tabla-vacia">
                {sinDatos}
              </td>
            </tr>
          ) : (
            datos.map((fila) => (
              <tr key={fila.id}>
                {columnas.map((col) => (
                  <td key={String(col.clave)}>
                    {col.render
                      ? col.render(fila)
                      : String((fila as Record<string, unknown>)[String(col.clave)] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
