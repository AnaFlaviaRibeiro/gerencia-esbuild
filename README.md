# esbuild — Seminário: Ferramentas de Build

Demonstração prática da ferramenta [esbuild](https://esbuild.github.io/) para o seminário *Explorando Ferramentas de Build*.

**Site oficial:** https://esbuild.github.io/

**Apresentação (slides + código):** [APRESENTACAO.md](./APRESENTACAO.md)

## Roteiro da demonstração ao vivo (~5 min)

```bash
npm install
npm run dev            # build dev + servidor (recomendado para ver source maps)
npm run build          # desenvolvimento (source maps)
npm run build:prod     # produção (minificado, sem .map)
npm run watch          # recompila ao salvar
npm run serve          # http://localhost:3000 (rode build antes)
npm test               # testes da calculadora
```

### DevTools não abre ou não mostra `src/*.ts`?

1. **Não abra `index.html` pelo explorador de arquivos** — use sempre `npm run serve` e acesse http://localhost:3000
2. Use **`npm run build`** (desenvolvimento). `build:prod` remove o arquivo `.map`
3. No navegador: **F12** → aba **Fontes** → `calculator.ts`, `index.ts`, `styles.css`
4. No **Console** deve aparecer: `Calculadora carregada (esbuild bundle)`

1. Mostrar `src/index.ts`, `src/calculator.ts` e `src/styles.css` (módulos + CSS).
2. Rodar `npm run build` e abrir `dist/bundle.js` — um único arquivo com tudo empacotado.
3. Comparar tamanho: `dist/bundle.js` (dev) vs `npm run build:prod` (minificado).
4. Abrir `http://localhost:3000` — testar a calculadora e o DevTools (source maps em dev).
5. Opcional: `npm run watch`, editar `src/calculator.ts` e ver recompilação instantânea.

## O que é o esbuild?

Bundler e transpilador extremamente rápido para JavaScript/TypeScript, escrito em Go. Compila, empacota e minifica sem configuração pesada — ideal para ferramentas, bibliotecas e apps web que precisam de builds rápidos.

## Aspectos da ferramenta (tema do seminário)

### Facilidade de configuração

- API via CLI ou JavaScript com poucas opções essenciais (`entryPoints`, `bundle`, `outfile`, `format`).
- Não exige arquivo de config obrigatório: este projeto usa `scripts/build.mjs` (~40 linhas).
- Suporte nativo a TypeScript, JSX e JSON sem plugins.

### Eficiência de compilação

- Paralelismo e implementação em Go: builds tipicamente **10–100× mais rápidos** que Webpack/Rollup em projetos médios.
- Compilação incremental em modo `--watch` (recompila só o necessário).
- `metafile` no script de build lista tamanho dos artefatos para comparar dev vs produção.

### Gerenciamento de dependências

- **Empacotamento:** resolve imports e gera um bundle (ou vários entry points).
- **Externals:** dependências podem ficar fora do bundle (`external: ['react']`).
- Não substitui npm/yarn/pnpm para instalar pacotes — foca em transformar e empacotar o que já está em `node_modules` ou no código fonte.

### Suporte multiplataformas

- `platform`: `browser`, `node`, `neutral`.
- `target`: versões de JS (ex.: `es2020`, `node18`).
- `format`: `iife`, `cjs`, `esm` — mesmo código, artefatos para web ou Node.

### Automação de tarefas

- Scripts npm (`build`, `build:prod`, `watch`, `serve`, `test`).
- API `context()` + `watch()` para pipeline de desenvolvimento.
- Testes em `src/calculator.test.ts` (`npm test` usa esbuild para rodar os testes).
- CI no GitHub Actions: testes + build em cada push/PR.

### Extensibilidade

- **Plugins** para resolver imports customizados, loaders (CSS, imagens), etc.
- Ecossistema menor que Webpack; casos comuns já vêm embutidos (TS, JSX).
- Usado por Vite, Snowpack e outras ferramentas como motor de transformação.

### Comunidade e suporte

- Projeto open source (MIT), mantido ativamente no GitHub.
- Documentação clara em https://esbuild.github.io/
- Ampla adoção indireta via Vite e frameworks modernos.

## Estrutura do projeto

```
gerencia-esbuild/
├── src/
│   ├── index.ts        # UI da calculadora
│   ├── calculator.ts       # lógica (+ − × ÷)
│   ├── calculator.test.ts  # testes automatizados
│   └── styles.css          # estilos (bundled pelo esbuild)
├── scripts/
│   ├── build.mjs     # configuração do esbuild
│   └── serve.mjs     # servidor estático para demo
├── dist/             # artefato gerado (não versionado)
│   └── bundle.js
├── index.html
└── package.json
```

## Vantagens

| Ponto | Detalhe |
|-------|---------|
| Velocidade | Ideal para DX e CI com feedback imediato |
| Simplicidade | Pouca configuração para TS/JS moderno |
| Zero dependências runtime | Binário Go + pacote npm enxuto |
| Baterias inclusas | TS, JSX, minify, source maps, tree shaking básico |

## Desvantagens

| Ponto | Detalhe |
|-------|---------|
| Plugins | Menos maduros que ecossistema Webpack |
| Code splitting avançado | Menos flexível que Rollup/Webpack para apps grandes |
| Transformações | Não cobre todos os casos (ex.: alguns polyfills/babel plugins) |
| Foco | Melhor como bundler/transpilador; não é gerenciador de pacotes nem orquestrador completo de monorepos |

## Quando usar em projetos reais?

- **Sim:** bibliotecas, ferramentas CLI, bundling rápido em dev (Vite), projetos que priorizam velocidade.
- **Avaliar alternativas:** apps enterprise com code splitting complexo, loaders muito customizados ou legado Babel pesado — Webpack/Rspack podem ser mais adequados.

## Referências

- [Documentação oficial](https://esbuild.github.io/)
- [API](https://esbuild.github.io/api/)
- [Getting started](https://esbuild.github.io/getting-started/)
