const { randomBytes } = require("node:crypto");
const { tmpdir } = require("node:os");
const { mkdtempSync, rmSync } = require("node:fs");
const { join, resolve } = require("node:path");
jest.mock("bcryptjs", () => ({
  hash: jest.fn(async (password) => `hash-de-prueba-${password}`),
  compare: jest.fn(async (password, hash) => hash === `hash-de-prueba-${password}`),
}));
const {
  DEFINICIONES, crearBaseSiFalta, obtenerCredenciales, rutaCredenciales, sembrarDatos, validarDestino,
} = require("./sembrar-grados-dev");

describe("siembra local de Grados y Títulos", () => {
  const raizRepo = resolve(__dirname, "../..");

  test("acepta exclusivamente PostgreSQL local de desarrollo llamado sigep_dev", () => {
    const destino = validarDestino("postgresql://dev:local@127.0.0.1:5432/sigep_dev?schema=public", "development");
    expect(destino.database).toBe("sigep_dev");
    expect(destino.host).toBe("127.0.0.1");
    for (const url of [
      "postgresql://dev:local@localhost:5432/sigep",
      "postgresql://dev:local@localhost:5432/sigep_test",
      "postgresql://dev:local@localhost:5432/sigep_dev_copy",
      "postgresql://dev:local@localhost:5432//sigep_dev",
      "postgresql://dev:local@localhost:5432/sigep_dev?host=remote.example.test",
      "postgresql://dev:local@db.example.test:5432/sigep_dev",
      "sqlite:./sigep_dev.db",
    ]) {
      let rechazado = false;
      try { validarDestino(url, "development"); } catch { rechazado = true; }
      expect(rechazado).toBe(true);
    }
    let produccionRechazada = false;
    try { validarDestino("postgresql://dev:local@localhost:5432/sigep_dev", "production"); }
    catch { produccionRechazada = true; }
    expect(produccionRechazada).toBe(true);
  });

  test("crea solo sigep_dev cuando falta y no la recrea cuando ya existe", async () => {
    const nodeEnvAnterior = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const base = { connect: jest.fn(), end: jest.fn(), query: jest.fn() };
    const ClientePrueba = jest.fn(() => base);
    try {
      base.query.mockImplementation(async (sql) => String(sql).includes("FROM pg_database") ? { rowCount: 0 } : { rowCount: 1 });
      const creada = await crearBaseSiFalta("postgresql://dev:local@localhost:5432/sigep_dev?schema=public", ClientePrueba);
      const creoSigepDev = base.query.mock.calls.some(([sql]) => String(sql) === 'CREATE DATABASE "sigep_dev"');
      expect(creada === "creada" && creoSigepDev).toBe(true);

      base.query.mockClear();
      base.query.mockImplementation(async (sql) => String(sql).includes("FROM pg_database") ? { rowCount: 1 } : { rowCount: 1 });
      const existente = await crearBaseSiFalta("postgresql://dev:local@localhost:5432/sigep_dev?schema=public", ClientePrueba);
      const intentoCrearDeNuevo = base.query.mock.calls.some(([sql]) => String(sql).startsWith("CREATE DATABASE"));
      expect(existente === "existente" && !intentoCrearDeNuevo).toBe(true);
    } finally {
      if (nodeEnvAnterior === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnvAnterior;
    }
  });

  test("rechaza destinos no autorizados antes de conectar a la base de mantenimiento", async () => {
    const nodeEnvAnterior = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const ClientePrueba = jest.fn();
    try {
      let rechazado = false;
      try { await crearBaseSiFalta("postgresql://dev:local@localhost:5432/sigep_test", ClientePrueba); }
      catch { rechazado = true; }
      expect(rechazado && ClientePrueba.mock.calls.length === 0).toBe(true);
    } finally {
      if (nodeEnvAnterior === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnvAnterior;
    }
  });

  test("genera y conserva cinco credenciales fuera del repositorio sin exponerlas", () => {
    const carpeta = mkdtempSync(join(tmpdir(), "sigep-dev-secrets-"));
    const archivo = join(carpeta, "credenciales.json");
    try {
      const primera = obtenerCredenciales({}, archivo, raizRepo);
      const segunda = obtenerCredenciales({}, archivo, raizRepo);
      expect(Object.keys(primera.passwords)).toHaveLength(5);
      expect(Object.keys(primera.passwords).every((clave) => primera.passwords[clave].length >= 20)).toBe(true);
      expect(Object.keys(primera.passwords).every((clave) => primera.passwords[clave] === segunda.passwords[clave])).toBe(true);
      expect(primera.archivo).toBe(archivo);
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  test("usa variables de entorno y rechaza un archivo de claves dentro del repositorio", () => {
    const clavePrueba = randomBytes(24).toString("base64url");
    const entorno = Object.fromEntries(DEFINICIONES.cuentas.map(({ clave }) => [`SIGEP_DEV_PASSWORD_${clave}`, clavePrueba]));
    const credenciales = obtenerCredenciales(entorno, null, raizRepo);
    expect(Object.values(credenciales.passwords).every((password) => password === clavePrueba)).toBe(true);
    let rechazado = false;
    try { rutaCredenciales({ SIGEP_DEV_CREDENTIALS_FILE: join(raizRepo, "claves.json") }, raizRepo); }
    catch { rechazado = true; }
    expect(rechazado).toBe(true);
  });

  test("acepta una sola variable de sesión como contraseña compartida de desarrollo", () => {
    const clavePrueba = randomBytes(24).toString("base64url");
    const credenciales = obtenerCredenciales({ SIGEP_DEV_PASSWORD: clavePrueba }, null, raizRepo);
    expect(Object.values(credenciales.passwords).every((password) => password === clavePrueba)).toBe(true);
    expect(credenciales.archivo).toBe(null);
  });

  test("define tres tipos de trámite distintos y fixtures naturales únicos", () => {
    expect(DEFINICIONES.programas.map(({ tipoTramite }) => tipoTramite).sort()).toEqual([
      "grado_doctor", "grado_maestro", "titulo_segunda_especialidad",
    ]);
    expect(new Set(DEFINICIONES.programas.map(({ codigoRequisito }) => codigoRequisito)).size).toBe(3);
    expect(DEFINICIONES.cuentas.filter(({ rol }) => rol === "estudiante")).toHaveLength(3);
    expect(DEFINICIONES.cuentas.filter(({ rol }) => rol === "administrador")).toHaveLength(1);
    expect(DEFINICIONES.cuentas.filter(({ rol }) => rol === "operador")).toHaveLength(1);
  });

  test("reconcilia los fixtures sin duplicarlos al repetir la siembra", async () => {
    const estado = { programa: [], configuracion: [], requisito: [], usuario: [], estudiante: [], ids: {} };
    const coincide = (fila, where) => Object.entries(where).every(([campo, esperado]) => {
      if (campo === "usuarioId_programaId") return fila.usuarioId === esperado.usuarioId && fila.programaId === esperado.programaId;
      if (esperado && typeof esperado === "object" && "in" in esperado) return esperado.in.includes(fila[campo]);
      if (esperado && typeof esperado === "object" && "not" in esperado) return fila[campo] !== esperado.not;
      return fila[campo] === esperado;
    });
    const modelo = (tabla, nombre, selectorUnico) => ({
      findFirst: async ({ where }) => estado[tabla].find((fila) => coincide(fila, where)) ?? null,
      findUnique: async ({ where }) => estado[tabla].find((fila) => coincide(fila, selectorUnico(where))) ?? null,
      findMany: async ({ where }) => estado[tabla].filter((fila) => coincide(fila, where)),
      count: async ({ where = {} } = {}) => estado[tabla].filter((fila) => coincide(fila, where)).length,
      create: async ({ data }) => {
        const fila = { ...data, id: ++estado.ids[nombre] };
        estado[tabla].push(fila);
        return fila;
      },
      update: async ({ where, data }) => {
        const fila = estado[tabla].find((registro) => coincide(registro, selectorUnico(where)));
        Object.assign(fila, data);
        return fila;
      },
      upsert: async ({ where, create, update }) => {
        const fila = estado[tabla].find((registro) => coincide(registro, selectorUnico(where)));
        if (fila) { Object.assign(fila, update); return fila; }
        const nuevo = { ...create, id: ++estado.ids[nombre] };
        estado[tabla].push(nuevo);
        return nuevo;
      },
    });
    Object.assign(estado.ids, { programa: 0, configuracion: 0, requisito: 0, usuario: 0, estudiante: 0 });
    const tx = {
      $queryRaw: async () => [],
      programa: modelo("programa", "programa", (where) => where),
      configuracionTramite: modelo("configuracion", "configuracion", (where) => where),
      plantillaRequisito: modelo("requisito", "requisito", (where) => where),
      usuario: modelo("usuario", "usuario", (where) => where),
      estudiante: modelo("estudiante", "estudiante", (where) => where),
    };
    const prisma = { $transaction: async (callback) => callback(tx) };
    const clavePrueba = randomBytes(24).toString("base64url");
    const passwords = Object.fromEntries(DEFINICIONES.cuentas.map(({ clave }) => [clave, clavePrueba]));
    const primera = await sembrarDatos(prisma, passwords);
    const hashesPrevios = estado.usuario.map(({ password }) => password);
    const segunda = await sembrarDatos(prisma, passwords);
    expect(primera).toEqual(segunda);
    expect(estado.usuario.every((usuario, indice) => usuario.password === hashesPrevios[indice])).toBe(true);
    expect(estado.programa).toHaveLength(3);
    expect(estado.usuario).toHaveLength(5);
    expect(estado.estudiante).toHaveLength(3);
    expect(estado.requisito).toHaveLength(3);
  });
});
