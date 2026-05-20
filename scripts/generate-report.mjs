#!/usr/bin/env node
/**
 * Emissão de relatórios consolidados: build + testes em HTML e JSON.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const reportsDir = path.join(ROOT, "reports");

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const buildMeta = readJsonSafe(path.join(reportsDir, "build-meta.json"));
const testSummary = readJsonSafe(path.join(reportsDir, "test-summary.json"));
const vitest = readJsonSafe(path.join(reportsDir, "vitest-results.json"));
const vcs = readJsonSafe(path.join(ROOT, "vcs-manifest.json"));
const deps = readJsonSafe(path.join(reportsDir, "dependency-graph.json"));

const consolidated = {
  geradoEm: new Date().toISOString(),
  build: buildMeta,
  testes: testSummary,
  vitest: vitest
    ? {
        numTotalTests: vitest.numTotalTests,
        numPassedTests: vitest.numPassedTests,
        numFailedTests: vitest.numFailedTests,
        success: vitest.success,
      }
    : null,
  vcs,
  dependencias: deps ? { totalArquivos: deps.totalArquivos } : null,
  statusGeral:
    (buildMeta?.sucesso !== false) && (testSummary?.sucesso !== false)
      ? "SUCESSO"
      : "FALHA",
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
  path.join(reportsDir, "consolidated-report.json"),
  JSON.stringify(consolidated, null, 2)
);

const buildOk = buildMeta?.sucesso !== false && !buildMeta?.pulado === false;
const testsOk = testSummary?.sucesso === true;
const statusClass = consolidated.statusGeral === "SUCESSO" ? "ok" : "fail";

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Build — Gerencia</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #1a1a2e; }
    .ok { color: #0a7; } .fail { color: #c33; }
    section { margin: 1.5rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { text-align: left; padding: 0.4rem; border-bottom: 1px solid #eee; }
    code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Relatório de Build</h1>
  <p class="${statusClass}"><strong>Status geral:</strong> ${consolidated.statusGeral}</p>
  <p><small>Gerado em ${consolidated.geradoEm}</small></p>

  <section>
    <h2>Construção</h2>
    <table>
      <tr><th>Sucesso</th><td>${buildMeta?.sucesso ?? "—"}</td></tr>
      <tr><th>Duração</th><td>${buildMeta?.duracaoMs ?? 0} ms</td></tr>
      <tr><th>Versão</th><td>${buildMeta?.versao ?? "—"}</td></tr>
      <tr><th>Commit</th><td><code>${buildMeta?.commit ?? vcs?.commitCurto ?? "—"}</code></td></tr>
      <tr><th>Recompilados</th><td>${(buildMeta?.arquivosRecompilados ?? []).join(", ") || "—"}</td></tr>
      <tr><th>Ignorados (cache)</th><td>${(buildMeta?.arquivosIgnorados ?? []).length} arquivo(s)</td></tr>
      <tr><th>Executável</th><td><code>${buildMeta?.saida ?? "dist/index.js"}</code></td></tr>
    </table>
  </section>

  <section>
    <h2>Testes automatizados</h2>
    <table>
      <tr><th>Sucesso</th><td class="${testsOk ? "ok" : "fail"}">${testSummary?.sucesso ?? "não executado"}</td></tr>
      <tr><th>Relatório</th><td><code>reports/vitest-results.json</code></td></tr>
      ${vitest ? `<tr><th>Total</th><td>${vitest.numPassedTests}/${vitest.numTotalTests} aprovados</td></tr>` : ""}
    </table>
  </section>

  <section>
    <h2>Controle de versão</h2>
    <table>
      <tr><th>Branch</th><td>${vcs?.branch ?? "—"}</td></tr>
      <tr><th>Tag</th><td>${vcs?.tag ?? "—"}</td></tr>
      <tr><th>Árvore limpa</th><td>${vcs?.workingTreeLimpo ?? "—"}</td></tr>
    </table>
  </section>
</body>
</html>`;

fs.writeFileSync(path.join(reportsDir, "build-report.html"), html);
console.log("Relatórios gerados:");
console.log("  reports/consolidated-report.json");
console.log("  reports/build-report.html");
console.log(`  Status: ${consolidated.statusGeral}`);
