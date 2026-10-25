import { api } from "../lib/api";
import type { Documento, Pagina } from "../types";

export const documentosService = {
  listar:      (expedienteId?: number) =>
    api.get<Pagina<Documento>>(
      `/documentos${expedienteId ? `?expedienteId=${expedienteId}` : ""}`
    ),
  obtener:     (id: number) =>
    api.get<Documento>(`/documentos/${id}`),
  verificarQr: (codigoQr: string) =>
    api.get<Documento>(`/documentos/verificar-qr/${codigoQr}`),
  exportarSunedu: (desde: string, hasta: string) =>
    api.get<Blob>(`/documentos/exportar-sunedu?desde=${desde}&hasta=${hasta}`),
};
