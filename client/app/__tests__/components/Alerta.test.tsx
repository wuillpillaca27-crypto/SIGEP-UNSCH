import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Alerta from "@/app/components/ui/Alerta";

describe("Alerta", () => {
  it.each([
    ["exito", "alerta-exito"],
    ["error", "alerta-error"],
    ["advertencia", "alerta-advertencia"],
    ["info", "alerta-info"],
  ] as const)("muestra tipo %s con rol de alerta y su clase", (tipo, clase) => {
    render(<Alerta tipo={tipo} mensaje="Operación terminada" />);

    expect(screen.getByRole("alert")).toHaveClass("alerta", clase);
    expect(screen.getByRole("alert")).toHaveTextContent("Operación terminada");
  });

  it("usa info como tipo predeterminado", () => {
    render(<Alerta mensaje="Aviso" />);

    expect(screen.getByRole("alert")).toHaveClass("alerta-info");
  });
});
