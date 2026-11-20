import { api } from "../lib/api";
import type { Usuario } from "../types";

interface CredencialesLogin { dni?: string; email?: string; password: string; }
interface RespuestaLogin    { usuario: Usuario; }

export const authService = {
  login: (credenciales: CredencialesLogin) =>
    api.post<RespuestaLogin>("/auth/login", credenciales),

  perfil: () =>
    api.get<Usuario>("/auth/perfil"),

  logout: () => api.post<{ ok: boolean }>("/auth/logout", {}),
};
