import type { User } from '@/models/auth'
import { ROL, type UserRole } from '@/constants/roles'

type UserAccessInfo = Pick<User, 'rol' | 'sensei_id' | 'club_id' | 'club_id_operativo'>

export type AsistenciaViewMode = 'sensei' | 'encargado' | 'admin'

/** Club operativo: el del rol directo o el vinculado por multi-cargo */
export function getOperationalClubId(user: UserAccessInfo | null | undefined): string | null {
  if (!user) return null
  return user.club_id ?? user.club_id_operativo ?? null
}

/** Usuario que opera como sensei (rol directo o vinculación silenciosa) */
export function actsAsSensei(user: UserAccessInfo | null | undefined): boolean {
  if (!user) return false
  return user.rol === ROL.SENSEI || !!user.sensei_id
}

/** Usuario que opera como encargado (rol directo o club operativo vinculado) */
export function actsAsEncargado(user: UserAccessInfo | null | undefined): boolean {
  if (!user) return false
  return user.rol === ROL.ENCARGADO || !!user.club_id_operativo
}

/**
 * Determina el modo de vista para pantallas de asistencia.
 * Prioridad: admin > encargado (rol directo) > sensei (rol directo o multi-cargo).
 */
export function resolveAsistenciaView(user: UserAccessInfo | null | undefined): AsistenciaViewMode | null {
  if (!user) return null
  if (user.rol === ROL.ADMIN) return 'admin'
  if (user.rol === ROL.ENCARGADO) return 'encargado'
  if (user.rol === ROL.SENSEI) return 'sensei'
  if (user.sensei_id) return 'sensei'
  if (user.club_id_operativo) return 'encargado'
  return null
}

function isEncargadoOperativePath(path: string): boolean {
  if (path.startsWith('/pagos') || path.startsWith('/contabilidad')) return true
  if (path.startsWith('/reportes') && !path.startsWith('/reportes/asociacion')) return true
  return false
}

/**
 * Verifica acceso a una ruta según roles permitidos y capacidades multi-cargo.
 */
export function hasRoleAccess(
  user: UserAccessInfo,
  allowedRoles: UserRole[],
  path?: string
): boolean {
  if (allowedRoles.includes(user.rol)) return true

  const allowsSenseiOrEncargado = allowedRoles.some(
    r => r === ROL.SENSEI || r === ROL.ENCARGADO
  )
  const allowsEncargado = allowedRoles.includes(ROL.ENCARGADO)

  if (actsAsSensei(user) && allowsSenseiOrEncargado) {
    if (!path) return true
    if (path.startsWith('/asistencia')) return true
    if (actsAsEncargado(user) && allowsEncargado && isEncargadoOperativePath(path)) return true
  }

  if (actsAsEncargado(user) && allowsEncargado) {
    if (!path) return true
    if (isEncargadoOperativePath(path)) return true
  }

  return false
}
