import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { POR_PAGINA } from "@/app/lib/constants";
import { usePaginacion } from "@/app/hooks/usePaginacion";

describe("usePaginacion", () => {
  it("inicia en la página 1 con el tamaño predeterminado o configurado", () => {
    const predeterminado = renderHook(() => usePaginacion());
    expect(predeterminado.result.current).toMatchObject({ pagina: 1, porPagina: POR_PAGINA });

    const personalizado = renderHook(() => usePaginacion(25));
    expect(personalizado.result.current).toMatchObject({ pagina: 1, porPagina: 25 });
  });

  it("asigna directamente la página solicitada y la reinicia sin cambiar porPagina", () => {
    const { result } = renderHook(() => usePaginacion(20));

    act(() => result.current.irA(4));
    expect(result.current.pagina).toBe(4);
    expect(result.current.porPagina).toBe(20);

    act(() => result.current.irA(-2));
    expect(result.current.pagina).toBe(-2);

    act(() => result.current.reiniciar());
    expect(result.current.pagina).toBe(1);
    expect(result.current.porPagina).toBe(20);
  });
});
