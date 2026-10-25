import { api } from "../lib/api";
import type { Estudiante, Pagina } from "../types";

export const estudiantesService = {
  listar:  (pagina = 1, buscar = "") =>
    api.get<Pagina<Estudiante>>(`/estudiantes?pagina=${pagina}&buscar=${buscar}`),
  obtener: (id: number) =>
    api.get<Estudiante>(`/estudiantes/${id}`),
  crear:   (datos: Omit<Estudiante, "id" | "creadoEn">) =>
    api.post<Estudiante>("/estudiantes", datos),
  editar:  (id: number, datos: Partial<Estudiante>) =>
    api.put<Estudiante>(`/estudiantes/${id}`, datos),
  eliminar:(id: number) =>
    api.delete<void>(`/estudiantes/${id}`),
};
