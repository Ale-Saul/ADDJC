import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Pagination from '../Pagination'

describe('Pagination', () => {
  const mockOnPageChange = jest.fn()
  const mockOnItemsPerPageChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderizado básico', () => {
    it('debe renderizar información de paginación correctamente', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByText('Mostrando 1 - 10 de 50 resultados')).toBeInTheDocument()
    })

    it('debe calcular correctamente el rango de items en página intermedia', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByText('Mostrando 21 - 30 de 50 resultados')).toBeInTheDocument()
    })

    it('debe calcular correctamente el rango de items en última página', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={3}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByText('Mostrando 21 - 25 de 25 resultados')).toBeInTheDocument()
    })

    it('no debe renderizar nada si totalItems es 0', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={0}
          totalItems={0}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('Navegación de páginas', () => {
    it('debe mostrar controles de paginación cuando hay más de 1 página', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      // MUI Pagination renderiza botones de navegación
      const paginationButtons = screen.getAllByRole('button')
      expect(paginationButtons.length).toBeGreaterThan(0)
    })

    it('no debe mostrar controles de paginación cuando solo hay 1 página', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={1}
          totalItems={5}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByText('Mostrando 1 - 5 de 5 resultados')).toBeInTheDocument()
      // No debe haber botones de navegación cuando totalPages <= 1
      const buttons = screen.queryAllByRole('button')
      // Solo debe tener el select si está presente, pero no botones de paginación
      expect(buttons.filter(btn => btn.getAttribute('aria-label')?.includes('página')).length).toBe(0)
    })

    it('debe llamar onPageChange al hacer clic en un número de página', async () => {
      const user = userEvent.setup()
      
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      // Buscar el botón de página 2
      const page2Button = screen.getByRole('button', { name: 'Go to page 2' })
      await user.click(page2Button)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('debe llamar onPageChange al hacer clic en "primera página"', async () => {
      const user = userEvent.setup()
      
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      const firstPageButton = screen.getByRole('button', { name: 'Go to first page' })
      await user.click(firstPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('debe llamar onPageChange al hacer clic en "última página"', async () => {
      const user = userEvent.setup()
      
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      const lastPageButton = screen.getByRole('button', { name: 'Go to last page' })
      await user.click(lastPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(5)
    })
  })

  describe('Selector de items por página', () => {
    it('debe mostrar selector de items por página cuando se proporciona onItemsPerPageChange', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          onItemsPerPageChange={mockOnItemsPerPageChange}
        />
      )

      // Verificar que el combobox existe
      const combobox = screen.getByRole('combobox')
      expect(combobox).toBeInTheDocument()
    })

    it('no debe mostrar selector cuando no se proporciona onItemsPerPageChange', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('debe mostrar el valor actual de itemsPerPage en el selector', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={20}
          onPageChange={mockOnPageChange}
          onItemsPerPageChange={mockOnItemsPerPageChange}
        />
      )

      // El select de MUI muestra el valor en un div con role combobox
      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveTextContent('20')
    })

    it('debe llamar onItemsPerPageChange y resetear a página 1 al cambiar items por página', async () => {
      const user = userEvent.setup()
      
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          onItemsPerPageChange={mockOnItemsPerPageChange}
        />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)
      
      const option20 = screen.getByRole('option', { name: '20' })
      await user.click(option20)

      expect(mockOnItemsPerPageChange).toHaveBeenCalledWith(20)
      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('debe usar opciones personalizadas de itemsPerPageOptions', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          onItemsPerPageChange={mockOnItemsPerPageChange}
          itemsPerPageOptions={[10, 25, 50]}
        />
      )

      // El combobox muestra el valor actual
      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveTextContent('10')
    })
  })

  describe('Casos especiales', () => {
    it('debe manejar correctamente una sola página con pocos items', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={1}
          totalItems={3}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByText('Mostrando 1 - 3 de 3 resultados')).toBeInTheDocument()
    })

    it('debe manejar correctamente cuando itemsPerPage es mayor que totalItems', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={1}
          totalItems={5}
          itemsPerPage={100}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByText('Mostrando 1 - 5 de 5 resultados')).toBeInTheDocument()
    })

    it('debe usar opciones por defecto [5, 10, 20, 50, 100] cuando no se especifican', async () => {
      const user = userEvent.setup()
      
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          onItemsPerPageChange={mockOnItemsPerPageChange}
        />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      // Verificar que existen las opciones por defecto
      expect(screen.getByRole('option', { name: '5' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument()
    })
  })
})
