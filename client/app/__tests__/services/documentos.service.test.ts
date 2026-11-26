import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { documentosService } from "@/app/services/documentos.service";

describe("documentosService", () => {
  it("construye las rutas de listado, obtención, QR y exportación SUNEDU", async () => {
    const solicitudes: Array<{ method: string; path: string }> = [];
    const datos = { resultado: "documentos simulados" };
    server.use(
      http.all("*/api/sigep/*", ({ request }) => {
        const url = new URL(request.url);
        solicitudes.push({
          method: request.method,
          path: url.pathname.replace("/api/sigep", "") + url.search,
        });
        return HttpResponse.json(datos);
      }),
    );

    await expect(documentosService.listar()).resolves.toEqual({ ok: true, datos });
    await expect(documentosService.listar(12)).resolves.toEqual({ ok: true, datos });
    await expect(documentosService.obtener(8)).resolves.toEqual({ ok: true, datos });
    await expect(documentosService.verificarQr("COD 1/ñ")).resolves.toEqual({ ok: true, datos });
    await expect(documentosService.verificarQr("COD 2", "diploma oficial")).resolves.toEqual({ ok: true, datos });
    await expect(documentosService.exportarSunedu("2024-01-01", "2024-12-31")).resolves.toEqual({ ok: true, datos });

    expect(solicitudes).toEqual([
      { method: "GET", path: "/documentos" },
      { method: "GET", path: "/documentos?expedienteId=12" },
      { method: "GET", path: "/documentos/8" },
      { method: "GET", path: "/documentos/verificar-qr/COD%201%2F%C3%B1" },
      { method: "GET", path: "/documentos/verificar-qr/COD%202?tipo=diploma%20oficial" },
      { method: "GET", path: "/documentos/exportar-sunedu?desde=2024-01-01&hasta=2024-12-31" },
    ]);
  });

  it("omite filtros opcionales vacíos", async () => {
    const rutas: string[] = [];
    server.use(
      http.get("*/api/sigep/*", ({ request }) => {
        const url = new URL(request.url);
        rutas.push(url.pathname.replace("/api/sigep", "") + url.search);
        return HttpResponse.json({ resultado: "simulado" });
      }),
    );

    await documentosService.listar(0);
    await documentosService.verificarQr("COD-3", "");

    expect(rutas).toEqual([
      "/documentos",
      "/documentos/verificar-qr/COD-3",
    ]);
  });
});
