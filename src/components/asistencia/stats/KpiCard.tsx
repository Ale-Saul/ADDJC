'use client'

import { Box, Typography, CircularProgress, Paper, Stack, Divider } from '@mui/material'
import { ReactNode } from 'react'

type Color = 'success' | 'warning' | 'error' | 'primary' | 'default'

const COLOR_MAP: Record<Color, { track: string; text: string; bg: string }> = {
  success: { track: '#4caf50', text: '#2e7d32', bg: '#e8f5e9' },
  warning: { track: '#ff9800', text: '#e65100', bg: '#fff3e0' },
  error:   { track: '#f44336', text: '#c62828', bg: '#ffebee' },
  primary: { track: '#1976d2', text: '#1565c0', bg: '#e3f2fd' },
  default: { track: '#9e9e9e', text: '#616161', bg: '#f5f5f5' },
}

interface KpiCardProps {
  label: string
  value: number
  isPercentage?: boolean
  subtitle?: string
  color?: Color
  icon?: ReactNode
  secondaryStats?: { label: string; value: string | number }[]
  sx?: any
}

export default function KpiCard({
  label,
  value,
  isPercentage = true,
  subtitle,
  color = 'primary',
  icon,
  secondaryStats,
  sx,
}: KpiCardProps) {
  const colors = COLOR_MAP[color]
  const displayValue = isPercentage ? Math.round(value) : value
  const progressValue = isPercentage ? Math.min(value, 100) : 0

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        transition: 'box-shadow 150ms ease',
        '&:hover': { boxShadow: 2 },
        ...sx,
      }}
    >
      {/* Icon + label */}
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon && <Box sx={{ color: colors.text, display: 'flex' }}>{icon}</Box>}
        <Typography variant="body2" color="text.secondary" fontWeight="500" textAlign="center">
          {label}
        </Typography>
      </Stack>

      {/* Circular progress + value */}
      {isPercentage ? (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Track (background circle) */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={96}
            thickness={5}
            sx={{ color: colors.bg, position: 'absolute' }}
          />
          {/* Value circle */}
          <CircularProgress
            variant="determinate"
            value={progressValue}
            size={96}
            thickness={5}
            sx={{ color: colors.track }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" fontWeight="bold" color={colors.text} aria-label={`${displayValue}%`}>
              {displayValue}%
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="h3" fontWeight="bold" color={colors.text}>
          {displayValue}
        </Typography>
      )}

      {/* Subtitle */}
      {subtitle && (
        <Typography variant="caption" color="text.secondary" textAlign="center" lineHeight={1.4}>
          {subtitle}
        </Typography>
      )}

      {/* Secondary stats */}
      {secondaryStats && secondaryStats.length > 0 && (
        <Stack
          direction="row"
          spacing={0}
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider', width: '100%' }}
        >
          {secondaryStats.map(stat => (
            <Box key={stat.label} textAlign="center" sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="700" color={colors.text}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
