import { describe, expect, it } from "@jest/globals";
import {
  formatearFecha,
  formatearFechaHora,
  infoEstado,
  nombreCompleto,
  truncar,
} from "@/app/lib/utils";

describe("utilidades de formato", () => {
  it("formatea fechas ISO válidas con la zona America/Lima", () => {
    expect(formatearFecha("2024-01-05T00:00:00.000Z")).toBe("04/01/2024");
    expect(formatearFechaHora("2024-01-05T15:04:00.000Z")).toBe(
      "05/01/2024, 10:04 a. m.",
    );
  });

  it.each(["", "no es una fecha"]) (
    "conserva Invalid Date al formatear la entrada %j",
    (entrada) => {
      expect(formatearFecha(entrada)).toBe("Invalid Date");
      expect(formatearFechaHora(entrada)).toBe("Invalid Date");
    },
  );

  it("devuelve la etiqueta y clase configuradas para estados conocidos", () => {
    expect(infoEstado("en_revision")).toEqual({
      label: "En revisión",
      clase: "badge-revision",
    });
    expect(infoEstado("aprobado")).toEqual({
      label: "Aprobado",
      clase: "badge-aprobado",
    });
  });

  it("usa el estado desconocido como etiqueta con la clase pendiente", () => {
    expect(infoEstado("estado_desconocido" as never)).toEqual({
      label: "estado_desconocido",
      clase: "badge-pendiente",
    });
  });

  it("concatena apellidos y nombres sin alterar sus espacios", () => {
    expect(nombreCompleto(" Ana María ", "Pérez López ")).toBe(
      "Pérez López ,  Ana María ",
    );
  });
});

describe("truncar", () => {
  it("usa 60 caracteres por defecto y conserva textos dentro del límite", () => {
    const enElLimite = "a".repeat(60);

    expect(truncar("texto corto")).toBe("texto corto");
    expect(truncar(enElLimite)).toBe(enElLimite);
  });

  it("añade puntos suspensivos al superar el límite", () => {
    expect(truncar("abcdefgh", 5)).toBe("abcde…");
    expect(truncar("a".repeat(61))).toBe(`${"a".repeat(60)}…`);
  });

  it("devuelve un texto vacío cuando el máximo es cero", () => {
    expect(truncar("texto", 0)).toBe("…");
  });
});
