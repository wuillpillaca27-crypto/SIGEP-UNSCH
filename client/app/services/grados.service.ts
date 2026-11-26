import { api } from "../lib/api";
import type { GradoTitulo, TipoGrado, Pagina } from "../types";

export const gradosService = {
  listar:  (pagina = 1, tipo?: TipoGrado) =>
    api.get<Pagina<GradoTitulo>>(
      `/grados-titulos?pagina=${pagina}${tipo ? `&tipo=${tipo}` : ""}`
    ),
  obtener: (id: number) =>
    api.get<GradoTitulo>(`/grados-titulos/${id}`),
  crear:   (datos: Omit<GradoTitulo, "id">) =>
    api.post<GradoTitulo>("/grados-titulos", datos),
  editar:  (id: number, datos: Partial<GradoTitulo>) =>
    api.put<GradoTitulo>(`/grados-titulos/${id}`, datos),
};
