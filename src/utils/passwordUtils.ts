/**
 * Utilidades para la gestión de contraseñas
 */

export function generarPasswordInicial(ci: string, ci_extension?: string | null): string {
  if (!ci) return `Judo.${Math.random().toString(36).slice(-8)}`
  const extension = ci_extension ? `-${ci_extension.trim()}` : ''
  return `Judo.${ci.trim()}${extension}`
}
