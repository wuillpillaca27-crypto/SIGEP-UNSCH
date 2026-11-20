"use client";

import { createContext } from "react";
import type { Perfil } from "../grados-titulos/solicitudes-api";

export const PerfilAdministrativo = createContext<Perfil | null>(null);
