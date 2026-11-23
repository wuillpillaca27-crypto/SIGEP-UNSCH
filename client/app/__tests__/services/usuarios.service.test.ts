import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { usuariosService } from "@/app/services/usuarios.service";

describe("usuariosService", () => {
  it("usa las rutas y operaciones CRUD de usuarios y estados", async () => {
    const solicitudes: Array<{ method: string; path: string; body: string }> = [];
    const datos = { resultado: "usuarios simulados" };
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
    const nuevo = { nombres: "Ana", apellidos: "Pérez", dni: "12345678" };
    const cambios = { email: "ana@example.test" };

    await expect(usuariosService.listar()).resolves.toEqual({ ok: true, datos });
    await expect(usuariosService.listar("operador")).resolves.toEqual({ ok: true, datos });
    await expect(usuariosService.obtener(5)).resolves.toEqual({ ok: true, datos });
    await expect(usuariosService.crear(nuevo as never)).resolves.toEqual({ ok: true, datos });
    await expect(usuariosService.editar(5, cambios)).resolves.toEqual({ ok: true, datos });
    await expect(usuariosService.cambiarEstado(5, false)).resolves.toEqual({ ok: true, datos });

    expect(solicitudes).toEqual([
      { method: "GET", path: "/usuarios", body: "" },
      { method: "GET", path: "/usuarios?rol=operador", body: "" },
      { method: "GET", path: "/usuarios/5", body: "" },
      { method: "POST", path: "/usuarios", body: JSON.stringify(nuevo) },
      { method: "PUT", path: "/usuarios/5", body: JSON.stringify(cambios) },
      { method: "PATCH", path: "/usuarios/5/estado", body: JSON.stringify({ activo: false }) },
    ]);
  });
});
