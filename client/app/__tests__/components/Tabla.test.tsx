import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Tabla from "@/app/components/ui/Tabla";

describe("Tabla", () => {
  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "activo", encabezado: "Estado", render: (fila: { id: number; nombre: string; activo: boolean }) => fila.activo ? "Activo" : "Inactivo" },
  ];

  it("muestra encabezados, valores y contenido personalizado con nombre accesible", () => {
    render(
      <Tabla
        etiqueta="Listado de usuarios"
        columnas={columnas}
        datos={[{ id: 1, nombre: "Ana", activo: true }]}
      />,
    );

    const region = screen.getByRole("region", { name: "Listado de usuarios" });
    const tabla = within(region).getByRole("table", { name: "Listado de usuarios" });
    expect(within(tabla).getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(within(tabla).getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(within(tabla).getByRole("cell", { name: "Activo" })).toBeInTheDocument();
  });

  it("muestra el mensaje configurado cuando no hay registros", () => {
    render(<Tabla columnas={columnas} datos={[]} sinDatos="Sin usuarios" />);

    expect(screen.getByRole("region", { name: "Tabla de datos" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Sin usuarios" })).toHaveAttribute("colspan", "2");
  });
});
