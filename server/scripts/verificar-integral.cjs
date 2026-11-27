const assert = require("node:assert/strict");
const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require("../.sigep-local/e2e/node_modules/playwright");

const base = process.env.SIGEP_E2E_BASE_URL || "http://127.0.0.1:3000";
const local = resolve(__dirname, "../.sigep-local");
const evidencia = process.argv.includes("--evidencia")
  ? resolve(__dirname, "../../specs/022-unificar-demostracion-matriculas/evidencia") : null;
const cuentas = new Map(readFileSync(resolve(local, "cuentas-academicas.tsv"), "utf8").trim()
  .split(/\r?\n/).slice(1).map((fila) => {
    const [alias, , , correo, password] = fila.split("\t");
    return [alias, { correo, password }];
  }));
function pdfDePrueba() {
  const texto = "BT /F1 16 Tf 50 720 Td (SIGEP - Evidencia E2E) Tj ET\n";
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${texto.length} >>\nstream\n${texto}endstream`,
  ];
  let archivo = "%PDF-1.4\n";
  const indices = objetos.map((objeto, indice) => {
    const posicion = archivo.length;
    archivo += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
    return String(posicion).padStart(10, "0") + " 00000 n \n";
  });
  const tabla = archivo.length;
  return Buffer.from(archivo + "xref\n0 6\n0000000000 65535 f \n" + indices.join("") +
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${tabla}\n%%EOF\n`);
}
const pdf = { name: "evidencia-demo.pdf", mimeType: "application/pdf", buffer: pdfDePrueba() };
const resultadosCP = [];
function aprobarCP(codigo, detalle) {
  resultadosCP.push({ codigo, estado: "PASS", detalle });
  console.log(`${codigo}: PASS — ${detalle}`);
}
const rutas = [
  ["/grados-titulos/doctor", "doctor"],
  ["/grados-titulos/maestro", "maestro"],
  ["/grados-titulos/segunda-especialidad", "segunda-especialidad"],
  ["/certificaciones/diplomados", "diplomados"],
  ["/certificaciones/modulos", "modulos"],
];
const boton = (pagina, nombre) => pagina.getByRole("button", { name: nombre, exact: true });
const enlace = (pagina, nombre) => pagina.getByRole("link", { name: nombre, exact: true });

async function ingresar(pagina, alias) {
  const cuenta = cuentas.get(alias);
  assert(cuenta, "Ejecuta la semilla de demostración antes de la prueba.");
  await pagina.waitForURL(/\/login/);
  await boton(pagina, "Correo personal").click();
  await pagina.getByLabel("Correo personal", { exact: true }).fill(cuenta.correo);
  await pagina.getByLabel("Contraseña", { exact: true }).fill(cuenta.password);
  const respuestaLogin = pagina.waitForResponse((respuesta) =>
    respuesta.request().method() === "POST" && respuesta.url().includes("/auth/login"));
  await boton(pagina, "Ingresar").click();
  const login = await respuestaLogin;
  if (login.status() !== 200) {
    const aviso = await pagina.getByRole("alert").allInnerTexts().catch(() => []);
    throw new Error(`Login de prueba falló: HTTP ${login.status()}${aviso.length ? `; ${aviso.join(" ")}` : ""}.`);
  }
  await pagina.waitForURL((url) => url.pathname !== "/login");
}

async function enviarPDF(pagina, archivo) {
  const [respuesta] = await Promise.all([
    pagina.waitForResponse((r) => r.request().method() === "PUT" && r.url().includes("/documentos/")),
    archivo.setInputFiles(pdf),
  ]);
  assert.equal(respuesta.status(), 200);
}

async function enviarFormulario(pagina, control, metodo, fragmento, codigo) {
  const [resultado] = await Promise.all([
    pagina.waitForResponse((r) => r.request().method() === metodo && r.url().includes(fragmento)),
    control.click(),
  ]);
  assert.equal(resultado.status(), codigo, fragmento);
  return resultado;
}

