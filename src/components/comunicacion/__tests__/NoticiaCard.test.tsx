import React from 'react'
import { render, screen } from '@testing-library/react'
import NoticiaCard from '../NoticiaCard'

describe('NoticiaCard', () => {
  const mockNoticia = {
    id: 'test-1',
    titulo: 'Título Test',
    contenido: 'Contenido de prueba',
    autor_id: 'user-1',
    categoria: 'aviso',
    es_destacada: false,
    fecha_inicio: '2023-01-01T00:00:00Z',
    activo: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '',
    club_id: null,
    imagen_url: null,
    audiencia: ['todos'],
    fecha_fin: null
  }

  it('renderiza la noticia correctamente', () => {
    render(<NoticiaCard noticia={mockNoticia as any} />)
    
    expect(screen.getByText('Título Test')).toBeInTheDocument()
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument()
  })

  it('muestra etiqueta de destacada cuando aplica', () => {
    const destacadaMsg = { ...mockNoticia, es_destacada: true }
    render(<NoticiaCard noticia={destacadaMsg as any} />)
    
    expect(screen.getByText('Destacada')).toBeInTheDocument()
  })
})