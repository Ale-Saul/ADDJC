import { createClient } from '@/lib/supabase/client'

export const storageService = {
  /**
   * Subir un archivo a Supabase Storage
   * @param file - Archivo a subir
   * @param bucket - Nombre del bucket en Supabase Storage
   * @param path - Ruta donde se guardará el archivo (ej: 'certificaciones/usuario_id/nombre_archivo.pdf')
   * @returns URL pública del archivo o error
   */
  async uploadFile(
    file: File,
    bucket: string,
    path: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = createClient()

      // Validar tipo de archivo (PDF o imágenes)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ]

      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Tipo de archivo no permitido. Solo se permiten PDF e imágenes (JPG, PNG, GIF, WEBP)'
        }
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'El archivo es demasiado grande. El tamaño máximo es 10MB'
        }
      }

      // Subir el archivo
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Permitir sobrescribir si el path es idéntico
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Para buckets privados, guardar el path en lugar de la URL
      // La URL se generará dinámicamente cuando se necesite ver el archivo
      // Esto permite usar signed URLs para buckets privados
      return { success: true, url: path }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el archivo'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un archivo de Supabase Storage
   * @param bucket - Nombre del bucket
   * @param path - Ruta del archivo a eliminar
   */
  async deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.storage.from(bucket).remove([path])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el archivo'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener URL pública de un archivo (para buckets públicos)
   * @param bucket - Nombre del bucket
   * @param path - Ruta del archivo
   */
  getPublicUrl(bucket: string, path: string): string {
    const supabase = createClient()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  /**
   * Obtener URL firmada de un archivo (para buckets privados)
   * @param bucket - Nombre del bucket
   * @param path - Ruta del archivo
   * @param expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
   */
  async getSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, url: data.signedUrl }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener URL firmada'
      return { success: false, error: errorMessage }
    }
  }
}

