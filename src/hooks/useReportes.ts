import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { pagoController } from '@/controllers/pagoController'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { Pago } from '@/models/pago'
import { Judoka } from '@/models/judoka'
import { Club } from '@/models/club'
import { ESTADO_PAGO, TIPO_PAGO_LABELS } from '@/constants/pagos'
import { ROL } from '@/constants/roles'
import { getOperationalClubId } from '@/utils/roleAccess'

export function useReportes() {
  const { user } = useAuth()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    return fecha.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() + 1)
    return fecha.toISOString().split('T')[0]
  })
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [senseiFiltro, setSenseiFiltro] = useState<string>('todos')
  const [clubFiltro, setClubFiltro] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)

  const isAdmin = user?.rol === ROL.ADMIN
  const operationalClubId = getOperationalClubId(user)

  // Obtener lista única de senseis de los judokas cargados
  const senseisList = useMemo(() => {
    const names = new Set<string>()
    judokas.forEach(j => {
      if (j.nombre_entrenador) names.add(j.nombre_entrenador)
    })
    return Array.from(names).sort()
  }, [judokas])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagosResponse, judokasResponse, clubesResponse] = await Promise.all([
          isAdmin
            ? pagoController.getAllPagos()
            : operationalClubId
              ? pagoController.getPagosByClub(operationalClubId)
              : Promise.resolve({ success: true, data: [] }),
          isAdmin
            ? judokaController.getAllJudokas(true)
            : operationalClubId
              ? judokaController.getJudokasByClub(operationalClubId)
              : Promise.resolve({ success: true, data: [] }),
          isAdmin
            ? clubController.getAllClubes()
            : Promise.resolve({ success: true, data: [] })
        ])

        if (pagosResponse.success && pagosResponse.data) {
          setPagos(pagosResponse.data)
        }
        if (judokasResponse.success && judokasResponse.data) {
          setJudokas(judokasResponse.data)
        }
        if (clubesResponse.success && clubesResponse.data) {
          setClubes(clubesResponse.data)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [operationalClubId, isAdmin])

  // Calcular el estado real de un pago considerando la fecha de vencimiento
  const getEstadoReal = (pago: Pago): string => {
    if (pago.estado === ESTADO_PAGO.PAGADO || 
        pago.estado === ESTADO_PAGO.CANCELADO || 
        pago.estado === ESTADO_PAGO.REEMBOLSADO) {
      return pago.estado
    }
    // Si está pendiente pero ya venció la fecha, mostrarlo como vencido
    if (pago.estado === ESTADO_PAGO.PENDIENTE && pago.fecha_vencimiento && pago.activo) {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const [year, month, day] = pago.fecha_vencimiento.split('-').map(Number)
      const vencimiento = new Date(year, month - 1, day)
      vencimiento.setHours(0, 0, 0, 0)
      
      if (vencimiento < hoy) return ESTADO_PAGO.VENCIDO
    }
    return pago.estado
  }

  // Pagos con el estado real calculado en tiempo real
  const pagosConEstadoReal = useMemo(() => {
    return pagos.map(pago => ({ ...pago, estado: getEstadoReal(pago) }))
  }, [pagos])

  // Filtrar pagos según criterios
  const pagosFiltrados = useMemo(() => {
    return pagosConEstadoReal.filter(pago => {
      // Filtro por fecha (usando fecha de creación o vencimiento según sea el caso)
      // Para reportes, solemos querer ver lo que "ocurre" en el rango.
      // Si el pago es pendiente/vencido, la fecha relevante es el vencimiento.
      // Si el pago está cobrado, la fecha relevante es la de pago.
      
      let fechaReferenciaStr: string | undefined = pago.created_at
      
      if (pago.estado === ESTADO_PAGO.PAGADO && pago.fecha_pago) {
        fechaReferenciaStr = pago.fecha_pago
      } else if (pago.fecha_vencimiento) {
        fechaReferenciaStr = pago.fecha_vencimiento
      }

      const [year, month, day] = (fechaReferenciaStr || '').split('T')[0].split('-').map(Number)
      const fechaRef = new Date(year, month - 1, day)
      fechaRef.setHours(0, 0, 0, 0)

      const [sYear, sMonth, sDay] = fechaInicio.split('-').map(Number)
      const inicio = new Date(sYear, sMonth - 1, sDay)
      inicio.setHours(0, 0, 0, 0)

      const [eYear, eMonth, eDay] = fechaFin.split('-').map(Number)
      const fin = new Date(eYear, eMonth - 1, eDay)
      fin.setHours(23, 59, 59, 999)
      
      if (fechaRef < inicio || fechaRef > fin) return false

      // Filtro por estado (usando el estado real)
      if (estadoFiltro !== 'todos' && pago.estado !== estadoFiltro) return false

      // Filtro por tipo
      if (tipoFiltro !== 'todos' && pago.tipo_pago !== tipoFiltro) return false

      // Filtro por Club (Solo Admin)
      if (isAdmin && clubFiltro !== 'todos' && pago.club_id !== clubFiltro) return false

      // Filtro por Sensei
      if (senseiFiltro !== 'todos') {
        const judoka = judokas.find(j => j.id === pago.judoka_id)
        if (judoka?.nombre_entrenador !== senseiFiltro) return false
      }

      return true
    })
  }, [pagosConEstadoReal, fechaInicio, fechaFin, estadoFiltro, tipoFiltro, senseiFiltro, clubFiltro, judokas, isAdmin])

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalGenerado = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.PAGADO)
      .reduce((sum, p) => sum + (p.monto_final || 0), 0)

    const totalPendiente = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.PENDIENTE)
      .reduce((sum, p) => sum + (p.monto_final || 0), 0)

    const totalVencido = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.VENCIDO)
      .reduce((sum, p) => sum + (p.monto_final || 0), 0)

    // Desglose por tipo de pago
    const porTipo = pagosFiltrados.reduce((acc, pago) => {
      const tipo = pago.tipo_pago
      if (!acc[tipo]) {
        acc[tipo] = { total: 0, cantidad: 0, pagado: 0 }
      }
      acc[tipo].total += pago.monto_final
      acc[tipo].cantidad += 1
      if (pago.estado === ESTADO_PAGO.PAGADO) {
        acc[tipo].pagado += pago.monto_final
      }
      return acc
    }, {} as Record<string, { total: number; cantidad: number; pagado: number }>)

    // Desglose por estado
    const porEstado = pagosFiltrados.reduce((acc, pago) => {
      const estado = pago.estado
      if (!acc[estado]) {
        acc[estado] = { total: 0, cantidad: 0 }
      }
      acc[estado].total += pago.monto_final
      acc[estado].cantidad += 1
      return acc
    }, {} as Record<string, { total: number; cantidad: number }>)

    return {
      totalGenerado,
      totalPendiente,
      totalVencido,
      cantidadTotal: pagosFiltrados.length,
      porTipo,
      porEstado
    }
  }, [pagosFiltrados])

  const clearFilters = () => {
    const fechaInicioDefault = new Date()
    fechaInicioDefault.setMonth(fechaInicioDefault.getMonth() - 1)
    
    const fechaFinDefault = new Date()
    fechaFinDefault.setMonth(fechaFinDefault.getMonth() + 1)

    setFechaInicio(fechaInicioDefault.toISOString().split('T')[0])
    setFechaFin(fechaFinDefault.toISOString().split('T')[0])
    setEstadoFiltro('todos')
    setTipoFiltro('todos')
    setSenseiFiltro('todos')
    setClubFiltro('todos')
  }

  const getJudokaNombre = (judokaId: string) => {
    const judoka = judokas.find(j => j.id === judokaId)
    if (!judoka) return 'Desconocido'
    return `${judoka.nombres} ${judoka.apellidos}`
  }

  const getTipoLabel = (tipo: string) => {
    return TIPO_PAGO_LABELS[tipo as keyof typeof TIPO_PAGO_LABELS] || tipo
  }

  return {
    pagos,
    judokas,
    clubes,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    estadoFiltro,
    setEstadoFiltro,
    tipoFiltro,
    setTipoFiltro,
    senseiFiltro,
    setSenseiFiltro,
    clubFiltro,
    setClubFiltro,
    showFilters,
    setShowFilters,
    isAdmin,
    senseisList,
    pagosFiltrados,
    estadisticas,
    clearFilters,
    getJudokaNombre,
    getTipoLabel
  }
}
