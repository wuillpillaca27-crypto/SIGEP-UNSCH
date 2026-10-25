// ─────────────────────────────────────────────────────────────
//  Constantes globales del sistema
// ─────────────────────────────────────────────────────────────

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const ESTADOS_EXPEDIENTE = {
  en_revision: { label: "En revisión",  clase: "badge-revision"  },
  observado:   { label: "Observado",    clase: "badge-observado" },
  aprobado:    { label: "Aprobado",     clase: "badge-aprobado"  },
  rechazado:   { label: "Rechazado",    clase: "badge-rechazado" },
  pendiente:   { label: "Pendiente",    clase: "badge-pendiente" },
} as const;

export const TIPOS_PROGRAMA = {
  maestria:              "Maestría",
  doctorado:             "Doctorado",
  segunda_especialidad:  "Segunda especialidad",
  diplomado:             "Diplomado",
  certificacion_modulos: "Certificación por módulos",
} as const;

export const TIPOS_GRADO = {
  bachiller:                  "Bachiller",
  magister:                   "Magíster",
  doctor:                     "Doctor",
  titulo_segunda_especialidad: "Título segunda especialidad",
} as const;

export const ROLES = {
  administrador: "Administrador",
  operador:      "Operador",
  docente:       "Docente",
  estudiante:    "Estudiante",
} as const;

export const POR_PAGINA = 10;
