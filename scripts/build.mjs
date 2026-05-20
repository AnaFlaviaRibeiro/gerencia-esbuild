import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = `${__dirname}/..`;
const outdir = `${root}/dist`;

const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

await mkdir(outdir, { recursive: true });

const common = {
  entryPoints: [`${root}/src/index.ts`],
  bundle: true,
  outfile: `${outdir}/bundle.js`,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: !isProduction,
  minify: isProduction,
  metafile: true,
  logLevel: "info",
  loader: { ".css": "css" },
};

if (isWatch) {
  const ctx = await esbuild.context(common);
  await ctx.watch();
  console.log("👀 esbuild em modo watch — altere src/ e salve para recompilar");
} else {
  const result = await esbuild.build(common);
  const outputs = Object.keys(result.metafile.outputs);
  console.log("\n📦 Artefatos gerados:");
  for (const file of outputs) {
    const info = result.metafile.outputs[file];
    const kb = (info.bytes / 1024).toFixed(2);
    console.log(`   ${file.replace(`${root}/`, "")} (${kb} KB)`);
  }
  if (isProduction) {
    console.log("\n✅ Build de produção (minificado)");
  } else {
    console.log("\n✅ Build de desenvolvimento (com source maps)");
  }
}
