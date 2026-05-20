import { describe, it, expect, beforeEach } from "vitest";
import {
  criarUsuario,
  buscarUsuario,
  listarUsuarios,
  limparUsuarios,
} from "../services/usuario-service.js";

describe("usuario-service", () => {
  beforeEach(() => limparUsuarios());

  it("cria e recupera usuário", () => {
    const u = criarUsuario("Maria Silva", "maria@exemplo.com");
    expect(buscarUsuario(u.id)).toEqual(u);
  });

  it("lista usuários cadastrados", () => {
    criarUsuario("Ana", "ana@exemplo.com");
    criarUsuario("Bob", "bob@exemplo.com");
    expect(listarUsuarios()).toHaveLength(2);
  });

  it("rejeita e-mail inválido", () => {
    expect(() => criarUsuario("Teste", "invalido")).toThrow("E-mail inválido");
  });
});
