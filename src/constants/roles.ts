/**
 * Constantes de roles del sistema.
 * Usar siempre estas constantes en lugar de strings literales.
 */
export const ROL = {
  ADMIN: 'admin',
  ASOCIACION: 'asociacion',
  SENSEI: 'sensei',
  ENCARGADO: 'encargado',
  ARBITRO: 'arbitro',
  JUDOKA: 'judoka',
} as const

export type UserRole = typeof ROL[keyof typeof ROL]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  asociacion: 'Asociación',
  sensei: 'Sensei',
  encargado: 'Encargado',
  arbitro: 'Árbitro',
  judoka: 'Judoka',
}
