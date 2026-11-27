import { describe, expect, it, jest } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/jest.setup";
import { api } from "@/app/lib/api";

describe("cliente HTTP", () => {
  it("envía cada método a la URL base con JSON y Content-Type correctos", async () => {
    const solicitudes: Array<{
      method: string;
      url: string;
      contentType: string | null;
      body: string;
      credentials: RequestCredentials;
    }> = [];

    server.use(
      http.all("*/api/sigep/metodos/*", async ({ request }) => {
        solicitudes.push({
          method: request.method,
          url: request.url,
          contentType: request.headers.get("content-type"),
          body: await request.text(),
          credentials: request.credentials,
        });
        return HttpResponse.json({ recibido: true });
      }),
    );

    await api.get("/metodos/get");
    await api.post("/metodos/post", { valor: 1 });
    await api.put("/metodos/put", { valor: 2 });
    await api.patch("/metodos/patch", { valor: 3 });
    await api.delete("/metodos/delete");

    expect(solicitudes).toEqual([
      {
        method: "GET",
        url: "http://localhost/api/sigep/metodos/get",
        contentType: "application/json",
        body: "",
        credentials: "same-origin",
      },
      {
        method: "POST",
        url: "http://localhost/api/sigep/metodos/post",
        contentType: "application/json",
        body: JSON.stringify({ valor: 1 }),
        credentials: "same-origin",
      },
      {
        method: "PUT",
        url: "http://localhost/api/sigep/metodos/put",
        contentType: "application/json",
        body: JSON.stringify({ valor: 2 }),
        credentials: "same-origin",
      },
      {
        method: "PATCH",
        url: "http://localhost/api/sigep/metodos/patch",
        contentType: "application/json",
        body: JSON.stringify({ valor: 3 }),
        credentials: "same-origin",
      },
      {
        method: "DELETE",
        url: "http://localhost/api/sigep/metodos/delete",
        contentType: "application/json",
        body: "",
        credentials: "same-origin",
      },
    ]);
  });

  it("devuelve el cuerpo JSON de una respuesta exitosa sin alterarlo", async () => {
    const datos = { id: 7, nombre: "Registro de prueba", activo: true };
    server.use(
      http.get("*/api/sigep/resultado", () => HttpResponse.json(datos)),
    );

    await expect(api.get("/resultado")).resolves.toEqual({ ok: true, datos });
  });

  it("prioriza detail, luego error y finalmente el mensaje HTTP predeterminado", async () => {
    server.use(
      http.get("*/api/sigep/error/detail", () =>
        HttpResponse.json({ detail: "Detalle", error: "Error secundario" }, { status: 422 }),
      ),
      http.get("*/api/sigep/error/error", () =>
        HttpResponse.json({ error: "Error explícito" }, { status: 400 }),
      ),
      http.get("*/api/sigep/error/predeterminado", () =>
        HttpResponse.json({}, { status: 503 }),
      ),
    );

    await expect(api.get("/error/detail")).resolves.toEqual({
      ok: false,
      estadoHttp: 422,
      error: "Detalle",
    });
    await expect(api.get("/error/error")).resolves.toEqual({
      ok: false,
      estadoHttp: 400,
      error: "Error explícito",
    });
    await expect(api.get("/error/predeterminado")).resolves.toEqual({
      ok: false,
      estadoHttp: 503,
      error: "Error del servidor",
    });
  });

  it("conserva el estado de un error del proxy aunque el cuerpo no sea JSON", async () => {
    server.use(
      http.get("*/api/sigep/error/no-json", () =>
        HttpResponse.text("respuesta inválida", { status: 500 }),
      ),
    );

    await expect(api.get("/error/no-json")).resolves.toEqual({
      ok: false,
      estadoHttp: 500,
      error: "El portal no recibe una respuesta válida de la API. Reintenta en unos instantes.",
    });
  });

  it("devuelve el mensaje de conexión si fetch falla", async () => {
    server.use(
      http.get("*/api/sigep/error/red", () => Response.error()),
    );

    await expect(api.get("/error/red")).resolves.toEqual({
      ok: false,
      error: "No se pudo conectar con el servidor",
    });
  });

  it("no lee localStorage ni envía Authorization cuando hay un token almacenado", async () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem");
    window.localStorage.setItem("token", "token-de-prueba");
    let authorization: string | null = null;

    server.use(
      http.get("*/api/sigep/sin-token", ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await api.get("/sin-token");

    expect(getItem).not.toHaveBeenCalled();
    expect(authorization).toBeNull();
    getItem.mockRestore();
    window.localStorage.removeItem("token");
  });
});
