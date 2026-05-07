import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MovimientoFinanciero, TipoMovimiento, CategoriaMovimiento, MovimientoFinancieroInput } from '@/models/movimientoFinanciero'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'
import { storageService } from '@/services/storageService'
import { useAuth } from '@/contexts/AuthContext'

const movimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  categoria: z.string().min(1, 'Categoría requerida'),
  concepto: z.string().min(1, 'El concepto es requerido'),
  descripcion: z.string().optional().nullable(),
  monto: z.union([z.number(), z.string()])
    .refine(val => val !== '' && val !== undefined && val !== null, 'El monto es requerido')
    .transform(val => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().positive('El monto debe ser mayor a 0')),
  fecha: z.string().min(1, 'La fecha es requerida'),
  origenClubId: z.string().nullable().optional(),
  origenEntidad: z.string().nullable().optional(),
}).refine(data => {
  if ((data.categoria === 'donacion_club' || data.categoria === 'pago_club') && !data.origenClubId) {
    return false;
  }
  return true;
}, {
  message: "Debe seleccionar un club de origen",
  path: ["origenClubId"]
}).refine(data => {
  if ((data.categoria === 'aporte_estado' || data.categoria === 'sponsor') && (!data.origenEntidad || data.origenEntidad.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Debe especificar la entidad de origen",
  path: ["origenEntidad"]
});

export type MovimientoFormValues = {
  tipo: 'ingreso' | 'egreso'
  categoria: string
  concepto: string
  descripcion?: string | null
  monto: number
  fecha: string
  origenClubId?: string | null
  origenEntidad?: string | null
}

export function useMovimientoForm(movimiento: MovimientoFinanciero | null, onClose: () => void, onSave: () => void) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobanteUrl, setComprobanteUrl] = useState('')
  const [comprobanteNombre, setComprobanteNombre] = useState('')

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      tipo: 'ingreso',
      categoria: 'otro',
      monto: '' as any,
      concepto: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      origenClubId: '',
      origenEntidad: '',
    }
  })

  const watchTipo = form.watch('tipo')
  const watchCategoria = form.watch('categoria')

  useEffect(() => {
    // Si estamos editando y el tipo es igual al del movimiento, no forzamos el reseteo
    if (movimiento && watchTipo === movimiento.tipo) {
      return;
    }
    
    // Resetear campos dependientes cuando cambia el tipo
    form.setValue('categoria', 'otro', { shouldValidate: true })
    form.setValue('origenClubId', '', { shouldValidate: true })
    form.setValue('origenEntidad', '', { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTipo])

  useEffect(() => {
    if (movimiento && watchCategoria === movimiento.categoria) {
      return;
    }
    
    // Limpiar campos dependiendo de la categoría seleccionada
    const isIngreso = watchTipo === 'ingreso'
    const requiresClub = isIngreso && (watchCategoria === 'pago_club' || watchCategoria === 'donacion_club')
    const requiresEntidad = isIngreso && (watchCategoria === 'aporte_estado' || watchCategoria === 'sponsor')

    if (!requiresClub) {
      form.setValue('origenClubId', '', { shouldValidate: true })
    }
    if (!requiresEntidad) {
      form.setValue('origenEntidad', '', { shouldValidate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCategoria, watchTipo])

  useEffect(() => {
    if (movimiento) {
      form.reset({
        tipo: movimiento.tipo as 'ingreso' | 'egreso',
        categoria: movimiento.categoria,
        monto: movimiento.monto,
        concepto: movimiento.concepto,
        descripcion: movimiento.descripcion || '',
        fecha: movimiento.created_at ? movimiento.created_at.split('T')[0] : '',
        origenClubId: movimiento.origen_club_id || '',
        origenEntidad: movimiento.origen_entidad || '',
      })
      setComprobanteUrl(movimiento.comprobante_url || '')
      setComprobanteNombre(movimiento.comprobante_nombre || '')
    } else {
      form.reset({
        tipo: 'ingreso',
        categoria: 'otro',
        monto: '' as any,
        concepto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        origenClubId: '',
        origenEntidad: '',
      })
      setComprobanteFile(null)
      setComprobanteUrl('')
      setComprobanteNombre('')
    }
    setError(null)
  }, [movimiento, form])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setComprobanteFile(file)
    setError(null)
  }

  const clearComprobante = () => {
    setComprobanteFile(null)
    if (comprobanteUrl) {
      setComprobanteUrl('')
      setComprobanteNombre('')
    }
  }

  const onSubmit = useCallback(async (data: MovimientoFormValues) => {
    setLoading(true)
    setError(null)

    try {
      let finalComprobanteUrl = comprobanteUrl
      let finalComprobanteNombre = comprobanteNombre

      if (comprobanteFile && user) {
        setUploadingFile(true)
        const timestamp = Date.now()
        const fileName = `${timestamp}_${comprobanteFile.name}`
        const path = `comprobantes-financieros/${fileName}`

        const uploadResult = await storageService.uploadFile(
          comprobanteFile,
          'comprobantes-financieros',
          path
        )

        if (uploadResult.success && uploadResult.url) {
          finalComprobanteUrl = uploadResult.url
          finalComprobanteNombre = comprobanteFile.name
        } else {
          throw new Error(uploadResult.error || 'Error al subir el comprobante')
        }
        setUploadingFile(false)
      }

      const movimientoData: MovimientoFinancieroInput = {
        tipo: data.tipo,
        categoria: data.categoria as CategoriaMovimiento,
        monto: data.monto,
        concepto: data.concepto.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        fecha: data.fecha ? `${data.fecha}T${new Date().toLocaleTimeString('en-GB')}` : new Date().toISOString(),
        origen_club_id: data.origenClubId || undefined,
        origen_entidad: data.origenEntidad?.trim() || undefined,
        comprobante_url: finalComprobanteUrl || undefined,
        comprobante_nombre: finalComprobanteNombre || undefined,
        estado: 'registrado'
      }

      let response;
      if (movimiento) {
        response = await movimientoFinancieroController.updateMovimiento(movimiento.id, movimientoData)
      } else {
        if (!user?.id) throw new Error('Usuario no autenticado')
        response = await movimientoFinancieroController.createMovimiento(movimientoData, user.id)
      }

      if (response.success) {
        onSave()
        onClose()
      } else {
        setError(response.error || 'Error al guardar el movimiento')
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el movimiento')
    } finally {
      setLoading(false)
      setUploadingFile(false)
    }
  }, [movimiento, comprobanteFile, comprobanteUrl, comprobanteNombre, user, onSave, onClose])

  return {
    form,
    loading,
    error,
    uploadingFile,
    comprobanteFile,
    comprobanteUrl,
    comprobanteNombre,
    handleFileChange,
    clearComprobante,
    onSubmit
  }
}
