import type { Usuario } from "../types.js";
import { validarEmail, validarNome } from "../utils/validacao.js";

const usuarios = new Map<string, Usuario>();

export function criarUsuario(nome: string, email: string): Usuario {
  if (!validarNome(nome)) {
    throw new Error("Nome inválido");
  }
  if (!validarEmail(email)) {
    throw new Error("E-mail inválido");
  }
  const id = crypto.randomUUID();
  const usuario: Usuario = { id, nome: nome.trim(), email: email.trim().toLowerCase() };
  usuarios.set(id, usuario);
  return usuario;
}

export function buscarUsuario(id: string): Usuario | undefined {
  return usuarios.get(id);
}

export function listarUsuarios(): Usuario[] {
  return [...usuarios.values()];
}

export function limparUsuarios(): void {
  usuarios.clear();
}
