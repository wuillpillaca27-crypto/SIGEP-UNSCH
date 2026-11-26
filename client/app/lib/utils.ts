// ─────────────────────────────────────────────────────────────
//  Utilidades generales
// ─────────────────────────────────────────────────────────────
import type { EstadoExpediente } from "../types";
import { ESTADOS_EXPEDIENTE } from "./constants";

/** Formatea una fecha ISO a "dd/mm/aaaa" */
export function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Formatea una fecha ISO a "dd/mm/aaaa hh:mm" */
export function formatearFechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Devuelve la clase CSS y la etiqueta para un estado de expediente */
export function infoEstado(estado: EstadoExpediente) {
  return ESTADOS_EXPEDIENTE[estado] ?? { label: estado, clase: "badge-pendiente" };
}

/** Nombre completo "Apellidos, Nombres" */
export function nombreCompleto(nombres: string, apellidos: string): string {
  return `${apellidos}, ${nombres}`;
}

/** Trunca un texto a N caracteres */
export function truncar(texto: string, max = 60): string {
  return texto.length > max ? texto.slice(0, max) + "…" : texto;
}
