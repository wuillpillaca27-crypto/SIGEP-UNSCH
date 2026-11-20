"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { solicitudes } from "../grados-titulos/solicitudes-api";

export default function Pagina() {
  return <Suspense fallback={<main className="login-wrap">Cargando acceso…</main>}><Ingreso /></Suspense>;
}

function Ingreso() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [modo, setModo] = useState<"dni" | "email">("dni");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const usuario = String(datos.get("identificador")).trim();
    setOcupado(true);
    setError("");
    try {
      const respuesta = await solicitudes.ingresar(usuario, String(datos.get("clave")));
      if (!respuesta.datos) {
        setError(respuesta.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const { token, usuario: perfil } = respuesta.datos;
      const personal = ["administrador", "operador"].includes(perfil.rol);
      const estudiante = perfil.rol === "estudiante" && perfil.estudiante;
      if (!personal && !estudiante) {
        setError("Esta cuenta no tiene acceso al panel ni a trámites de estudiante.");
        return;
      }
      localStorage.removeItem("sigep-token");
      localStorage.removeItem("sigep-usuario");
      localStorage.setItem("token", token);
      const solicitado = parametros.get("continuar") ?? "";
      const permitido = personal ? /^\/admin(?:\/|$)/ : /^\/(?:mis-tramites|grados-titulos\/iniciar-solicitud|certificaciones\/iniciar-solicitud)(?:\/|$)/;
      const destino = solicitado.startsWith("/") && !solicitado.startsWith("//") && !/[\\\x00-\x20]/.test(solicitado)
        ? new URL(solicitado, location.origin) : null;
      router.replace(destino && permitido.test(destino.pathname)
        ? destino.pathname + destino.search + destino.hash : personal ? "/admin" : "/mis-tramites");
    } finally { setOcupado(false); }
  }

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <Image src="/escudo-unsch.png" alt="Escudo UNSCH" width={54} height={70} />
          <div><div className="login-title serif">SIGEP-UNSCH</div><div className="login-sub">Escuela de Posgrado</div></div>
        </div>
        <h1 className="serif">Iniciar sesión</h1>
        <p>Utiliza tu DNI o el correo personal registrado y tu contraseña.</p>
        <div className="login-tabs" aria-label="Método de ingreso">
          <button type="button" className={`login-tab${modo === "dni" ? " login-tab-activo" : ""}`} aria-pressed={modo === "dni"} onClick={() => { setModo("dni"); setError(""); }}>DNI</button>
          <button type="button" className={`login-tab${modo === "email" ? " login-tab-activo" : ""}`} aria-pressed={modo === "email"} onClick={() => { setModo("email"); setError(""); }}>Correo personal</button>
        </div>
        {error && <p className="alerta alerta-error" role="alert">{error}</p>}
        <form className="login-form" onSubmit={ingresar}>
          <label className="campo-label" htmlFor="identificador">{modo === "dni" ? "DNI" : "Correo personal"}</label>
          <input key={modo} className="campo-input" id="identificador" name="identificador" autoComplete="username" type={modo === "dni" ? "text" : "email"} inputMode={modo === "dni" ? "numeric" : "email"} pattern={modo === "dni" ? "[0-9]{8}" : undefined} required />
          <label className="campo-label" htmlFor="clave">Contraseña</label>
          <input className="campo-input" id="clave" name="clave" type="password" autoComplete="current-password" required />
          <button type="submit" className="btn btn-rojo" disabled={ocupado}>{ocupado ? "Ingresando…" : "Ingresar"}</button>
        </form>
        <p><Link href="/ayuda">Ayuda con mi cuenta</Link></p>
        <Link href="/">Volver al inicio</Link>
      </div>
    </main>
  );
}
