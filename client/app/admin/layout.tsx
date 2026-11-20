"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Sidebar from "../components/Sidebar";
import { solicitudes, type Perfil } from "../grados-titulos/solicitudes-api";
import { PerfilAdministrativo } from "./perfil";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [perfil, setPerfil] = useState<Perfil>();
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [cerrando, setCerrando] = useState(false);
  useEffect(() => {
    let vigente = true;
    solicitudes.perfil().then((respuesta) => {
      if (!vigente) return;
      const cuenta = respuesta.datos;
      if (cuenta && ["administrador", "operador"].includes(cuenta.rol)) setPerfil(cuenta);
      else if (cuenta) router.replace("/mis-tramites");
      else if (respuesta.estadoHttp === 401) router.replace(`/login?continuar=${encodeURIComponent(pathname)}`);
      else setError(respuesta.error ?? "No se pudo validar la sesión.");
    });
    return () => { vigente = false; };
  }, [router, pathname, intento]);

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const consulta = String(new FormData(evento.currentTarget).get("buscar")).trim();
    router.push(`/admin/expedientes?buscar=${encodeURIComponent(consulta)}`);
  }

  if (!perfil) return <main className="content">{error ? <><p role="alert">{error}</p><button onClick={() => { setError(""); setIntento(intento + 1); }}>Reintentar</button></> : <p role="status">Validando acceso al panel…</p>}</main>;

  return (
    <PerfilAdministrativo.Provider value={perfil}><div className="shell">
      <Sidebar />
      <div className="shell-main">
        <div className="topbar">
          <form className="topbar-search" onSubmit={buscar}>
            <label htmlFor="buscar" className="sr-only">Buscar expediente</label>
            <input id="buscar" name="buscar" type="search" placeholder="DNI, código o expediente" maxLength={100} />
            <button type="submit" className="btn">Buscar</button>
          </form>
          <div className="topbar-user">
            <span>{perfil.nombres} {perfil.apellidos}</span>
            <span className="topbar-role">{perfil.rol === "administrador" ? "Administrador" : "Operador"}</span>
            <button type="button" className="topbar-logout" disabled={cerrando} onClick={async () => {
              setCerrando(true);
              const respuesta = await solicitudes.cerrarSesion();
              if (respuesta.ok) window.location.replace("/login");
              else {
                setError(respuesta.error ?? "No se pudo cerrar la sesión.");
                setCerrando(false);
              }
            }}>Cerrar sesión</button>
          </div>
        </div>
        {error && <p role="alert">{error}</p>}
        {children}
      </div>
    </div></PerfilAdministrativo.Provider>
  );
}