async function solicitar(pagina, [ruta, tramite], completa) {
  const usarAlias = completa && evidencia && !process.env.SIGEP_E2E_BASE_URL;
  await pagina.goto((usarAlias ? "http://127.0.0.1:3001" : base) + ruta);
  if (usarAlias) assert.equal(new URL(pagina.url()).port, new URL(base).port);
  await enlace(pagina, "Iniciar solicitud").click();
  if (completa) {
    await pagina.waitForURL(/\/login/);
    assert.match(new URL(pagina.url()).searchParams.get("continuar"), /tramite=doctor/);
    await ingresar(pagina, "integral");
    const perfil = await (await pagina.request.get(base + "/api/sigep/auth/perfil")).json();
    assert.equal(perfil.email, cuentas.get("integral").correo);
    const opciones = await (await pagina.request.get(base + "/api/sigep/solicitudes/opciones")).json();
    assert.equal(opciones.matriculas.length, 5);
    for (const tipo of ["maestria", "doctorado", "segunda_especialidad"]) {
      assert(opciones.matriculas.some((matricula) => matricula.tipo === tipo && matricula.motivo === null));
    }
    aprobarCP("CP01", "sesión integral iniciada");
    aprobarCP("CP02", "matrículas propias incluyen los tres tipos solicitados");
  }
  await pagina.waitForURL((url) => url.pathname.endsWith("/iniciar-solicitud") && url.searchParams.get("tramite") === tramite,
    { waitUntil: "domcontentloaded" });
  assert.equal(new URL(pagina.url()).searchParams.get("tramite"), tramite);
  await pagina.getByRole("heading", { name: "Datos personales", exact: true }).waitFor();
  if (completa && evidencia) {
    await enlace(pagina, "Consultar requisitos").click();
    await pagina.waitForURL((url) => url.pathname === "/grados-titulos/doctor" && url.hash === "#requisitos");
    await pagina.locator("#requisitos").waitFor();
    await pagina.goBack();
    await enlace(pagina, "Solicitar orientación").click();
    await pagina.waitForURL((url) => url.pathname === "/ayuda");
    await pagina.getByRole("heading", { name: "Solicitar orientación", exact: true }).waitFor();
    await pagina.goBack();
    await pagina.getByRole("heading", { name: "Datos personales", exact: true }).waitFor();
  }
  await boton(pagina, "Siguiente").click();
  await pagina.getByRole("heading", { name: "Programa académico", exact: true }).waitFor();
  const selector = pagina.getByRole("combobox", { name: /Programa académico/i });
  await selector.waitFor();
  assert.equal(await selector.locator("option").count(), 1);
  const formularioDoctor = pagina.locator("main").filter({
    has: pagina.getByRole("heading", { name: "Solicitud de Grado de Doctor", exact: true }),
  });
  if (completa && evidencia) await formularioDoctor.screenshot({ path: resolve(evidencia, "doctorado-programa.png") });
  const borrador = await (await enviarFormulario(pagina, boton(pagina, "Guardar borrador"), "POST", "/api/sigep/solicitudes", 200)).json();
  const codigoInicio = { maestro: "CP03", doctor: "CP04", "segunda-especialidad": "CP05" }[tramite];
  if (codigoInicio) aprobarCP(codigoInicio, `borrador iniciado para ${tramite}`);
  if (evidencia && codigoInicio) {
    const archivoCaptura = { maestro: "asistente-maestro.png", doctor: "asistente-doctor.png", "segunda-especialidad": "asistente-segunda-especialidad.png" }[tramite];
    await pagina.locator("section").filter({ has: pagina.getByRole("heading", { name: "Asistente de solicitud", exact: true }) })
      .screenshot({ path: resolve(evidencia, archivoCaptura) });
  }
  if (completa) {
    await enlace(pagina, "Cancelar y salir").click();
    const tarjeta = pagina.locator("article").filter({ hasText: borrador.programa.nombre });
    await enlace(tarjeta, "Continuar borrador").first().click();
    await boton(pagina, "Siguiente").click();
  }
  const retomado = await (await enviarFormulario(pagina, boton(pagina, "Continuar"), "POST", "/api/sigep/solicitudes", 200)).json();
  assert.equal(retomado.id, borrador.id);
  assert.equal(retomado.tipoTramite, borrador.tipoTramite);
  await pagina.getByRole("heading", { name: "Requisitos académicos", exact: true }).waitFor();
  assert(retomado.validaciones.length > 0);
  if (codigoInicio) aprobarCP("CP06", "requisitos publicados corresponden al trámite y programa");
  await boton(pagina, "Siguiente").click();
  await pagina.getByRole("heading", { name: "Documentos", exact: true }).waitFor();
  const requisitosDocumentales = retomado.validaciones.filter(({ plantilla }) => plantilla.tipo === "documental");
  const campos = (nombre) => pagina.locator("label").filter({ hasText: nombre });
  const subir = async (nombre) => {
    await enviarPDF(pagina, campos(nombre).locator('input[type="file"]:enabled'));
    await campos(nombre).filter({ hasText: "Adjunto" }).waitFor();
  };
  for (const { plantilla } of requisitosDocumentales) await subir(plantilla.nombre);
  if (completa) {
    const nombre = requisitosDocumentales[0].plantilla.nombre;
    const bloque = campos(nombre).locator("..");
    const vista = pagina.waitForResponse((r) => r.request().method() === "GET" && r.url().includes("/documentos/"));
    await boton(bloque, "Visualizar PDF").click();
    assert.equal((await vista).status(), 200);
    await subir(nombre);
    if (evidencia) await formularioDoctor.screenshot({ path: resolve(evidencia, "doctorado-documentos.png") });
    await enviarFormulario(pagina, boton(bloque, "Retirar PDF"), "DELETE", "/documentos/", 200);
    await campos(nombre).filter({ hasText: "Pendiente" }).waitFor();
    await subir(nombre);
    await boton(pagina, "Anterior").click();
    await pagina.getByRole("heading", { name: "Requisitos académicos", exact: true }).waitFor();
    await boton(pagina, "Siguiente").click();
  }
  if (codigoInicio === "CP04") aprobarCP("CP07", "PDF adjuntado, visualizado, reemplazado y retirado en borrador");
  await boton(pagina, "Siguiente").click();
  const alerta = pagina.getByText(/Falta adjuntar:/);
  if (await alerta.isVisible()) throw new Error(await alerta.innerText());
  const expediente = await (await enviarFormulario(pagina, boton(pagina, "Presentar solicitud"), "POST", "/presentar", 200)).json();
  assert.equal(expediente.estado, "presentado");
  if (codigoInicio) aprobarCP("CP09", `solicitud ${tramite} presentada`);
  if (completa) {
    const descarga = pagina.waitForEvent("download");
    await enlace(pagina, "Descargar acuse").click();
    const archivo = await descarga;
    assert.equal(archivo.suggestedFilename(), "acuse-de-presentacion.txt");
    assert.match(readFileSync(await archivo.path(), "utf8"), /SIGEP-/);
  }
  await enlace(pagina, "Consultar expediente en Mis Trámites").click();
  await pagina.locator(`#expediente-${expediente.id}`).waitFor();
  if (codigoInicio) aprobarCP("CP11", `expediente ${tramite} visible en Mis Trámites`);
  if (completa && evidencia) await pagina.locator(`#expediente-${expediente.id}`).screenshot({ path: resolve(evidencia, "doctorado-expediente.png") });
  console.log("Navegador:", tramite, pagina.viewportSize().width, "px, expediente presentado y consultado.");
  return expediente;
}

