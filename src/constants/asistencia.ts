/**
 * Constantes para el módulo de asistencia.
 * Centraliza claves de caché de React Query y valores de dominio.
 */

export const ASISTENCIA_QUERY_KEYS = {
  all: ['asistencia'] as const,
  sesiones: () => [...ASISTENCIA_QUERY_KEYS.all, 'sesiones'] as const,
  sesionesClub: (clubId: string) => [...ASISTENCIA_QUERY_KEYS.sesiones(), 'club', clubId] as const,
  esionesSensei: (senseiId: string) => [...ASISTENCIA_QUERY_KEYS.sesiones(), 'sensei', senseiId] as const,
  sesion: (sesionId: string) => [...ASISTENCIA_QUERY_KEYS.sesiones(), sesionId] as const,
  detalle: (sesionId: string) => [...ASISTENCIA_QUERY_KEYS.all, 'detalle', sesionId] as const,
  historial: (judokaId: string) => [...ASISTENCIA_QUERY_KEYS.all, 'historial', judokaId] as const,
  statsJudoka: (judokaId: string) => [...ASISTENCIA_QUERY_KEYS.all, 'stats', 'judoka', judokaId] as const,
  statsSensei: (senseiId: string) => [...ASISTENCIA_QUERY_KEYS.all, 'stats', 'sensei', senseiId] as const,
  reporteClub: (clubId: string) => [...ASISTENCIA_QUERY_KEYS.all, 'reporte', 'club', clubId] as const,
} as const
