#!/usr/bin/env node
/**
 * Gera notas de lançamento do build a partir de metadados VCS e do build.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function readSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const build = readSafe(path.join(ROOT, "reports", "build-meta.json"));
const vcs = readSafe(path.join(ROOT, "vcs-manifest.json"));
const tests = readSafe(path.join(ROOT, "reports", "test-summary.json"));

let changelog = "";
try {
  changelog = execSync("git log -5 --oneline", { cwd: ROOT, encoding: "utf8" });
} catch {
  changelog = "(repositório git não inicializado)\n";
}

const notes = `# Notas de lançamento — v${pkg.version}

**Data do build:** ${new Date().toISOString()}

## Informações da versão

| Campo | Valor |
|-------|-------|
| Versão | ${pkg.version} |
| Commit | ${vcs.commitCurto ?? build.commit ?? "N/A"} |
| Branch | ${vcs.branch ?? "N/A"} |
| Tag | ${vcs.tag ?? "—"} |
| Build | ${build.sucesso ? "✅ Sucesso" : build.pulado ? "⏭️ Sem alterações" : "❌ Falha"} |
| Testes | ${tests.sucesso ? "✅ Aprovados" : tests.sucesso === false ? "❌ Falharam" : "—"} |
| Duração do build | ${build.duracaoMs ?? 0} ms |

## Artefatos

- Executável: \`${build.saida ?? "dist/index.js"}\`
- Relatório HTML: \`reports/build-report.html\`
- JUnit: \`reports/junit.xml\`

## Arquivos recompilados

${(build.arquivosRecompilados ?? []).map((f) => `- ${f}`).join("\n") || "_Nenhum (build em cache)_"}

## Commits recentes

\`\`\`
${changelog.trim()}
\`\`\`

---
_Gerado automaticamente por scripts/generate-release-notes.mjs_
`;

const out = path.join(ROOT, "docs", "RELEASE_NOTES.md");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, notes);
console.log(`Notas de lançamento: ${path.relative(ROOT, out)}`);
