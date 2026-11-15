/**
 * Utilidades para la gestión de contraseñas
 */

export function generarPasswordInicial(ci?: string | null, ci_extension?: string | null): string {
  if (!ci || !ci.trim()) return 'Cochabamba2026!'
  const extension = ci_extension ? `-${ci_extension.trim()}` : ''
  return `Koklub.${ci.trim()}${extension}`
}
