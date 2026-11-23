import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { estudiantesService } from "@/app/services/estudiantes.service";

describe("estudiantesService", () => {
  it("construye rutas, parámetros y cuerpos para sus operaciones", async () => {
    const solicitudes: Array<{ method: string; path: string; body: string }> = [];
    const datos = { resultado: "estudiantes simulados" };
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
    const nuevo = { dni: "12345678", nombres: "Ana", apellidos: "Pérez" };
    const cambios = { email: "ana@example.test" };

    await expect(estudiantesService.listar()).resolves.toEqual({ ok: true, datos });
    await expect(estudiantesService.listar(3, "ana")).resolves.toEqual({ ok: true, datos });
    await expect(estudiantesService.obtener(7)).resolves.toEqual({ ok: true, datos });
    await expect(estudiantesService.crear(nuevo as never)).resolves.toEqual({ ok: true, datos });
    await expect(estudiantesService.editar(7, cambios)).resolves.toEqual({ ok: true, datos });
    await expect(estudiantesService.eliminar(7)).resolves.toEqual({ ok: true, datos });

    expect(solicitudes).toEqual([
      { method: "GET", path: "/estudiantes?pagina=1&buscar=", body: "" },
      { method: "GET", path: "/estudiantes?pagina=3&buscar=ana", body: "" },
      { method: "GET", path: "/estudiantes/7", body: "" },
      { method: "POST", path: "/estudiantes", body: JSON.stringify(nuevo) },
      { method: "PUT", path: "/estudiantes/7", body: JSON.stringify(cambios) },
      { method: "DELETE", path: "/estudiantes/7", body: "" },
    ]);
  });
});
