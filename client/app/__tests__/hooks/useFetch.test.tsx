import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { useFetch } from "@/app/hooks/useFetch";
import type { RespuestaApi } from "@/app/types";

function diferida<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
}

describe("useFetch", () => {
  it("expone el estado inicial y guarda una respuesta exitosa", async () => {
    const solicitud = diferida<RespuestaApi<string>>();
    const { result } = renderHook(() => useFetch(() => solicitud.promesa));

    expect(result.current).toMatchObject({ datos: null, cargando: true, error: null });

    await act(async () => {
      solicitud.resolver({ ok: true, datos: "cargado" });
      await solicitud.promesa;
    });

    expect(result.current).toMatchObject({ datos: "cargado", cargando: false, error: null });
  });

  it("muestra el error de API al recargar y conserva los datos anteriores", async () => {
    const respuestas: Array<Promise<RespuestaApi<string>>> = [
      Promise.resolve({ ok: true, datos: "datos previos" }),
      Promise.resolve({ ok: false, error: "No autorizado" }),
    ];
    const fetcher = jest.fn(() => respuestas.shift()!);
    const { result } = renderHook(() => useFetch(fetcher));

    await waitFor(() => expect(result.current.datos).toBe("datos previos"));
    act(() => result.current.recargar());
    await waitFor(() => expect(result.current.error).toBe("No autorizado"));

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({
      datos: "datos previos",
      cargando: false,
      error: "No autorizado",
    });
  });

  it("ignora una respuesta obsoleta cuando cambian las dependencias", async () => {
    const primera = diferida<RespuestaApi<string>>();
    const segunda = diferida<RespuestaApi<string>>();
    const { result, rerender } = renderHook(
      ({ clave }) => useFetch(() => (clave === "primera" ? primera.promesa : segunda.promesa), [clave]),
      { initialProps: { clave: "primera" } },
    );

    rerender({ clave: "segunda" });
    await act(async () => {
      primera.resolver({ ok: true, datos: "obsoleta" });
      await primera.promesa;
    });
    expect(result.current).toMatchObject({ datos: null, cargando: true, error: null });

    await act(async () => {
      segunda.resolver({ ok: true, datos: "actual" });
      await segunda.promesa;
    });
    expect(result.current).toMatchObject({ datos: "actual", cargando: false, error: null });
  });

  it("ignora la respuesta pendiente después de desmontar el consumidor", async () => {
    const solicitud = diferida<RespuestaApi<string>>();
    const { result, unmount } = renderHook(() => useFetch(() => solicitud.promesa));
    const estadoAntesDeDesmontar = result.current;

    unmount();
    await act(async () => {
      solicitud.resolver({ ok: true, datos: "respuesta tardía" });
      await solicitud.promesa;
    });

    expect(result.current).toBe(estadoAntesDeDesmontar);
  });
});
