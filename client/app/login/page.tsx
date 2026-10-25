"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Credenciales de prueba (sin backend) ──────────────────────
const USUARIOS_MOCK = [
  {
    dni:      "12345678",
    password: "admin123",
    correo:   "admin@unsch.edu.pe",
    nombre:   "Administrador SIGEP",
    rol:      "administrador",
  },
];

type Tab = "dni" | "correo";

export default function LoginPage() {
  const router = useRouter();

  const [tab, setTab]           = useState<Tab>("dni");
  const [dni, setDni]           = useState("");
  const [correo, setCorreo]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [cargando, setCargando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tab === "dni" && (!dni || !password)) {
      setError("Completa todos los campos.");
      return;
    }
    if (tab === "correo" && (!correo || !password)) {
      setError("Completa todos los campos.");
      return;
    }

    setCargando(true);

    setTimeout(() => {
      const usuario =
        tab === "dni"
          ? USUARIOS_MOCK.find(
              (u) => u.dni === dni.trim() && u.password === password
            )
          : USUARIOS_MOCK.find(
              (u) =>
                u.correo.toLowerCase() === correo.trim().toLowerCase() &&
                u.password === password
            );

      if (!usuario) {
        setError(
          tab === "dni"
            ? "DNI o contraseña incorrectos."
            : "Correo o contraseña incorrectos."
        );
        setCargando(false);
        return;
      }

      localStorage.setItem("sigep-token",   "mock-token-local");
      localStorage.setItem("sigep-usuario", JSON.stringify(usuario));
      router.push("/admin");
    }, 300);
  }

  function cambiarTab(t: Tab) {
    setTab(t);
    setError("");
    setDni("");
    setCorreo("");
    setPassword("");
  }

  return (
    <main className="login-wrap">
      <div className="login-card">

        {/* Cabecera */}
        <div className="login-header">
          <Image
            src="/escudo-unsch.png"
            alt="Escudo UNSCH"
            width={56}
            height={72}
            priority
          />
          <div>
            <div className="login-title serif">SIGEP</div>
            <div className="login-sub">
              UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA
            </div>
          </div>
        </div>

        <h1 className="login-h1 serif">Iniciar sesión</h1>
        <p className="login-desc">Ingrese sus credenciales institucionales</p>

        {/* Tabs */}
        <div className="login-tabs" role="tablist" aria-label="Método de ingreso">
          <button
            role="tab"
            aria-selected={tab === "dni"}
            className={`login-tab${tab === "dni" ? " login-tab-activo" : ""}`}
            onClick={() => cambiarTab("dni")}
            type="button"
          >
            DNI
          </button>
          <button
            role="tab"
            aria-selected={tab === "correo"}
            className={`login-tab${tab === "correo" ? " login-tab-activo" : ""}`}
            onClick={() => cambiarTab("correo")}
            type="button"
          >
            Correo institucional
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alerta alerta-error" role="alert">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label={tab === "dni" ? "Ingresar con DNI" : "Ingresar con correo"}
        >
          {tab === "dni" ? (
            <>
              <label htmlFor="dni" className="campo-label">DNI</label>
              <input
                id="dni"
                name="dni"
                type="text"
                inputMode="numeric"
                className="campo-input"
                placeholder="Número de DNI (8 dígitos)"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                autoComplete="username"
                required
              />
            </>
          ) : (
            <>
              <label htmlFor="correo" className="campo-label">
                Correo institucional
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                className="campo-input"
                placeholder="usuario@unsch.edu.pe"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                required
              />
            </>
          )}

          <label
            htmlFor="password"
            className="campo-label"
            style={{ marginTop: 16 }}
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="campo-input"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className="btn btn-rojo"
            style={{ marginTop: 24, width: "100%" }}
            disabled={cargando}
            aria-busy={cargando}
          >
            {cargando ? "Verificando…" : "INGRESAR"}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div className="login-demo">
          <span className="login-demo-titulo">Credenciales de prueba</span>
          <div className="login-demo-fila">
            <span>DNI</span>
            <code>12345678</code>
          </div>
          <div className="login-demo-fila">
            <span>Correo</span>
            <code>admin@unsch.edu.pe</code>
          </div>
          <div className="login-demo-fila">
            <span>Contraseña</span>
            <code>admin123</code>
          </div>
        </div>

        <a href="/" className="login-volver">← Volver al inicio</a>
      </div>
    </main>
  );
}
