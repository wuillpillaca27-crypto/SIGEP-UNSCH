import { api } from "../lib/api";
import type { Programa, TipoPrograma, Pagina } from "../types";

export const programasService = {
  listar:  (tipo?: TipoPrograma) =>
    api.get<Pagina<Programa>>(`/programas${tipo ? `?tipo=${tipo}` : ""}`),
  obtener: (id: number) =>
    api.get<Programa>(`/programas/${id}`),
  crear:   (datos: Omit<Programa, "id">) =>
    api.post<Programa>("/programas", datos),
  editar:  (id: number, datos: Partial<Programa>) =>
    api.put<Programa>(`/programas/${id}`, datos),
};
