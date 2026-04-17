/**
 * Utilidades para la gestión de contraseñas
 */

export function generarPasswordInicial(ci: string): string {
  if (!ci) return `Judo.${Math.random().toString(36).slice(-8)}`
  return `Judo.${ci.trim()}`
}
