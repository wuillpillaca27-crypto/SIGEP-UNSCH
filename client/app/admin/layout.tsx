import Sidebar from "../components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="shell-main">
        <div className="topbar">
          <div className="topbar-search">
            <label htmlFor="buscar" className="sr-only">Buscar</label>
            <input
              id="buscar"
              type="search"
              placeholder="DNI, código o expediente"
              aria-label="Buscar por DNI, código o expediente"
            />
          </div>
          <div className="topbar-user">
            <span>[Nombre de usuario]</span>
            <span className="topbar-role">Administrador</span>
            <a href="/" className="topbar-logout">Cerrar sesión</a>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
