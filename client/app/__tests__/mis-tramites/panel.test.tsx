import { expect, it } from "@jest/globals";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import Panel from "@/app/mis-tramites/page";
import { PerfilEstudiante } from "@/app/mis-tramites/sesion";

it("calcula indicadores desde solicitudes propias y permite marcar notificaciones", async () => {
  const solicitud = {
    id: 9, codigo: "SIGEP-TEST-9", estado: "observado", tipoTramite: "grado_doctor", presentadoEn: "2026-10-10T12:00:00.000Z",
    observaciones: "Adjuntar corrección", programa: { id: 4, nombre: "Doctorado de prueba" },
    documentos: [{ id: 17, nombre: "Constancia", tipoDoc: "documento_emitido" }],
    validaciones: [{ id: 18, estado: "observado", observacion: "Firma pendiente", plantilla: { id: 2, nombre: "Firma", descripcion: "Firmar", tipo: "documental", obligatorio: true } }],
    historial: [{ id: 21, estadoDespues: "observado", creadoEn: "2026-10-11T12:00:00.000Z", motivo: "Revisar firma" }],
  };
  let marcadasTodas = false;
  server.use(
    http.get("*/api/sigep/solicitudes", () => HttpResponse.json([solicitud])),
    http.get("*/api/sigep/solicitudes/notificaciones", () => HttpResponse.json({
      datos: [
        { id: 3, solicitudId: 9, tipo: "observacion_registrada", mensaje: "Hay una observación", leida: false, creadoEn: "2026-10-11T12:00:00.000Z", leidaEn: null },
        { id: 4, solicitudId: 9, tipo: "estado_en_revision", mensaje: "Expediente en revisión", leida: false, creadoEn: "2026-10-12T12:00:00.000Z", leidaEn: null },
      ],
      noLeidas: marcadasTodas ? 0 : 2,
    })),
    http.patch("*/api/sigep/solicitudes/notificaciones/:id/leer", () => HttpResponse.json({ ok: true })),
    http.patch("*/api/sigep/solicitudes/notificaciones/leer-todas", () => {
      marcadasTodas = true;
      return HttpResponse.json({ actualizadas: 1 });
    }),
  );

  render(<PerfilEstudiante.Provider value={{ nombres: "Estudiante", apellidos: "Prueba", dni: "00000001", email: "estudiante@test.invalid", rol: "estudiante", estudiante: null }}>
    <Panel />
  </PerfilEstudiante.Provider>);

  expect(await screen.findByText("Actividad reciente")).toBeInTheDocument();
  const indicadorObservado = screen.getAllByText("Observaciones pendientes", { exact: true }).find((elemento) => elemento.closest("a"));
  expect(indicadorObservado?.closest("a")).toHaveTextContent("1");
  expect(screen.getByText("Hay una observación")).toBeInTheDocument();
  const fila = screen.getByText("Hay una observación").closest("li");
  fireEvent.click(within(fila!).getByRole("button", { name: "Marcar notificación como leída" }));
  await waitFor(() => expect(within(fila!).queryByRole("button", { name: "Marcar notificación como leída" })).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Marcar todas como leídas" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Marcar todas como leídas" })).not.toBeInTheDocument());
});
