import "./styles.css";
import { Calculator, type Operator } from "./calculator.js";

const calc = new Calculator();
let expressionHint = "";

const app = document.getElementById("app");
if (!app) throw new Error("#app não encontrado");

function formatDisplay(value: string): string {
  return value.replace(".", ",");
}

function render(): void {
  const value = calc.getDisplay();
  const isError = value === "Erro";
  const shown = isError ? value : formatDisplay(value);

  app.innerHTML = `
    <header class="page-header">
      <h1>Calculadora</h1>
      <p>Demo esbuild · TypeScript empacotado</p>
    </header>
    <div class="calculator" role="application" aria-label="Calculadora">
      <div class="display" aria-live="polite">
        <div class="display-expression">${expressionHint}</div>
        <div class="display-value${isError ? " error" : ""}">${shown}</div>
      </div>
      <div class="keys">
        <button type="button" class="fn" data-action="clear">AC</button>
        <button type="button" class="fn" data-action="sign">±</button>
        <button type="button" class="fn" data-action="percent">%</button>
        <button type="button" class="op" data-op="/">÷</button>

        <button type="button" data-digit="7">7</button>
        <button type="button" data-digit="8">8</button>
        <button type="button" data-digit="9">9</button>
        <button type="button" class="op" data-op="*">×</button>

        <button type="button" data-digit="4">4</button>
        <button type="button" data-digit="5">5</button>
        <button type="button" data-digit="6">6</button>
        <button type="button" class="op" data-op="-">−</button>

        <button type="button" data-digit="1">1</button>
        <button type="button" data-digit="2">2</button>
        <button type="button" data-digit="3">3</button>
        <button type="button" class="op" data-op="+">+</button>

        <button type="button" class="zero" data-digit="0">0</button>
        <button type="button" data-action="decimal">,</button>
        <button type="button" class="equals" data-action="equals">=</button>
      </div>
    </div>
    <p class="devtools-tip">
      <kbd>F12</kbd> → Fontes → <code>calculator.ts</code> / <code>index.ts</code>
    </p>
  `;

  app.querySelectorAll("[data-digit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      calc.inputDigit((btn as HTMLButtonElement).dataset.digit!);
      update();
    });
  });

  app.querySelectorAll("[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const op = (btn as HTMLButtonElement).dataset.op as Operator;
      expressionHint = `${calc.getDisplay()} ${symbol(op)}`;
      calc.setOperator(op);
      highlightOp(btn as HTMLButtonElement);
      update();
    });
  });

  app.querySelector('[data-action="decimal"]')?.addEventListener("click", () => {
    calc.inputDecimal();
    update();
  });

  app.querySelector('[data-action="equals"]')?.addEventListener("click", () => {
    calc.equals();
    expressionHint = "";
    update();
  });

  app.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
    calc.clear();
    expressionHint = "";
    update();
  });

  app.querySelector('[data-action="sign"]')?.addEventListener("click", () => {
    calc.toggleSign();
    update();
  });

  app.querySelector('[data-action="percent"]')?.addEventListener("click", () => {
    calc.percent();
    update();
  });

  document.addEventListener("keydown", onKeyDown);
}

function symbol(op: Operator): string {
  return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op];
}

function highlightOp(active: HTMLButtonElement): void {
  app.querySelectorAll(".op.active").forEach((b) => b.classList.remove("active"));
  active.classList.add("active");
}

function update(): void {
  const valueEl = app.querySelector(".display-value");
  const exprEl = app.querySelector(".display-expression");
  if (valueEl) {
    const v = calc.getDisplay();
    valueEl.textContent = v === "Erro" ? v : formatDisplay(v);
    valueEl.classList.toggle("error", v === "Erro");
  }
  if (exprEl) exprEl.textContent = expressionHint;
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key >= "0" && e.key <= "9") {
    calc.inputDigit(e.key);
    update();
  } else if (e.key === "." || e.key === ",") {
    e.preventDefault();
    calc.inputDecimal();
    update();
  } else if (e.key === "Enter" || e.key === "=") {
    calc.equals();
    expressionHint = "";
    update();
  } else if (e.key === "Escape") {
    calc.clear();
    expressionHint = "";
    update();
  } else if (e.key === "Backspace") {
    calc.backspace();
    update();
  } else if (["+", "-", "*", "/"].includes(e.key)) {
    expressionHint = `${calc.getDisplay()} ${symbol(e.key as Operator)}`;
    calc.setOperator(e.key as Operator);
    update();
  }
}

render();
console.log("Calculadora carregada (esbuild bundle)", { versao: "1.0" });
