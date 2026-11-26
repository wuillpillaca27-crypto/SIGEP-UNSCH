import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Campo from "@/app/components/ui/Campo";

describe("Campo", () => {
  it("asocia la etiqueta con el control e incluye el valor recibido", () => {
    render(<Campo id="correo" label="Correo electrónico" type="email" defaultValue="ana@example.test" />);

    const control = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(control).toHaveAttribute("id", "correo");
    expect(control).toHaveValue("ana@example.test");
    expect(control).not.toHaveAttribute("aria-describedby");
    expect(control).not.toHaveAttribute("aria-invalid");
  });

  it("aplica la clase de error y expone el mensaje como alerta", () => {
    render(<Campo id="dni" label="DNI" error="El DNI es obligatorio" />);

    expect(screen.getByRole("textbox", { name: "DNI" })).toHaveClass("campo-input", "campo-error");
    expect(screen.getByRole("alert")).toHaveTextContent("El DNI es obligatorio");
  });
});
