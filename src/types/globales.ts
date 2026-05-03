// Tipos globales compartidos
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

