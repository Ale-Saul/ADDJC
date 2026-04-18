'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'
import { useSesionesByClub, useSesionesBySensei, useCrearSesion, useEliminarSesion } from './useAsistenciaSesiones'
import { AsistenciaSesion, AsistenciaSesionCreate } from '@/models/asistencia'

/**
 * Centraliza toda la lógica de estado y datos de la pantalla
 * de listado de sesiones de asistencia.
 */
export function useAsistenciaPage() {
  const { user } = useAuth()

  const isSensei = user?.rol === ROL.SENSEI
  const isEncargado = user?.rol === ROL.ENCARGADO
  const isAdmin = user?.rol === ROL.ADMIN

  const senseiId = user?.sensei_id ?? ''
  const clubId = user?.club_id ?? ''

  // --- Consultas ---
  const clubQuery = useSesionesByClub(isEncargado || isAdmin ? clubId : '')
  const senseiQuery = useSesionesBySensei(isSensei ? senseiId : '')

  const sesiones: AsistenciaSesion[] = isSensei
    ? (senseiQuery.data ?? [])
    : (clubQuery.data ?? [])

  const isLoading = isSensei ? senseiQuery.isLoading : clubQuery.isLoading
  const fetchError = isSensei ? senseiQuery.error?.message : clubQuery.error?.message

  // --- Filtros ---
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroSenseiId, setFiltroSenseiId] = useState('all')

  const sesionesVisibles = useMemo(() => {
    return sesiones.filter(s => {
      if (filtroFechaInicio && s.fecha < filtroFechaInicio) return false
      if (filtroFechaFin && s.fecha > filtroFechaFin) return false
      if (filtroSenseiId !== 'all' && s.sensei_id !== filtroSenseiId) return false
      return true
    })
  }, [sesiones, filtroFechaInicio, filtroFechaFin, filtroSenseiId])

  // Lista única de senseis disponibles para el filtro (solo encargado/admin)
  const senseiOptions = useMemo(() => {
    const seen = new Map<string, string>()
    sesiones.forEach(s => {
      if (s.sensei_id && s.nombre_sensei) seen.set(s.sensei_id, s.nombre_sensei)
    })
    return Array.from(seen.entries()).map(([id, nombre]) => ({ value: id, label: nombre }))
  }, [sesiones])

  const limpiarFiltros = () => {
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setFiltroSenseiId('all')
  }

  // --- Diálogo nueva sesión ---
  const [dialogOpen, setDialogOpen] = useState(false)
  const abrirDialog = () => setDialogOpen(true)
  const cerrarDialog = () => setDialogOpen(false)

  // --- Mutations ---
  const crearMutation = useCrearSesion()
  const eliminarMutation = useEliminarSesion(clubId, senseiId)

  const handleCrearSesion = async (data: AsistenciaSesionCreate) => {
    const res = await crearMutation.mutateAsync(data)
    if (res.success) cerrarDialog()
    return res
  }

  const handleEliminarSesion = async (sesionId: string) => {
    return eliminarMutation.mutateAsync({ id: sesionId, userId: user?.id })
  }

  // --- Snackbar feedback ---
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  const mostrarSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }
  const cerrarSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }))

  return {
    user,
    isSensei,
    isEncargado,
    isAdmin,
    senseiId,
    clubId,
    sesiones: sesionesVisibles,
    isLoading,
    fetchError: fetchError ?? null,
    filtros: {
      fechaInicio: filtroFechaInicio, setFechaInicio: setFiltroFechaInicio,
      fechaFin: filtroFechaFin, setFechaFin: setFiltroFechaFin,
      senseiId: filtroSenseiId, setSenseiId: setFiltroSenseiId,
      senseiOptions,
      limpiarFiltros
    },
    dialog: { open: dialogOpen, abrir: abrirDialog, cerrar: cerrarDialog },
    handleCrearSesion,
    handleEliminarSesion,
    crearLoading: crearMutation.isPending,
    eliminarLoading: eliminarMutation.isPending,
    snackbar,
    mostrarSnackbar,
    cerrarSnackbar,
  }
}
