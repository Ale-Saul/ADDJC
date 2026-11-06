/**
 * Utilidades para captura de ubicación GPS y enlaces de mapas.
 */

export interface GeolocationResult {
  success: boolean
  lat?: number
  lng?: number
  accuracy?: number
  error?: string
}

let cachedPosition: { lat: number; lng: number; accuracy: number; timestamp: number } | null = null

/**
 * Pre-calienta el sensor GPS en segundo plano para que la marcación sea instantánea.
 */
export function prewarmGeolocation(): void {
  if (typeof window === 'undefined' || !navigator.geolocation) return
  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: Date.now(),
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  } catch {
    // Silencioso en prewarm
  }
}

/**
 * Obtiene las coordenadas actuales con estrategia progresiva:
 * 1. Usa caché reciente (< 45s) si existe.
 * 2. Intenta GPS satelital de alta precisión (5s).
 * 3. Si falla o da timeout, recurre inmediatamente a triangulación de red/antenas/Wi-Fi (6s).
 */
export async function getCurrentCoordinates(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      error: 'Tu navegador o dispositivo no soporta geolocalización GPS.',
    }
  }

  // 1. Verificar si tenemos una posición reciente (< 45 segundos)
  if (cachedPosition && Date.now() - cachedPosition.timestamp < 45000) {
    return {
      success: true,
      lat: cachedPosition.lat,
      lng: cachedPosition.lng,
      accuracy: cachedPosition.accuracy,
    }
  }

  const tryGetPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    })
  }

  // 2. Intento de alta precisión (satelital rápido)
  try {
    const pos = await tryGetPosition({
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 30000,
    })
    cachedPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
      timestamp: Date.now(),
    }
    return {
      success: true,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
    }
  } catch (err: any) {
    // Si el usuario denegó permisos explícitamente, no reintentamos
    if (err && err.code === 1) {
      return {
        success: false,
        error: 'Permiso de ubicación denegado. Por favor habilita el GPS y otorga permiso de ubicación en tu navegador.',
      }
    }
  }

  // 3. Fallback inmediato a precisión estándar / triangulación de red (funciona en interiores)
  try {
    const pos = await tryGetPosition({
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 60000,
    })
    cachedPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
      timestamp: Date.now(),
    }
    return {
      success: true,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
    }
  } catch (err: any) {
    let message = 'No se pudo capturar la señal de ubicación GPS.'
    if (err?.code === 1) {
      message = 'Permiso de ubicación denegado en tu navegador.'
    } else if (err?.code === 2) {
      message = 'Ubicación no disponible. Por favor activa la ubicación/GPS de tu celular.'
    } else if (err?.code === 3) {
      message = 'Tiempo de espera agotado buscando señal GPS. Activa tu ubicación y reintenta.'
    }
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Genera el enlace directo a Google Maps para visualizar el punto geográfico.
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/**
 * Formatea los metros de precisión para mostrar al usuario.
 */
export function formatAccuracy(accuracy?: number | null): string {
  if (accuracy === undefined || accuracy === null) return ''
  if (accuracy < 30) return `±${accuracy}m (Alta precisión)`
  if (accuracy < 100) return `±${accuracy}m (Media precisión)`
  return `±${accuracy}m (Aproximada)`
}


