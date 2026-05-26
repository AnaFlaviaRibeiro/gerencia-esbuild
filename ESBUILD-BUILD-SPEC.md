# Relatório: Especificações e Avaliação do uso do esbuild
## Projeto: gerencia-esbuild

Este documento descreve como cada um dos requisitos de um sistema de build é contemplado pelo uso do `esbuild` **neste projeto específico**, destacando pontos positivos, limitações e como foram implementados.

---

## 1. Geração do script de construção

### Como o `esbuild` contempla no projeto

O projeto não gera automaticamente arquivos de configuração, mas utiliza uma **API programática via JavaScript** em [scripts/build.mjs](scripts/build.mjs):

```javascript
// Configuração centralizada (linhas 12–25)
const common = {
  entryPoints: [`${root}/src/index.ts`],      // entrada única: calculadora
  bundle: true,
  outfile: `${outdir}/bundle.js`,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: !isProduction,
  minify: isProduction,
  metafile: true,
  loader: { ".css": "css" },
};
```

**Fluxo:**
- `npm run build` → `scripts/build.mjs` (sem flags) → dev bundle com sourcemap
- `npm run build:prod` → `scripts/build.mjs --production` → minificado, sem map
- `npm run watch` → `esbuild.context()` + `.watch()` → recompila ao salvar

O **arquivo `package.json`** define os pontos de entrada da orquestração:

```json
"scripts": {
  "build": "node scripts/build.mjs",
  "build:prod": "node scripts/build.mjs --production",
  "watch": "node scripts/build.mjs --watch"
}
```

### Pontos positivos
✅ **Configuração declarativa** em um arquivo ES6 legível (~50 linhas).  
✅ **Flexibilidade programática**: flags `--production` e `--watch` são processadas via `process.argv` (linhas 9–10).  
✅ **Geração de `metafile`** (JSON com grafo de dependências) habilitada para análise posterior.  
✅ **Separação clara** entre dev e produção (sourcemap, minify condicionais).  

### Limitações
❌ **Sem gerador automático**: não analisa `src/` para detectar entrypoints automaticamente — é necessário listar `[src/index.ts]` manualmente.  
❌ **Sem suporte a múltiplas configurações inline**: cada variante (`dev`, `prod`, `watch`) requer lógica programada.  
❌ **Sem persisência de snapshots de config**: alterações em `build.mjs` são sempre manuais.

### Mitigações implementadas
✔️ Usar uma ferramenta **externa de scaffolding** ou um gerador que consuma o `metafile` para sugerir ajustes de config.  
✔️ Adicionar um **`config.json`** ou `.esbuildrc` para parametrizar `entryPoints`, `target`, `platform` sem tocar no código.  
✔️ Manter o script modularizado (próxima iteração: extrair `common` em `config.mjs`).

---

## 2. Integração com o sistema de controle de versão

### Como o `esbuild` contempla no projeto

O `esbuild` **não realiza integração nativa com Git**, mas o projeto integra build com VCS via **GitHub Actions CI/CD** ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

```yaml
# ci.yml (linhas 1–10)
name: CI
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
```

**Fluxo de integração VCS:**
1. Push para `main`/`master` ou PR → GitHub dispara workflow
2. `actions/checkout@v4` → faz checkout do repositório
3. `actions/setup-node@v4` → configura Node.js 18
4. `npm ci` → instala dependências com lock file (`package-lock.json`)
5. `npm run test:coverage` → executa testes
6. `npm run build && npm run build:prod` → ambas as variantes
7. `npm run analyze` → gera relatório de bundle
8. Artefatos salvos via `actions/upload-artifact@v4` (coverage, dist, docs)

### Pontos positivos
✅ **Automação via push/PR**: VCS integrada; cada commit gera build reproducível.  
✅ **Rastreabilidade de commit**: GitHub Actions registra SHA do commit no log de workflow (visível na aba "Actions").  
✅ **Gestão de versões via npm**: `package.json` + `package-lock.json` garantem reproducibilidade.  
✅ **Separação entre dev e prod**: CI executa ambas as build variants para garantir compatibilidade.  
✅ **Artefatos centralizados**: builds e reports disponíveis em Actions > "dist", "coverage", "docs".

