"use client";
import { useState, useEffect, useCallback } from "react";
import type { RespuestaApi } from "../types";

interface Estado<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/**
 * Hook genérico para llamadas al API.
 * @param fetcher Función que retorna una RespuestaApi<T>
 * @param deps    Dependencias que disparan una nueva llamada (como useEffect)
 */
export function useFetch<T>(
  fetcher: () => Promise<RespuestaApi<T>>,
  deps: unknown[] = []
): Estado<T> {
  const [datos, setDatos]       = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [rev, setRev]           = useState(0);

  const recargar = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetcher().then((res) => {
      if (!activo) return;
      if (res.ok && res.datos !== undefined) {
        setDatos(res.datos);
      } else {
        setError(res.error ?? "Error desconocido");
      }
      setCargando(false);
    });

    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, rev]);

  return { datos, cargando, error, recargar };
}
