/**
 * Máscaras y formateo de entrada para campos de formulario.
 * Restringen lo que el usuario puede escribir; la validación final la hace Zod.
 */

/** Máximo de dígitos antes del guión en CI. Debe coincidir con zodSchemas (ciSchema). */
const CI_NUMBERS_MAX = 7
/** Máximo de letras después del guión en CI. */
const CI_LETTERS_MAX = 3

/**
 * Formatea el valor del campo Carnet de Identidad al escribir.
 * Restricción estricta:
 * 1. Antes del guión: solo números, máximo 7.
 * 2. Después del guión: solo letras (A-Z), máximo 3.
 */
export function formatCIInput(value: string): string {
  const upper = value.toUpperCase()

  if (!upper.includes('-')) {
    // Sin guión: solo números, máx 7
    return upper.replace(/[^0-9]/g, '').slice(0, CI_NUMBERS_MAX)
  }

  // Con guión: dividir en parte numérica y parte de letras
  const [before, ...rest] = upper.split('-')
  const part1 = before.replace(/[^0-9]/g, '').slice(0, CI_NUMBERS_MAX)
  const part2 = rest.join('').replace(/[^A-Z]/g, '').slice(0, CI_LETTERS_MAX)

  return `${part1}-${part2}`
}

/**
 * Formatea el valor del campo Número de Celular al escribir.
 * Solo dígitos, máximo 8 caracteres (debe coincidir con zodSchemas celularSchema).
 */
export function formatCelularInput(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, 8)
}

/**
 * Formatea nombres y apellidos al escribir.
 * Solo letras (incluye acentos y Ñ) y espacios.
 * La validación final se hace en Zod.
 */
export function formatNameInput(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g, '')
}
