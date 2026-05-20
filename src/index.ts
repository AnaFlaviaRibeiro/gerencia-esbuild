#!/usr/bin/env node
import { criarUsuario, listarUsuarios } from "./services/usuario-service.js";

const args = process.argv.slice(2);

function exibirAjuda(): void {
  console.log(`
Gerencia — sistema de demonstração do build com esbuild

Uso:
  gerencia                    Lista usuários cadastrados
  gerencia add <nome> <email> Cadastra um usuário
  gerencia help               Exibe esta ajuda
`);
}

function main(): void {
  if (args.includes("help") || args.includes("--help")) {
    exibirAjuda();
    return;
  }

  if (args[0] === "add" && args.length >= 3) {
    const nome = args.slice(1, -1).join(" ");
    const email = args[args.length - 1]!;
    const u = criarUsuario(nome, email);
    console.log(`Usuário criado: ${u.id} — ${u.nome} <${u.email}>`);
    return;
  }

  const lista = listarUsuarios();
  if (lista.length === 0) {
    console.log("Nenhum usuário cadastrado. Use: gerencia add <nome> <email>");
    return;
  }
  console.log("Usuários:");
  for (const u of lista) {
    console.log(`  - ${u.nome} <${u.email}> (${u.id})`);
  }
}

main();
