'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getOperationalClubId, resolveAsistenciaView } from '@/utils/roleAccess'
import { useSesionesByClub, useSesionesBySensei, useCrearSesion, useEliminarSesion } from './useAsistenciaSesiones'
import { AsistenciaSesion, AsistenciaSesionCreate } from '@/models/asistencia'
import dayjs from 'dayjs'

const HOY = dayjs().format('YYYY-MM-DD')
const HACE_UN_MES = dayjs().subtract(1, 'month').format('YYYY-MM-DD')

const getLunes = (d: dayjs.Dayjs) => {
  const day = d.day() // 0 = Dom, 1 = Lun...
  const diff = day === 0 ? -6 : 1 - day
  return d.add(diff, 'day').startOf('day')
}

/**
 * Centraliza toda la lógica de estado y datos de la pantalla
 * de listado de sesiones de asistencia.
 */
export function useAsistenciaPage() {
  const { user } = useAuth()

  const asistenciaView = resolveAsistenciaView(user)
  const isSensei = asistenciaView === 'sensei'
  const isEncargado = asistenciaView === 'encargado'
  const isAdmin = asistenciaView === 'admin'

  const senseiId = user?.sensei_id ?? ''
  const clubId = getOperationalClubId(user) ?? ''

  // --- Consultas ---
  const clubQuery = useSesionesByClub(isEncargado || isAdmin ? clubId : '')
  const senseiQuery = useSesionesBySensei(isSensei ? senseiId : '')

  const sesiones: AsistenciaSesion[] = isSensei
    ? (senseiQuery.data ?? [])
    : (clubQuery.data ?? [])

  const isLoading = isSensei ? senseiQuery.isLoading : clubQuery.isLoading
  const fetchError = isSensei ? senseiQuery.error?.message : clubQuery.error?.message

  // --- Filtros Encargado / Admin ---
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(HACE_UN_MES)
  const [filtroFechaFin, setFiltroFechaFin] = useState(HOY)
  const [filtroSenseiId, setFiltroSenseiId] = useState('all')

  // --- Filtro Período Entrenador (Para mantener la pantalla limpia) ---
  const [periodoEntrenador, setPeriodoEntrenador] = useState<'esta_semana' | 'hoy' | 'proxima_semana' | 'anteriores' | 'todas'>('esta_semana')

  const lunesEstaSemana = useMemo(() => getLunes(dayjs()), [])
  const domingoEstaSemana = useMemo(() => lunesEstaSemana.add(6, 'day'), [lunesEstaSemana])
  const lunesProximaSemana = useMemo(() => lunesEstaSemana.add(7, 'day'), [lunesEstaSemana])
  const domingoProximaSemana = useMemo(() => lunesProximaSemana.add(6, 'day'), [lunesProximaSemana])

  // Sesiones visibles para el Entrenador (orden cronológico ascendente)
  const sesionesEntrenador = useMemo(() => {
    if (!isSensei) return []

    const lunesStr = lunesEstaSemana.format('YYYY-MM-DD')
    const domStr = domingoEstaSemana.format('YYYY-MM-DD')
    const lunesProxStr = lunesProximaSemana.format('YYYY-MM-DD')
    const domProxStr = domingoProximaSemana.format('YYYY-MM-DD')

    const filtradas = sesiones.filter(s => {
      if (periodoEntrenador === 'hoy') {
        return s.fecha === HOY
      }
      if (periodoEntrenador === 'esta_semana') {
        return s.fecha >= lunesStr && s.fecha <= domStr
      }
      if (periodoEntrenador === 'proxima_semana') {
        return s.fecha >= lunesProxStr && s.fecha <= domProxStr
      }
      if (periodoEntrenador === 'anteriores') {
        return s.fecha < lunesStr
      }
      return true // 'todas'
    })

    // Orden: de la que ya se va a cumplir a la que falta más (cronológico ASC)
    return filtradas.sort((a, b) => {
      if (periodoEntrenador === 'anteriores') {
        return b.fecha.localeCompare(a.fecha) || (b.hora_inicio || '').localeCompare(a.hora_inicio || '')
      }
      const diffFecha = a.fecha.localeCompare(b.fecha)
      if (diffFecha !== 0) return diffFecha
      return (a.hora_inicio || '').localeCompare(b.hora_inicio || '')
    })
  }, [sesiones, isSensei, periodoEntrenador, lunesEstaSemana, domingoEstaSemana, lunesProximaSemana, domingoProximaSemana])

  const conteoEstaSemana = useMemo(() => {
    const lStr = lunesEstaSemana.format('YYYY-MM-DD')
    const dStr = domingoEstaSemana.format('YYYY-MM-DD')
    return sesiones.filter(s => s.fecha >= lStr && s.fecha <= dStr).length
  }, [sesiones, lunesEstaSemana, domingoEstaSemana])

  const conteoHoy = useMemo(() => {
    return sesiones.filter(s => s.fecha === HOY).length
  }, [sesiones])

  const sesionesVisibles = useMemo(() => {
    const filtradas = sesiones.filter(s => {
      if (filtroFechaInicio && s.fecha < filtroFechaInicio) return false
      if (filtroFechaFin && s.fecha > filtroFechaFin) return false
      if (filtroSenseiId !== 'all' && s.sensei_id !== filtroSenseiId) return false
      return true
    })

    // Orden cronológico: de la que ya se va a cumplir a la que falta más
    return filtradas.sort((a, b) => {
      const diffFecha = a.fecha.localeCompare(b.fecha)
      if (diffFecha !== 0) return diffFecha
      return (a.hora_inicio || '').localeCompare(b.hora_inicio || '')
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
    setFiltroFechaInicio(HACE_UN_MES)
    setFiltroFechaFin(HOY)
    setFiltroSenseiId('all')
  }

  // --- Diálogo nueva sesión ---
  const [dialogOpen, setDialogOpen] = useState(false)
  const abrirDialog = () => setDialogOpen(true)
  const cerrarDialog = () => setDialogOpen(false)

  // --- Mutations ---
  const crearMutation = useCrearSesion()
  const eliminarMutation = useEliminarSesion(clubId, senseiId)

  const handleCrearSesion = async (data: AsistenciaSesionCreate | AsistenciaSesionCreate[]) => {
    if (Array.isArray(data)) {
      let creadas = 0
      for (const s of data) {
        const res = await crearMutation.mutateAsync(s)
        if (res.success) creadas++
      }
      if (creadas > 0) {
        cerrarDialog()
        mostrarSnackbar(`¡Se crearon ${creadas} sesiones de entrenamiento para la semana!`, 'success')
        return { success: true }
      }
      return { success: false, error: 'No se pudieron crear las sesiones semanales.' }
    } else {
      const res = await crearMutation.mutateAsync(data)
      if (res.success) {
        cerrarDialog()
        mostrarSnackbar('Sesión de entrenamiento creada exitosamente', 'success')
      }
      return res
    }
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

  const sesionesAgrupadas = useMemo(() => {
    if (isSensei) return null

    const grupos: Record<string, { nombre: string; sesiones: AsistenciaSesion[] }> = {}
    
    // Inicializar grupo del encargado actual
    const miNombre = `${user?.nombres} ${user?.apellidos}`
    grupos[senseiId] = { nombre: miNombre, sesiones: [] }

    sesionesVisibles.forEach(s => {
      const sId = s.sensei_id
      const sNombre = s.nombre_sensei || 'Sensei desconocido'
      
      if (!grupos[sId]) {
        grupos[sId] = { nombre: sNombre, sesiones: [] }
      }
      grupos[sId].sesiones.push(s)
    })

    return Object.entries(grupos)
      .filter(([id, data]) => data.sesiones.length > 0 || id === senseiId)
      .sort(([idA, dataA], [idB, dataB]) => {
        if (idA === senseiId) return -1
        if (idB === senseiId) return 1
        return dataA.nombre.localeCompare(dataB.nombre)
      })
      .map(([id, data]) => ({ id, ...data }))
  }, [sesionesVisibles, isSensei, senseiId, user])

  return {
    user,
    isSensei,
    isEncargado,
    isAdmin,
    senseiId,
    clubId,
    sesiones: sesionesVisibles,
    sesionesAgrupadas,
    // Estado y filtros para mantener la pantalla limpia del entrenador
    periodoEntrenador,
    setPeriodoEntrenador,
    sesionesEntrenador,
    lunesEstaSemana,
    domingoEstaSemana,
    lunesProximaSemana,
    domingoProximaSemana,
    conteoEstaSemana,
    conteoHoy,
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
