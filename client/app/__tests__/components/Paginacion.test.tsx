import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import Paginacion from "@/app/components/ui/Paginacion";

describe("Paginacion", () => {
  it("no muestra controles con cero o una página", () => {
    const { rerender } = render(
      <Paginacion paginaActual={1} total={0} porPagina={10} onChange={jest.fn()} />,
    );
    expect(screen.queryByRole("navigation", { name: "Paginación" })).not.toBeInTheDocument();

    rerender(<Paginacion paginaActual={1} total={10} porPagina={10} onChange={jest.fn()} />);
    expect(screen.queryByRole("navigation", { name: "Paginación" })).not.toBeInTheDocument();
  });

  it("marca la página actual y habilita/deshabilita los límites", () => {
    render(<Paginacion paginaActual={2} total={30} porPagina={10} onChange={jest.fn()} />);

    expect(screen.getByRole("navigation", { name: "Paginación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeEnabled();
  });

  it("notifica los cambios de página y deshabilita los extremos", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <Paginacion paginaActual={1} total={25} porPagina={10} onChange={onChange} />,
    );
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onChange).toHaveBeenCalledWith(3);

    rerender(<Paginacion paginaActual={3} total={25} porPagina={10} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
  });
});
