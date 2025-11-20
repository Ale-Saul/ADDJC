import { supabase } from '@/lib/supabase'

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
          upsert: false // No sobrescribir archivos existentes
        })

      if (error) {
        // Si el archivo ya existe, intentar con un nombre único
        if (error.message.includes('already exists')) {
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop()
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
          const uniquePath = `${path.replace(/\.[^/.]+$/, '')}_${timestamp}.${fileExtension}`

          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket)
            .upload(uniquePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (retryError) {
            return { success: false, error: retryError.message }
          }

          // Obtener URL pública
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniquePath)
          return { success: true, url: urlData.publicUrl }
        }

        return { success: false, error: error.message }
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
      return { success: true, url: urlData.publicUrl }
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
   * Obtener URL pública de un archivo
   * @param bucket - Nombre del bucket
   * @param path - Ruta del archivo
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
}

