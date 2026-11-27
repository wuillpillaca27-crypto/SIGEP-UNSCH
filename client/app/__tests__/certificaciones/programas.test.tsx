import { expect, it } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import ProgramasAcademicos from "@/app/mis-tramites/programas/programas";

it("muestra las matrículas, habilita la solicitud solo cuando corresponde y enlaza al expediente del programa", async () => {
  const fechas = { fechaInicio: "2026-01-05T00:00:00.000Z", fechaFin: null };
  server.use(
    http.get("*/api/sigep/solicitudes/opciones", () => HttpResponse.json({ matriculas: [
      { ...fechas, id: 2, matriculaId: 21, nombre: "Doctorado de prueba", tipo: "doctorado", codigoUniv: "TEST-D",
        estadoAcad: "activo", motivo: null, tramites: [{ clave: "doctor", nombre: "Grado de Doctor",
          requisitos: [{ id: 5, nombre: "PDF de prueba", descripcion: "Documento de prueba", obligatorio: true }] }] },
      { ...fechas, id: 3, matriculaId: 22, nombre: "Maestría de prueba", tipo: "maestria", codigoUniv: "TEST-M",
        estadoAcad: "suspendido", motivo: "matricula_no_habilitada", tramites: [] },
    ] })),
    http.get("*/api/sigep/solicitudes", () => HttpResponse.json([
      { id: 70, programa: { id: 2 }, presentadoEn: "2026-06-01T00:00:00.000Z" },
    ])),
  );
  render(<ProgramasAcademicos />);
  const doctorado = within((await screen.findByRole("heading", { name: "Doctorado de prueba" })).closest("article")!);
  expect(doctorado.getByRole("link", { name: "Iniciar solicitud" })).toHaveAttribute(
    "href", "/grados-titulos/iniciar-solicitud?tramite=doctor&programa=2",
  );
  expect(doctorado.getByRole("link", { name: "Consultar expediente" })).toHaveAttribute("href", "/mis-tramites/expedientes#expediente-70");
  expect(doctorado.getByText("Requisitos publicados (1)")).toBeInTheDocument();
  const maestria = within(screen.getByRole("heading", { name: "Maestría de prueba" }).closest("article")!);
  expect(maestria.getByText("Matrícula sin habilitación para solicitudes")).toBeInTheDocument();
  expect(maestria.queryByRole("link", { name: "Iniciar solicitud" })).not.toBeInTheDocument();
});
