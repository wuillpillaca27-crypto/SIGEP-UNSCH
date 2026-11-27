import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { File as NodeFile } from "node:buffer";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import AsistenteCertificacion from "@/app/grados-titulos/iniciar-solicitud/asistente";
import { solicitudes } from "@/app/grados-titulos/solicitudes-api";

const mockReplace = jest.fn();

const perfil = {
  nombres: "Ana", apellidos: "Estudiante", dni: "12345678", email: "ana@test.invalid", rol: "estudiante",
  estudiante: { codigoUniv: "TEST-1", programa: { id: 7, nombre: "Diplomado de prueba", tipo: "diplomado" } },
};
const opciones = {
  programas: [{
    id: 7, nombre: "Diplomado de prueba", tipo: "diplomado", activo: true,
    tramites: [{ clave: "diplomados", nombre: "Diplomados de Posgrado", tipoTramite: "certificado_diplomado", requisitos: [
      { id: 11, nombre: "PDF de prueba", descripcion: "Fixture local.", tipo: "documental", obligatorio: true, versionNorm: "TEST" },
    ] }],
  }],
  programaRegistrado: { id: 7, nombre: "Diplomado de prueba", tipo: "diplomado", activo: true },
  motivo: null,
};

describe("Asistente de certificación", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/certificaciones/iniciar-solicitud?tramite=diplomados");
  });

  it("redirige al login preservando la solicitud si la sesión venció", async () => {
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: false, estadoHttp: 401, error: "Inicia sesión nuevamente" });
    jest.spyOn(solicitudes, "opciones");
    render(<AsistenteCertificacion seleccion="diplomados" navegar={mockReplace} />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(
      "/login?continuar=%2Fcertificaciones%2Finiciar-solicitud%3Ftramite%3Ddiplomados",
    ));
    expect(solicitudes.opciones).not.toHaveBeenCalled();
  });

  it("conserva el trámite de Doctorado al enviar al visitante al login", async () => {
    window.history.replaceState({}, "", "/grados-titulos/iniciar-solicitud?tramite=doctor");
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: false, estadoHttp: 401, codigo: "SESION_AUSENTE" });
    render(<AsistenteCertificacion seleccion="doctor" navegar={mockReplace} />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(
      "/login?continuar=%2Fgrados-titulos%2Finiciar-solicitud%3Ftramite%3Ddoctor",
    ));
  });

  it("busca Doctorado entre todas las matrículas y ofrece solo programas compatibles", async () => {
    const requisito = opciones.programas[0].tramites[0].requisitos;
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: true, datos: perfil });
    jest.spyOn(solicitudes, "opciones").mockResolvedValue({ ok: true, datos: {
      ...opciones,
      programas: [
        ...opciones.programas,
        { id: 8, nombre: "Doctorado A", tipo: "doctorado", activo: true,
          tramites: [{ clave: "doctor", nombre: "Grado de Doctor", tipoTramite: "grado_doctor", requisitos: requisito }] },
        { id: 9, nombre: "Doctorado B", tipo: "doctorado", activo: true,
          tramites: [{ clave: "doctor", nombre: "Grado de Doctor", tipoTramite: "grado_doctor", requisitos: requisito }] },
      ],
    } });
    render(<AsistenteCertificacion seleccion="doctor" programaInicial="9" navegar={mockReplace} />);
    await screen.findByRole("heading", { name: "Datos personales" });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    const selector = screen.getByLabelText("Programa académico");
    expect(selector).toHaveValue("9");
    expect(screen.getByRole("option", { name: "Doctorado A" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: opciones.programas[0].nombre })).not.toBeInTheDocument();
  });

  it("exige seleccionar explícitamente cuando hay varias matrículas compatibles", async () => {
    const requisito = opciones.programas[0].tramites[0].requisitos;
    const doctorados = [8, 9].map((id) => ({
      id, nombre: `Doctorado ${id}`, tipo: "doctorado", activo: true,
      tramites: [{ clave: "doctor", nombre: "Grado de Doctor", tipoTramite: "grado_doctor", requisitos: requisito }],
    }));
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: true, datos: perfil });
    jest.spyOn(solicitudes, "opciones").mockResolvedValue({ ok: true, datos: { ...opciones, programas: doctorados } });
    render(<AsistenteCertificacion seleccion="doctor" navegar={mockReplace} />);
    await screen.findByRole("heading", { name: "Datos personales" });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    const selector = screen.getByLabelText("Programa académico");
    expect(selector).toHaveValue("");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    fireEvent.change(selector, { target: { value: "9" } });
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("reintenta una conexión fallida y vuelve al login si no hay sesión", async () => {
    jest.spyOn(solicitudes, "perfil")
      .mockResolvedValueOnce({ ok: false, error: "No se pudo conectar con el servidor" })
      .mockResolvedValueOnce({ ok: false, estadoHttp: 401 });
    render(<AsistenteCertificacion seleccion="diplomados" navegar={mockReplace} />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar conexión" }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(
      "/login?continuar=%2Fcertificaciones%2Finiciar-solicitud%3Ftramite%3Ddiplomados",
    ));
  });

  it("distingue una sesión válida sin matrícula de una sesión ausente", async () => {
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: true, datos: { ...perfil, estudiante: null } });
    jest.spyOn(solicitudes, "opciones").mockResolvedValue({ ok: true, datos: {
      programas: [], programaRegistrado: null, motivo: "sin_matricula",
    } });
    render(<AsistenteCertificacion seleccion="maestro" navegar={mockReplace} />);
    expect(await screen.findByText(/no tiene una matrícula de estudiante vinculada/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solicitar orientación" })).toHaveAttribute("href", "/ayuda");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it.each([
    ["maestro", "maestria", "grado_maestro", "Grado de Maestro"],
    ["doctor", "doctorado", "grado_doctor", "Grado de Doctor"],
    ["segunda-especialidad", "segunda_especialidad", "titulo_segunda_especialidad", "Título de Segunda Especialidad"],
    ["modulos", "certificacion_modulos", "certificacion_modulos", "Certificaciones por Módulos"],
  ])("muestra el trámite %s y los datos del titular", async (clave, tipo, tipoTramite, nombre) => {
    const programa = { id: 7, nombre: "Programa de prueba", tipo, activo: true };
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: true, datos: {
      ...perfil, estudiante: { ...perfil.estudiante, programa },
    } });
    jest.spyOn(solicitudes, "opciones").mockResolvedValue({ ok: true, datos: {
      programas: [{ ...programa, tramites: [{ clave, nombre, tipoTramite, requisitos: opciones.programas[0].tramites[0].requisitos }] }],
      programaRegistrado: programa, motivo: null,
    } });
    render(<AsistenteCertificacion seleccion={clave} navegar={mockReplace} />);
    expect(await screen.findByRole("heading", { name: "Datos personales" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByLabelText("Trámite disponible")).toHaveValue(tipoTramite);
  });

  it("explica que la matrícula no corresponde a un programa certificable y ofrece ayuda", async () => {
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: true, datos: perfil });
    jest.spyOn(solicitudes, "opciones").mockResolvedValue({ ok: true, datos: {
      programas: [{ id: 7, nombre: "Maestría de prueba", tipo: "maestria", activo: true, tramites: [{ clave: "maestro", nombre: "Grado de Maestro", tipoTramite: "grado_maestro", requisitos: [] }] }], programaRegistrado: { id: 7, nombre: "Maestría de prueba", tipo: "maestria", activo: true }, motivo: null,
    } });
    render(<AsistenteCertificacion seleccion="diplomados" navegar={mockReplace} />);
    expect(await screen.findByText(/Tu programa registrado es Maestría de prueba/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solicitar orientación" })).toHaveAttribute("href", "/ayuda");
  });

  it("presenta los cinco pasos y crea un borrador del programa seleccionado", async () => {
    jest.spyOn(solicitudes, "perfil").mockResolvedValue({ ok: true, datos: perfil });
    jest.spyOn(solicitudes, "opciones").mockResolvedValue({ ok: true, datos: opciones });
    const borrador = {
      id: 33, codigo: "SIGEP-TEST", estado: "borrador", tipoTramite: "certificado_diplomado", presentadoEn: null,
      observaciones: null, programa: { nombre: "Diplomado de prueba" }, documentos: [],
      validaciones: [{ id: 44, estado: "pendiente", observacion: null, plantilla: opciones.programas[0].tramites[0].requisitos[0] }], historial: [],
    };
    jest.spyOn(solicitudes, "crear").mockResolvedValue({ ok: true, datos: borrador });
    render(<AsistenteCertificacion seleccion="diplomados" navegar={mockReplace} />);
    expect(await screen.findByRole("heading", { name: "Datos personales" })).toBeInTheDocument();
    expect(screen.getByText(perfil.dni)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByLabelText("Programa académico")).toHaveValue("7");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(solicitudes.crear).toHaveBeenCalledWith("certificado_diplomado", 7));
    expect(await screen.findByRole("heading", { name: "Requisitos académicos" })).toBeInTheDocument();
    expect(screen.getByText("PDF de prueba")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(await screen.findByText(/Borrador guardado/)).toBeInTheDocument();
    const conDocumento = { ...borrador, documentos: [{ id: 50, nombre: "PDF de prueba", tipoDoc: "11" }] };
    server.use(http.put("*/api/sigep/solicitudes/33/documentos/11", () => HttpResponse.json(conDocumento)));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText(/Adjunta los PDF solicitados/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/PDF de prueba · Pendiente/), {
      target: { files: [new NodeFile(["%PDF-1.7\n%%EOF"], "requisito.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() => expect(screen.getByText(/PDF de prueba · Adjunto/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Confirma tu solicitud")).toBeInTheDocument();
    jest.spyOn(solicitudes, "presentar").mockResolvedValue({ ok: true, datos: { ...conDocumento, estado: "presentado", presentadoEn: "2026-11-26T12:00:00.000Z" } });
    fireEvent.click(screen.getByRole("button", { name: "Presentar solicitud" }));
    expect(await screen.findByText(/Solicitud presentada\. Expediente/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultar expediente en Mis Trámites" })).toHaveAttribute("href", "/mis-tramites/expedientes#expediente-33");
  });
});
