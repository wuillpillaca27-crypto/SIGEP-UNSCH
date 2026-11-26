import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { auditoriaService } from "@/app/services/auditoria.service";

describe("auditoriaService", () => {
  it("aplica la paginación predeterminada y propaga la búsqueda", async () => {
    const rutas: string[] = [];
    const datos = { resultado: "auditoría simulada" };
    server.use(
      http.get("*/api/sigep/*", ({ request }) => {
        const url = new URL(request.url);
        rutas.push(url.pathname.replace("/api/sigep", "") + url.search);
        return HttpResponse.json(datos);
      }),
    );

    await expect(auditoriaService.listar()).resolves.toEqual({ ok: true, datos });
    await expect(auditoriaService.listar(4, "inicio de sesión")).resolves.toEqual({ ok: true, datos });

    expect(rutas).toEqual([
      "/auditoria?pagina=1&buscar=",
      "/auditoria?pagina=4&buscar=inicio%20de%20sesi%C3%B3n",
    ]);
  });
});
