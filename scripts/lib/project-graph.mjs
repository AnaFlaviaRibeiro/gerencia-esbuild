import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const SRC = path.join(ROOT, "src");

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;

/** Resolve import relativo para caminho absoluto do arquivo-fonte */
export function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** Varre src/ e monta grafo de dependências entre arquivos locais */
export function buildDependencyGraph() {
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        if (name !== "__tests__" && name !== "node_modules") walk(full);
      } else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts")) {
        files.push(full);
      }
    }
  }
  walk(SRC);

  const graph = new Map();
  for (const file of files) {
    const deps = new Set();
    const content = fs.readFileSync(file, "utf8");
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(content)) !== null) {
      const resolved = resolveImport(file, m[1]);
      if (resolved) deps.add(resolved);
    }
    graph.set(file, [...deps]);
  }
  return { files, graph };
}

/** Ordem topológica para compilação (dependências primeiro) */
export function topologicalOrder(graph) {
  const visited = new Set();
  const order = [];
  function visit(node) {
    if (visited.has(node)) return;
    visited.add(node);
    for (const dep of graph.get(node) ?? []) visit(dep);
    order.push(node);
  }
  for (const node of graph.keys()) visit(node);
  return order;
}
