// ─────────────────────────────────────────────────────────────
//  Cliente HTTP base — todas las llamadas al backend pasan aquí
// ─────────────────────────────────────────────────────────────
import { API_URL } from "./constants";
import type { RespuestaApi } from "../types";

async function peticion<T>(
  endpoint: string,
  opciones: RequestInit = {}
): Promise<RespuestaApi<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...opciones.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...opciones, headers, credentials: "same-origin" });
    const json = await res.json().catch(() => undefined);

    if (!res.ok) {
      const error = json?.detail ?? json?.error ?? (
        json === undefined && res.status >= 500
          ? "El portal no recibe una respuesta válida de la API. Reintenta en unos instantes."
          : "Error del servidor"
      );
      return { ok: false, estadoHttp: res.status, error, ...(json?.codigo ? { codigo: json.codigo } : {}) };
    }
    if (json === undefined) return { ok: false, estadoHttp: res.status, error: "La API devolvió una respuesta con formato inesperado." };

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
