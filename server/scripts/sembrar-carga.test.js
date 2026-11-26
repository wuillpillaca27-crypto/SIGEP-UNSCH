const { parsearArgumentos, validarDestino } = require("./sembrar-carga");

describe("siembra sintética de carga", () => {
  test("usa 20.000 usuarios con run-id único por defecto", () => {
    const opciones = parsearArgumentos([]);
    expect(opciones.count).toBe(20000);
    expect(opciones.runId).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(opciones.rollback).toBe(false);
  });

  test("acepta parámetros acotados y rollback de verificación", () => {
    expect(parsearArgumentos(["--count", "20000", "--run-id", "smoke-011", "--rollback"])).toMatchObject({
      count: 20000,
      runId: "smoke-011",
      rollback: true,
    });
  });

  test.each(["0", "20001", "NaN"]) ("rechaza un conteo fuera del rango: %s", (count) => {
    expect(() => parsearArgumentos(["--count", count])).toThrow("entero entre 1 y 20000");
  });

  test("rechaza esquemas SQLite y destinos PostgreSQL remotos", () => {
    expect(() => validarDestino("file:./grados.sqlite")).toThrow("postgresql://");
    expect(() => validarDestino("postgresql://db.example:5432/sigep"))
      .toThrow("PostgreSQL local fuera de producción");
  });

  test("acepta PostgreSQL local y rechaza producción", () => {
    expect(() => validarDestino("postgresql://127.0.0.1:5432/sigep")).not.toThrow();
    const anterior = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(() => validarDestino("postgresql://127.0.0.1:5432/sigep"))
        .toThrow("PostgreSQL local fuera de producción");
    } finally {
      if (anterior === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = anterior;
    }
  });
});