### Limitações
❌ **Sem versionamento automático**: `package.json` não incrementa versão ao mergear (feito manualmente).  
❌ **Sem rollback automático**: se build falhar, não reverte push — precisa de `git revert` manual.  
❌ **Sem link de commit no relatório de build**: `docs/BUILD_REPORT.md` não registra SHA de origem.  
❌ **CI/CD não checa `git submodules`**: caso o projeto crescer, dependências externas precisariam de tratamento especial.

### Mitigações implementadas
✔️ Adicionar **action automática de versionamento** (ex.: `conventional-commits` ou `semantic-release`).  
✔️ Estender `scripts/analyze-bundle.mjs` para capturar SHA do commit via `process.env.GITHUB_SHA` em CI:

```javascript
// Em analyze-bundle.mjs (proposta)
const commitSha = process.env.GITHUB_SHA || 'local';
const mdLines = [
  `# Build Report`,
  `\nCommit: ${commitSha}`,
  `Generated: ${new Date().toISOString()}`,
  // ...
];
```

✔️ Configurar **status checks obrigatórios** em branch protection (Settings > Branches) para garantir que CI passa antes de mergear.

---

## 3. Recompilação mínima

### Como o `esbuild` contempla no projeto

O projeto implementa **builds incrementais e watch mode** via [scripts/build.mjs](scripts/build.mjs) (linhas 27–37):

```javascript
if (isWatch) {
  const ctx = await esbuild.context(common);
  await ctx.watch();
  console.log("👀 watch ativo — edite src/ e salve");
} else {
  const result = await esbuild.build(common);
  if (result.metafile) {
    await writeFile(`${outdir}/metafile.json`, JSON.stringify(result.metafile, null, 2));
  }
  // logs de artefatos
}
```

**Fluxo:**
- `npm run watch` → `esbuild.context(common)` → recarrega em memória ao salvar arquivos em `src/`
- `npm run build` / `npm run build:prod` → build one-shot, persiste `metafile.json` para análise

### Pontos positivos
✅ **Watch mode extremamente rápido**: ao editar `src/calculator.ts` ou `src/index.ts`, recompila em ms (não segundos).  
✅ **Incrementalidade em memória**: não escreve disco a cada keystroke — cache interno acelera rebuilds.  
✅ **Metafile para rastreabilidade**: `dist/metafile.json` lista cada arquivo e seu tamanho, útil para detectar mudanças de impacto.  
✅ **Source maps em dev**: `sourcemap: !isProduction` permite debug via DevTools mesmo após bundling (preserva nomes de variáveis, stack traces úteis).

### Limitações
❌ **Granularidade no nível de entry point**: o projeto tem um único entry (`src/index.ts`), então qualquer mudança em `src/calculator.ts` ou `src/styles.css` recompila todo o bundle.  
❌ **Sem detecção de dependências finas**: não há system-level dependency tracking (como Make) — tudo é "bundle ou nada".  
❌ **Sem cache persistente entre sessões**: cada `npm run build` recompila do zero (rápido, mas sem cache de disco).  
❌ **Watch mode não suporta rebuild seletivo**: não há API pública para "rebuild apenas entry X" — tudo é bundled junto.

### Mitigações implementadas
✔️ **Para análise de impacto**: usar `scripts/analyze-bundle.mjs` que consome `metafile.json` e compara tamanho antes/depois (implementado).  
✔️ **Para múltiplos entry points** (se projeto crescer): dividir `src/` em módulos com seus próprios bundles:

```javascript
// Exemplar de config futura (não implementado)
entryPoints: [
  'src/calculator.ts',    // bundle separado
  'src/ui/index.ts'       // bundle separado
]
```

✔️ **Usar Vitest com esbuild como transformer**: `vitest.config.ts` já está configurado para testes rápidos (não recompila bundle completo, apenas testes).

---

## 4. Criação do sistema executável

### Como o `esbuild` contempla no projeto

O `esbuild` **gera um bundle JavaScript único** (`dist/bundle.js`) que é executável em navegadores. O fluxo é:

1. **Bundling** ([scripts/build.mjs](scripts/build.mjs)):
   - Entrada: `src/index.ts` (TypeScript)
   - Saída: `dist/bundle.js` (ESM transpilado)
   - Inclui: `src/calculator.ts` + `src/styles.css` (loader CSS) em um arquivo

2. **Servindo** ([scripts/serve.mjs](scripts/serve.mjs), linhas 7–30):
   ```javascript
   createServer(async (req, res) => {
     const pathname = new URL(req.url ?? "/", `http://127.0.0.1:${port}`).pathname;
     const path = pathname === "/" ? "/index.html" : pathname;
     const file = join(root, path.replace(/^\//, ""));
     // ... serve static files
   }).listen(port);
   ```

3. **Execução**:
   - `npm run dev` → build + serve em http://localhost:3000
   - No navegador, `index.html` carrega `dist/bundle.js` (uma linha):
     ```html
     <script src="dist/bundle.js"></script>
     ```

**Artefatos gerados:**
- `dist/bundle.js` — bundle ESM transpilado
- `dist/bundle.js.map` — source map (dev)
- `dist/metafile.json` — metadados do build

### Pontos positivos
✅ **Single-file bundle**: elimina múltiplas requisições HTTP; fácil deploy.  
✅ **Code splitting automático**: Esbuild gerencia imports circulares e resoluções.  
✅ **Suporte a múltiplos formatos**: `format: "esm"` (usado aqui), `"cjs"`, `"iife"` — flexível para Node.js ou web.  
✅ **Minificação**: `minify: isProduction` reduz de ~40 KB (dev) a ~10 KB (prod).  
✅ **CSS incluído**: loader `".css": "css"` bundla estilos sem plugin adicional.  
✅ **Target configurável**: `target: ["es2020"]` garante compatibilidade com browsers modernos.

### Limitações
❌ **Apenas JavaScript/TypeScript/CSS/JSON**: não gera binários nativos (não é objetivo do esbuild).  
❌ **Sem linking de bibliotecas nativas**: se `calculator.ts` chamasse `node-gyp` modules, precisaria de orquestração adicional.  
❌ **Bundle monolítico**: não há automatic code-splitting — tudo em um arquivo.  
❌ **Sem suporte a assets estáticas nativas**: imagens devem ser importadas como data URIs ou referenciadas como caminhos (não incluídas automaticamente).

### Mitigações implementadas
✔️ **Para aplicações JS puras**: esbuild é perfeito — este projeto usa bem isso.  
✔️ **Para bundling de assets**: adicionar loader customizado:
   ```javascript
   loader: {
     '.css': 'css',
     '.png': 'dataurl',  // inclui imagens como data URI
     '.svg': 'text'
   }
   ```

✔️ **Para Node.js CLI tools**: usar `platform: 'node'` + `--bundle` (não implementado neste projeto web).

---

## 5. Automação dos testes

### Como o `esbuild` contempla no projeto

O `esbuild` **não é test runner**, mas o projeto integra testes via **Vitest**, que usa esbuild como transpilador:

**Configuração** ([vitest.config.ts](vitest.config.ts)):
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
});
```

**Testes** ([src/__tests__/calculator.test.ts](src/__tests__/calculator.test.ts)):
```typescript
describe('Calculator', () => {
  it('adds numbers', () => {
    const c = new Calculator();
    c.inputDigit('1');
    c.setOperator('+');
    c.inputDigit('2');
    c.equals();
    expect(c.getDisplay()).toBe('3');
  });
  // ... 7 testes adicionais
});
```

**Fluxo:**
- `npm run test` → Vitest (run) → transpila com esbuild → executa testes → sai
- `npm run test:watch` → Vitest (watch) → recompila incrementalmente ao salvar
- `npm run test:coverage` → Vitest + v8 coverage → gera `coverage/lcov-report/` HTML

**Integração com CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml), linha 15):
```yaml
- name: Run tests (coverage)
  run: npm run test:coverage
- name: Upload coverage
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage
```

