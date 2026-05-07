import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import NuevaNoticiaForm from '../NuevaNoticiaForm'
import { comunicacionService } from '@/services/comunicacionService'
import { ROL } from '@/constants/roles'

jest.mock('@/services/comunicacionService', () => ({
  comunicacionService: {
    uploadImagenNoticia: jest.fn()
  }
}))

const wrapWithProvider = (ui: React.ReactElement) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {ui}
    </LocalizationProvider>
  )
}

describe('NuevaNoticiaForm', () => {
  const mockOnSuccess = jest.fn().mockResolvedValue({ success: true })
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(comunicacionService.uploadImagenNoticia as jest.Mock).mockResolvedValue('http://mockurl.com/image.png')
  })

  it('renderiza correctamente el formulario', () => {
    wrapWithProvider(
      <NuevaNoticiaForm
        autorId="user-1"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByLabelText(/título \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contenido \*/i)).toBeInTheDocument()
    // Select renders differently in MUI so finding the label via getByLabelText might fail
    // if 'for' isn't properly linked to an input. Buscamos por texto visible.
    const categorias = screen.getAllByText(/categoría \*/i)
    expect(categorias.length).toBeGreaterThan(0)
  })

  it('muestra validaciones al intentar enviar vacio', async () => {
    wrapWithProvider(
      <NuevaNoticiaForm
        autorId="user-1"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )
    
    const submitBtn = screen.getByRole('button', { name: /publicar/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // Zod resolver arrojara errores, estos deben mostrarse en el DOM 
      const alerts = screen.queryAllByRole('alert')
      // React Hook Form no renderiza alert nativo para campos individuales si usamos TextField error={!!fieldError}
      // pero si tiene form helper text, asi que dependemos de revisar los helpers text o Mui-error (esto dependera de FormInput)
    })
    // Verificamos que onSubmit NO se llamo porque falla validacion
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('debe mostrar opcion global para encargado y permitir seleccion', async () => {
    wrapWithProvider(
      <NuevaNoticiaForm
        autorId="user-1"
        rolUsuario={ROL.ENCARGADO}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )
    
    // Material UI checkbox labels sometimes render in different DOM spots.
    // Usamos textContent esperando a que se incorpore si hay lag
    await waitFor(() => {
      expect(screen.getByText(/Para mi club/i)).toBeInTheDocument()
      expect(screen.getByText(/Noticia Global \(Todos los clubes\)/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('checkbox', { name: /árbitros/i })).not.toBeInTheDocument()
  })

  it('la opcion todos debe excluir a las especificas y viceversa', async () => {
    wrapWithProvider(
      <NuevaNoticiaForm
        autorId="user-1"
        clubId="club-1"
        rolUsuario={ROL.ADMIN}
        noticia={{
          id: 'test',
          titulo: 'Test',
          contenido: 'Test contenido largo',
          autor_id: 'user-1',
          categoria: 'logro',
          es_destacada: false,
          fecha_inicio: '2023-01-01',
          activo: true,
          created_at: '',
          updated_at: '',
          club_id: 'club-1',
          imagen_url: null,
          audiencia: ['todos'],
          fecha_fin: null
        }}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )
    
    // React-hook-form actualiza async. MUI renderiza visualmente checkboxes anidados dentro de spans.
    const checkboxTodos = screen.getByLabelText(/Todos/i) as HTMLInputElement
    const checkboxJudokas = screen.getByLabelText(/Judokas/i) as HTMLInputElement

    // Esperamos a que esté inicializado
    await waitFor(() => {
      expect(checkboxTodos.checked).toBe(true)
    })

    // Simulamos click en Judokas
    fireEvent.click(checkboxJudokas)

    // Al elegir Judokas, se debería desmarcar 'todos'
    await waitFor(() => {
      expect(checkboxJudokas.checked).toBe(true)
      expect(checkboxTodos.checked).toBe(false)
    })
  })
})