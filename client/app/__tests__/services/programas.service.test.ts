import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { programasService } from "@/app/services/programas.service";

describe("programasService", () => {
  it("construye listados filtrados o generales y propaga las operaciones", async () => {
    const solicitudes: Array<{ method: string; path: string; body: string }> = [];
    const datos = { resultado: "programas simulados" };
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
    const nuevo = { nombre: "Maestría de prueba", tipo: "maestria", facultad: "Ingeniería" };
    const cambios = { activo: false };

    await expect(programasService.listar()).resolves.toEqual({ ok: true, datos });
    await expect(programasService.listar("maestria")).resolves.toEqual({ ok: true, datos });
    await expect(programasService.obtener(3)).resolves.toEqual({ ok: true, datos });
    await expect(programasService.crear(nuevo as never)).resolves.toEqual({ ok: true, datos });
    await expect(programasService.editar(3, cambios)).resolves.toEqual({ ok: true, datos });

    expect(solicitudes).toEqual([
      { method: "GET", path: "/programas", body: "" },
      { method: "GET", path: "/programas?tipo=maestria", body: "" },
      { method: "GET", path: "/programas/3", body: "" },
      { method: "POST", path: "/programas", body: JSON.stringify(nuevo) },
      { method: "PUT", path: "/programas/3", body: JSON.stringify(cambios) },
    ]);
  });
});
