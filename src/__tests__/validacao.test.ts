import { describe, it, expect } from "vitest";
import { validarEmail, validarNome } from "../utils/validacao.js";

describe("validacao", () => {
  it("aceita e-mails válidos", () => {
    expect(validarEmail("a@b.co")).toBe(true);
    expect(validarEmail("user@example.com")).toBe(true);
  });

  it("rejeita e-mails inválidos", () => {
    expect(validarEmail("")).toBe(false);
    expect(validarEmail("sem-arroba")).toBe(false);
    expect(validarEmail("@dominio.com")).toBe(false);
  });

  it("valida nomes com tamanho adequado", () => {
    expect(validarNome("Jo")).toBe(true);
    expect(validarNome("A")).toBe(false);
    expect(validarNome("x".repeat(121))).toBe(false);
  });
});
