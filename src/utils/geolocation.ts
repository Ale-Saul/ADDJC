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

/**
 * Obtiene las coordenadas actuales del dispositivo usando la API de Geolocalización del navegador.
 */
export function getCurrentCoordinates(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({
        success: false,
        error: 'Tu navegador o dispositivo no soporta geolocalización GPS.',
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        })
      },
      (error) => {
        let message = 'No se pudo obtener la ubicación GPS.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado. Por favor habilita el GPS en tu navegador para registrar la constancia.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'La señal de ubicación no está disponible en este momento.'
            break
          case error.TIMEOUT:
            message = 'Se agotó el tiempo de espera para obtener la ubicación.'
            break
        }
        resolve({
          success: false,
          error: message,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    )
  })
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

