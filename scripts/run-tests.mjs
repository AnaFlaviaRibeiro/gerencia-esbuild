#!/usr/bin/env node
/**
 * Automação de testes com Vitest (relatório JSON em reports/vitest-results.json).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const reportsDir = path.join(ROOT, "reports");
const ci = process.argv.includes("--ci");

fs.mkdirSync(reportsDir, { recursive: true });

const args = [
  "vitest",
  "run",
  "--reporter=default",
  "--reporter=json",
  `--outputFile.json=${path.join(reportsDir, "vitest-results.json")}`,
];

if (ci) args.push("--coverage");

const result = spawnSync("npx", args, {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});

const summary = {
  executadoEm: new Date().toISOString(),
  sucesso: result.status === 0,
  codigoSaida: result.status ?? 1,
  relatorio: "reports/vitest-results.json",
};

fs.writeFileSync(
  path.join(reportsDir, "test-summary.json"),
  JSON.stringify(summary, null, 2)
);

process.exit(result.status ?? 1);
