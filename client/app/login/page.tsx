// TODO: conectar con authService.login()
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <Image src="/escudo-unsch.png" alt="Escudo UNSCH" width={56} height={72} priority />
          <div>
            <div className="login-title serif">SIGEP</div>
            <div className="login-sub">UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA</div>
          </div>
        </div>

        <h1 className="login-h1 serif">Iniciar sesión</h1>
        <p className="login-desc">Ingrese sus credenciales institucionales</p>

        <form className="login-form" action="#" method="post">
          <label htmlFor="dni" className="campo-label">DNI</label>
          <input id="dni" name="dni" type="text" className="campo-input" placeholder="Número de DNI" maxLength={8} required />

          <label htmlFor="password" className="campo-label" style={{ marginTop: 16 }}>Contraseña</label>
          <input id="password" name="password" type="password" className="campo-input" placeholder="Contraseña" required />

          <button type="submit" className="btn btn-rojo" style={{ marginTop: 24, width: "100%" }}>
            INGRESAR
          </button>
        </form>

        <a href="/" className="login-volver">← Volver al inicio</a>
      </div>
    </main>
  );
}
