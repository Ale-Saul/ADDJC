import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ROL } from '@/constants/roles'
import EnviarNotificacionManualForm from '../EnviarNotificacionManualForm'

// Mocking the hooks to avoid actual network/state logic complexity in this test
jest.mock('@/hooks/useNotificaciones', () => ({
  useDestinatariosNotificacion: jest.fn(() => ({ data: [], isLoading: false })),
  useEnviarNotificacionManual: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

const mockOnSuccess = jest.fn()
const mockOnCancel = jest.fn()

describe('EnviarNotificacionManualForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza correctamente', () => {
    wrapWithProvider(
      <EnviarNotificacionManualForm
        remitenteId="88888888-8888-4888-b888-888888888888"
        remitenteRol={ROL.ASOCIACION}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )
    
    // El componente no parece tener un título "Enviar Notificación Manual" en el Stack component="form"
    // Validamos por los labels del formulario
    expect(screen.getByLabelText(/Destinatario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Asunto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mensaje/i)).toBeInTheDocument()
  })

  it('muestra errores de validacion si se intenta enviar vacío', async () => {
    wrapWithProvider(
      <EnviarNotificacionManualForm
        remitenteId="88888888-8888-4888-b888-888888888888"
        remitenteRol={ROL.ASOCIACION}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )
    
    // MUI components with react-hook-form can be slow to update or requires submitting
    const submitBtn = screen.getByRole('button', { name: /Enviar/i })
    
    // RHF/Zod validation might need a bit more interaction or time
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      // Usamos findByText o waitFor con getByText para dar tiempo a RHF/Zod
      expect(screen.queryByText(/El asunto debe tener al menos 3 caracteres/i)).toBeInTheDocument()
      expect(screen.queryByText(/El mensaje debe tener al menos 5 caracteres/i)).toBeInTheDocument()
      expect(screen.queryByText(/Debe seleccionar un destinatario válido/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})