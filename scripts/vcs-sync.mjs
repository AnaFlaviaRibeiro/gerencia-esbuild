#!/usr/bin/env node
/**
 * Integração com controle de versão (Git):
 * - Registra commit/tag atual no manifesto de build
 * - Opcionalmente sincroniza submódulos ou tags de dependências declaradas
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "vcs-manifest.json");

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function isGitRepo() {
  return fs.existsSync(path.join(ROOT, ".git"));
}

const dependencies = [
  { name: "esbuild", source: "npm", versionField: "devDependencies.esbuild" },
  { name: "vitest", source: "npm", versionField: "devDependencies.vitest" },
];

function readPkgVersion(field) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const parts = field.split(".");
  let cur = pkg;
  for (const p of parts.slice(1)) cur = cur?.[p];
  return cur ?? "unknown";
}

const manifest = {
  sincronizadoEm: new Date().toISOString(),
  repositorio: isGitRepo(),
  branch: git("rev-parse --abbrev-ref HEAD"),
  commit: git("rev-parse HEAD"),
  commitCurto: git("rev-parse --short HEAD"),
  tag: git("describe --tags --exact-match 2>/dev/null") || null,
  autor: git('log -1 --format="%an <%ae>"'),
  dataCommit: git("log -1 --format=%ci"),
  dependencias: dependencies.map((d) => ({
    ...d,
    versaoFixada: readPkgVersion(d.versionField),
  })),
};

if (isGitRepo()) {
  const status = git("status --porcelain");
  manifest.workingTreeLimpo = !status;
  if (status) manifest.arquivosModificados = status.split("\n").filter(Boolean);

  try {
    execSync("git submodule update --init --recursive", {
      cwd: ROOT,
      stdio: "pipe",
    });
    manifest.submodulosAtualizados = true;
  } catch {
    manifest.submodulosAtualizados = false;
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log("Sincronização VCS concluída.");
console.log(`  Commit: ${manifest.commitCurto ?? "N/A (sem git)"}`);
console.log(`  Branch: ${manifest.branch ?? "N/A"}`);
console.log(`  Manifesto: vcs-manifest.json`);
