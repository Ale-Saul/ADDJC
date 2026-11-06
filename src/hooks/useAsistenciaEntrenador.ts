'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AsistenciaEntrenador,
  TipoEventoEntrenador,
} from '@/models/asistenciaEntrenador'
import { asistenciaEntrenadorService } from '@/services/asistenciaEntrenadorService'
import { getCurrentCoordinates, prewarmGeolocation, GeolocationResult } from '@/utils/geolocation'

export function useCheckinEntrenador(entrenadorId?: string, clubId?: string) {
  const [activa, setActiva] = useState<AsistenciaEntrenador | null>(null)
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsInfo, setGpsInfo] = useState<GeolocationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [duracionMinutos, setDuracionMinutos] = useState<number>(0)

  // Pre-calentar el GPS al cargar el componente
  useEffect(() => {
    prewarmGeolocation()
  }, [])

  // Cargar si hay una sesión activa al montar
  const cargarActiva = useCallback(async () => {
    if (!entrenadorId) return
    setLoading(true)
    setError(null)
    const res = await asistenciaEntrenadorService.getActivaByEntrenador(entrenadorId)
    if (res.success) {
      setActiva(res.data ?? null)
    } else {
      setError(res.error || 'Error al verificar marcación activa')
    }
    setLoading(false)
  }, [entrenadorId])

  useEffect(() => {
    cargarActiva()
  }, [cargarActiva])

  // Obtener o refrescar GPS manualmente
  const refrescarUbicacion = useCallback(async (): Promise<GeolocationResult> => {
    setGpsLoading(true)
    const gps = await getCurrentCoordinates()
    setGpsLoading(false)
    setGpsInfo(gps)
    if (!gps.success && gps.error) {
      setError(gps.error)
    } else {
      setError(null)
    }
    return gps
  }, [])

  // Timer para actualizar la duración mientras esté activa
  useEffect(() => {
    if (!activa?.hora_entrada) return

    const calcular = () => {
      const inicio = new Date(activa.hora_entrada).getTime()
      const ahora = Date.now()
      const diffMinutos = Math.max(0, Math.floor((ahora - inicio) / 60000))
      setDuracionMinutos(diffMinutos)
    }

    calcular()
    const timer = setInterval(calcular, 30000)
    return () => clearInterval(timer)
  }, [activa])

  // Marcar Entrada con GPS OBLIGATORIO
  const marcarEntrada = async (params: {
    tipo_evento: TipoEventoEntrenador
    categoria?: string | null
    titulo?: string | null
    notas?: string | null
  }) => {
    if (!entrenadorId || !clubId) {
      setError('Falta información del entrenador o club.')
      return { success: false, error: 'Falta información del entrenador o club.' }
    }

    setError(null)
    setGpsLoading(true)

    // Obtener GPS
    const gps = await getCurrentCoordinates()
    setGpsLoading(false)
    setGpsInfo(gps)

    // OBLIGATORIEDAD DE GPS: No se permite guardar sin ubicación
    if (!gps.success || gps.lat == null || gps.lng == null) {
      const err = gps.error || 'La ubicación GPS es obligatoria para registrar la asistencia. Activa tu GPS e intenta de nuevo.'
      setError(err)
      return { success: false, error: err }
    }

    setLoading(true)
    const res = await asistenciaEntrenadorService.marcarEntrada({
      club_id: clubId,
      entrenador_id: entrenadorId,
      tipo_evento: params.tipo_evento,
      categoria: params.categoria || null,
      titulo: params.titulo || null,
      latitud: gps.lat,
      longitud: gps.lng,
      precision: gps.accuracy ?? null,
      notas: params.notas || null,
    })

    setLoading(false)
    if (res.success && res.data) {
      setActiva(res.data ?? null)
      return { success: true, data: res.data }
    } else {
      setError(res.error || 'No se pudo registrar la entrada')
      return { success: false, error: res.error }
    }
  }

  // Marcar Salida con GPS OBLIGATORIO
  const marcarSalida = async (notas?: string) => {
    if (!activa) {
      return { success: false, error: 'No hay ninguna sesión activa para marcar salida.' }
    }

    setError(null)
    setGpsLoading(true)

    // Obtener GPS
    const gps = await getCurrentCoordinates()
    setGpsLoading(false)
    setGpsInfo(gps)

    // OBLIGATORIEDAD DE GPS: No se permite guardar sin ubicación
    if (!gps.success || gps.lat == null || gps.lng == null) {
      const err = gps.error || 'La ubicación GPS es obligatoria para registrar la salida. Activa tu GPS e intenta de nuevo.'
      setError(err)
      return { success: false, error: err }
    }

    setLoading(true)
    const res = await asistenciaEntrenadorService.marcarSalida({
      id: activa.id,
      latitud: gps.lat,
      longitud: gps.lng,
      precision: gps.accuracy ?? null,
      notas: notas || activa.notas || null,
    })

    setLoading(false)
    if (res.success && res.data) {
      setActiva(null)
      return { success: true, data: res.data }
    } else {
      setError(res.error || 'No se pudo registrar la salida')
      return { success: false, error: res.error }
    }
  }

  return {
    activa,
    loading,
    gpsLoading,
    gpsInfo,
    refrescarUbicacion,
    error,
    duracionMinutos,
    marcarEntrada,
    marcarSalida,
    recargar: cargarActiva,
  }
}
