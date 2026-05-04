import { useState, useMemo, useEffect, useCallback } from 'react'
import { Judoka } from '@/models/judoka'
import { Pago } from '@/models/pago'
import { useJudokas } from '@/hooks/useJudokas'
import { pagoController } from '@/controllers/pagoController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'
import { CATEGORIES } from '@/constants/globales'
import { ROL } from '@/constants/roles'
import { ESTADO_PAGO } from '@/constants/pagos'
import dayjs from 'dayjs'

export function usePagosManager(user: any) {
  const isAdmin = user?.rol === ROL.ADMIN

  // Estado de pagos
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)

  const refreshPagos = useCallback(async () => {
    setLoadingPagos(true)
    const clubId = user?.club_id
    const response = clubId
      ? await pagoController.getPagosByClub(clubId)
      : await pagoController.getAllPagos(false)
    if (response.success && response.data) {
      setPagos(response.data)
    }
    setLoadingPagos(false)
  }, [user?.club_id])

  useEffect(() => { refreshPagos() }, [refreshPagos])

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false)
  const [senseiFilter, setSenseiFilter] = useState<string>('all')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [clubFilter, setClubFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'vencido' | 'pendiente' | 'al_dia'>('all')
  const [clubes, setClubes] = useState<Club[]>([])
  
  // Hooks base
  const {
    judokas: rawJudokas,
    isLoading: loadingJudokas,
    searchTerm,
    setSearchTerm,
    refresh: refreshJudokas
  } = useJudokas({ clubId: user?.club_id || undefined, autoFetch: true })

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

  // Calcular el estado de pagos por judoka
  const judokasStatus = useMemo(() => {
    const statusMap: Record<string, 'vencido' | 'pendiente' | 'al_dia'> = {}
    const today = dayjs()

    // Inicializar todos como al día
    rawJudokas.forEach(j => {
      statusMap[j.id] = 'al_dia'
    })

    // Procesar pagos para determinar el estado más crítico
    pagos.forEach(p => {
      // Solo nos interesan los pagos que no están pagados ni cancelados
      if (p.estado === ESTADO_PAGO.PAGADO || p.estado === ESTADO_PAGO.CANCELADO || p.estado === ESTADO_PAGO.REEMBOLSADO) {
        return
      }

      const currentStatus = statusMap[p.judoka_id]
      if (!currentStatus) return

      // Determinar si está vencido dinámicamente
      const isVencido = p.estado === ESTADO_PAGO.VENCIDO || dayjs(p.fecha_vencimiento).isBefore(today, 'day')

      if (isVencido) {
        statusMap[p.judoka_id] = 'vencido' // Vencido tiene prioridad máxima
      } else if (currentStatus !== 'vencido') {
        statusMap[p.judoka_id] = 'pendiente'
      }
    })

    return statusMap
  }, [rawJudokas, pagos])

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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(j => judokasStatus[j.id] === statusFilter)
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
  }, [rawJudokas, senseiFilter, categoriaFilter, clubFilter, statusFilter, isAdmin, judokasStatus, user?.club_id])

  const clearFilters = useCallback(() => {
    setSenseiFilter('all')
    setCategoriaFilter('all')
    setClubFilter('all')
    setStatusFilter('all')
    setSearchTerm('')
  }, [setSearchTerm])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshJudokas(), refreshPagos()])
  }, [refreshJudokas, refreshPagos])

  // Paginación
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const totalPages = useMemo(() => {
    return Math.ceil(filteredJudokas.length / itemsPerPage)
  }, [filteredJudokas.length, itemsPerPage])

  const paginatedJudokas = useMemo(() => {
    return filteredJudokas.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    )
  }, [filteredJudokas, page, itemsPerPage])

  // Resetear a página 1 cuando los filtros cambian
  useEffect(() => {
    setPage(1)
  }, [searchTerm, senseiFilter, categoriaFilter, clubFilter, statusFilter])

  return {
    isAdmin,
    judokas: filteredJudokas,
    judokasStatus,
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
      statusFilter,
      setStatusFilter,
      clubes,
      senseisList,
      clearFilters
    },
    refreshAll,
    page: page || 1,
    setPage,
    itemsPerPage: itemsPerPage || 10,
    setItemsPerPage,
    totalPages: totalPages || 0,
    paginatedJudokas
  }
}
