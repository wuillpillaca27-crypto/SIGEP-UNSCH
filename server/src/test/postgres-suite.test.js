const { validarDestino } = require("./postgres-suite");

describe("validación del destino PostgreSQL para fixtures Jest", () => {
  const nodeEnvOriginal = process.env.NODE_ENV;

  afterEach(() => {
    if (nodeEnvOriginal === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnvOriginal;
  });

  test.each(["postgresql://sigep_app@localhost:5432/sigep_test", "postgres://sigep_app@127.0.0.1:5432/sigep_test"])(
    "acepta una URL PostgreSQL local de pruebas: %s",
    (valor) => expect(validarDestino(new URL(valor)).pathname).toBe("/sigep_test"),
  );

  test.each(["sqlite:file:test.db", "mysql://localhost/sigep_test", "not-a-url"])(
    "rechaza destinos ajenos a PostgreSQL: %s",
    (valor) => {
      if (valor === "not-a-url") expect(() => validarDestino(null)).toThrow("SIGEP_TEST_DATABASE_URL");
      else expect(() => validarDestino(new URL(valor))).toThrow("PostgreSQL");
    },
  );

  test("rechaza PostgreSQL remoto", () => {
    expect(() => validarDestino(new URL("postgresql://db.example.test/sigep_test"))).toThrow("local");
  });

  test("rechaza una base cuyo nombre no termina en _test", () => {
    expect(() => validarDestino(new URL("postgresql://localhost:5432/sigep"))).toThrow("terminar en _test");
  });

  test("rechaza cualquier ejecución declarada en producción", () => {
    process.env.NODE_ENV = "production";
    expect(() => validarDestino(new URL("postgresql://localhost:5432/sigep_test"))).toThrow("producción");
  });
});
