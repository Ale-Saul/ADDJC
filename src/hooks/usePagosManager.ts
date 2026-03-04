import { useState, useMemo, useEffect, useCallback } from 'react'
import { Judoka } from '@/models/judoka'
import { Pago } from '@/models/pago'
import { useJudokas } from '@/hooks/useJudokas'
import { usePagos } from '@/hooks/usePagos'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'
import { CATEGORIES } from '@/utils/constants'
import { ROL } from '@/constants/roles'

export function usePagosManager(user: any) {
  const isAdmin = user?.rol === ROL.ADMIN
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false)
  const [senseiFilter, setSenseiFilter] = useState<string>('all')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [clubFilter, setClubFilter] = useState<string>('all')
  const [clubes, setClubes] = useState<Club[]>([])
  
  // Hooks base
  const {
    judokas: rawJudokas,
    isLoading: loadingJudokas,
    searchTerm,
    setSearchTerm,
    refresh: refreshJudokas
  } = useJudokas({ clubId: user?.club_id || undefined, autoFetch: true })

  const {
    allPagos: pagos,
    isLoading: loadingPagos,
    refresh: refreshPagos,
  } = usePagos({ clubId: user?.club_id || undefined })

  // Cargar clubes solo para admins
  useEffect(() => {
    if (isAdmin) {
      const loadClubes = async () => {
        const response = await clubController.getAllClubes()
        if (response.success && response.data) {
          setClubes(response.data)
        }
      }
      loadClubes()
    }
  }, [isAdmin])

  // Obtener lista única de senseis
  const senseisList = useMemo(() => {
    const names = new Set<string>()
    rawJudokas.forEach(j => {
      if (j.nombre_entrenador) names.add(j.nombre_entrenador)
    })
    return Array.from(names).sort()
  }, [rawJudokas])

  // Filtrado y ordenamiento de judokas
  const filteredJudokas = useMemo(() => {
    let filtered = [...rawJudokas]
    
    if (senseiFilter !== 'all') {
      filtered = filtered.filter(j => j.nombre_entrenador === senseiFilter)
    }
    
    if (categoriaFilter !== 'all') {
      filtered = filtered.filter(j => j.categoria === categoriaFilter)
    }

    if (isAdmin && clubFilter !== 'all') {
      filtered = filtered.filter(j => j.club_id === clubFilter)
    }

    // Filtrar judokas que no tienen club (solo si no es admin y no se ha filtrado por club)
    // En pagos y cuotas solo deben aparecer los del club
    if (!isAdmin) {
      filtered = filtered.filter(j => j.club_id === user?.club_id)
    }

    return filtered.sort((a, b) => {
      const clubA = a.nombre_club || 'Z'
      const clubB = b.nombre_club || 'Z'
      const clubCompare = clubA.localeCompare(clubB)
      if (clubCompare !== 0) return clubCompare

      const senseiA = a.nombre_entrenador || 'Z'
      const senseiB = b.nombre_entrenador || 'Z'
      const senseiCompare = senseiA.localeCompare(senseiB)
      if (senseiCompare !== 0) return senseiCompare

      const beltA = a.cinturon_actual || 'Z'
      const beltB = b.cinturon_actual || 'Z'
      const beltCompare = beltA.localeCompare(beltB)
      if (beltCompare !== 0) return beltCompare

      return (a.nombres || '').localeCompare(b.nombres || '')
    })
  }, [rawJudokas, senseiFilter, categoriaFilter, clubFilter, isAdmin])

  const clearFilters = useCallback(() => {
    setSenseiFilter('all')
    setCategoriaFilter('all')
    setClubFilter('all')
    setSearchTerm('')
  }, [setSearchTerm])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshJudokas(), refreshPagos()])
  }, [refreshJudokas, refreshPagos])

  return {
    isAdmin,
    judokas: filteredJudokas,
    pagos,
    loading: loadingJudokas || loadingPagos,
    searchTerm,
    setSearchTerm,
    filters: {
      showFilters,
      setShowFilters,
      senseiFilter,
      setSenseiFilter,
      categoriaFilter,
      setCategoriaFilter,
      clubFilter,
      setClubFilter,
      clubes,
      senseisList,
      clearFilters
    },
    refreshAll
  }
}
