import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import CargandoSpinner from "@/app/components/ui/CargandoSpinner";

describe("CargandoSpinner", () => {
  it("expone el texto y el estado accesible predeterminados", () => {
    render(<CargandoSpinner />);
    const estado = screen.getByRole("status");

    expect(estado).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(estado.querySelector(".spinner")).toHaveAttribute("aria-hidden", "true");
  });

  it("muestra el texto personalizado", () => {
    render(<CargandoSpinner texto="Cargando expedientes" />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando expedientes");
  });
});
