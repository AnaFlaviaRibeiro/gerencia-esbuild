import * as esbuild from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = await mkdtemp(join(tmpdir(), "esbuild-test-"));
const outfile = join(dir, "tests.mjs");

try {
  await esbuild.build({
    entryPoints: [join(root, "src/calculator.test.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    external: ["node:test", "node:assert", "node:assert/strict"],
  });

  const code = await new Promise((resolve) => {
    const proc = spawn("node", ["--test", outfile], { stdio: "inherit" });
    proc.on("exit", (c) => resolve(c ?? 1));
  });

  if (code !== 0) process.exit(code);
  console.log("\n✅ Todos os testes passaram");
} finally {
  await rm(dir, { recursive: true, force: true });
}
