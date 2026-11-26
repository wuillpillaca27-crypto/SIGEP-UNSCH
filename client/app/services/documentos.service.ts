import { api } from "../lib/api";
import type { Documento, Pagina } from "../types";

export type DocumentoVerificado = {
  codigo: string;
  tipoTramite: string;
  programa: string;
  emitidoEn: string | null;
  demostracion: boolean;
};

export const documentosService = {
  listar:      (expedienteId?: number) =>
    api.get<Pagina<Documento>>(
      `/documentos${expedienteId ? `?expedienteId=${expedienteId}` : ""}`
    ),
  obtener:     (id: number) =>
    api.get<Documento>(`/documentos/${id}`),
  verificarQr: (codigoQr: string, tipo?: string) =>
    api.get<DocumentoVerificado>(`/documentos/verificar-qr/${encodeURIComponent(codigoQr)}${tipo ? `?tipo=${encodeURIComponent(tipo)}` : ""}`),
  exportarSunedu: (desde: string, hasta: string) =>
    api.get<Blob>(`/documentos/exportar-sunedu?desde=${desde}&hasta=${hasta}`),
};
