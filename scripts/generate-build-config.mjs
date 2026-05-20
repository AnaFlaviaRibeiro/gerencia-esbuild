#!/usr/bin/env node
/**
 * Gera automaticamente build.config.mjs a partir da análise do grafo de dependências.
 * O desenvolvedor pode editar o arquivo manualmente depois — alterações manuais são preservadas
 * se o arquivo já existir (use --force para sobrescrever).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDependencyGraph, topologicalOrder, ROOT } from "./lib/project-graph.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(ROOT, "build.config.mjs");
const force = process.argv.includes("--force");

if (fs.existsSync(configPath) && !force) {
  console.log(
    "build.config.mjs já existe. Edite manualmente ou execute com --force para regenerar."
  );
  process.exit(0);
}

const { graph } = buildDependencyGraph();
const order = topologicalOrder(graph);
const entryPoints = order
  .filter((f) => f.endsWith("index.ts"))
  .map((f) => path.relative(ROOT, f).replace(/\\/g, "/"));

const mainEntry = entryPoints[0] ?? "src/index.ts";

const configContent = `/**
 * Configuração de build — gerada automaticamente em ${new Date().toISOString()}
 * Edite este arquivo manualmente para ajustar opções do esbuild.
 * Regenerar: npm run generate:config -- --force
 */
export default {
  /** Ponto de entrada principal do executável */
  entryPoints: ["${mainEntry}"],
  /** Saída do bundle */
  outdir: "dist",
  /** Arquivos fonte rastreados para recompilação mínima */
  trackedSources: ${JSON.stringify(
    order.map((f) => path.relative(ROOT, f).replace(/\\/g, "/")),
    null,
    2
  ).replace(/\n/g, "\n  ")},
  platform: "node",
  target: "node20",
  format: "esm",
  bundle: true,
  sourcemap: true,
  minify: false,
  /** Metadados do grafo de dependências */
  dependencyCount: ${graph.size},
};
`;

fs.writeFileSync(configPath, configContent);
console.log(`Configuração gerada: ${path.relative(ROOT, configPath)}`);
console.log(`  Entrada: ${mainEntry}`);
console.log(`  Fontes rastreados: ${graph.size} arquivos`);
