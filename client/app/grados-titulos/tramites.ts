export const tramites = {
  maestro: {
    nombre: "Grado de Maestro",
    titulo: "Obtención del Grado Académico de Maestro",
    programa: "maestria",
    tipo: "grado_maestro",
    temas: "Plan de estudios, créditos, idiomas, tesis o trabajo de investigación, sustentación y acta.",
  },
  doctor: {
    nombre: "Grado de Doctor",
    titulo: "Obtención del Grado Académico de Doctor",
    programa: "doctorado",
    tipo: "grado_doctor",
    temas: "Plan de estudios, créditos, idiomas, tesis doctoral, sustentación y acta de aprobación.",
  },
  "segunda-especialidad": {
    nombre: "Título de Segunda Especialidad",
    titulo: "Obtención del Título de Segunda Especialidad",
    programa: "segunda_especialidad",
    tipo: "titulo_segunda_especialidad",
    temas: "Condiciones académicas, modalidad de titulación y documentación específica del programa.",
  },
} as const;

export type Tramite = keyof typeof tramites;

export const certificaciones = {
  diplomados: {
    nombre: "Diplomados de Posgrado",
    titulo: "Certificación de Diplomados de Posgrado",
    programa: "diplomado",
    tipo: "certificado_diplomado",
    temas: "Consulta los requisitos y documentos publicados para el diplomado de tu programa.",
  },
  modulos: {
    nombre: "Certificaciones por Módulos",
    titulo: "Certificaciones por Módulos",
    programa: "certificacion_modulos",
    tipo: "certificacion_modulos",
    temas: "Selecciona tu programa para consultar la documentación requerida para la certificación por módulos.",
  },
} as const;

export const tramitesAcademicos = { ...tramites, ...certificaciones };

export type Certificacion = keyof typeof certificaciones;
export type TramiteAcademico = keyof typeof tramitesAcademicos;

export function esCertificacion(valor: string): valor is Certificacion {
  return Object.hasOwn(certificaciones, valor);
}

export function esTramite(valor: string): valor is Tramite {
  return Object.hasOwn(tramites, valor);
}
