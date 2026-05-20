const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validarNome(nome: string): boolean {
  const t = nome.trim();
  return t.length >= 2 && t.length <= 120;
}