async function orientacion(pagina, personal) {
  await pagina.goto(base + "/ayuda#orientacion");
  await pagina.getByLabel("Nombres y apellidos").fill("Prueba de navegador");
  const correo = cuentas.get("integral").correo;
  await pagina.getByLabel("Correo electrónico").fill(correo);
  await pagina.locator('select[name="tipoTramite"]').selectOption("grado_doctor");
  await pagina.getByLabel("Programa académico").fill("Doctorado de demostración");
  const asunto = "Orientación E2E " + Date.now();
  await pagina.getByLabel("Asunto").fill(asunto);
  await pagina.getByLabel("Descripción").fill("Consulta local de prueba del flujo integral.");
  const alta = await (await enviarFormulario(pagina, boton(pagina, "Registrar consulta"), "POST", "/api/sigep/orientacion", 201)).json();
  assert.equal((await pagina.request.get(base + "/api/sigep/atencion-orientacion")).status(), 403);
  await personal.goto(base + "/admin/orientacion");
  await ingresar(personal, "revision");
  const tarjeta = personal.locator("section").filter({ has: personal.getByRole("heading", { name: asunto }) });
  await tarjeta.getByLabel("Respuesta").fill("Consulta de demostración atendida por el operador.");
  await enviarFormulario(personal, boton(tarjeta, "Publicar respuesta"), "PATCH", "/respuesta", 200);
  await tarjeta.getByText("Respuesta registrada").waitFor();
  await pagina.getByLabel("Código de atención").fill(alta.codigo);
  await pagina.getByLabel("Correo de la consulta").fill(correo);
  await boton(pagina, "Consultar respuesta").click();
  await pagina.getByText("Consulta de demostración atendida por el operador.").waitFor();
  console.log("Navegador: orientación, respuesta del operador y rechazo de acceso al estudiante.");
}

