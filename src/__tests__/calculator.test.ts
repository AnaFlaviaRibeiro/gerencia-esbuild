import { describe, it, expect } from 'vitest';
import { Calculator } from '../calculator';

describe('Calculator', () => {
  it('adds numbers', () => {
    const c = new Calculator();
    c.inputDigit('1');
    c.setOperator('+');
    c.inputDigit('2');
    c.equals();
    expect(c.getDisplay()).toBe('3');
  });

  it('subtracts numbers', () => {
    const c = new Calculator();
    c.inputDigit('5');
    c.setOperator('-');
    c.inputDigit('2');
    c.equals();
    expect(c.getDisplay()).toBe('3');
  });

  it('multiplies numbers', () => {
    const c = new Calculator();
    c.inputDigit('3');
    c.setOperator('*');
    c.inputDigit('4');
    c.equals();
    expect(c.getDisplay()).toBe('12');
  });

  it('divides numbers', () => {
    const c = new Calculator();
    c.inputDigit('8');
    c.setOperator('/');
    c.inputDigit('2');
    c.equals();
    expect(c.getDisplay()).toBe('4');
  });

  it('percent converts correctly', () => {
    const c = new Calculator();
    c.inputDigit('5');
    c.percent();
    expect(c.getDisplay()).toBe('0.05');
  });

  it('handles divide by zero as error', () => {
    const c = new Calculator();
    c.inputDigit('1');
    c.setOperator('/');
    c.inputDigit('0');
    c.equals();
    expect(c.getDisplay()).toBe('Erro');
  });
});
