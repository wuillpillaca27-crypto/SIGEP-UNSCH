import { api } from "../lib/api";
import type { ResumenDashboard } from "../types";

export const dashboardService = {
  resumen: () => api.get<ResumenDashboard>("/dashboard/resumen"),
};
