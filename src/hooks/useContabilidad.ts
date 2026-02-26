import { useState, useEffect, useMemo } from 'react'
import { MovimientoFinanciero } from '@/models/movimientoFinanciero'
import { Club } from '@/models/club'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'
import { clubController } from '@/controllers/clubController'
import { ESTADO_MOVIMIENTO } from '@/constants/contabilidad'

export function useContabilidad() {
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para diálogo de formulario
  const [openDialog, setOpenDialog] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoFinanciero | null>(null)
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    return fecha.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [clubFiltro, setClubFiltro] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)

  const clearFilters = () => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    setFechaInicio(fecha.toISOString().split('T')[0])
    setFechaFin(new Date().toISOString().split('T')[0])
    setTipoFiltro('todos')
    setCategoriaFiltro('todos')
    setClubFiltro('todos')
  }

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar movimientos filtrados por fecha
      const movimientosResponse = await movimientoFinancieroController.getMovimientosByDateRange(
        fechaInicio,
        fechaFin
      )
      
      if (movimientosResponse.success && movimientosResponse.data) {
        setMovimientos(movimientosResponse.data)
      } else {
        setError(movimientosResponse.error || 'Error al cargar los movimientos')
      }

      // Cargar clubes para el filtro
      const clubesResponse = await clubController.getAllClubes()
      if (clubesResponse.success && clubesResponse.data) {
        setClubes(clubesResponse.data)
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      setError(err.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [fechaInicio, fechaFin])

  // Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      // Filtro por tipo
      if (tipoFiltro !== 'todos' && mov.tipo !== tipoFiltro) return false
      
      // Filtro por categoría
      if (categoriaFiltro !== 'todos' && mov.categoria !== categoriaFiltro) return false
      
      // Filtro por club
      if (clubFiltro !== 'todos' && mov.origen_club_id !== clubFiltro) return false
      
      // Excluir movimientos anulados por defecto
      if (mov.estado === ESTADO_MOVIMIENTO.CANCELADO) return false
      
      return true
    })
  }, [movimientos, tipoFiltro, categoriaFiltro, clubFiltro])

  // Calcular balance
  const balance = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0)
    
    const egresos = movimientosFiltrados
      .filter(m => m.tipo === 'egreso')
      .reduce((sum, m) => sum + m.monto, 0)
    
    return {
      total_ingresos: ingresos,
      total_egresos: egresos,
      balance: ingresos - egresos,
      periodo_inicio: fechaInicio,
      periodo_fin: fechaFin,
    }
  }, [movimientosFiltrados, fechaInicio, fechaFin])

  const handleAgregarMovimiento = () => {
    setEditingMovimiento(null)
    setOpenDialog(true)
  }

  const handleEditarMovimiento = (movimiento: MovimientoFinanciero) => {
    setEditingMovimiento(movimiento)
    setOpenDialog(true)
  }

  const handleEliminarMovimiento = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este movimiento?')) return
    
    try {
      const response = await movimientoFinancieroController.deleteMovimiento(id)
      if (response.success) {
        await cargarDatos()
      } else {
        alert(response.error || 'Error al eliminar movimiento')
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar movimiento')
    }
  }

  const handleAnularMovimiento = async (id: string) => {
    if (!confirm('¿Está seguro de anular este movimiento?')) return
    
    try {
      const response = await movimientoFinancieroController.anularMovimiento(id)
      if (response.success) {
        await cargarDatos()
      } else {
        alert(response.error || 'Error al anular movimiento')
      }
    } catch (err: any) {
      alert(err.message || 'Error al anular movimiento')
    }
  }

  const handleGuardarMovimiento = async () => {
    setOpenDialog(false)
    await cargarDatos()
  }

  return {
    movimientos,
    clubes,
    loading,
    error,
    openDialog,
    setOpenDialog,
    editingMovimiento,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    tipoFiltro,
    setTipoFiltro,
    categoriaFiltro,
    setCategoriaFiltro,
    clubFiltro,
    setClubFiltro,
    showFilters,
    setShowFilters,
    clearFilters,
    cargarDatos,
    movimientosFiltrados,
    balance,
    handleAgregarMovimiento,
    handleEditarMovimiento,
    handleEliminarMovimiento,
    handleAnularMovimiento,
    handleGuardarMovimiento
  }
}
