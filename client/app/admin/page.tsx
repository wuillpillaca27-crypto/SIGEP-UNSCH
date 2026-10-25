const stats = [
  { label: "Estudiantes activos", value: "[000]" },
  { label: "Expedientes en trámite", value: "[000]" },
  { label: "Grados y títulos pendientes", value: "[000]" },
];

const statVerificado = { label: "Diplomas verificados", value: "[000]" };

const expedientes = [
  { nombre: "[Apellidos y nombres]", programa: "[Programa]", estado: "En revisión", estadoClass: "badge-revision" },
  { nombre: "[Apellidos y nombres]", programa: "[Programa]", estado: "Observado", estadoClass: "badge-observado" },
  { nombre: "[Apellidos y nombres]", programa: "[Programa]", estado: "Aprobado", estadoClass: "badge-aprobado" },
  { nombre: "[Apellidos y nombres]", programa: "[Programa]", estado: "En revisión", estadoClass: "badge-revision" },
];

const auditoria = [
  { usuario: "[Usuario]", accion: "[acción registrada]", fecha: "[fecha y hora]" },
  { usuario: "[Usuario]", accion: "[acción registrada]", fecha: "[fecha y hora]" },
  { usuario: "[Usuario]", accion: "[acción registrada]", fecha: "[fecha y hora]" },
  { usuario: "[Usuario]", accion: "[acción registrada]", fecha: "[fecha y hora]" },
];

const accesosRapidos = [
  { label: "Nuevo expediente", href: "/admin/expedientes" },
  { label: "Validar requisitos", href: "/admin/validacion-requisitos" },
  { label: "Verificar diploma QR", href: "/admin/verificacion-qr" },
  { label: "Exportar a SUNEDU", href: "/admin/exportacion-sunedu" },
];

export default function AdminDashboard() {
  return (
    <div className="content">
      <div className="eyebrow">PANEL PRINCIPAL</div>
      <h1 className="serif">Resumen de la Escuela de Posgrado</h1>

      {/* Stats principales */}
      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value serif">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Stat diplomas verificados */}
      <div className="stats-row" style={{ marginTop: 0 }}>
        <div className="stat-card">
          <div className="stat-label">{statVerificado.label}</div>
          <div className="stat-value serif">{statVerificado.value}</div>
        </div>
      </div>

      {/* Tabla expedientes + actividad reciente */}
      <div className="dashboard-cols">
        {/* Expedientes recientes */}
        <div className="dash-panel">
          <div className="dash-panel-title">EXPEDIENTES RECIENTES</div>
          <table className="exp-table" aria-label="Expedientes recientes">
            <thead>
              <tr>
                <th>ESTUDIANTE</th>
                <th>PROGRAMA</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((e, i) => (
                <tr key={i}>
                  <td>{e.nombre}</td>
                  <td>{e.programa}</td>
                  <td>
                    <span className={`badge ${e.estadoClass}`}>{e.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actividad reciente / Auditoría */}
        <div className="dash-panel">
          <div className="dash-panel-title">ACTIVIDAD RECIENTE · AUDITORÍA</div>
          <ul className="audit-list">
            {auditoria.map((a, i) => (
              <li key={i} className="audit-item">
                <div className="audit-user">[{a.usuario}]</div>
                <div className="audit-action">{a.accion}</div>
                <div className="audit-date">{a.fecha}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="accesos-section">
        <div className="dash-panel-title">ACCESOS RÁPIDOS</div>
        <div className="accesos-row">
          {accesosRapidos.map((acc) => (
            <a key={acc.label} href={acc.href} className="btn-acceso">
              {acc.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
