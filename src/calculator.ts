export type Operator = "+" | "-" | "*" | "/";

export class Calculator {
  private display = "0";
  private stored: number | null = null;
  private pending: Operator | null = null;
  private fresh = true;

  getDisplay(): string {
    return this.display;


  inputDigit(digit: string): void {
    if (this.fresh) {
      this.display = digit === "0" ? "0" : digit;
      this.fresh = false;
      return;
    }
    if (this.display === "0" && digit !== ".") {
      this.display = digit;
    } else if (this.display.length < 12) {
      this.display += digit;
    }
  }

  inputDecimal(): void {
    if (this.fresh) {
      this.display = "0.";
      this.fresh = false;
      return;
    }
    if (!this.display.includes(".")) {
      this.display += ".";
    }
  }

  setOperator(op: Operator): void {
    const current = parseFloat(this.display);
    if (this.stored !== null && this.pending && !this.fresh) {
      this.stored = this.compute(this.stored, current, this.pending);
      this.display = this.format(this.stored);
    } else {
      this.stored = current;
    }
    this.pending = op;
    this.fresh = true;
  }

  equals(): void {
    if (this.stored === null || !this.pending) return;
    const current = parseFloat(this.display);
    const result = this.compute(this.stored, current, this.pending);
    this.display = this.format(result);
    this.stored = null;
    this.pending = null;
    this.fresh = true;
  }

  clear(): void {
    this.display = "0";
    this.stored = null;
    this.pending = null;
    this.fresh = true;
  }

  toggleSign(): void {
    const n = parseFloat(this.display);
    this.display = this.format(-n);
  }

  percent(): void {
    const n = parseFloat(this.display) / 100;
    this.display = this.format(n);
  }

  backspace(): void {
    if (this.fresh || this.display.length <= 1) {
      this.display = "0";
      this.fresh = true;
      return;
    }
    this.display = this.display.slice(0, -1);
    if (this.display === "" || this.display === "-") {
      this.display = "0";
    }
  }

  private compute(a: number, b: number, op: Operator): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
    }
  }

  private format(n: number): string {
    if (!Number.isFinite(n)) return "Erro";
    const str = String(Math.round(n * 1e10) / 1e10);
    return str.length > 12 ? n.toExponential(4) : str;
  }
}
