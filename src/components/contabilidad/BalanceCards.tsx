import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Total Ingresos */}
      <Grid item xs={12} sm={6} md={4}>
        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  TOTAL INGRESOS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {formatCurrency(balance.total_ingresos)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 50, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Total Egresos */}
      <Grid item xs={12} sm={6} md={4}>
        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  TOTAL EGRESOS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {formatCurrency(balance.total_egresos)}
                </Typography>
              </Box>
              <TrendingDownIcon sx={{ fontSize: 50, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Balance */}
      <Grid item xs={12} sm={12} md={4}>
        <Card 
          sx={{ 
            bgcolor: balance.balance >= 0 ? 'info.light' : 'warning.light',
            color: balance.balance >= 0 ? 'info.contrastText' : 'warning.contrastText'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  BALANCE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {formatCurrency(balance.balance)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                  {balance.balance >= 0 ? 'Superávit' : 'Déficit'}
                </Typography>
              </Box>
              <AccountBalanceWalletIcon sx={{ fontSize: 50, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
