"use client";

import { api } from "../lib/api";
import { API_URL } from "../lib/constants";

export type Perfil = {
  nombres: string; apellidos: string; dni: string; email: string;
  rol: string;
  estudiante: { codigoUniv: string; programa: { id: number; nombre: string; tipo: string } } | null;
};
export type Solicitud = {
  id: number; codigo: string; estado: string; tipoTramite: string; presentadoEn: string | null;
  observaciones: string | null; programa: { nombre: string };
  documentos: { id: number; nombre: string; tipoDoc: string }[];
  validaciones: {
    id: number; estado: string; observacion: string | null;
    plantilla: { id: number; nombre: string; descripcion: string; tipo: string; obligatorio: boolean };
  }[];
  historial: { id: number; estadoDespues: string; creadoEn: string; motivo: string | null }[];
};

export const solicitudes = {
  ingresar: (identificador: string, password: string) => api.post<{ usuario: Perfil }>("/auth/login", {
    ...(/^\d{8}$/.test(identificador) ? { dni: identificador } : { email: identificador }), password,
  }),
  perfil: () => api.get<Perfil>("/auth/perfil"),
  cerrarSesion: () => api.post<{ ok: boolean }>("/auth/logout", {}),
  listar: () => api.get<Solicitud[]>("/solicitudes"),
  crear: (tipoTramite: string) => api.post<Solicitud>("/solicitudes", { tipoTramite }),
  presentar: (id: number) => api.post<Solicitud>(`/solicitudes/${id}/presentar`, {}),
  subsanar: (id: number) => api.post<Solicitud>(`/solicitudes/${id}/subsanar`, {}),
};

function archivo(id: number, idArchivo: number, opciones?: RequestInit) {
  return fetch(`${API_URL}/solicitudes/${id}/documentos/${idArchivo}`, {
    ...opciones,
    credentials: "same-origin",
  });
}

export async function cargarDocumento(id: number, requisito: number, pdf: File): Promise<Solicitud> {
  if (pdf.type !== "application/pdf" || pdf.size > 10 * 1024 * 1024) {
    throw new Error("Selecciona un PDF de hasta 10 MB.");
  }
  const respuesta = await archivo(id, requisito, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: pdf });
  if (!respuesta.ok) throw new Error((await respuesta.json()).error ?? "No se pudo cargar el archivo.");
  return respuesta.json();
}

export async function descargarDocumento(id: number, documento: number, revision = false, visualizar = false) {
  const respuesta = revision
    ? await fetch(`${API_URL}/revision-grados/${id}/documentos/${documento}`, { credentials: "same-origin" })
    : await archivo(id, documento);
  if (!respuesta.ok) throw new Error("No se pudo abrir el documento.");
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement("a");
  enlace.href = url;
  if (visualizar) {
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
  } else {
    enlace.download = "documento.pdf";
  }
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function estadoVisible(estado: string) {
  const etiquetas: Record<string, string> = {
    borrador: "Borrador", presentado: "Presentado", en_revision: "En revisión",
    observado: "Observado", pendiente: "Pendiente", cumplido: "Cumplido", no_aplica: "No aplica",
  };
  return etiquetas[estado] ?? estado.replaceAll("_", " ");
}
