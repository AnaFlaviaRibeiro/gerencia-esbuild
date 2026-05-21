import { test } from "node:test";
import assert from "node:assert/strict";
import { Calculator } from "./calculator.js";

function press(calc: Calculator, keys: string[]): void {
  for (const key of keys) {
    if (key === "AC") calc.clear();
    else if (key === "=") calc.equals();
    else if (key === ".") calc.inputDecimal();
    else if (["+", "-", "*", "/"].includes(key)) calc.setOperator(key as "+" | "-" | "*" | "/");
    else calc.inputDigit(key);
  }
}

test("soma 7 + 3 = 10", () => {
  const calc = new Calculator();
  press(calc, ["7", "+", "3", "="]);
  assert.equal(calc.getDisplay(), "10");
});

test("subtração 10 - 4 = 6", () => {
  const calc = new Calculator();
  press(calc, ["1", "0", "-", "4", "="]);
  assert.equal(calc.getDisplay(), "6");
});

test("multiplicação 6 * 5 = 30", () => {
  const calc = new Calculator();
  press(calc, ["6", "*", "5", "="]);
  assert.equal(calc.getDisplay(), "30");
});

test("divisão por zero retorna Erro", () => {
  const calc = new Calculator();
  press(calc, ["8", "/", "0", "="]);
  assert.equal(calc.getDisplay(), "Erro");
});

test("AC limpa o visor", () => {
  const calc = new Calculator();
  press(calc, ["9", "AC"]);
  assert.equal(calc.getDisplay(), "0");
});
