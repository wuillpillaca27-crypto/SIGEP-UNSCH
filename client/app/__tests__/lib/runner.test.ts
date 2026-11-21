import { describe, expect, it } from "vitest";
import { POR_PAGINA } from "@/app/lib/constants";

describe("entorno Vitest", () => {
  it("resuelve el alias del cliente y fija la zona horaria de Lima", () => {
    expect(POR_PAGINA).toBe(10);
    expect(process.env.TZ).toBe("America/Lima");
    expect(new Date("2024-01-05T00:00:00.000Z").getDate()).toBe(4);
  });
});