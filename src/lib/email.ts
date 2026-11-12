// Validação de email partilhada entre cliente (formulários) e servidor (zod).
// Uma única regra evita divergências entre o que o formulário aceita e o que a API aceita.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Remove espaços; devolve null para vazio (o email é opcional). */
export function normalizarEmail(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor
  const v = valor.trim()
  return v === '' ? null : v
}

/** Vazio é válido (campo opcional); caso contrário tem de ter formato de email. */
export function emailValido(valor: string): boolean {
  const v = valor.trim()
  return v === '' || EMAIL_REGEX.test(v)
}
