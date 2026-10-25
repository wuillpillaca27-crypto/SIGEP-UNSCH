import { api } from "../lib/api";
import type { RegistroAuditoria, Pagina } from "../types";

export const auditoriaService = {
  listar: (pagina = 1, buscar = "") =>
    api.get<Pagina<RegistroAuditoria>>(
      `/auditoria?pagina=${pagina}&buscar=${buscar}`
    ),
};
