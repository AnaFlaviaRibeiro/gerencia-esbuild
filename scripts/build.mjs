#!/usr/bin/env node
/**
 * Build com esbuild — recompilação mínima via contexto incremental e cache de hashes.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".build-cache");
const CACHE_FILE = path.join(CACHE_DIR, "file-hashes.json");
const BUILD_META = path.join(ROOT, "reports", "build-meta.json");

async function loadConfig() {
  const configPath = path.join(ROOT, "build.config.mjs");
  if (!fs.existsSync(configPath)) {
    console.log("build.config.mjs ausente — gerando...");
    const { spawnSync } = await import("node:child_process");
    spawnSync("node", ["scripts/generate-build-config.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
  return (await import(pathToFileURL(configPath).href)).default;
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function loadHashCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function saveHashCache(cache) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/** Determina quais fontes mudaram desde o último build (recompilação mínima) */
function detectChangedSources(trackedSources, prevCache) {
  const changed = [];
  const unchanged = [];
  const nextCache = { ...prevCache };

  for (const rel of trackedSources) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const hash = hashFile(abs);
    const prev = prevCache[rel];
    if (prev !== hash) {
      changed.push(rel);
      nextCache[rel] = hash;
    } else {
      unchanged.push(rel);
    }
  }
  return { changed, unchanged, nextCache };
}

async function getGitCommit() {
  try {
    const { execSync } = await import("node:child_process");
    return execSync("git rev-parse --short HEAD 2>/dev/null", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

let ctx = null;

async function runBuild(watch = false) {
  const config = await loadConfig();
  const prevCache = loadHashCache();
  const { changed, unchanged, nextCache } = detectChangedSources(
    config.trackedSources ?? [],
    prevCache
  );

  const isFirstBuild = Object.keys(prevCache).length === 0;
  const needsFullBuild = isFirstBuild || changed.length > 0;

  if (!needsFullBuild && !watch) {
    console.log("Recompilação mínima: nenhum arquivo alterado. Build ignorado.");
    fs.mkdirSync(path.dirname(BUILD_META), { recursive: true });
    fs.writeFileSync(
      BUILD_META,
      JSON.stringify(
        {
          sucesso: true,
          pulado: true,
          duracaoMs: 0,
          arquivosRecompilados: [],
          arquivosIgnorados: unchanged,
          versao: JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version,
          commit: await getGitCommit(),
        },
        null,
        2
      )
    );
    return;
  }

  const start = Date.now();
  const common = {
    entryPoints: config.entryPoints,
    outdir: config.outdir ?? "dist",
    platform: config.platform ?? "node",
    target: config.target ?? "node20",
    format: config.format ?? "esm",
    bundle: config.bundle ?? true,
    sourcemap: config.sourcemap ?? true,
    minify: config.minify ?? false,
    // Shebang apenas no arquivo de saída (após bundle), para ./dist/index.js
  };

  if (watch) {
    if (ctx) await ctx.dispose();
    ctx = await esbuild.context(common);
    await ctx.watch();
    console.log("Modo watch: recompilação incremental ativa.");
    return;
  }

  if (ctx) {
    const result = await ctx.rebuild();
    if (result.errors.length) throw new Error("Falha no rebuild incremental");
  } else {
    ctx = await esbuild.context(common);
    const result = await ctx.rebuild();
    if (result.errors.length) throw new Error("Falha no build");
  }

  const outFile = path.join(ROOT, config.outdir ?? "dist", "index.js");
  if (fs.existsSync(outFile)) {
    let code = fs.readFileSync(outFile, "utf8");
    code = code.replace(/^(#![^\n]*\n)+/, "");
    fs.writeFileSync(outFile, "#!/usr/bin/env node\n" + code);
    fs.chmodSync(outFile, 0o755);
  }

  saveHashCache(nextCache);
  const duracaoMs = Date.now() - start;
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

  const meta = {
    sucesso: true,
    pulado: false,
    duracaoMs,
    arquivosRecompilados: isFirstBuild ? config.trackedSources : changed,
    arquivosIgnorados: isFirstBuild ? [] : unchanged,
    versao: pkg.version,
    commit: await getGitCommit(),
    saida: path.relative(ROOT, outFile),
  };

  fs.mkdirSync(path.dirname(BUILD_META), { recursive: true });
  fs.writeFileSync(BUILD_META, JSON.stringify(meta, null, 2));

  console.log(`Build concluído em ${duracaoMs}ms`);
  console.log(`  Executável: ${meta.saida}`);
  if (changed.length) {
    console.log(`  Recompilados (${changed.length}): ${changed.join(", ")}`);
  }
  if (unchanged.length && !isFirstBuild) {
    console.log(`  Ignorados (${unchanged.length}): cache válido`);
  }
}

const watch = process.argv.includes("--watch");
runBuild(watch).catch((err) => {
  console.error("Erro no build:", err.message);
  process.exit(1);
});
