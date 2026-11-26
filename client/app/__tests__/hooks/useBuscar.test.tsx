import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { useBuscar } from "@/app/hooks/useBuscar";

afterEach(() => {
  jest.useRealTimers();
});

describe("useBuscar", () => {
  it("actualiza texto de inmediato y aplica el debounce predeterminado de 300 ms", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useBuscar());

    act(() => result.current.onChange("ana"));
    expect(result.current.texto).toBe("ana");
    expect(result.current.busqueda).toBe("");

    act(() => jest.advanceTimersByTime(299));
    expect(result.current.busqueda).toBe("");
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.busqueda).toBe("ana");
  });

  it("cancela la búsqueda anterior y respeta la espera personalizada", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useBuscar(100));

    act(() => result.current.onChange("a"));
    act(() => jest.advanceTimersByTime(80));
    act(() => result.current.onChange("ana"));
    expect(result.current.texto).toBe("ana");

    act(() => jest.advanceTimersByTime(99));
    expect(result.current.busqueda).toBe("");
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.busqueda).toBe("ana");
  });
});