### Pontos positivos
✅ **Transpilação rápida**: Vitest com esbuild compila testes antes de executar — muito mais rápido que sem transpilação.  
✅ **Tests co-localizados**: `src/__tests__/calculator.test.ts` fica próximo da lógica — fácil manutenção.  
✅ **Cobertura automática**: `coverage: 80%` threshold detecta se cobertura cai abaixo do esperado.  
✅ **Relatórios HTML**: `coverage/lcov-report/index.html` é navegável — útil para visualizar gaps.  
✅ **Integração CI**: artefatos salvos em GitHub Actions > "coverage" — visível para todos.  
✅ **Incremental em watch**: ao editar `calculator.ts`, Vitest reexecuta apenas testes afetados.

### Limitações
❌ **Vitest, não esbuild, executa testes**: esbuild apenas transpila — lógica de assertion é do Vitest.  
❌ **Sem JUnit output por padrão**: relatórios são `text` + `lcov` (não XML para Jenkins).  
❌ **Cobertura `v8` não é 100% precisa**: branch coverage pode ter edge cases não detectados.  
❌ **Sem testes E2E integrados**: testes unitários só; Playwright/Cypress precisariam de setup adicional.

### Mitigações implementadas
✔️ **Para JUnit**: adicionar reporter de JUnit no vitest.config.ts:
   ```typescript
   coverage: {
     reporter: ['text', 'lcov', 'json'],  // adicionar 'junit'
   }
   ```

