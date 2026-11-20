"use client";

import { createContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { solicitudes, type Perfil } from "../grados-titulos/solicitudes-api";
import { SelloPosgrado } from "../grados-titulos/orientacion";
import styles from "../grados-titulos/orientacion.module.css";

export const PerfilEstudiante = createContext<Perfil | null>(null);

export default function Sesion({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    solicitudes.perfil().then((respuesta) => {
      if (!vigente) return;
      const cuenta = respuesta.datos;
      const estudiante = cuenta?.rol === "estudiante" && cuenta.estudiante ? cuenta : null;
      setPerfil(estudiante);
      if (cuenta && !estudiante) setError("Usa una cuenta de estudiante para acceder.");
      else if (!respuesta.ok && respuesta.estadoHttp !== 401) setError(respuesta.error ?? "No se pudo verificar la sesión.");
    });
    return () => { vigente = false; };
  }, [intento]);

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    setOcupado(true);
    setError("");
    try {
      const resultado = await solicitudes.ingresar(String(formulario.get("usuario")).trim(), String(formulario.get("password")));
      const datos = resultado.datos;
      if (!datos) setError(resultado.error ?? "No se pudo iniciar sesión.");
      else if (datos.usuario.rol !== "estudiante" || !datos.usuario.estudiante) setError("Usa una cuenta de estudiante para acceder.");
      else {
        setPerfil(datos.usuario);
      }
    } finally {
      setOcupado(false);
    }
  }

  if (perfil) return <PerfilEstudiante.Provider value={perfil}>
    <div className="pub-secciones" style={{ textAlign: "right" }}>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-borde-carbon" type="button" disabled={ocupado} onClick={async () => {
        setOcupado(true);
        const respuesta = await solicitudes.cerrarSesion();
        if (respuesta.ok) window.location.replace("/login");
        else {
          setError(respuesta.error ?? "No se pudo cerrar la sesión.");
          setOcupado(false);
        }
      }}>Cerrar sesión</button>
    </div>
    {children}
  </PerfilEstudiante.Provider>;

  return (
    <main className={styles.pagina}>
      <header className={styles.hero}><SelloPosgrado /><h1>Mis Trámites</h1><p>Ingresa con tu cuenta de estudiante para gestionar tus solicitudes.</p></header>
      <section className={styles.panel}>
        {perfil === undefined ? <p role="status">Verificando sesión…</p> : (
          <form className={styles.formulario} onSubmit={ingresar} aria-busy={ocupado}>
            <h2>Acceso de estudiante</h2>
            {error && <p role="alert">{error}</p>}
            <label>DNI o correo personal registrado<input name="usuario" autoComplete="username" required /></label>
            <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
            <div className={styles.controles}>
              <button type="submit" disabled={ocupado}>{ocupado ? "Verificando…" : "Ingresar"}</button>
              {error && <button type="button" disabled={ocupado} onClick={() => {
                setError("");
                setPerfil(undefined);
                setIntento(intento + 1);
              }}>Volver a verificar sesión</button>}
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
