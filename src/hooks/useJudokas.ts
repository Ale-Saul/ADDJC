/**
 * Hook personalizado para manejo de judokas
 */

import { useState, useEffect, useCallback } from 'react'
import { judokaController } from '@/controllers/judokaController'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { searchInArray } from '@/utils/helpers'

interface UseJudokasOptions {
  clubId?: string
  entrenadorId?: string
  autoFetch?: boolean
}

export function useJudokas(options: UseJudokasOptions = {}) {
  const { clubId, entrenadorId, autoFetch = true } = options

  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [filteredJudokas, setFilteredJudokas] = useState<Judoka[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJudoka, setSelectedJudoka] = useState<Judoka | null>(null)

  const fetchJudokas = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let response
    // Determinar qué método llamar según los filtros
    if (entrenadorId) {
      // Si hay entrenadorId, filtrar por entrenador (senseis)
      response = await judokaController.getJudokasByEntrenador(entrenadorId)
    } else if (clubId) {
      // Si hay clubId, filtrar por club (encargados)
      response = await judokaController.getJudokasByClub(clubId)
    } else {
      // Sin filtros, obtener todos (admin, asociacion)
      response = await judokaController.getAllJudokas()
    }

    if (response.success && response.data) {
      setJudokas(response.data)
      setFilteredJudokas(response.data)
    } else {
      setError(response.error || 'Error al cargar judokas')
    }

    setIsLoading(false)
  }, [clubId, entrenadorId])

  useEffect(() => {
    if (autoFetch) {
      fetchJudokas()
    }
  }, [fetchJudokas, autoFetch])

  useEffect(() => {
    if (searchTerm) {
      const results = searchInArray(judokas, searchTerm, [
        'nombres',
        'apellidos',
        'categoria',
        'cinturon_actual',
        'nombre_entrenador',
      ])
      setFilteredJudokas(results)
    } else {
      setFilteredJudokas(judokas)
    }
  }, [searchTerm, judokas])

  const getJudoka = async (id: string) => {
    setIsLoading(true)
    const response = await judokaController.getJudokaById(id)

    if (response.success && response.data) {
      setSelectedJudoka(response.data)
      return { success: true, data: response.data }
    } else {
      setError(response.error || 'Error al cargar judoka')
      return { success: false, error: response.error }
    }
  }

  const createJudoka = async (data: JudokaCreate) => {
    setIsLoading(true)
    const response = await judokaController.createJudoka(data)

    if (response.success && response.data) {
      setJudokas(prev => [...prev, response.data!])
      return { success: true, data: response.data }
    } else {
      setError(response.error || 'Error al crear judoka')
      return { success: false, error: response.error }
    }
  }

  const updateJudoka = async (id: string, data: JudokaUpdate) => {
    setIsLoading(true)
    const response = await judokaController.updateJudoka(id, data)

    if (response.success && response.data) {
      setJudokas(prev =>
        prev.map(j => (j.id === id ? response.data! : j))
      )
      if (selectedJudoka?.id === id) {
        setSelectedJudoka(response.data)
      }
      return { success: true, data: response.data }
    } else {
      setError(response.error || 'Error al actualizar judoka')
      return { success: false, error: response.error }
    }
  }

  const deleteJudoka = async (id: string) => {
    const judoka = judokas.find(j => j.id === id)
    if (!judoka) {
      return { success: false, error: 'Judoka no encontrado' }
    }

    const confirmed = confirm(
      `¿Estás seguro de eliminar al judoka "${judoka.nombres} ${judoka.apellidos}"?`
    )

    if (!confirmed) {
      return { success: false, error: 'Operación cancelada' }
    }

    setIsLoading(true)
    const response = await judokaController.deleteJudoka(id)

    if (response.success) {
      setJudokas(prev => prev.filter(j => j.id !== id))
      return { success: true }
    } else {
      setError(response.error || 'Error al eliminar judoka')
      return { success: false, error: response.error }
    }
  }

  const refresh = async () => {
    await fetchJudokas()
  }

  return {
    judokas: filteredJudokas,
    allJudokas: judokas,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    selectedJudoka,
    getJudoka,
    createJudoka,
    updateJudoka,
    deleteJudoka,
    refresh,
  }
}
