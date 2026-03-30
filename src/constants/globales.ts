/**
 * Constantes globales del sistema
 */

export const GENDERS = {
  FEMENINO: 'Femenino',
  MASCULINO: 'Masculino',
  PREFIERO_NO_DECIR: 'Prefiero no decir',
} as const

export const GENDERS_LIST = Object.values(GENDERS).sort((a, b) => a.localeCompare(b))

/** Cargos para miembros de la asociación */
export const CARGOS_ASOCIACION = [
  'Presidente',
  'Secretario',
  'Tesorero',
  'Vicepresidente',
  'Vocal',
] as const

/** Municipios para clubes (Cochabamba y otras) */
export const MUNICIPIOS = [
  'Arani',
  'Arque',
  'Ayopaya',
  'Bolívar',
  'Carrasco',
  'Cercado',
  'Chapare',
  'Esteban Arce',
  'Germán Jordán',
  'Mizque',
  'Moxos',
  'Pocona',
  'Punata',
  'Quillacollo',
  'Tapacarí',
  'Tiraque',
] as const

/** Especialidades para senseis */
export const ESPECIALIDADES_SENSEI = [
  'Kata',
  'Katame-waza',
  'Nage-waza',
  'Randori',
] as const

/** Grados Dan para senseis */
export const GRADOS_DAN = [
  '1er Dan',
  '2do Dan',
  '3er Dan',
  '4to Dan',
  '5to Dan',
  '6to Dan',
  '7mo Dan',
  '8vo Dan',
  '9no Dan',
  '10mo Dan',
] as const

/** Niveles para árbitros */
export const NIVELES_ARBITRAJE = [
  'Internacional',
  'Nacional',
  'Regional',
] as const

export const BELT_COLORS = [
  'Blanco',
  'Amarillo',
  'Naranja',
  'Verde',
  'Azul',
  'Café',
  'Negro',
] as const

export const CATEGORIES = [
  'Preinfantil',
  'Infantil',
  'Cadete',
  'Junior',
  'Senior',
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

/** Extensiones de CI para Bolivia */
export const CI_EXTENSIONS = [
  'LP', // La Paz
  'CB', // Cochabamba
  'SC', // Santa Cruz
  'OR', // Oruro
  'PT', // Potosí
  'TJ', // Tarija
  'CH', // Chuquisaca
  'BE', // Beni
  'PN', // Pando
] as const

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
