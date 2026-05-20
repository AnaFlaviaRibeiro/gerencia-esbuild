/**
 * Configuração de build — gerada automaticamente em 2026-05-20T18:51:23.965Z
 * Edite este arquivo manualmente para ajustar opções do esbuild.
 * Regenerar: npm run generate:config -- --force
 */
export default {
  /** Ponto de entrada principal do executável */
  entryPoints: ["src/index.ts"],
  /** Saída do bundle */
  outdir: "dist",
  /** Arquivos fonte rastreados para recompilação mínima */
  trackedSources: [
    "src/index.ts",
    "src/services/usuario-service.ts",
    "src/types.ts",
    "src/utils/validacao.ts"
  ],
  platform: "node",
  target: "node20",
  format: "esm",
  bundle: true,
  sourcemap: true,
  minify: false,
  /** Metadados do grafo de dependências */
  dependencyCount: 4,
};
