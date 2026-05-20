#!/usr/bin/env node
/**
 * Geração de documentação: API via TypeDoc + página de visão do sistema.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const docsDir = path.join(ROOT, "docs");

fs.mkdirSync(docsDir, { recursive: true });

const typedoc = spawnSync(
  "npx",
  [
    "typedoc",
    "--entryPoints",
    "src/index.ts",
    "src/services/usuario-service.ts",
    "src/utils/validacao.ts",
    "--out",
    path.join(docsDir, "api"),
    "--name",
    "Gerencia API",
    "--readme",
    "none",
  ],
  { cwd: ROOT, stdio: "inherit" }
);

const buildMeta = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(ROOT, "reports", "build-meta.json"), "utf8")
    );
  } catch {
    return {};
  }
})();

const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Documentação — Gerencia</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; line-height: 1.6; }
    a { color: #06c; }
  </style>
</head>
<body>
  <h1>Gerencia — Documentação do Sistema</h1>
  <p>Sistema de demonstração com pipeline de build baseado em <strong>esbuild</strong>.</p>
  <h2>Links</h2>
  <ul>
    <li><a href="api/index.html">Referência da API (TypeDoc)</a></li>
    <li><a href="../reports/build-report.html">Último relatório de build</a></li>
    <li><a href="RELEASE_NOTES.md">Notas de lançamento</a></li>
  </ul>
  <h2>Último build documentado</h2>
  <ul>
    <li>Versão: ${buildMeta.versao ?? "—"}</li>
    <li>Commit: ${buildMeta.commit ?? "—"}</li>
    <li>Executável: <code>${buildMeta.saida ?? "dist/index.js"}</code></li>
  </ul>
  <h2>Módulos</h2>
  <ul>
    <li><code>src/index.ts</code> — CLI principal</li>
    <li><code>src/services/usuario-service.ts</code> — cadastro de usuários</li>
    <li><code>src/utils/validacao.ts</code> — regras de validação</li>
  </ul>
</body>
</html>`;

fs.writeFileSync(path.join(docsDir, "index.html"), indexHtml);
console.log("Documentação gerada em docs/");
console.log(`  TypeDoc: ${typedoc.status === 0 ? "ok" : "com avisos"}`);
console.log("  docs/index.html");
