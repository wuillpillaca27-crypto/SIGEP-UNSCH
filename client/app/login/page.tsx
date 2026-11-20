"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { solicitudes } from "../grados-titulos/solicitudes-api";
import { api } from "../lib/api";
import { API_URL } from "../lib/constants";
import styles from "./institucional.module.css";

const dibujos = {
  dni: "M3 5h18v14H3zM13 9h5m-5 4h5m-5 3h3M6 15c0-2 5-2 5 0M8.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  correo: "M3 5h18v14H3zM3 6l9 7 9-7",
  candado: "M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3m-4 4v3",
  ojo: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  oculto: "M3 3l18 18M10 6a10 10 0 0 1 2 0c6 0 10 6 10 6a13 13 0 0 1-3 3M15 18a11 11 0 0 1-3 0c-6 0-10-6-10-6a14 14 0 0 1 4-4",
  acceso: "M12 4h8v16h-8M4 12h12m-4-4 4 4-4 4",
  persona: "M7 21v-3a5 5 0 0 1 5-5 5 5 0 0 1 5 5v3M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  birrete: "m2 9 10-5 10 5-10 5zm4 2v6c3 3 9 3 12 0v-6m4-2v6",
  ayuda: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zm-13-3a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1",
  inicio: "m2 11 10-8 10 8M5 10v11h5v-6h4v6h5V10",
} as const;

function Icono({ nombre }: { nombre: keyof typeof dibujos }) {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={dibujos[nombre]} /></svg>;
}

function Google() {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 2.38 30.49 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.42 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.82 7.18l7.73 6C44.35 38.04 46.98 31.86 46.98 24.55z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.91 2.3-8.18 2.3-6.25 0-11.58-4.22-13.47-9.91l-7.98 6.19C6.5 42.62 14.61 48 24 48z"/>
  </svg>;
}

export default function Pagina() {
  return <Suspense fallback={<main className={styles.fondo}>Cargando acceso…</main>}><Ingreso /></Suspense>;
}

