/**
 * Hook personalizado para manejo de pagos
 */

import { useState, useEffect, useCallback } from 'react'
import { pagoController } from '@/controllers/pagoController'
import { Pago, PagoCreate, PagoUpdate } from '@/models/pago'
import { searchInArray, filterBy } from '@/utils/helpers'
import { PAYMENT_STATUS } from '@/utils/constants'

interface UsePagosOptions {
  judokaId?: string
  clubId?: string
  estado?: string
  autoFetch?: boolean
}

export function usePagos(options: UsePagosOptions = {}) {
  const { judokaId, clubId, estado, autoFetch = true } = options

  const [pagos, setPagos] = useState<Pago[]>([])
  const [filteredPagos, setFilteredPagos] = useState<Pago[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    pagados: 0,
    vencidos: 0,
  })

  const fetchPagos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const response = await pagoController.getAllPagos(judokaId, clubId, estado)

    if (response.success && response.data) {
      setPagos(response.data)
      setFilteredPagos(response.data)
      calculateStats(response.data)
    } else {
      setError(response.error || 'Error al cargar pagos')
    }

    setIsLoading(false)
  }, [judokaId, clubId, estado])

  useEffect(() => {
    if (autoFetch) {
      fetchPagos()
    }
  }, [fetchPagos, autoFetch])

  useEffect(() => {
    let results = pagos

    if (searchTerm) {
      results = searchInArray(pagos, searchTerm, ['concepto', 'descripcion'])
    }

    setFilteredPagos(results)
  }, [searchTerm, pagos])

  const calculateStats = (pagosList: Pago[]) => {
    const total = pagosList.length
    const pendientes = pagosList.filter(p => p.estado === PAYMENT_STATUS.PENDIENTE).length
    const pagados = pagosList.filter(p => p.estado === PAYMENT_STATUS.PAGADO).length
    const vencidos = pagosList.filter(p => p.estado === PAYMENT_STATUS.VENCIDO).length

    setStats({ total, pendientes, pagados, vencidos })
  }

  const getPago = async (id: string) => {
    setIsLoading(true)
    const response = await pagoController.getPagoById(id)

    if (response.success && response.data) {
      setSelectedPago(response.data)
      return { success: true, data: response.data }
    } else {
      setError(response.error || 'Error al cargar pago')
      return { success: false, error: response.error }
    }
  }

  const createPago = async (data: PagoCreate) => {
    setIsLoading(true)
    const response = await pagoController.createPago(data)

    if (response.success && response.data) {
      setPagos(prev => [...prev, response.data!])
      return { success: true, data: response.data }
    } else {
      setError(response.error || 'Error al crear pago')
      return { success: false, error: response.error }
    }
  }

  const updatePago = async (id: string, data: PagoUpdate) => {
    setIsLoading(true)
    const response = await pagoController.updatePago(id, data)

    if (response.success && response.data) {
      setPagos(prev => prev.map(p => (p.id === id ? response.data! : p)))
      if (selectedPago?.id === id) {
        setSelectedPago(response.data)
      }
      return { success: true, data: response.data }
    } else {
      setError(response.error || 'Error al actualizar pago')
      return { success: false, error: response.error }
    }
  }

  const deletePago = async (id: string) => {
    const pago = pagos.find(p => p.id === id)
    if (!pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    const confirmed = confirm(`¿Estás seguro de eliminar el pago "${pago.concepto}"?`)

    if (!confirmed) {
      return { success: false, error: 'Operación cancelada' }
    }

    setIsLoading(true)
    const response = await pagoController.deletePago(id)

    if (response.success) {
      setPagos(prev => prev.filter(p => p.id !== id))
      return { success: true }
    } else {
      setError(response.error || 'Error al eliminar pago')
      return { success: false, error: response.error }
    }
  }

  const registrarPago = async (id: string, metodoPago: string, comprobante?: string) => {
    const data: PagoUpdate = {
      estado: PAYMENT_STATUS.PAGADO,
      fecha_pago: new Date().toISOString(),
      metodo_pago: metodoPago,
      comprobante_url: comprobante,
    }

    return await updatePago(id, data)
  }

  const filterByEstado = (estado: string) => {
    const results = filterBy(pagos, { estado } as any)
    setFilteredPagos(results)
  }

  const refresh = () => {
    fetchPagos()
  }

  return {
    pagos: filteredPagos,
    allPagos: pagos,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    selectedPago,
    stats,
    getPago,
    createPago,
    updatePago,
    deletePago,
    registrarPago,
    filterByEstado,
    refresh,
  }
}