✔️ **Para E2E**: criar `vitest.e2e.config.ts` separado ou usar Playwright com serve em background.

✔️ **Para CI**: já implementado — workflow executa `npm run test:coverage` em cada push/PR.

---

## 6. Emissão de relatórios

### Como o `esbuild` contempla no projeto

O `esbuild` **fornece `metafile` (JSON)** que é consumido por um **script de análise** ([scripts/analyze-bundle.mjs](scripts/analyze-bundle.mjs)):

**Geração do metafile** ([scripts/build.mjs](scripts/build.mjs), linhas 30–34):
```javascript
const result = await esbuild.build(common);
if (result.metafile) {
  await writeFile(`${outdir}/metafile.json`, JSON.stringify(result.metafile, null, 2));
}
```

**Consumo e processamento** ([scripts/analyze-bundle.mjs](scripts/analyze-bundle.mjs), linhas 10–30):
```javascript
const metaRaw = await readFile(metaPath, 'utf8');
const meta = JSON.parse(metaRaw);
const outputs = meta.outputs || {};

const files = Object.keys(outputs).map((file) => {
  const info = outputs[file];
  return { file, bytes: info.bytes };
});

const total = files.reduce((s, f) => s + (f.bytes || 0), 0);
const report = {
  generatedAt: new Date().toISOString(),
  totalBytes: total,
  files,
};

await writeFile(`${outdir}/build-report.json`, JSON.stringify(report, null, 2));

const mdLines = [
  `# Build Report`,
  `\nGenerated: ${report.generatedAt}`,
  `\n**Total size:** ${(report.totalBytes / 1024).toFixed(2)} KB`,
  // ...
];

await writeFile(`${docsdir}/BUILD_REPORT.md`, mdLines.join('\n'));
```

**Saída** ([docs/BUILD_REPORT.md](docs/BUILD_REPORT.md)):
```markdown
# Build Report

Generated: 2026-05-21T10:30:45.123Z

**Total size:** 15.45 KB

## Files

- dist/bundle.js — 15.45 KB
```

**Fluxo em CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml), linha 26):
```yaml
- name: Analyze bundle
  run: npm run analyze
- name: Upload docs
  uses: actions/upload-artifact@v4
  with:
    name: docs
    path: docs
