import { api } from "../lib/api";
import type { Expediente, EstadoExpediente, Pagina } from "../types";

export const expedientesService = {
  listar:         (pagina = 1, buscar = "", estado?: EstadoExpediente) =>
    api.get<Pagina<Expediente>>(
      `/expedientes?pagina=${pagina}&buscar=${buscar}${estado ? `&estado=${estado}` : ""}`
    ),
  obtener:        (id: number) =>
    api.get<Expediente>(`/expedientes/${id}`),
  crear:          (datos: Omit<Expediente, "id" | "creadoEn" | "actualizadoEn">) =>
    api.post<Expediente>("/expedientes", datos),
  actualizarEstado: (id: number, estado: EstadoExpediente, observaciones?: string) =>
    api.patch<Expediente>(`/expedientes/${id}/estado`, { estado, observaciones }),
};
