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

  const [tab, setTab]                       = useState<Tab>("dni");
  const [dni, setDni]                       = useState("");
  const [correo, setCorreo]                 = useState("");
  const [password, setPassword]             = useState("");
  const [error, setError]                   = useState("");
  const [cargando, setCargando]             = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [mensajeRecuperar, setMensajeRecuperar] = useState("");
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false);

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

  // ── Google OAuth (mock: redirige al flujo OAuth real cuando el backend lo soporte) ──
  function handleGoogle() {
    setCargandoGoogle(true);
    // En producción: window.location.href = `${API_URL}/auth/google`
    // Por ahora simulamos el flujo con feedback claro al usuario
    setTimeout(() => {
      setCargandoGoogle(false);
      setError(
        "El inicio de sesión con Google aún no está habilitado para este entorno. " +
        "Por favor usa tus credenciales institucionales."
      );
    }, 1200);
  }

  // ── Recuperar contraseña ──────────────────────────────────────
  function handleEnviarRecuperar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRecuperar.trim()) return;
    setEnviandoRecuperar(true);
    setTimeout(() => {
      setEnviandoRecuperar(false);
      setMensajeRecuperar(
        `Si el correo ${emailRecuperar} está registrado, recibirás las instrucciones en breve.`
      );
    }, 1000);
  }

  function cerrarModalRecuperar() {
    setModalRecuperar(false);
    setEmailRecuperar("");
    setMensajeRecuperar("");
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

          {/* Enlace ¿Olvidaste tu contraseña? */}
          <button
            type="button"
            className="login-olvidaste"
            onClick={() => { setError(""); setModalRecuperar(true); }}
          >
            ¿Olvidaste tu contraseña?
          </button>

          <button
            type="submit"
            className="btn btn-rojo"
            style={{ marginTop: 16, width: "100%" }}
            disabled={cargando}
            aria-busy={cargando}
          >
            {cargando ? "Verificando…" : "INGRESAR"}
          </button>
        </form>

        {/* Separador OR */}
        <div className="login-separador" aria-hidden="true">
          <span className="login-separador-linea" />
          <span className="login-separador-icono">⊕</span>
          <span className="login-separador-linea" />
        </div>

        {/* Botón Google */}
        <button
          type="button"
          className="btn-google"
          onClick={handleGoogle}
          disabled={cargandoGoogle}
          aria-busy={cargandoGoogle}
        >
          {cargandoGoogle ? (
            <span className="btn-google-cargando" aria-live="polite">
              <span className="btn-google-spinner" aria-hidden="true" />
              Conectando…
            </span>
          ) : (
            <>
              <GoogleIcon />
              Iniciar sesión con Google
            </>
          )}
        </button>

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

      {/* Modal recuperar contraseña */}
      {modalRecuperar && (
        <div
          className="login-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-recuperar-titulo"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModalRecuperar(); }}
        >
          <div className="login-modal">
            <div className="login-modal-header">
              <h2 id="modal-recuperar-titulo" className="login-modal-titulo serif">
                Recuperar contraseña
              </h2>
              <button
                className="modal-cerrar"
                onClick={cerrarModalRecuperar}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="login-modal-body">
              {mensajeRecuperar ? (
                <div className="alerta alerta-exito" role="status">
                  {mensajeRecuperar}
                </div>
              ) : (
                <>
                  <p className="login-modal-desc">
                    Ingresa tu correo institucional y te enviaremos las instrucciones
                    para restablecer tu contraseña.
                  </p>
                  <form onSubmit={handleEnviarRecuperar} noValidate>
                    <label htmlFor="email-recuperar" className="campo-label">
                      Correo institucional
                    </label>
                    <input
                      id="email-recuperar"
                      type="email"
                      className="campo-input"
                      placeholder="usuario@unsch.edu.pe"
                      value={emailRecuperar}
                      onChange={(e) => setEmailRecuperar(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-rojo"
                      style={{ marginTop: 20, width: "100%" }}
                      disabled={enviandoRecuperar || !emailRecuperar.trim()}
                      aria-busy={enviandoRecuperar}
                    >
                      {enviandoRecuperar ? "Enviando…" : "Enviar instrucciones"}
                    </button>
                  </form>
                </>
              )}
              <button
                type="button"
                className="login-volver"
                style={{ marginTop: 12, display: "block" }}
                onClick={cerrarModalRecuperar}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Logo de Google en SVG (oficial) ──────────────────────────
function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
