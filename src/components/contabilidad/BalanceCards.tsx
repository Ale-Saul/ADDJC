import { Card, CardContent, Typography, Box } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { BalanceFinanciero } from '@/models/movimientoFinanciero'

interface BalanceCardsProps {
  balance: BalanceFinanciero
  loading?: boolean
}

export default function BalanceCards({ balance, loading = false }: BalanceCardsProps) {
  const formatCurrency = (amount: number) => {
    return `Bs. ${new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`
  }

  return (
    <Box display="flex" gap={2} mb={3} flexWrap="wrap">
      {/* Total Ingresos */}
      <Card sx={{ 
        flex: '1 1 calc(33.33% - 12px)', 
        minWidth: '250px', 
        bgcolor: 'success.light', 
        color: 'success.contrastText' 
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                TOTAL INGRESOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {formatCurrency(balance.total_ingresos)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', minHeight: 16 }}>
                &nbsp;
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 50, opacity: 0.7, ml: 2 }} />
          </Box>
        </CardContent>
      </Card>

      {/* Total Egresos */}
      <Card sx={{ 
        flex: '1 1 calc(33.33% - 12px)', 
        minWidth: '250px', 
        bgcolor: 'error.light', 
        color: 'error.contrastText' 
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                TOTAL EGRESOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {formatCurrency(balance.total_egresos)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', minHeight: 16 }}>
                &nbsp;
              </Typography>
            </Box>
            <TrendingDownIcon sx={{ fontSize: 50, opacity: 0.7, ml: 2 }} />
          </Box>
        </CardContent>
      </Card>

      {/* Balance */}
      <Card sx={{ 
        flex: '1 1 calc(33.33% - 12px)', 
        minWidth: '250px',
        bgcolor: balance.balance >= 0 ? 'info.light' : 'warning.light',
        color: balance.balance >= 0 ? 'info.contrastText' : 'warning.contrastText'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                BALANCE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {formatCurrency(balance.balance)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', minHeight: 16 }}>
                {balance.balance >= 0 ? 'Superávit' : 'Déficit'}
              </Typography>
            </Box>
            <AccountBalanceWalletIcon sx={{ fontSize: 50, opacity: 0.7, ml: 2 }} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