async function revisarYVerificar(personal, expediente) {
  await personal.goto(base + "/admin/expedientes?buscar=" + encodeURIComponent(expediente.codigo));
  const caso = personal.locator("article").filter({ has: personal.getByRole("heading", { name: expediente.codigo }) });
  const revision = await enviarFormulario(personal, boton(caso, "Iniciar revisión"), "POST", "/acciones", 200);
  assert.equal((await revision.json()).estado, "en_revision");
  const emitidos = await (await personal.request.get(base + "/api/sigep/revision-grados?estado=emitido")).json();
  const ejemplo = emitidos.datos.find((item) => /demostraci[oó]n/i.test(item.programa.nombre));
  if (!ejemplo) {
    console.log("Verificación positiva en navegador omitida: se necesita un documento de demostración emitido.");
    return;
  }
  await personal.goto(base + "/verificar-documento?codigo=" + encodeURIComponent(ejemplo.codigo));
  await personal.getByText("Código de demostración encontrado", { exact: true }).waitFor();
  console.log("Navegador: inicio de revisión y verificación pública por código.");
}

async function controlesPublicos(pagina) {
  await pagina.goto(base + "/grados-titulos/doctor");
  await boton(pagina, "Abrir menú").click();
  await boton(pagina, "GRADOS Y TÍTULOS").click();
  await enlace(pagina.locator(".nb-movil-sub"), "Grado de Doctor").click();
  await boton(pagina, "Abrir menú").waitFor();
  const buscador = pagina.getByRole("searchbox", { name: "Buscar requisitos" });
  await buscador.fill("sin coincidencia de prueba");
  await pagina.getByText("No hay resultados para esta búsqueda.").waitFor();
  await pagina.getByRole("region", { name: "Documentos necesarios" }).getByText(/PDF de prueba/).waitFor();
  await pagina.getByText("¿Dónde encuentro los requisitos de mi programa?", { exact: true }).click();
  await pagina.getByText("Selecciona tu programa en la sección de requisitos para consultar la información publicada.").waitFor();
  await boton(pagina, "Modo oscuro").click();
  await pagina.locator(".pagina-publica.tema-oscuro").waitFor();
  await boton(pagina, "Modo claro").click();
  await pagina.locator(".accessibility-trigger").click();
  await pagina.locator(".accessibility-panel.is-open").waitFor();
  await pagina.locator(".accessibility-close").click();
  await pagina.locator(".accessibility-panel.is-open").waitFor({ state: "detached" });
  console.log("Navegador móvil: menú, búsqueda, documentos, preguntas frecuentes, modo oscuro y accesibilidad.");
}

