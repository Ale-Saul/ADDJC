'use client'

import { useMemo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PeopleIcon from '@mui/icons-material/People'
import { Pago } from '@/models/pago'

interface PagosStatsProps {
  pagos: Pago[]
}

export default function PagosStats({ pagos }: PagosStatsProps) {
  const stats = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Obtener el primer día del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    // Total pendiente (solo pagos pendientes, no vencidos)
    const totalPendiente = pagos
      .filter(p => p.estado === 'pendiente' && p.activo)
      .reduce((sum, p) => sum + p.monto_final, 0)

    // Total vencido + días promedio de atraso
    const pagosVencidos = pagos.filter(p => p.estado === 'vencido' && p.activo)
    const totalVencido = pagosVencidos.reduce((sum, p) => sum + p.monto_final, 0)
    
    const diasVencidos = pagosVencidos.map(p => {
      const fechaVencimiento = new Date(p.fecha_vencimiento)
      const diffTime = hoy.getTime() - fechaVencimiento.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    })
    
    const promedioDiasVencidos = diasVencidos.length > 0
      ? Math.round(diasVencidos.reduce((sum, d) => sum + d, 0) / diasVencidos.length)
      : 0

    // Total cobrado este mes
    const totalCobradoMes = pagos
      .filter(p => {
        if (p.estado !== 'pagado' || !p.fecha_pago) return false
        const fechaPago = new Date(p.fecha_pago)
        return fechaPago >= inicioMes && fechaPago <= hoy
      })
      .reduce((sum, p) => sum + p.monto_final, 0)

    // Judokas únicos con deuda (pendiente o vencido)
    const judokasConDeuda = new Set(
      pagos
        .filter(p => (p.estado === 'pendiente' || p.estado === 'vencido') && p.activo)
        .map(p => p.judoka_id)
    ).size

    return {
      totalPendiente,
      totalVencido,
      promedioDiasVencidos,
      cantidadVencidos: pagosVencidos.length,
      totalCobradoMes,
      judokasConDeuda
    }
  }, [pagos])

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4,
        flexWrap: 'wrap',
        width: '100%'
      }}
    >
      {/* Total Pendiente */}
      <Card sx={{ 
        bgcolor: '#FFA726', 
        flex: '1 1 calc(25% - 12px)',
        minWidth: '250px',
        borderRadius: 2 
      }} elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TrendingUpIcon sx={{ color: '#000', mr: 1, fontSize: 28 }} />
            <Typography variant="caption" color="#000" fontWeight="bold" sx={{ fontSize: '0.75rem', letterSpacing: 0.5 }}>
              TOTAL PENDIENTE
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="#000" sx={{ mb: 0.5 }}>
            Bs. {stats.totalPendiente.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      {/* Total Vencido */}
      <Card sx={{ 
        bgcolor: '#EF5350', 
        flex: '1 1 calc(25% - 12px)',
        minWidth: '250px',
        borderRadius: 2 
      }} elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <WarningAmberIcon sx={{ color: '#000', mr: 1, fontSize: 28 }} />
            <Typography variant="caption" color="#000" fontWeight="bold" sx={{ fontSize: '0.75rem', letterSpacing: 0.5 }}>
              TOTAL VENCIDO
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="#000" sx={{ mb: 0.5 }}>
            Bs. {stats.totalVencido.toFixed(2)}
          </Typography>
          {stats.cantidadVencidos > 0 && (
            <Typography variant="caption" color="#000" sx={{ display: 'block', mt: 1 }}>
              {stats.cantidadVencidos} {stats.cantidadVencidos === 1 ? 'pago' : 'pagos'} 
              {stats.promedioDiasVencidos > 0 && ` • ~${stats.promedioDiasVencidos} días`}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Total Cobrado Este Mes */}
      <Card sx={{ 
        bgcolor: '#66BB6A', 
        flex: '1 1 calc(25% - 12px)',
        minWidth: '250px',
        borderRadius: 2 
      }} elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <CheckCircleIcon sx={{ color: '#000', mr: 1, fontSize: 28 }} />
            <Typography variant="caption" color="#000" fontWeight="bold" sx={{ fontSize: '0.75rem', letterSpacing: 0.5 }}>
              COBRADO ESTE MES
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="#000" sx={{ mb: 0.5 }}>
            Bs. {stats.totalCobradoMes.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="#000" sx={{ display: 'block', mt: 1 }}>
            {new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
          </Typography>
        </CardContent>
      </Card>

      {/* Judokas con Deuda */}
      <Card sx={{ 
        bgcolor: '#42A5F5', 
        flex: '1 1 calc(25% - 12px)',
        minWidth: '250px',
        borderRadius: 2 
      }} elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <PeopleIcon sx={{ color: '#000', mr: 1, fontSize: 28 }} />
            <Typography variant="caption" color="#000" fontWeight="bold" sx={{ fontSize: '0.75rem', letterSpacing: 0.5 }}>
              JUDOKAS CON DEUDA
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="#000" sx={{ mb: 0.5 }}>
            {stats.judokasConDeuda}
          </Typography>
          <Typography variant="caption" color="#000" sx={{ display: 'block', mt: 1 }}>
            pendiente o vencido
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
