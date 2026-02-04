/**
 * Validadores comunes para el sistema
 */

export const validators = {
  /**
   * Valida formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Valida longitud mínima de contraseña
   */
  isValidPassword(password: string, minLength: number = 6): boolean {
    return password.length >= minLength
  },

  /**
   * Valida que un string no esté vacío
   */
  isNotEmpty(value: string): boolean {
    return value.trim().length > 0
  },

  /**
   * Valida que un número sea positivo
   */
  isPositiveNumber(value: number): boolean {
    return value > 0
  },

  /**
   * Valida formato de teléfono (básico)
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{7,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  },

  /**
   * Valida que una fecha no sea futura
   */
  isNotFutureDate(date: string): boolean {
    const inputDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return inputDate <= today
  },

  /**
   * Valida rango de edad
   */
  isValidAge(birthDate: string, minAge: number = 0, maxAge: number = 150): boolean {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age >= minAge && age <= maxAge
  },

  /**
   * Valida que un valor esté en un array de opciones
   */
  isInArray<T>(value: T, array: T[]): boolean {
    return array.includes(value)
  },

  /**
   * Valida URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  /**
   * Valida que un objeto tenga propiedades requeridas
   */
  hasRequiredFields<T extends Record<string, any>>(
    obj: T,
    requiredFields: (keyof T)[]
  ): boolean {
    return requiredFields.every(field => {
      const value = obj[field]
      return value !== undefined && value !== null && value !== ''
    })
  },
}

/**
 * Mensajes de error de validación
 */
export const validationMessages = {
  required: (field: string) => `${field} es requerido`,
  invalidEmail: 'El formato del email no es válido',
  invalidPassword: (minLength: number) => `La contraseña debe tener al menos ${minLength} caracteres`,
  invalidPhone: 'El formato del teléfono no es válido',
  futureDate: 'La fecha no puede ser futura',
  invalidAge: (min: number, max: number) => `La edad debe estar entre ${min} y ${max} años`,
  invalidUrl: 'La URL no es válida',
  notInList: (field: string) => `${field} no es una opción válida`,
  positiveNumber: (field: string) => `${field} debe ser un número positivo`,
}
