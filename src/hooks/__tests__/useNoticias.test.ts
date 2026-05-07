import { renderHook } from '@testing-library/react'
import { useNoticias } from '../useNoticias'
import { comunicacionService } from '@/services/comunicacionService'

jest.mock('@/services/comunicacionService', () => ({
  comunicacionService: {
    getNoticiasByClub: jest.fn(),
    getNoticiasDestacadas: jest.fn(),
  }
}))

describe('useNoticias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(comunicacionService.getNoticiasByClub as jest.Mock).mockResolvedValue([])
    ;(comunicacionService.getNoticiasDestacadas as jest.Mock).mockResolvedValue([])
  })

  it('debe iniciar la carga de noticias globalmente al dar un role y global', async () => {
    const { result } = renderHook(() => useNoticias({
      clubId: 'global',
      rol: 'ASOCIACION' as any,
    }))

    expect(result.current.loading).toBe(true)
    expect(result.current.noticias).toEqual([])
    
    // Validamos que se manda a llamar a service
    // Dependiendo de cuando monta el effect
  })
})
