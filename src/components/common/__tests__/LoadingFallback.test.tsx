import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoadingFallback from '../LoadingFallback'

describe('LoadingFallback', () => {
  describe('Renderizado', () => {
    it('debe renderizar el componente de carga', () => {
      render(<LoadingFallback />)

      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })

    it('debe renderizar el spinner de carga', () => {
      const { container } = render(<LoadingFallback />)

      // Verificar que el spinner existe (div con clases de animación)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('debe tener las clases correctas para el spinner', () => {
      const { container } = render(<LoadingFallback />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('w-10')
      expect(spinner).toHaveClass('h-10')
      expect(spinner).toHaveClass('border-4')
      expect(spinner).toHaveClass('border-blue-500')
      expect(spinner).toHaveClass('border-t-transparent')
      expect(spinner).toHaveClass('rounded-full')
    })
  })

  describe('Estilos y layout', () => {
    it('debe tener contenedor con altura mínima completa de pantalla', () => {
      const { container } = render(<LoadingFallback />)

      const mainContainer = container.firstChild as HTMLElement
      expect(mainContainer).toHaveClass('min-h-screen')
    })

    it('debe centrar el contenido', () => {
      const { container } = render(<LoadingFallback />)

      const mainContainer = container.firstChild as HTMLElement
      expect(mainContainer).toHaveClass('flex')
      expect(mainContainer).toHaveClass('items-center')
      expect(mainContainer).toHaveClass('justify-center')
    })

    it('debe tener fondo gris claro', () => {
      const { container } = render(<LoadingFallback />)

      const mainContainer = container.firstChild as HTMLElement
      expect(mainContainer).toHaveClass('bg-[#f5f5f5]')
    })

    it('debe renderizar card con sombra y fondo blanco', () => {
      const { container } = render(<LoadingFallback />)

      const card = container.querySelector('.bg-white')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded')
      expect(card).toHaveClass('shadow-lg')
    })

    it('debe tener padding en el contenedor interno', () => {
      const { container } = render(<LoadingFallback />)

      const card = container.querySelector('.bg-white')
      expect(card).toHaveClass('p-8')
    })

    it('debe alinear elementos en columna', () => {
      const { container } = render(<LoadingFallback />)

      const card = container.querySelector('.bg-white')
      expect(card).toHaveClass('flex')
      expect(card).toHaveClass('flex-col')
      expect(card).toHaveClass('items-center')
    })

    it('debe tener ancho máximo en el contenedor', () => {
      const { container } = render(<LoadingFallback />)

      const card = container.querySelector('.bg-white')
      expect(card).toHaveClass('max-w-sm')
      expect(card).toHaveClass('w-full')
    })
  })

  describe('Texto de carga', () => {
    it('debe mostrar texto en color gris', () => {
      render(<LoadingFallback />)

      const loadingText = screen.getByText('Cargando...')
      expect(loadingText).toHaveClass('text-gray-600')
    })

    it('debe mostrar texto en tamaño pequeño', () => {
      render(<LoadingFallback />)

      const loadingText = screen.getByText('Cargando...')
      expect(loadingText).toHaveClass('text-sm')
    })
  })

  describe('Accesibilidad', () => {
    it('debe renderizar el texto de carga visible para lectores de pantalla', () => {
      render(<LoadingFallback />)

      const loadingText = screen.getByText('Cargando...')
      expect(loadingText).toBeVisible()
    })

    it('debe ser un componente client-side', () => {
      // Verificar que no hay problemas de hidratación al renderizar
      const { rerender } = render(<LoadingFallback />)
      
      // Re-renderizar para simular hidratación
      rerender(<LoadingFallback />)

      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })
  })

  describe('Múltiples instancias', () => {
    it('debe poder renderizar múltiples instancias sin conflictos', () => {
      const { container } = render(
        <>
          <LoadingFallback />
          <LoadingFallback />
        </>
      )

      const loadingTexts = screen.getAllByText('Cargando...')
      expect(loadingTexts).toHaveLength(2)

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners).toHaveLength(2)
    })
  })

  describe('Snapshot', () => {
    it('debe coincidir con el snapshot', () => {
      const { container } = render(<LoadingFallback />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