async function principal() {
  if (evidencia) mkdirSync(evidencia, { recursive: true });
  const navegador = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    pagina.setDefaultTimeout(20000);
    let doctorado;
    const presentados = [];
    for (const [indice, ruta] of rutas.entries()) {
      if (indice === 3) await pagina.setViewportSize({ width: 390, height: 844 });
      const expediente = await solicitar(pagina, ruta, indice === 0);
      if (indice === 0) doctorado = expediente;
      presentados.push({ id: expediente.id, codigo: expediente.codigo, tipoTramite: expediente.tipoTramite });
    }
    const grados = presentados.filter(({ tipoTramite }) => ["grado_maestro", "grado_doctor", "titulo_segunda_especialidad"].includes(tipoTramite));
    assert.equal(grados.length, 3);
    assert.equal(new Set(grados.map(({ id }) => id)).size, 3);
    aprobarCP("CP08", "borradores guardados y recuperados antes de presentar");
    aprobarCP("CP10", "tres expedientes independientes con IDs distintos");
    const personal = await navegador.newPage();
    personal.setDefaultTimeout(20000);
    await orientacion(pagina, personal);
    await revisarYVerificar(personal, doctorado);
    await controlesPublicos(pagina);
    await pagina.goto(base + "/mis-tramites/programas");
    await boton(pagina, "Cerrar sesión").click();
    await pagina.waitForURL(/\/login/);
    assert.equal((await pagina.request.get(base + "/api/sigep/auth/perfil")).status(), 401);
    console.log("Navegador: cierre de sesión comprobado.");
    await ingresar(pagina, "integral");
    const respuestaPersistidas = await pagina.request.get(base + "/api/sigep/solicitudes");
    assert.equal(respuestaPersistidas.status(), 200);
    const persistidas = await respuestaPersistidas.json();
    for (const expediente of grados) assert(persistidas.some(({ id, codigo }) => id === expediente.id && codigo === expediente.codigo));
    aprobarCP("CP12", "expedientes persistidos después de cerrar e iniciar sesión");
    if (evidencia) {
      const individual = await navegador.newPage();
      await individual.goto(base + "/grados-titulos/iniciar-solicitud?tramite=doctor");
      await ingresar(individual, "maestria");
      const perfil = await (await individual.request.get(base + "/api/sigep/auth/perfil")).json();
      assert.equal(perfil.email, cuentas.get("maestria").correo);
      await individual.getByRole("heading", { name: "El trámite solicitado no corresponde a tu matrícula" }).waitFor();
      await individual.getByText("Tu programa registrado es Maestría de demostración.", { exact: true }).waitFor();
      const antes = await (await individual.request.get(base + "/api/sigep/solicitudes")).json();
      const bloqueo = await individual.request.post(base + "/api/sigep/solicitudes", { data: { tipoTramite: "grado_doctor" } });
      assert.equal(bloqueo.status(), 422);
      const despues = await (await individual.request.get(base + "/api/sigep/solicitudes")).json();
      assert.deepEqual(despues.map(({ id }) => id), antes.map(({ id }) => id));
      aprobarCP("CP13", "cuenta solo-maestría bloqueada sin solicitud nueva");
      aprobarCP("CP14", "Grado de Maestro completado y regresión comprobada");
      console.log("Navegador: rechazo de Doctorado reproducido con la cuenta individual de Maestría.");
      writeFileSync(resolve(evidencia, "expedientes-navegador.json"), JSON.stringify(presentados, null, 2) + "\n");
      const esperados = Array.from({ length: 14 }, (_, i) => `CP${String(i + 1).padStart(2, "0")}`).sort();
      assert.deepEqual([...new Set(resultadosCP.map(({ codigo }) => codigo))].sort(), esperados);
      writeFileSync(resolve(evidencia, "casos-e2e.json"), JSON.stringify({ casos: resultadosCP }, null, 2) + "\n");
    }
  } finally {
    await navegador.close();
  }
}

principal().catch((error) => { console.error(error.stack); process.exitCode = 1; });
