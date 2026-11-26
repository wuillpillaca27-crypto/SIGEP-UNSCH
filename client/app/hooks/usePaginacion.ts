"use client";
import { useState } from "react";
import { POR_PAGINA } from "../lib/constants";

export function usePaginacion(porPagina = POR_PAGINA) {
  const [pagina, setPagina] = useState(1);

  const irA = (p: number) => setPagina(p);
  const reiniciar = () => setPagina(1);

  return { pagina, porPagina, irA, reiniciar };
}
