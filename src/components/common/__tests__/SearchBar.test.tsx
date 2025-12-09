import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SearchBar from '../SearchBar'

describe('SearchBar', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Renderizado básico', () => {
    it('debe renderizar con placeholder por defecto', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
    })

    it('debe renderizar con placeholder personalizado', () => {
      render(<SearchBar onSearch={mockOnSearch} placeholder="Buscar judokas..." />)

      expect(screen.getByPlaceholderText('Buscar judokas...')).toBeInTheDocument()
    })

    it('debe mostrar icono de búsqueda', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const searchInput = screen.getByPlaceholderText('Buscar...')
      expect(searchInput).toBeInTheDocument()
      
      // Verificar que el SearchIcon está presente (como adornment)
      const svg = searchInput.parentElement?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('debe renderizar con fullWidth por defecto', () => {
      const { container } = render(<SearchBar onSearch={mockOnSearch} />)

      const textField = container.querySelector('.MuiTextField-root')
      expect(textField).toHaveClass('MuiFormControl-fullWidth')
    })

    it('debe renderizar sin fullWidth cuando se especifica', () => {
      const { container } = render(<SearchBar onSearch={mockOnSearch} fullWidth={false} />)

      const textField = container.querySelector('.MuiTextField-root')
      expect(textField).not.toHaveClass('MuiFormControl-fullWidth')
    })
  })

  describe('Funcionalidad de búsqueda', () => {
    it('debe actualizar el valor del input al escribir', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Buscar...')
      await user.type(input, 'test')

      expect(input).toHaveValue('test')
    })

    it('debe llamar onSearch con debounce por defecto (300ms)', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Buscar...')
      await user.type(input, 'test')

      // No debe llamarse inmediatamente
      expect(mockOnSearch).not.toHaveBeenCalled()

      // Avanzar 300ms
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })
    })

    it('debe usar debounceMs personalizado', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} debounceMs={500} />)

      const input = screen.getByPlaceholderText('Buscar...')
      await user.type(input, 'test')

      // No debe llamarse antes de 500ms
      jest.advanceTimersByTime(300)
      expect(mockOnSearch).not.toHaveBeenCalled()

      // Debe llamarse después de 500ms
      jest.advanceTimersByTime(200)
      
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })
    })

    it('debe cancelar búsquedas anteriores si el usuario sigue escribiendo', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />)

      const input = screen.getByPlaceholderText('Buscar...')
      
      // Escribir primera letra
      await user.type(input, 't')
      jest.advanceTimersByTime(100)
      
      // Escribir segunda letra antes de que se complete el debounce
      await user.type(input, 'e')
      jest.advanceTimersByTime(100)
      
      // Escribir tercera letra
      await user.type(input, 's')
      jest.advanceTimersByTime(100)
      
      // Escribir cuarta letra
      await user.type(input, 't')
      
      // Completar el debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        // Solo debe llamarse una vez con el valor final
        expect(mockOnSearch).toHaveBeenCalledTimes(1)
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })
    })

    it('debe llamar onSearch con string vacío al montar el componente', async () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      // Esperar a que el componente monte
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('')
      })
    })
  })

  describe('Botón de limpiar', () => {
    it('no debe mostrar botón de limpiar cuando el input está vacío', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const clearButton = screen.queryByLabelText('limpiar búsqueda')
      expect(clearButton).not.toBeInTheDocument()
    })

    it('debe mostrar botón de limpiar cuando hay texto', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Buscar...')
      await user.type(input, 'test')

      const clearButton = screen.getByLabelText('limpiar búsqueda')
      expect(clearButton).toBeInTheDocument()
    })

    it('debe limpiar el input y llamar onSearch con string vacío al hacer clic', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Buscar...')
      await user.type(input, 'test')

      jest.advanceTimersByTime(300)
      mockOnSearch.mockClear() // Limpiar llamadas anteriores

      const clearButton = screen.getByLabelText('limpiar búsqueda')
      await user.click(clearButton)

      expect(input).toHaveValue('')
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('debe mostrar ClearIcon en el botón de limpiar', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Buscar...')
      await user.type(input, 'test')

      const clearButton = screen.getByLabelText('limpiar búsqueda')
      const clearIcon = clearButton.querySelector('svg')
      expect(clearIcon).toBeInTheDocument()
    })
  })

  describe('Comportamiento de hidratación', () => {
    it('debe esperar a que el componente esté montado antes de ejecutar búsquedas', async () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      // No debe llamarse inmediatamente después del render
      expect(mockOnSearch).not.toHaveBeenCalled()

      // Avanzar timers para simular el montaje
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        // Debe llamarse después del montaje con string vacío
        expect(mockOnSearch).toHaveBeenCalledWith('')
      })
    })
  })

  describe('Múltiples búsquedas', () => {
    it('debe manejar múltiples búsquedas correctamente', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />)

      const input = screen.getByPlaceholderText('Buscar...')

      // Primera búsqueda
      await user.type(input, 'test1')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test1')
      })

      mockOnSearch.mockClear()

      // Limpiar y hacer segunda búsqueda
      const clearButton = screen.getByLabelText('limpiar búsqueda')
      await user.click(clearButton)

      await user.type(input, 'test2')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test2')
      })
    })

    it('debe actualizar la búsqueda al modificar el texto existente', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />)

      const input = screen.getByPlaceholderText('Buscar...')

      // Primera búsqueda
      await user.type(input, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      })

      mockOnSearch.mockClear()

      // Modificar el texto
      await user.clear(input)
      await user.type(input, 'modified')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('modified')
      })
    })
  })
})