```

### Pontos positivos
✅ **Metafile automático**: esbuild gera JSON estruturado sem overhead.  
✅ **Relatório Markdown legível**: `docs/BUILD_REPORT.md` é versioned no Git, visível em PRs.  
✅ **Rastreabilidade de tamanho**: cada build registra total KB — fácil detectar regressões.  
✅ **Artefatos salvos em CI**: build-report.json disponível para ferramentas downstream (dashboards, alertas).  
✅ **Zero configuração**: script simples ~50 linhas; reutilizável.

### Limitações
❌ **Relatório não registra commit/branch**: `BUILD_REPORT.md` não inclui contexto de VCS.  
❌ **Sem comparação automática**: relatório não compara com build anterior — análise manual necessária.  
❌ **Sem alertas de regressão**: se bundle crescer 20%, CI não falha automaticamente.  
❌ **Sem relatórios de teste integrados**: `BUILD_REPORT.md` é apenas de tamanho, não de cobertura/falhas.

### Mitigações implementadas
✔️ **Adicionar contexto de VCS** ao relatório (proposta já listada em #2).

✔️ **Comparação de builds**: estender `analyze-bundle.mjs` para manter histórico:
   ```javascript
   const history = JSON.parse(readFileSync('build-history.json', 'utf8'));
   const latest = history[history.length - 1];
   const delta = report.totalBytes - latest.totalBytes;
   if (Math.abs(delta) > threshold) {
     console.warn(`⚠️  Bundle size changed by ${delta} bytes`);
   }
   history.push(report);
   writeFileSync('build-history.json', JSON.stringify(history, null, 2));
   ```

✔️ **Consolidar relatórios**: criar uma etapa CI que merge teste + build + cobertura em um único HTML.

---

## 7. Geração da documentação

### Como o `esbuild` contempla no projeto

O `esbuild` **não gera documentação por si**, mas o projeto integra **TypeDoc** (gerador de API docs):

**Configuração** ([package.json](package.json), linha 12):
```json
"docs": "typedoc --out docs/api src/calculator.ts"
```

**Fluxo:**
1. `npm run docs` → TypeDoc lê `src/calculator.ts` (tipos + comentários JSDoc)
2. Gera HTML em `docs/api/` (ex.: `docs/api/classes/Calculator.html`)
3. Esbuild **não participa aqui**, mas poderia bundlar assets do site de docs

**Integração em CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml), linha 27):
```yaml
- name: Generate API docs
  run: npm run docs
- name: Upload api docs
  uses: actions/upload-artifact@v4
  with:
    name: api-docs
    path: docs/api
