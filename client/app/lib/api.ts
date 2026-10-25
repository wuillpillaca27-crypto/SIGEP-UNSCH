// ─────────────────────────────────────────────────────────────
//  Cliente HTTP base — todas las llamadas al backend pasan aquí
// ─────────────────────────────────────────────────────────────
import { API_URL } from "./constants";
import type { RespuestaApi } from "../types";

async function peticion<T>(
  endpoint: string,
  opciones: RequestInit = {}
): Promise<RespuestaApi<T>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...opciones, headers });
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json?.detail ?? json?.error ?? "Error del servidor" };
    }

    return { ok: true, datos: json };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor" };
  }
}

export const api = {
  get:    <T>(url: string)                        => peticion<T>(url),
  post:   <T>(url: string, body: unknown)         => peticion<T>(url, { method: "POST",   body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown)         => peticion<T>(url, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown)         => peticion<T>(url, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T>(url: string)                        => peticion<T>(url, { method: "DELETE" }),
};
