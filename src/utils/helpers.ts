/**
 * Funciones helper generales
 */

import { formatters } from './formatters'

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Espera un tiempo determinado (útil para delays)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Clona profundamente un objeto
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Compara dos objetos superficialmente
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false
    }
  }

  return true
}

/**
 * Obtiene valores únicos de un array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Agrupa un array por una clave
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Ordena un array por una clave
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Filtra un array por múltiples condiciones
 */
export function filterBy<T>(
  array: T[],
  filters: Partial<Record<keyof T, any>>
): T[] {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key as keyof T] === value
    })
  })
}

/**
 * Busca en un array por un término
 */
export function searchInArray<T>(
  array: T[],
  searchTerm: string,
  searchKeys: (keyof T)[]
): T[] {
  const term = searchTerm.toLowerCase().trim()

  if (!term) return array

  return array.filter(item => {
    return searchKeys.some(key => {
      const value = item[key]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term)
      }
      if (typeof value === 'number') {
        return value.toString().includes(term)
      }
      return false
    })
  })
}

/**
 * Pagina un array
 */
export function paginate<T>(
  array: T[],
  page: number,
  pageSize: number
): {
  data: T[]
  total: number
  totalPages: number
  currentPage: number
  hasMore: boolean
} {
  const total = array.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = array.slice(start, end)

  return {
    data,
    total,
    totalPages,
    currentPage: page,
    hasMore: page < totalPages,
  }
}

/**
 * Calcula el total de una propiedad numérica en un array
 */
export function sum<T>(array: T[], key: keyof T): number {
  return array.reduce((total, item) => {
    const value = item[key]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
}

/**
 * Calcula el promedio de una propiedad numérica en un array
 */
export function average<T>(array: T[], key: keyof T): number {
  if (array.length === 0) return 0
  return sum(array, key) / array.length
}

/**
 * Descarga un archivo
 */
export function downloadFile(data: Blob | string, filename: string, mimeType?: string) {
  const blob = typeof data === 'string' 
    ? new Blob([data], { type: mimeType || 'text/plain' })
    : data

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(nombre: string, apellido?: string): string {
  const n = nombre.charAt(0).toUpperCase()
  const a = apellido ? apellido.charAt(0).toUpperCase() : ''
  return n + a
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Verifica si una fecha ha expirado
 */
export function isExpired(date: string): boolean {
  return new Date(date) < new Date()
}

/**
 * Calcula días hasta/desde una fecha
 */
export function daysUntil(date: string): number {
  const target = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Obtiene el color de un estado
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    activo: 'success',
    inactivo: 'error',
    pendiente: 'warning',
    pagado: 'success',
    vencido: 'error',
    cancelado: 'error',
    completado: 'success',
  }
  return colors[status.toLowerCase()] || 'default'
}

/**
 * Formatea errores de API para mostrar
 */
export function formatApiError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return 'Ha ocurrido un error inesperado'
}

/**
 * Limpia un objeto eliminando propiedades undefined/null
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key as keyof T] = value
    }
    return acc
  }, {} as Partial<T>)
}

/**
 * Convierte un File a base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}