function Ingreso() {
  const parametros = useSearchParams();
  const [modo, setModo] = useState<"dni" | "email">("dni");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");
  const [campos, setCampos] = useState({ identificador: "", clave: "" });
  const [ocupado, setOcupado] = useState(false);
  const [google, setGoogle] = useState<boolean>();
  const enviando = useRef(false);

  useEffect(() => {
    let activo = true;
    try {
      for (const clave of ["token", "sigep-token", "sigep-usuario"]) localStorage.removeItem(clave);
    } catch { /* Limpiar sesiones antiguas es opcional para el acceso por cookie. */ }
    api.get<{ habilitado: boolean }>("/auth/google/estado").then((r) => {
      if (activo) setGoogle(r.datos?.habilitado === true);
    });
    return () => { activo = false; };
  }, []);

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
    const form = evento.currentTarget;
    const datos = new FormData(form);
    const usuario = String(datos.get("identificador")).trim();
    const clave = String(datos.get("clave"));
    const identificadorValido = modo === "dni" ? /^\d{8}$/.test(usuario) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario);
    const validacion = {
      identificador: identificadorValido ? "" : modo === "dni" ? "Ingresa un DNI de 8 dígitos." : "Ingresa un correo electrónico válido.",
      clave: !clave ? "Ingresa tu contraseña." : new TextEncoder().encode(clave).length > 72 ? "La contraseña supera la longitud admitida." : "",
    };
    setCampos(validacion);
    setError("");
    if (validacion.identificador || validacion.clave) {
      const primera = form.elements.namedItem(validacion.identificador ? "identificador" : "clave");
      if (primera instanceof HTMLElement) primera.focus();
      return;
    }
    enviando.current = true;
    setOcupado(true);
    try {
      const respuesta = await solicitudes.ingresar(usuario, clave);
      if (!respuesta.datos) {
        setError(respuesta.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const { usuario: perfil } = respuesta.datos;
      const personal = ["administrador", "operador"].includes(perfil.rol);
      if (!personal && !(perfil.rol === "estudiante" && perfil.estudiante)) {
        await solicitudes.cerrarSesion();
        setError("Esta cuenta no tiene acceso a trámites de estudiante ni al panel.");
        return;
      }
      const solicitado = parametros.get("continuar") ?? "";
      const permitido = personal ? /^\/admin(?:\/|$)/ : /^\/(?:mis-tramites|grados-titulos\/iniciar-solicitud|certificaciones\/iniciar-solicitud)(?:\/|$)/;
      const destino = solicitado.startsWith("/") && !solicitado.startsWith("//") && !/[\\\x00-\x20]/.test(solicitado)
        ? new URL(solicitado, location.origin) : null;
      window.location.replace(destino && permitido.test(destino.pathname)
        ? destino.pathname + destino.search + destino.hash : personal ? "/admin" : "/mis-tramites");
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }

  return (
    <main className={styles.fondo}>
      <div className={styles.tarjeta}>
        <div className={styles.marca}>
          <Image src="/escudo-unsch.png" alt="Escudo UNSCH" width={49} height={63} priority />
          <div><strong className="serif">SIGEP-<span>UNSCH</span></strong><p>Escuela de Posgrado</p></div>
        </div>
        <div className={styles.bienvenida}>
          <span className={styles.birrete}><Icono nombre="birrete" /></span>
          <p className={styles.saludo}>¡Bienvenidos a SIGEP-UNSCH!</p>
          <p>Sistema Integral de Gestión y Validación de Grados, Títulos y Certificaciones</p>
        </div>
        <header className={styles.encabezado}>
          <span className={styles.persona}><Icono nombre="persona" /></span>
          <div><h1>Iniciar sesión</h1><p>Utiliza tu DNI o el correo personal registrado y tu contraseña.</p></div>
        </header>
        <div className={styles.metodos} role="group" aria-label="Método de ingreso">
          {(["dni", "email"] as const).map((tipo) => (
            <button key={tipo} type="button" disabled={ocupado} aria-pressed={modo === tipo} onClick={() => {
              setModo(tipo); setCampos((prev) => ({ ...prev, identificador: "" })); setError("");
            }}>
              <Icono nombre={tipo === "dni" ? "dni" : "correo"} />{tipo === "dni" ? "DNI" : "Correo personal"}
            </button>
          ))}
        </div>
        {(error || parametros.get("google") === "error") && <p className={styles.error} role="alert">{error || "No se pudo iniciar sesión con Google. Utiliza tus credenciales de SIGEP."}</p>}
        <form className={styles.formulario} onSubmit={ingresar} noValidate aria-busy={ocupado}>
          <label htmlFor="identificador">{modo === "dni" ? "DNI" : "Correo personal"}</label>
          <div className={styles.campo}><Icono nombre={modo === "dni" ? "dni" : "correo"} />
            <input key={modo} id="identificador" name="identificador" autoComplete="username" type={modo === "dni" ? "text" : "email"}
              inputMode={modo === "dni" ? "numeric" : "email"} placeholder={modo === "dni" ? "Ingrese su DNI" : "Ingrese su correo personal"}
              aria-invalid={Boolean(campos.identificador)} aria-describedby={campos.identificador ? "error-identificador" : undefined}
              maxLength={modo === "dni" ? 8 : 254} required disabled={ocupado}
              onChange={() => setCampos((prev) => ({ ...prev, identificador: "" }))} />
          </div>
          {campos.identificador && <p id="error-identificador" className={styles.error} role="alert">{campos.identificador}</p>}
          <label htmlFor="clave">Contraseña</label>
          <div className={styles.campo}><Icono nombre="candado" />
            <input id="clave" name="clave" type={mostrar ? "text" : "password"} placeholder="Ingrese su contraseña" autoComplete="current-password" required disabled={ocupado}
              aria-invalid={Boolean(campos.clave)} aria-describedby={campos.clave ? "error-clave" : undefined}
              onChange={() => setCampos((prev) => ({ ...prev, clave: "" }))} />
            <button type="button" className={styles.ojo} aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setMostrar(!mostrar)}>
              <Icono nombre={mostrar ? "oculto" : "ojo"} />
            </button>
          </div>
          {campos.clave && <p id="error-clave" className={styles.error} role="alert">{campos.clave}</p>}
          <a className={styles.recuperar} href="https://campus.unsch.edu.pe/recuperar-contrasena" target="_blank" rel="noopener noreferrer">¿Olvidaste tu contraseña?</a>
          <button type="submit" className={styles.ingresar} disabled={ocupado}><Icono nombre="acceso" />{ocupado ? "Ingresando…" : "Ingresar"}</button>
        </form>
        <p className={styles.separador}>o también puedes ingresar con</p>
        {google && !ocupado
          ? <a className={styles.google} href={API_URL + "/auth/google/iniciar"}><Google />Continuar con Google</a>
          : <button type="button" className={styles.google} disabled><Google />Continuar con Google</button>}
        {google === false && <p className={styles.estadoGoogle}>Google aún no está habilitado en este entorno.</p>}
        <footer className={styles.pie}>
          <Link href="/ayuda"><Icono nombre="ayuda" />Ayuda con mi cuenta</Link>
          <Link href="/"><Icono nombre="inicio" />Volver al inicio</Link>
        </footer>
      </div>
    </main>
  );
}
