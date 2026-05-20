# Gerencia — Sistema de Build com esbuild

Projeto de demonstração que implementa as características clássicas de um **sistema de build**, usando **esbuild** como motor de compilação e empacotamento.

## Características implementadas

| Requisito | Implementação |
|-----------|----------------|
| **Geração do script de construção** | `npm run analyze` + `npm run generate:config` analisam imports e geram `build.config.mjs`; edição manual permitida |
| **Integração com VCS** | `npm run vcs:sync` registra commit/branch/tag em `vcs-manifest.json` e atualiza submódulos Git |
| **Recompilação mínima** | Cache de hashes em `.build-cache/` + contexto incremental do esbuild; só recompila arquivos alterados |
| **Sistema executável** | Bundle em `dist/index.js` com shebang, permissão de execução e dependências ligadas |
| **Automação de testes** | Vitest com relatório JSON em `reports/vitest-results.json` |
| **Emissão de relatórios** | `reports/build-report.html`, `consolidated-report.json`, resumo de testes |
| **Geração de documentação** | TypeDoc em `docs/api/` + `docs/RELEASE_NOTES.md` + índice em `docs/index.html` |

## Início rápido

```bash
npm install
npm run generate:config   # gera build.config.mjs (ou edite manualmente)
npm run all               # pipeline completo: VCS → build → testes → relatório → docs
node dist/index.js help   # executa o programa
```

## Comandos

```bash
npm run analyze           # grafo de dependências → reports/dependency-graph.json
npm run generate:config   # gera build.config.mjs (--force para sobrescrever)
npm run build             # compila com recompilação mínima
npm run build:watch       # modo watch (incremental contínuo)
npm run vcs:sync          # sincroniza metadados Git
npm run test              # executa testes (Vitest)
npm run report            # relatório HTML/JSON consolidado
npm run docs              # documentação API + índice
npm run release-notes     # notas de lançamento em docs/RELEASE_NOTES.md
```

## Estrutura

```
gerencia/
├── src/                    # código-fonte e testes
├── scripts/                # pipeline de build
│   ├── analyze-deps.mjs
│   ├── generate-build-config.mjs
│   ├── build.mjs
│   ├── vcs-sync.mjs
│   ├── run-tests.mjs
│   ├── generate-report.mjs
│   ├── generate-docs.mjs
│   └── generate-release-notes.mjs
├── build.config.mjs        # gerado ou editado manualmente
├── dist/                   # executável empacotado
├── reports/                # relatórios de build e testes
└── docs/                   # documentação gerada
```

## Edição manual do script de build

Após `npm run generate:config`, edite `build.config.mjs` (por exemplo `minify: true`, entradas extras). O script `build.mjs` carrega sempre esse arquivo.

## Recompilação mínima

1. **Hashes** — cada arquivo em `trackedSources` é comparado ao cache; se nada mudou, o build é ignorado.
2. **esbuild context** — rebuilds subsequentes reutilizam o contexto incremental do esbuild.
3. **Watch** — `npm run build:watch` recompila só o necessário a cada alteração.

## Requisitos

- Node.js ≥ 20
- npm
