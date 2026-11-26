import { describe, expect, it, jest } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { authService } from "@/app/services/auth.service";

describe("authService", () => {
  it("usa login, perfil y logout con sus métodos, rutas y cuerpos vigentes", async () => {
    const solicitudes: Array<{ method: string; path: string; body: string }> = [];
    const datos = { resultado: "autenticación simulada" };
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

    const credenciales = { dni: "12345678", password: "clave-de-prueba" };
    await expect(authService.login(credenciales)).resolves.toEqual({ ok: true, datos });
    await expect(authService.perfil()).resolves.toEqual({ ok: true, datos });
    await expect(authService.logout()).resolves.toEqual({ ok: true, datos });

    expect(solicitudes).toEqual([
      { method: "POST", path: "/auth/login", body: JSON.stringify(credenciales) },
      { method: "GET", path: "/auth/perfil", body: "" },
      { method: "POST", path: "/auth/logout", body: "{}" },
    ]);
  });

  it("logout propaga la respuesta sin eliminar datos de localStorage", async () => {
    const removeItem = jest.spyOn(Storage.prototype, "removeItem");
    window.localStorage.setItem("token", "token-de-prueba");
    server.use(
      http.post("*/api/sigep/auth/logout", () =>
        HttpResponse.json({ ok: "respuesta del servidor" }),
      ),
    );

    await expect(authService.logout()).resolves.toEqual({
      ok: true,
      datos: { ok: "respuesta del servidor" },
    });
    expect(removeItem).not.toHaveBeenCalled();

    removeItem.mockRestore();
    window.localStorage.removeItem("token");
  });
});
