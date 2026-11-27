import { expect, it } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import Seguimiento from "@/app/mis-tramites/expedientes/seguimiento";

const solicitudes = Array.from({ length: 12 }, (_, indice) => {
  const doctor = indice % 2 === 0;
  return {
    id: indice + 1, codigo: `SIGEP-${String(indice + 1).padStart(3, "0")}`, estado: "presentado",
    tipoTramite: doctor ? "grado_doctor" : "certificado_diplomado", creadoEn: `2026-10-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`,
    actualizadoEn: `2026-10-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`, presentadoEn: `2026-10-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`,
    observaciones: null, programa: { id: doctor ? 1 : 2, nombre: doctor ? "Doctorado de prueba" : "Diplomado de prueba" },
    documentos: [], validaciones: [], historial: [{ id: indice + 1, estadoDespues: "presentado", creadoEn: `2026-10-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`, motivo: null }],
  };
});

it("filtra solicitudes por trámite y pagina los resultados propios", async () => {
  server.use(http.get("*/api/sigep/solicitudes", () => HttpResponse.json(solicitudes)));
  render(<Seguimiento vista="solicitudes" />);

  expect(await screen.findByText(/SIGEP-012/)).toBeInTheDocument();
  const tipo = screen.getByLabelText("Filtrar por tipo");
  fireEvent.change(tipo, { target: { value: "certificado_diplomado" } });
  expect(screen.getByText(/SIGEP-012/)).toBeInTheDocument();
  expect(screen.queryByText(/SIGEP-011/)).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Paginación de trámites" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
  const paginacion = await screen.findByRole("navigation", { name: "Paginación de trámites" });
  fireEvent.click(within(paginacion).getByRole("button", { name: "Página siguiente" }));
  expect(within(paginacion).getByText(/Página 2 de 2/)).toBeInTheDocument();
  expect(screen.getByText(/SIGEP-002/)).toBeInTheDocument();
  expect(screen.queryByText(/SIGEP-012/)).not.toBeInTheDocument();
});
