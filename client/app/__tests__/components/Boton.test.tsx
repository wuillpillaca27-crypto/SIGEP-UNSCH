import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import Boton from "@/app/components/ui/Boton";

describe("Boton", () => {
  it.each([
    ["primario", "btn-rojo"],
    ["secundario", "btn-carbon"],
    ["peligro", "btn-peligro"],
    ["borde", "btn-borde-carbon"],
  ] as const)("aplica la variante %s", (variante, clase) => {
    render(<Boton variante={variante}>Guardar</Boton>);

    expect(screen.getByRole("button", { name: "Guardar" })).toHaveClass("btn", clase);
  });

  it("ejecuta la acción habilitada y no la ejecuta cuando está deshabilitado", () => {
    const onClick = jest.fn();
    const { rerender } = render(<Boton onClick={onClick}>Enviar</Boton>);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Boton onClick={onClick} disabled>Enviar</Boton>);
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("muestra el estado accesible de carga y deshabilita el botón", () => {
    render(<Boton cargando>Guardar</Boton>);
    const boton = screen.getByRole("button", { name: "Cargando…" });

    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");
  });
});
