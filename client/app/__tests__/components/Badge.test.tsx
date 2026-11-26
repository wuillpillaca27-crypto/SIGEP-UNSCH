import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Badge from "@/app/components/ui/Badge";

describe("Badge", () => {
  it.each([
    ["en_revision", "En revisión", "badge-revision"],
    ["aprobado", "Aprobado", "badge-aprobado"],
    ["rechazado", "Rechazado", "badge-rechazado"],
  ] as const)("muestra el estado %s con su etiqueta y clase", (estado, etiqueta, clase) => {
    render(<Badge estado={estado} />);

    expect(screen.getByText(etiqueta)).toHaveClass("badge", clase);
  });
});
