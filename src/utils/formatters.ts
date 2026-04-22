/**
 * Formateadores comunes para el sistema
 */

export const formatters = {
  /**
   * Formatea una fecha a string legible (dd/mm/yyyy por defecto)
   */
  formatDate(date: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!date) return '-'
    
    let d: Date
    if (typeof date === 'string') {
      // Si es formato YYYY-MM-DD, evitar problemas de zona horaria
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number)
        d = new Date(year, month - 1, day)
      } else {
        d = new Date(date)
      }
    } else {
      d = date
    }

    if (isNaN(d.getTime())) return '-'
    
    if (format === 'short') {
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
    
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  },

  /**
   * Formatea una fecha y hora con segundos
   */
  formatDateTime(date: string | Date, includeSeconds: boolean = false): string {
    const d = new Date(date)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined
    })
  },

  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number, currency: string = 'BOB'): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  },

  /**
   * Formatea un número con separadores de miles
   */
  formatNumber(num: number, decimals: number = 0): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  },

  /**
   * Formatea un nombre completo
   */
  formatFullName(nombres: string, apellidos?: string): string {
    if (apellidos) {
      return `${nombres} ${apellidos}`
    }
    return nombres
  },

  /**
   * Formatea un teléfono
   */
  formatPhone(phone: string): string {
    // Eliminar caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '')
    
    // Formatear según longitud
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2')
    }
    
    return phone
  },

  /**
   * Capitaliza la primera letra de cada palabra
   */
  capitalize(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },

  /**
   * Trunca un texto a cierta longitud
   */
  truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - suffix.length) + suffix
  },

  /**
   * Formatea un número de documento
   */
  formatDocumentNumber(doc: string, type: 'CI' | 'NIT' = 'CI'): string {
    const cleaned = doc.replace(/\D/g, '')
    
    if (type === 'CI') {
      return cleaned.replace(/(\d+)(\d{1,2})/, '$1-$2')
    }
    
    return cleaned
  },

  /**
   * Formatea un peso competitivo
   */
  formatWeight(weight: number): string {
    return `${weight} kg`
  },

  /**
   * Convierte un rol a su etiqueta legible
   */
  formatRole(rol: string): string {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      asociacion: 'Asociación',
      sensei: 'Sensei',
      encargado: 'Encargado',
      arbitro: 'Árbitro',
      judoka: 'Judoka',
    }
    return roles[rol] || rol
  },

  /**
   * Formatea un estado a su etiqueta legible
   */
  formatStatus(status: string): string {
    const statuses: Record<string, string> = {
      activo: 'Activo',
      inactivo: 'Inactivo',
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      vencido: 'Vencido',
      cancelado: 'Cancelado',
      completado: 'Completado',
    }
    return statuses[status.toLowerCase()] || status
  },

  /**
   * Formatea una categoría de judoka
   */
  formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  },

  /**
   * Formatea un grado de cinturón
   */
  formatBelt(belt: string): string {
    const belts: Record<string, string> = {
      blanco: 'Blanco',
      amarillo: 'Amarillo',
      naranja: 'Naranja',
      verde: 'Verde',
      azul: 'Azul',
      marron: 'Marrón',
      negro: 'Negro',
    }
    return belts[belt.toLowerCase()] || belt
  },
}

export function formatCIInput(value: string): string {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '').slice(0, 7);
}

export function formatCIExtensionInput(value: string): string {
  if (!value) return '';
  // Formato: 1 número seguido de 1 letra (ej: 1A)
  const cleaned = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  
  if (cleaned.length === 0) return '';
  
  const firstChar = cleaned[0].replace(/[^0-9]/g, '');
  const secondChar = cleaned.length > 1 ? cleaned[1].replace(/[^A-Z]/g, '') : '';
  
  return firstChar + secondChar;
}

export function formatNameInput(value: string): string {
  if (!value) return '';
  // Eliminar números y caracteres especiales, permitir letras, acentos, Ñ y espacios
  const cleaned = value.replace(/[0-9]/g, '').replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
  // Reducir múltiples espacios a uno solo
  const singleSpace = cleaned.replace(/\s+/g, ' ');
  // Capitalizar solo la primera letra de la cadena
  if (singleSpace.length > 0) {
    return singleSpace.charAt(0).toUpperCase() + singleSpace.slice(1);
  }
  return singleSpace;
}

export function formatCelularInput(value: string): string {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '').slice(0, 8);
}

/**
 * Normaliza espacios en campos de texto libre: colapsa múltiples espacios
 * consecutivos a uno solo. El recorte final ocurre al enviar el formulario.
 */
export function formatTextoInput(value: string): string {
  return value.replace(/\s{2,}/g, ' ');
}

/**
 * Formatea input de hora HH:MM mientras el usuario escribe.
 * - Solo acepta dígitos; el ":" se inserta automáticamente.
 * - Horas: 00-23 · Minutos: 00-59
 */
export function formatHoraInput(raw: string): string {
  // Extraer solo dígitos del valor crudo
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // Parte de las horas (primeros 2 dígitos)
  let h = digits.slice(0, 2);

  // Si el primer dígito es > 2, no puede ser una hora válida de dos dígitos → auto-pad con 0
  if (h.length === 1 && parseInt(h, 10) > 2) {
    h = '0' + h;
  }

  // Clampear horas al rango 00-23
  if (h.length === 2 && parseInt(h, 10) > 23) h = '23';

  if (digits.length <= 2) {
    // Si el valor ya tenía ":" significa que el usuario está borrando: no re-insertar
    const hadColon = raw.includes(':');
    if (digits.length === 2 && !hadColon) return h + ':';
    return h;
  }

  // Parte de los minutos (dígitos 3 y 4)
  let m = digits.slice(2, 4);
  // El primer dígito de los minutos no puede ser > 5 (rango 00-59)
  if (m.length >= 1 && parseInt(m[0], 10) > 5) m = '5' + m.slice(1);
  if (m.length === 2 && parseInt(m, 10) > 59) m = '59';

  return h + ':' + m;
}

export function formatNameWithNumbersInput(value: string): string {
  if (!value) return '';
  // Permitir letras, acentos, Ñ, números y espacios. Eliminar otros caracteres especiales.
  const cleaned = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s]/g, '');
  // Reducir múltiples espacios a uno solo
  const singleSpace = cleaned.replace(/\s+/g, ' ');
  // Capitalizar solo la primera letra de la cadena
  if (singleSpace.length > 0) {
    return singleSpace.charAt(0).toUpperCase() + singleSpace.slice(1);
  }
  return singleSpace;
}
