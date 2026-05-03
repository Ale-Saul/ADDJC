import { useState, useEffect, useMemo } from 'react'
import { pagoController } from '@/controllers/pagoController'
import { clubController } from '@/controllers/clubController'
import { judokaController } from '@/controllers/judokaController'
import { Pago } from '@/models/pago'
import { Club } from '@/models/club'
import { Judoka } from '@/models/judoka'
import { ESTADO_PAGO, TIPO_PAGO_LABELS } from '@/constants/pagos'
import dayjs from 'dayjs'

export interface ResumenClub {
  club: Club
  totalCobrado: number
  totalPendiente: number
  totalVencido: number
  cantidadPagos: number
  cantidadJudokas: number
}

export interface ResumenJudoka {
  judoka: Judoka
  totalCobrado: number
  totalPendiente: number
  totalVencido: number
  cantidadPagos: number
}

export interface PagoConDetalles extends Pago {
  judoka_nombre?: string
  club_nombre?: string
}

export function useReportesAsociacion() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    return fecha.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [clubSeleccionado, setClubSeleccionado] = useState<string>('todos')
  const [vistaDetalle, setVistaDetalle] = useState<'club' | 'pagos' | 'judokas'>('club')
  const [showFilters, setShowFilters] = useState(false)

  const clearFilters = () => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    setFechaInicio(fecha.toISOString().split('T')[0])
    setFechaFin(new Date().toISOString().split('T')[0])
    setClubSeleccionado('todos')
    setVistaDetalle('club')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagosResponse, clubesResponse, judokasResponse] = await Promise.all([
          pagoController.getAllPagos(),
          clubController.getAllClubes(),
          judokaController.getAllJudokas()
        ])

        if (pagosResponse.success && pagosResponse.data) {
          setPagos(pagosResponse.data)
        }
        if (clubesResponse.success && clubesResponse.data) {
          setClubes(clubesResponse.data)
        }
        if (judokasResponse.success && judokasResponse.data) {
          setJudokas(judokasResponse.data)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar pagos por fecha
  const pagosFiltrados = useMemo(() => {
    const today = dayjs().startOf('day')
    
    return pagos.map(pago => {
      // Determinar si está vencido dinámicamente si está pendiente
      if (pago.estado === ESTADO_PAGO.PENDIENTE && pago.fecha_vencimiento) {
        const vencimiento = dayjs(pago.fecha_vencimiento).startOf('day')
        if (vencimiento.isBefore(today)) {
          return { ...pago, estado: ESTADO_PAGO.VENCIDO }
        }
      }
      return pago
    }).filter(pago => {
      const fechaPago = new Date(pago.created_at)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)
      
      return fechaPago >= inicio && fechaPago <= fin
    })
  }, [pagos, fechaInicio, fechaFin])

  // Calcular resumen por club
  const resumenesPorClub = useMemo(() => {
    // Filtrar clubes según selección
    const clubesFiltrados = clubSeleccionado === 'todos' 
      ? clubes 
      : clubes.filter(c => c.id === clubSeleccionado)

    const resumen: ResumenClub[] = clubesFiltrados.map(club => {
      const pagosClub = pagosFiltrados.filter(p => p.club_id === club.id)
      
      const totalCobrado = pagosClub
        .filter(p => p.estado === ESTADO_PAGO.PAGADO)
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalPendiente = pagosClub
        .filter(p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO)
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalVencido = pagosClub
        .filter(p => p.estado === ESTADO_PAGO.VENCIDO)
        .reduce((sum, p) => sum + p.monto_final, 0)

      // Contar judokas únicos con pagos en este período
      const judokasUnicos = new Set(pagosClub.map(p => p.judoka_id))

      return {
        club,
        totalCobrado,
        totalPendiente,
        totalVencido,
        cantidadPagos: pagosClub.length,
        cantidadJudokas: judokasUnicos.size
      }
    })

    // Ordenar por total cobrado descendente
    return resumen.sort((a, b) => b.totalCobrado - a.totalCobrado)
  }, [clubes, pagosFiltrados, clubSeleccionado])

  // Pagos con detalles de judoka y club
  const pagosConDetalles = useMemo(() => {
    // Filtrar pagos según club seleccionado
    const pagosFiltradosPorClub = clubSeleccionado === 'todos'
      ? pagosFiltrados
      : pagosFiltrados.filter(p => p.club_id === clubSeleccionado)
    
    return pagosFiltradosPorClub.map(pago => {
      const judoka = judokas.find(j => j.id === pago.judoka_id)
      const club = clubes.find(c => c.id === pago.club_id)
      
      return {
        ...pago,
        judoka_nombre: judoka ? `${judoka.nombres} ${judoka.apellidos}` : 'N/A',
        club_nombre: club?.nombre_club || 'N/A'
      } as PagoConDetalles
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [pagosFiltrados, judokas, clubes, clubSeleccionado])

  // Calcular resumen por judoka
  const resumenesPorJudoka = useMemo(() => {
    // Filtrar judokas según selección de club
    const judokasFiltrados = clubSeleccionado === 'todos' 
      ? judokas 
      : judokas.filter(j => j.club_id === clubSeleccionado)

    // Filtrar pagos según selección de club
    const pagosFiltradosPorClub = clubSeleccionado === 'todos'
      ? pagosFiltrados
      : pagosFiltrados.filter(p => p.club_id === clubSeleccionado)

    const resumen: ResumenJudoka[] = judokasFiltrados.map(judoka => {
      const pagosJudoka = pagosFiltradosPorClub.filter(p => p.judoka_id === judoka.id)
      
      const totalCobrado = pagosJudoka
        .filter(p => p.estado === ESTADO_PAGO.PAGADO)
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalPendiente = pagosJudoka
        .filter(p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO)
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalVencido = pagosJudoka
        .filter(p => p.estado === ESTADO_PAGO.VENCIDO)
        .reduce((sum, p) => sum + p.monto_final, 0)

      return {
        judoka,
        totalCobrado,
        totalPendiente,
        totalVencido,
        cantidadPagos: pagosJudoka.length
      }
    })

    // Ordenar por total pendiente descendente (mostrar primero los que más deben)
    return resumen.sort((a, b) => b.totalPendiente - a.totalPendiente)
  }, [judokas, pagosFiltrados, clubSeleccionado])

  // Totales generales
  const totalesGenerales = useMemo(() => {
    return {
      totalCobrado: resumenesPorClub.reduce((sum, r) => sum + r.totalCobrado, 0),
      totalPendiente: resumenesPorClub.reduce((sum, r) => sum + r.totalPendiente, 0),
      totalVencido: resumenesPorClub.reduce((sum, r) => sum + r.totalVencido, 0),
      cantidadClubes: clubes.length,
      clubesActivos: resumenesPorClub.filter(r => r.cantidadPagos > 0).length
    }
  }, [resumenesPorClub, clubes])

  const getTipoLabel = (tipo: string) => {
    return TIPO_PAGO_LABELS[tipo as keyof typeof TIPO_PAGO_LABELS] || tipo
  }

  return {
    pagos,
    clubes,
    judokas,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    clubSeleccionado,
    setClubSeleccionado,
    vistaDetalle,
    setVistaDetalle,
    showFilters,
    setShowFilters,
    clearFilters,
    pagosFiltrados,
    resumenesPorClub,
    pagosConDetalles,
    resumenesPorJudoka,
    totalesGenerales,
    getTipoLabel
  }
}
