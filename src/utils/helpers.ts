/**
 * Funciones helper generales
 */

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
