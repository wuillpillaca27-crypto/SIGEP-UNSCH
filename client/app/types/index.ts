// ─────────────────────────────────────────────────────────────
//  Tipos globales del sistema SIGEP-UNSCH
//  NO modificar sin actualizar los servicios correspondientes
// ─────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────
export type Rol = "administrador" | "operador" | "docente" | "estudiante";

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string; // ISO date
}

// ── Programas académicos ──────────────────────────────────────
export type TipoPrograma =
  | "maestria"
  | "doctorado"
  | "segunda_especialidad"
  | "diplomado"
  | "certificacion_modulos";

export interface Programa {
  id: number;
  nombre: string;
  tipo: TipoPrograma;
  facultad: string;
  activo: boolean;
}

// ── Estudiantes ───────────────────────────────────────────────
export interface Estudiante {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  programaId: number;
  programa?: Programa;
  activo: boolean;
  creadoEn: string;
}

// ── Expedientes ───────────────────────────────────────────────
export type EstadoExpediente =
  | "en_revision"
  | "observado"
  | "aprobado"
  | "rechazado"
  | "pendiente";

export interface Expediente {
  id: number;
  codigo: string;
  estudianteId: number;
  estudiante?: Estudiante;
  programaId: number;
  programa?: Programa;
  estado: EstadoExpediente;
  observaciones?: string;
  creadoEn: string;
  actualizadoEn: string;
}

// ── Documentos y diplomas ─────────────────────────────────────
export type TipoDocumento = "diploma" | "certificado" | "constancia" | "acta";

export interface Documento {
  id: number;
  expedienteId: number;
  expediente?: Expediente;
  tipo: TipoDocumento;
  url?: string;
  codigoQr?: string;
  emitidoEn?: string;
  verificado: boolean;
}

// ── Grados y títulos ──────────────────────────────────────────
export type TipoGrado = "bachiller" | "magister" | "doctor" | "titulo_segunda_especialidad";

export interface GradoTitulo {
  id: number;
  estudianteId: number;
  estudiante?: Estudiante;
  tipo: TipoGrado;
  programaId: number;
  programa?: Programa;
  fechaConferimiento?: string;
  registroSunedu?: string;
  estado: EstadoExpediente;
}

// ── Auditoría ─────────────────────────────────────────────────
export interface RegistroAuditoria {
  id: number;
  usuarioId: number;
  usuario?: Pick<Usuario, "nombres" | "apellidos">;
  accion: string;
  entidad: string;
  entidadId: number;
  detalles?: string;
  creadoEn: string;
}

// ── Dashboard (resumen) ───────────────────────────────────────
export interface ResumenDashboard {
  estudiantesActivos: number;
  expedientesEnTramite: number;
  gradosTitulosPendientes: number;
  diplomasVerificados: number;
  expedientesRecientes: Expediente[];
  actividadReciente: RegistroAuditoria[];
}

// ── Paginación genérica ───────────────────────────────────────
export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

// ── Respuesta API genérica ────────────────────────────────────
export interface RespuestaApi<T> {
  ok: boolean;
  datos?: T;
  error?: string;
  mensaje?: string;
}
