import { api } from "../lib/api";
import type { Usuario } from "../types";

interface CredencialesLogin { dni: string; password: string; }
interface RespuestaLogin    { token: string; usuario: Usuario; }

export const authService = {
  login: (credenciales: CredencialesLogin) =>
    api.post<RespuestaLogin>("/auth/login", credenciales),

  perfil: () =>
    api.get<Usuario>("/auth/perfil"),

  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("token");
  },
};
