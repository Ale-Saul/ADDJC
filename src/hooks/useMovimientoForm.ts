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
  origenClubId: z.string().optional().nullable(),
  origenEntidad: z.string().optional().nullable(),
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

export type MovimientoFormValues = z.infer<typeof movimientoSchema>

export function useMovimientoForm(movimiento: MovimientoFinanciero | null, onClose: () => void, onSave: () => void) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobanteUrl, setComprobanteUrl] = useState('')
  const [comprobanteNombre, setComprobanteNombre] = useState('')

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
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

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'tipo') {
        // Resetear categoría cuando cambia el tipo
        form.setValue('categoria', value.tipo === 'ingreso' ? 'otro' : 'otro')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

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
        fecha: new Date().toISOString(), // Siempre guardar con fecha y hora actual
        origen_club_id: data.origenClubId || undefined,
        origen_entidad: data.origenEntidad?.trim() || undefined,
        comprobante_url: finalComprobanteUrl || null,
        comprobante_nombre: finalComprobanteNombre || null,
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
