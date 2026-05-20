#!/usr/bin/env node
/**
 * Analisa o programa e identifica componentes dependentes.
 * Saída: relatório JSON em reports/dependency-graph.json
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  buildDependencyGraph,
  topologicalOrder,
} from "./lib/project-graph.mjs";

const { files, graph } = buildDependencyGraph();
const order = topologicalOrder(graph);

const report = {
  geradoEm: new Date().toISOString(),
  raiz: ROOT,
  totalArquivos: files.length,
  ordemCompilacao: order.map((f) => path.relative(ROOT, f)),
  dependencias: Object.fromEntries(
    [...graph.entries()].map(([f, deps]) => [
      path.relative(ROOT, f),
      deps.map((d) => path.relative(ROOT, d)),
    ])
  ),
};

const outDir = path.join(ROOT, "reports");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "dependency-graph.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("Análise de dependências concluída.");
console.log(`  Arquivos: ${files.length}`);
console.log(`  Relatório: ${path.relative(ROOT, outPath)}`);
for (const f of order) {
  const rel = path.relative(ROOT, f);
  const deps = (graph.get(f) ?? []).map((d) => path.relative(ROOT, d));
  console.log(`  ${rel}${deps.length ? ` ← ${deps.join(", ")}` : ""}`);
}
