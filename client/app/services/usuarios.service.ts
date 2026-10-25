import { api } from "../lib/api";
import type { Usuario, Rol, Pagina } from "../types";

export const usuariosService = {
  listar:  (rol?: Rol) =>
    api.get<Pagina<Usuario>>(`/usuarios${rol ? `?rol=${rol}` : ""}`),
  obtener: (id: number) =>
    api.get<Usuario>(`/usuarios/${id}`),
  crear:   (datos: Omit<Usuario, "id" | "creadoEn">) =>
    api.post<Usuario>("/usuarios", datos),
  editar:  (id: number, datos: Partial<Usuario>) =>
    api.put<Usuario>(`/usuarios/${id}`, datos),
  cambiarEstado: (id: number, activo: boolean) =>
    api.patch<Usuario>(`/usuarios/${id}/estado`, { activo }),
};
