"use client";

import { useContext, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { PerfilAdministrativo } from "./perfil";
import styles from "../grados-titulos/orientacion.module.css";

const programasTipos = {
  maestria: "Maestría", doctorado: "Doctorado", segunda_especialidad: "Segunda especialidad",
  diplomado: "Diplomado", certificacion_modulos: "Certificación por módulos",
};
const secciones = {
  estudiantes: "Estudiantes", programas: "Programas académicos", usuarios: "Usuarios y permisos",
  requisitos: "Plantillas de requisitos", auditoria: "Auditoría del sistema", configuracion: "Configuración",
};
type Seccion = keyof typeof secciones;
type Cuenta = { nombres: string; apellidos: string; dni: string; email: string; rol: string; activo: boolean };
type Fila = Partial<Cuenta> & {
  id: number; codigo?: string; nombre?: string; tipo?: string; facultad?: string; codigoUniv?: string;
  estadoAcad?: string; accion?: string; entidadId?: number; creadoEn?: string; versionNorm?: string;
  fechaInicio?: string; fechaFin?: string | null; habilitadoTramites?: boolean;
  programa?: { nombre: string }; usuario?: Cuenta;
};
type Programa = { id: number; nombre: string; activo: boolean };
type Resultado = Fila[] | { datos: Fila[]; siguiente: boolean } | Record<string, string>;

export default function Gestion({ seccion }: { seccion: Seccion }) {
  const perfil = useContext(PerfilAdministrativo);
  const [resultado, setResultado] = useState<Resultado>();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [pagina, setPagina] = useState(1);
  const [version, setVersion] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [rol, setRol] = useState("estudiante");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const editable = perfil?.rol === "administrador" && ["programas", "usuarios", "requisitos"].includes(seccion);
  const gestionaMatriculas = perfil?.rol === "administrador" && seccion === "estudiantes";
  const requiereProgramas = (editable && seccion !== "programas") || gestionaMatriculas;

  useEffect(() => {
    let activo = true;
    api.get<Resultado>(`/administracion/${seccion}?pagina=${pagina}`).then((r) => {
      if (activo) {
        setResultado(r.datos);
        setError(r.error ?? "");
      }
    });
    if (requiereProgramas) api.get<Programa[]>("/administracion/programas").then((r) => {
      if (activo && r.datos) setProgramas(r.datos.filter((item) => item.activo));
    });
    return () => { activo = false; };
  }, [seccion, pagina, version, requiereProgramas]);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const r = await api.post<unknown>(`/administracion/${seccion}`, Object.fromEntries(new FormData(form)));
      if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      else {
        form.reset();
        setRol("estudiante");
        setMensaje("Registro guardado.");
        setPagina(1);
        setVersion(version + 1);
      }
    } finally { setOcupado(false); }
  }

  async function guardarMatricula(evento: FormEvent<HTMLFormElement>, id?: number) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const datos = { ...Object.fromEntries(campos), habilitadoTramites: campos.has("habilitadoTramites") };
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const respuesta = id ? await api.patch(`/administracion/matriculas/${id}`, datos)
        : await api.post("/administracion/matriculas", datos);
      if (respuesta.ok) {
        if (!id) { formulario.reset(); setPagina(1); }
        setVersion((previa) => previa + 1);
        setMensaje("Matrícula guardada.");
      } else setError(respuesta.error ?? "No se pudo guardar la matrícula.");
    } finally { setOcupado(false); }
  }

  const listado = resultado && !Array.isArray(resultado) && "datos" in resultado && Array.isArray(resultado.datos) ? resultado : undefined;
  const filas: Fila[] | undefined = Array.isArray(resultado) ? resultado : Array.isArray(listado?.datos) ? listado.datos : undefined;
  const selectorPrograma = <label>Programa<select name="programaId" required defaultValue=""><option value="">Selecciona un programa activo</option>{programas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>;
  return (
    <main className={styles.pagina}>
      <h1 className="serif">{secciones[seccion]}</h1>
      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      {seccion === "estudiantes" && perfil?.rol === "administrador" && <Link href="/admin/usuarios">Registrar estudiante</Link>}
      {gestionaMatriculas && <section className={styles.panel}><h2>Asignar programa a una cuenta existente</h2>
        <form className={styles.formulario} onSubmit={guardarMatricula}>
          <label>DNI de la cuenta<input name="dni" required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} /></label>
          <label>Código universitario de la matrícula<input name="codigoUniv" required maxLength={40} /></label>
          {selectorPrograma}
          <CamposMatricula />
          <button disabled={ocupado}>Asignar programa</button>
        </form>
      </section>}
      {editable && (
        <section className={styles.panel}><h2>Nuevo registro</h2>
          <form className={styles.formulario} onSubmit={guardar}>
            {seccion === "programas" && <>
              <label>Nombre<input name="nombre" required maxLength={160} /></label>
              <label>Facultad<input name="facultad" required maxLength={160} /></label>
              <label>Tipo<select name="tipo" required>{Object.entries(programasTipos).map(([tipo, nombre]) => <option key={tipo} value={tipo}>{nombre}</option>)}</select></label>
            </>}
            {seccion === "usuarios" && <>
              <label>Nombres<input name="nombres" required maxLength={100} /></label>
              <label>Apellidos<input name="apellidos" required maxLength={100} /></label>
              <label>DNI<input name="dni" required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} /></label>
              <label>Correo personal<input name="email" type="email" required maxLength={254} /></label>
              <label>Contraseña inicial<input name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password" /></label>
              <label>Rol<select name="rol" value={rol} onChange={(e) => setRol(e.target.value)}><option value="estudiante">Estudiante</option><option value="operador">Operador</option><option value="administrador">Administrador</option></select></label>
              {rol === "estudiante" && <><label>Código universitario<input name="codigoUniv" required maxLength={40} /></label>{selectorPrograma}</>}
            </>}
            {seccion === "requisitos" && <>
              {selectorPrograma}
              <label>Código<input name="codigo" required maxLength={50} /></label>
              <label>Nombre<input name="nombre" required maxLength={160} /></label>
              <label>Descripción<textarea name="descripcion" required maxLength={2000} /></label>
              <label>Referencia normativa<input name="versionNorm" required maxLength={100} /></label>
              <label>Obligatoriedad<select name="obligatorio"><option value="true">Obligatorio</option><option value="false">Opcional</option></select></label>
              <label>Publicación<select name="activo"><option value="false">Guardar sin publicar</option><option value="true">Publicar</option></select></label>
              <label>Tipo<select name="tipo" required><option value="documental">Documental</option><option value="academico">Académico</option><option value="idioma">Idioma</option><option value="pago">Pago</option><option value="otro">Otro</option></select></label>
            </>}
            <button type="submit" disabled={ocupado}>{ocupado ? "Guardando…" : "Guardar registro"}</button>
          </form>
        </section>
      )}
      <section className={styles.panel}>
        {!resultado && !error && <p role="status">Consultando registros…</p>}
        {filas?.length === 0 && <p>No hay registros que mostrar.</p>}
        {filas && filas.length > 0 && <ul className={styles.lista}>{filas.map((fila) => {
          const cuenta = fila.usuario ?? fila;
          return <li key={fila.id}>
            <strong>{fila.nombre ?? `${cuenta.nombres} ${cuenta.apellidos}`}</strong>
            <p>{[fila.codigoUniv, fila.programa?.nombre, fila.facultad, fila.tipo, fila.codigo, fila.versionNorm, fila.estadoAcad,
              seccion !== "auditoria" && cuenta.dni, seccion === "usuarios" && cuenta.email, seccion === "usuarios" && cuenta.rol,
              fila.accion, fila.entidadId && `Expediente ${fila.entidadId}`, fila.creadoEn && new Date(fila.creadoEn).toLocaleString("es-PE")].filter(Boolean).join(" · ")}</p>
            {gestionaMatriculas && <details><summary>Editar matrícula</summary>
              <form key={version} className={styles.formulario} onSubmit={(evento) => guardarMatricula(evento, fila.id)}>
                <CamposMatricula fila={fila} />
                <button disabled={ocupado}>Actualizar matrícula</button>
              </form>
            </details>}
          </li>;
        })}</ul>}
        {seccion === "configuracion" && resultado && <dl>{Object.entries(resultado).map(([etiqueta, valor]) => (
          <div key={etiqueta}><dt>{({ sistema: "Sistema", ingreso: "Inicio de sesión", tamanoMaximoPDF: "Tamaño máximo de PDF", vigenciaSesion: "Vigencia de sesión" } as Record<string, string>)[etiqueta] ?? etiqueta}</dt><dd>{String(valor)}</dd></div>
        ))}</dl>}
        {listado && <div className={styles.controles}>
          <button type="button" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina}</span>
          <button type="button" disabled={!listado.siguiente} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
        </div>}
      </section>
    </main>
  );
}

function CamposMatricula({ fila }: { fila?: Fila }) {
  return <>
    <label>Estado académico<select name="estadoAcad" defaultValue={fila?.estadoAcad ?? "activo"}>
      <option value="activo">Activo</option><option value="egresado">Egresado</option><option value="graduado">Graduado</option>
      <option value="suspendido">Suspendido</option><option value="retirado">Retirado</option>
    </select></label>
    <label>Fecha de inicio<input type="date" name="fechaInicio" required defaultValue={fila?.fechaInicio?.slice(0, 10)} /></label>
    <label>Fecha de fin<input type="date" name="fechaFin" defaultValue={fila?.fechaFin?.slice(0, 10)} /></label>
    <label><span><input type="checkbox" name="habilitadoTramites" defaultChecked={fila?.habilitadoTramites ?? true} /> Habilitar trámites</span></label>
  </>;
}
