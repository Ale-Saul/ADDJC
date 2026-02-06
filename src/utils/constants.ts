/**
 * Constantes globales del sistema
 */

export const ROLES = {
  ADMIN: 'admin',
  ASOCIACION: 'asociacion',
  SENSEI: 'sensei',
  ENCARGADO: 'encargado',
  ARBITRO: 'arbitro',
  JUDOKA: 'judoka',
} as const

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.ASOCIACION]: 'Asociación',
  [ROLES.SENSEI]: 'Sensei',
  [ROLES.ENCARGADO]: 'Encargado',
  [ROLES.ARBITRO]: 'Árbitro',
  [ROLES.JUDOKA]: 'Judoka',
} as const

export const ROLES_LIST = Object.values(ROLES)

export const PAYMENT_STATUS = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
  REEMBOLSADO: 'reembolsado',
} as const

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDIENTE]: 'Pendiente',
  [PAYMENT_STATUS.PAGADO]: 'Pagado',
  [PAYMENT_STATUS.VENCIDO]: 'Vencido',
  [PAYMENT_STATUS.CANCELADO]: 'Cancelado',
  [PAYMENT_STATUS.REEMBOLSADO]: 'Reembolsado',
} as const

export const PAYMENT_TYPES = {
  MENSUALIDAD: 'mensualidad',
  INSCRIPCION: 'inscripcion',
  EXAMEN: 'examen',
  TORNEO: 'torneo',
  EVENTO: 'evento',
  OTRO: 'otro',
} as const

export const PAYMENT_TYPE_LABELS = {
  [PAYMENT_TYPES.MENSUALIDAD]: 'Mensualidad',
  [PAYMENT_TYPES.INSCRIPCION]: 'Inscripción',
  [PAYMENT_TYPES.EXAMEN]: 'Examen',
  [PAYMENT_TYPES.TORNEO]: 'Torneo',
  [PAYMENT_TYPES.EVENTO]: 'Evento',
  [PAYMENT_TYPES.OTRO]: 'Otro',
} as const

export const DISCOUNT_TYPES = {
  PORCENTAJE: 'porcentaje',
  MONTO_FIJO: 'monto_fijo',
  NINGUNO: 'ninguno',
} as const

export const DISCOUNT_REASONS = {
  BECA: 'beca',
  PROMOCION: 'promocion',
  HERMANOS: 'hermanos',
  ANTICIPADO: 'anticipado',
  ESPECIAL: 'especial',
  NINGUNO: 'ninguno',
} as const

export const MOVEMENT_TYPES = {
  INGRESO: 'ingreso',
  EGRESO: 'egreso',
  TRANSFERENCIA: 'transferencia',
} as const

export const MOVEMENT_STATUS = {
  PENDIENTE: 'pendiente',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
  RECHAZADO: 'rechazado',
} as const

export const GENDERS = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
  PREFIERO_NO_DECIR: 'Prefiero no decir',
} as const

export const GENDERS_LIST = Object.values(GENDERS)

/** Cargos para miembros de la asociación */
export const CARGOS_ASOCIACION = [
  'Secretario',
  'Tesorero',
  'Presidente',
  'Vicepresidente',
  'Vocal',
] as const

/** Provincias para clubes (Cochabamba y otras) */
export const PROVINCIAS = [
  'Cercado',
  'Chapare',
  'Carrasco',
  'Mizque',
  'Germán Jordán',
  'Ayopaya',
  'Arque',
  'Tapacarí',
  'Bolívar',
  'Moxos',
  'Pocona',
  'Punata',
  'Quillacollo',
  'Tiraque',
  'Arani',
  'Esteban Arce',
] as const

/** Especialidades para senseis */
export const ESPECIALIDADES_SENSEI = [
  'Nage-waza',
  'Katame-waza',
  'Kata',
  'Randori',
] as const

export const BELT_COLORS = [
  'Blanco',
  'Amarillo',
  'Naranja',
  'Verde',
  'Azul',
  'Marrón',
  'Negro',
] as const

export const CATEGORIES = [
  'Mini',
  'Infantil',
  'Cadete',
  'Juvenil',
  'Senior',
  'Master',
] as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
} as const

export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD de MMMM de YYYY',
  WITH_TIME: 'DD/MM/YYYY HH:mm',
} as const

export const CURRENCY = {
  CODE: 'BOB',
  SYMBOL: 'Bs.',
  NAME: 'Boliviano',
} as const

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  MIN_AGE: 4,
  MAX_AGE: 100,
  PHONE_MIN_LENGTH: 7,
  PHONE_MAX_LENGTH: 15,
} as const

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROFILE: '/perfil',
  JUDOKAS: '/judokas',
  SENSEIS: '/senseis',
  ARBITROS: '/arbitros',
  CLUBES: '/clubes',
  ASOCIACION: '/asociacion',
  PAGOS: '/pagos',
  CONTABILIDAD: '/contabilidad',
  REPORTES: '/reportes',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
  },
  ADMIN: {
    CREATE_USER: '/api/admin/create-user',
    DISABLE_USER: '/api/admin/disable-user',
  },
} as const

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme_preference',
} as const

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
  WARNING: 4000,
} as const
