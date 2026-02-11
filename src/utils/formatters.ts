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
   * Formatea una fecha y hora
   */
  formatDateTime(date: string | Date): string {
    const d = new Date(date)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
