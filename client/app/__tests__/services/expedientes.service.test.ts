import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { expedientesService } from "@/app/services/expedientes.service";

describe("expedientesService", () => {
  it("mantiene filtros opcionales, rutas y cuerpos de sus operaciones", async () => {
    const solicitudes: Array<{ method: string; path: string; body: string }> = [];
    const datos = { resultado: "expedientes simulados" };
    server.use(
      http.all("*/api/sigep/*", async ({ request }) => {
        const url = new URL(request.url);
        solicitudes.push({
          method: request.method,
          path: url.pathname.replace("/api/sigep", "") + url.search,
          body: await request.text(),
        });
        return HttpResponse.json(datos);
      }),
    );
    const nuevo = { codigo: "EXP-001", estudianteId: 4, programaId: 2 };
    const cambio = { estado: "observado", observaciones: "Adjuntar un documento" };

    await expect(expedientesService.listar()).resolves.toEqual({ ok: true, datos });
    await expect(expedientesService.listar(2, "EXP", "observado")).resolves.toEqual({ ok: true, datos });
    await expect(expedientesService.obtener(9)).resolves.toEqual({ ok: true, datos });
    await expect(expedientesService.crear(nuevo as never)).resolves.toEqual({ ok: true, datos });
    await expect(expedientesService.actualizarEstado(9, "observado", "Adjuntar un documento")).resolves.toEqual({ ok: true, datos });

    expect(solicitudes).toEqual([
      { method: "GET", path: "/expedientes?pagina=1&buscar=", body: "" },
      { method: "GET", path: "/expedientes?pagina=2&buscar=EXP&estado=observado", body: "" },
      { method: "GET", path: "/expedientes/9", body: "" },
      { method: "POST", path: "/expedientes", body: JSON.stringify(nuevo) },
      { method: "PATCH", path: "/expedientes/9/estado", body: JSON.stringify(cambio) },
    ]);
  });

  it("omite estado y observaciones cuando no se proporcionan", async () => {
    let ruta = "";
    let cuerpo = "";
    server.use(
      http.all("*/api/sigep/*", async ({ request }) => {
        const url = new URL(request.url);
        ruta = url.pathname.replace("/api/sigep", "") + url.search;
        cuerpo = await request.text();
        return HttpResponse.json({ resultado: "simulado" });
      }),
    );

    await expedientesService.listar(1, "");
    expect(ruta).toBe("/expedientes?pagina=1&buscar=");
    await expedientesService.actualizarEstado(9, "aprobado");
    expect(ruta).toBe("/expedientes/9/estado");
    expect(cuerpo).toBe(JSON.stringify({ estado: "aprobado" }));
  });
});
