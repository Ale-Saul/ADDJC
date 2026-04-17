import { useState, useEffect, useCallback } from 'react'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'

export function useClubes() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClubes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await clubController.getAllClubes()
      if (response.success && response.data) {
        setClubes(response.data)
      } else {
        setError(response.error || 'Error al cargar clubes')
      }
    } catch (err) {
      setError('Error inesperado al cargar clubes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClubes()
  }, [fetchClubes])

  return {
    clubes,
    isLoading,
    error,
    refresh: fetchClubes
  }
}
