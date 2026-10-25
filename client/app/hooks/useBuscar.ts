"use client";
import { useState, useCallback } from "react";

/**
 * Hook para campo de búsqueda con debounce.
 * @param espera milisegundos de debounce (default 300)
 */
export function useBuscar(espera = 300) {
  const [texto, setTexto]       = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [timer, setTimer]       = useState<ReturnType<typeof setTimeout> | null>(null);

  const onChange = useCallback(
    (valor: string) => {
      setTexto(valor);
      if (timer) clearTimeout(timer);
      const t = setTimeout(() => setBusqueda(valor), espera);
      setTimer(t);
    },
    [timer, espera]
  );

  return { texto, busqueda, onChange };
}