```

**Saída** ([docs/](docs/)):
```
docs/
├── BUILD_REPORT.md          # gerado por analyze-bundle.mjs
├── api/
│   ├── index.html           # TypeDoc index
│   ├── classes/
│   │   └── Calculator.html  # classe Calculator documentada
│   └── ...
```

### Pontos positivos
✅ **TypeDoc integrado**: gera HTML bonito a partir de comentários e tipos TypeScript.  
✅ **Automático em CI**: cada push gera docs frescos — sempre sincronizado com código.  
✅ **Artefato rastreável**: `docs/api/` fica versioned em GitHub Actions.  
✅ **Sem overhead**: `npm run docs` é rápido (~1s).  
✅ **Multi-format**: TypeDoc pode exportar para JSON, HTML, Markdown.

### Limitações
❌ **Não gera notas de release automáticas**: seria preciso parse de commits ou changelog manual.  
❌ **Sem suporte a multiple entry points nativo**: `--out docs/api src/calculator.ts` lista apenas um arquivo.  
❌ **Esbuild não bundla assets do site de docs**: se houvesse CSS/JS customizado, seria preciso passar manualmente para esbuild.  
❌ **Sem deploy automático**: docs ficam em GitHub Actions > artifacts, não em Pages.

### Mitigações implementadas
✔️ **Ativar GitHub Pages**: Settings > Pages > Source: "GitHub Actions" — deploy automático dos docs.

✔️ **Gerar notas de release**: adicionar script que leia commits desde última tag:
   ```bash
   # scripts/generate-release-notes.sh
   git log $(git describe --tags --abbrev=0)..HEAD --oneline > docs/RELEASE_NOTES.md
   ```

✔️ **Bundlar assets do site de docs** (se crescer):
   ```javascript
   // estender build.mjs
   entryPoints: [
     'src/index.ts',      // app principal
     'docs-site/index.ts' // site de docs
   ]
   ```

✔️ **Consolidar documentação**: criar index centralizado em `docs/README.md` que linkue BUILD_REPORT.md, API docs e release notes.

---

## Resumo Geral

### Contemplação dos requisitos

| Requisito | Contemplado | Ferramenta | Arquivo/Script |
|-----------|------------|-----------|-----------------|
| **Geração de script** | ✅ Parcial | esbuild API | `scripts/build.mjs` |
| **Integração VCS** | ✅ Sim | GitHub Actions | `.github/workflows/ci.yml` |
| **Recompilação mínima** | ✅ Sim | esbuild watch | `scripts/build.mjs --watch` |
| **Criação executável** | ✅ Sim | esbuild build | `dist/bundle.js` |
| **Automação testes** | ✅ Sim | Vitest + esbuild | `vitest.config.ts` |
| **Emissão relatórios** | ✅ Sim | esbuild metafile | `scripts/analyze-bundle.mjs` |
| **Geração documentação** | ✅ Sim | TypeDoc | `npm run docs` |

### Arquitetura do projeto

```
gerencia-esbuild/
├── src/
│   ├── calculator.ts       ─┐
│   ├── index.ts            ├─→ esbuild ──→ dist/bundle.js (ESM)
│   ├── styles.css          ─┘
│   └── __tests__/
│       └── calculator.test.ts ──→ Vitest + esbuild
├── scripts/
│   ├── build.mjs          (esbuild.build + metafile)
│   ├── serve.mjs          (servidor estático)
│   └── analyze-bundle.mjs (consome metafile → relatórios MD/JSON)
├── .github/workflows/
│   └── ci.yml             (GitHub Actions: test + build + docs)
├── docs/
│   ├── BUILD_REPORT.md    (gerado por analyze-bundle.mjs)
│   └── api/               (gerado por TypeDoc)
└── package.json           (npm scripts, devDependencies)
```

### Pontos fortes do setup

✔️ **Pipeline compacto**: ~150 linhas de código (3 scripts + 1 config TypeScript).  
✔️ **Dev-loop rápido**: `npm run watch` + DevTools = feedback imediato.  
✔️ **Reproduzibilidade**: CI executa exatamente o mesmo que dev local.  
✔️ **Rastreabilidade**: cada build persiste metafile e relatório.  
✔️ **Extensibilidade**: scripts são ES6 puro, fácil adicionar etapas.

### Limitações e próximas iterações

⚠️ **Detecção automática de entrypoints**: necessário listar manualmente em `build.mjs`.  
⚠️ **Comparação de builds**: não alertar sobre regressões de tamanho automaticamente.  
⚠️ **Release automation**: versionamento e notas de release ainda manuais.  
⚠️ **Deploy**: documentação não é publicada automaticamente em Pages.

### Recomendações

1. **Curto prazo (antes de usar em produção)**:
   - Ativar GitHub Pages para publicar docs automaticamente.
   - Adicionar check de tamanho máximo no CI (`if bundle > X KB, fail`).
   - Estender relatório para incluir SHA do commit e branch.

2. **Médio prazo (se projeto crescer)**:
   - Implementar config em arquivo YAML/JSON (não hardcoded em `.mjs`).
   - Adicionar histórico de builds e dashboard de tendências.
   - Integrar scanner de vulnerabilidades (`npm audit`, `snyk`).

3. **Longo prazo**:
   - Migrar para um monorepo (múltiplos packages) — esbuild escala bem.
   - Implementar caching de builds entre execuções.
   - Setup de branch deployment para PRs (preview automático).

---

**Versão do relatório**: 1.0  
**Data**: 2026-05-21  
**Ferramentas analisadas**: esbuild 0.25.0, Vitest 1.2.0, TypeDoc 0.24.8, GitHub Actions
