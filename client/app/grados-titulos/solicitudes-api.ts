"use client";

import { api } from "../lib/api";
import { API_URL } from "../lib/constants";

export type Perfil = {
  nombres: string; apellidos: string; dni: string; email: string;
  rol: string;
  estudiantes?: { id: number; codigoUniv: string; programa: { id: number; nombre: string; tipo: string; activo?: boolean } }[];
  estudiante: { codigoUniv: string; programa: { id: number; nombre: string; tipo: string } } | null;
};
export type Solicitud = {
  id: number; codigo: string; estado: string; tipoTramite: string; presentadoEn: string | null;
  observaciones: string | null; programa: { id?: number; nombre: string };
  documentos: { id: number; nombre: string; tipoDoc: string }[];
  validaciones: {
    id: number; estado: string; observacion: string | null;
    plantilla: { id: number; nombre: string; descripcion: string; tipo: string; obligatorio: boolean };
  }[];
  historial: { id: number; estadoDespues: string; creadoEn: string; motivo: string | null }[];
};
type MotivoMatricula = "programa_inactivo" | "sin_requisitos_activos" | "tramite_deshabilitado" | "plantilla_no_publicada" | "matricula_no_habilitada";
type ProgramaSolicitud = {
    id: number; nombre: string; tipo: string; activo: boolean;
    tramites: {
      clave: string; nombre: string; tipoTramite: string;
      requisitos: { id: number; nombre: string; descripcion: string; tipo: string; obligatorio: boolean; versionNorm: string }[];
    }[];
};
export type Matricula = ProgramaSolicitud & {
  matriculaId: number; codigoUniv: string; estadoAcad: string; fechaInicio: string; fechaFin: string | null;
  claveTramite: string; motivo: MotivoMatricula | null;
};
export type OpcionesSolicitud = {
  programas: ProgramaSolicitud[];
  matriculas?: Matricula[];
  programaRegistrado: { id: number; nombre: string; tipo: string; activo: boolean } | null;
  motivo: "sin_matricula" | MotivoMatricula | null;
};

export const solicitudes = {
  ingresar: (identificador: string, password: string) => api.post<{ usuario: Perfil }>("/auth/login", {
    ...(/^\d{8}$/.test(identificador) ? { dni: identificador } : { email: identificador }), password,
  }),
  perfil: () => api.get<Perfil>("/auth/perfil"),
  opciones: () => api.get<OpcionesSolicitud>("/solicitudes/opciones"),
  cerrarSesion: () => api.post<{ ok: boolean }>("/auth/logout", {}),
  listar: () => api.get<Solicitud[]>("/solicitudes"),
  crear: (tipoTramite: string, programaId?: number) => api.post<Solicitud>("/solicitudes", {
    tipoTramite,
    ...(programaId !== undefined ? { programaId } : {}),
  }),
  presentar: (id: number) => api.post<Solicitud>(`/solicitudes/${id}/presentar`, {}),
  subsanar: (id: number) => api.post<Solicitud>(`/solicitudes/${id}/subsanar`, {}),
  desistir: (id: number, motivo: FormDataEntryValue | null) => api.post<Solicitud>(`/solicitudes/${id}/desistir`, { motivo }),
  retirarDocumento: (id: number, documento: number) => api.delete<Solicitud>(`/solicitudes/${id}/documentos/${documento}`),
};

export const rutaConstancia = (id: number) => `${API_URL}/solicitudes/${id}/constancia`;

function archivo(id: number, idArchivo: number, opciones?: RequestInit) {
  return fetch(`${API_URL}/solicitudes/${id}/documentos/${idArchivo}`, {
    ...opciones,
    credentials: "same-origin",
  });
}

export class ErrorDocumento extends Error {
  constructor(mensaje: string, readonly estadoHttp: number, readonly codigo?: string) {
    super(mensaje);
  }
}

export async function cargarDocumento(id: number, requisito: number, pdf: File): Promise<Solicitud> {
  if (pdf.type !== "application/pdf" || pdf.size > 10 * 1024 * 1024) {
    throw new Error("Selecciona un PDF de hasta 10 MB.");
  }
  const respuesta = await archivo(id, requisito, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: pdf });
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new ErrorDocumento(datos?.error ?? "No se pudo cargar el archivo.", respuesta.status, datos?.codigo);
  }
  return respuesta.json();
}

export async function descargarDocumento(id: number, documento: number, revision = false, visualizar = false) {
  const respuesta = revision
    ? await fetch(`${API_URL}/revision-grados/${id}/documentos/${documento}`, { credentials: "same-origin" })
    : await archivo(id, documento);
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new ErrorDocumento(datos?.error ?? "No se pudo abrir el documento.", respuesta.status, datos?.codigo);
  }
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
    activo: "Activo", egresado: "Egresado", graduado: "Graduado", suspendido: "Suspendido", retirado: "Retirado",
    borrador: "Borrador", presentado: "Presentado", en_revision: "En revisión",
    observado: "Observado", pendiente: "Pendiente", cumplido: "Cumplido", no_aplica: "No aplica",
  };
  return etiquetas[estado] ?? estado.replaceAll("_", " ");
}
