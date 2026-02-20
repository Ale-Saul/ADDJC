/**
 * Utilidades para la gestión de contraseñas
 */

/**
 * Genera la contraseña inicial para un nuevo usuario basada en su carnet.
 * Formato: "Judo.[Carnet]"
 * Si el carnet contiene guiones (ej: 1234567-CB), se mantienen.
 */
export function generarPasswordInicial(ci: string): string {
  if (!ci) return `Judo.${Math.random().toString(36).slice(-8)}`
  return `Judo.${ci.trim()}`
}
