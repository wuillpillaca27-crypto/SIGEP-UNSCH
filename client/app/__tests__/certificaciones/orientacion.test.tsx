import { expect, it } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import Orientacion from "@/app/grados-titulos/orientacion";

it("filtra requisitos por nombre o descripción y mantiene visibles los documentos", async () => {
  server.use(
    http.get("*/api/sigep/catalogo-grados/certificado_diplomado", () => HttpResponse.json({
      datos: [{ id: 1, nombre: "Diplomado A" }, { id: 2, nombre: "Diplomado B" }],
    })),
    http.get("*/api/sigep/catalogo-grados/certificado_diplomado/1", () => HttpResponse.json({
      requisitos: [
        { id: 1, nombre: "Créditos", descripcion: "Avance del programa", tipo: "academico", obligatorio: true, versionNorm: "v1" },
        { id: 2, nombre: "Tesis", descripcion: "Acreditación de idiomas", tipo: "academico", obligatorio: true, versionNorm: "v1" },
        { id: 3, nombre: "PDF obligatorio", tipo: "documental", obligatorio: true, versionNorm: "v1" },
        { id: 4, nombre: "PDF opcional", tipo: "documental", obligatorio: false, versionNorm: "v1" },
      ],
      fuente: "Fuente de prueba", costos: "Costo aprobado de prueba",
      formatos: [{ nombre: "Formato oficial de prueba", url: "https://ejemplo.invalid/formato.pdf" }],
    })),
    http.get("*/api/sigep/catalogo-grados/certificado_diplomado/2", () => HttpResponse.json({ requisitos: [], demostracion: true })),
  );
  render(<Orientacion inicial="diplomados" seccion="certificaciones" />);
  await screen.findByRole("option", { name: "Diplomado A" });
  const buscarPrograma = screen.getByRole("searchbox", { name: "Buscar programa" });
  fireEvent.change(buscarPrograma, { target: { value: "diplomado b" } });
  expect(screen.getByRole("option", { name: "Diplomado B" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Diplomado A" })).not.toBeInTheDocument();
  fireEvent.change(buscarPrograma, { target: { value: "sin coincidencia" } });
  expect(screen.getByText("No hay programas para esta búsqueda.")).toBeInTheDocument();
  fireEvent.change(buscarPrograma, { target: { value: "" } });
  const programa = screen.getByRole("combobox", { name: "Programa académico" });
  const buscar = screen.getByRole("searchbox", { name: "Buscar requisitos" });
  fireEvent.change(programa, { target: { value: "1" } });
  await screen.findByText("Créditos");
  expect(buscar).toHaveValue("");
  expect(screen.getByText("Tesis")).toBeInTheDocument();
  fireEvent.change(buscar, { target: { value: "creditos" } });
  expect(screen.getByText("Créditos")).toBeInTheDocument();
  expect(screen.queryByText("Tesis")).not.toBeInTheDocument();
  fireEvent.change(buscar, { target: { value: "acreditacion" } });
  expect(screen.getByText("Tesis")).toBeInTheDocument();
  expect(screen.queryByText("Créditos")).not.toBeInTheDocument();
  fireEvent.change(buscar, { target: { value: "sin resultados" } });
  expect(screen.getByText(/no hay resultados/i)).toBeInTheDocument();
  const documentos = within(screen.getByRole("region", { name: "Documentos necesarios" }));
  expect(documentos.getByText("PDF obligatorio")).toBeInTheDocument();
  expect(documentos.getByText("PDF opcional")).toBeInTheDocument();
  expect(documentos.getByRole("link", { name: "Formato oficial de prueba" })).toHaveAttribute("href", "https://ejemplo.invalid/formato.pdf");
  expect(screen.getByRole("link", { name: "Iniciar solicitud" })).toHaveAttribute("href", "/certificaciones/iniciar-solicitud?tramite=diplomados");
  fireEvent.change(programa, { target: { value: "2" } });
  expect(buscar).toHaveValue("");
  expect(await screen.findByText("Programa de demostración.")).toBeInTheDocument();
  expect(screen.queryByText("Costos autorizados")).not.toBeInTheDocument();
});
