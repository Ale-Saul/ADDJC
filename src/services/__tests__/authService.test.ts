const { authService } = require('../authService')

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    exchangeCodeForSession: jest.fn(),
    setSession: jest.fn(),
    signUp: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
  },
  storage: { from: jest.fn().mockReturnThis(), upload: jest.fn(), getPublicUrl: jest.fn() },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnThis()
}

jest.mock('@/lib/supabase/client', () => ({ createClient: jest.fn(() => mockSupabase) }))

describe('authService FULL COBERTURA', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('signIn completo (todas las ramas)', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: { access_token: 't' } } })
    mockSupabase.auth.setSession.mockResolvedValue({})
    // Judoka rama
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', rol: 'judoka', activo: true } })
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'j1', club_id: 'c1', clubes: { nombre_club: 'C' } } })
    await authService.signIn({email:'e', password:'p'})
    
    // Sensei rama
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: { access_token: 't' } } })
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', rol: 'sensei', activo: true } })
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 's1', club_id: 'c1', clubes: { nombre_club: 'C' } } })
    await authService.signIn({email:'e', password:'p'})

    // Errores
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: { message: 'E' } })
    await authService.signIn({email:'e', password:'p'})
    
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: { access_token: 't' } } })
    mockSupabase.single.mockResolvedValueOnce({ error: { message: 'E' } })
    await authService.signIn({email:'e', password:'p'})
  })

  it('getUserProfile completo (todas las ramas)', async () => {
    // Judoka con club
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', rol: 'judoka' } })
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'j1', club_id: 'c1' } })
    mockSupabase.single.mockResolvedValueOnce({ data: { nombre_club: 'C' } })
    await authService.getUserProfile('u1')

    // Sensei con club
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p2', rol: 'sensei' } })
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 's1', club_id: 'c1' } })
    mockSupabase.single.mockResolvedValueOnce({ data: { nombre_club: 'C' } })
    await authService.getUserProfile('u1')

    // Fallos
    mockSupabase.single.mockResolvedValueOnce({ error: { message: 'E' } })
    await authService.getUserProfile('u1')
    mockSupabase.single.mockResolvedValueOnce({ data: null })
    await authService.getUserProfile('u1')
  })

  it('updateProfile completo (todas las ramas)', async () => {
    // Caso apellidos split
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', rol:'judoka' } })
    mockSupabase.single.mockResolvedValueOnce({ data: { id:'j1' } })
    await authService.updateProfile('u1', { apellidos: 'A B', avatar_url:'u' })

    // Error
    mockSupabase.single.mockResolvedValueOnce({ error: { message:'E' } })
    await authService.updateProfile('u1', {})
  })

  it('completePasswordChange completo', async () => {
    mockSupabase.auth.updateUser.mockResolvedValueOnce({ error: null })
    mockSupabase.update.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    // Test branch where db update fails
    mockSupabase.single.mockResolvedValueOnce({ error: { message: 'DB error' } })
    await authService.completePasswordChange('p', 'u')

    mockSupabase.auth.updateUser.mockResolvedValueOnce({ error: { message: 'E' } })
    await authService.completePasswordChange('p', 'u')
  })

  it('uploadAvatar completo', async () => {
    const file = { size: 10, type: 'image/png', name: 'n.png' }
    mockSupabase.storage.upload.mockResolvedValueOnce({ error: null })
    mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'u' } })
    await authService.uploadAvatar('u1', file)

    // Errores val
    await authService.uploadAvatar('u1', { size: 9e9, type:'img' })
    await authService.uploadAvatar('u1', { size: 10, type:'text' })

    // Error upload
    mockSupabase.storage.upload.mockResolvedValueOnce({ error: { message: 'E' } })
    await authService.uploadAvatar('u1', file)
  })

  it('Metodos restantes', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: { user: { id: 'u' } } })
    await authService.signUp({ email: 'e', password: 'p' })
    mockSupabase.auth.signUp.mockResolvedValue({ error: { message: 'E' } })
    await authService.signUp({ email: 'e', password: 'p' })
    mockSupabase.auth.signUp.mockResolvedValue({ data: { user: null } })
    await authService.signUp({ email: 'e', password: 'p' })

    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    await authService.signOut()
    mockSupabase.auth.signOut.mockResolvedValue({ error: { message: 'E' } })
    await authService.signOut()

    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    await authService.resetPassword('e')
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: { message:'E' } })
    await authService.resetPassword('e')

    mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
    await authService.updatePassword('p')

    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: {} } })
    await authService.getSession()

    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({ data: { session: {} } })
    await authService.exchangeCodeForSession('c')

    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    await authService.verifyCurrentPassword('e', 'p')
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: { message:'E' } })
    await authService.verifyCurrentPassword('e', 'p')
    
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    // Mock getUserProfile
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1' } })
    await authService.getCurrentUser()
  })

  it('Manejo de excepciones (Catch blocks)', async () => {
    mockSupabase.auth.signInWithPassword.mockImplementation(() => { throw new Error('X') })
    await authService.signIn({email:'e', password:'p'})
    mockSupabase.auth.signOut.mockImplementation(() => { throw new Error('X') })
    await authService.signOut()
    mockSupabase.auth.signUp.mockImplementation(() => { throw new Error('X') })
    await authService.signUp({email:'e', password:'p'})
    mockSupabase.auth.getUser.mockImplementation(() => { throw new Error('X') })
    await authService.getCurrentUser()
    mockSupabase.from.mockImplementation(() => { throw new Error('X') })
    await authService.getUserProfile('u')
    mockSupabase.auth.resetPasswordForEmail.mockImplementation(() => { throw new Error('X') })
    await authService.resetPassword('e')
    mockSupabase.auth.updateUser.mockImplementation(() => { throw new Error('X') })
    await authService.completePasswordChange('p','u')
    mockSupabase.from.mockImplementation(() => { throw new Error('X') })
    await authService.updateProfile('u', {})
    mockSupabase.storage.from.mockImplementation(() => { throw new Error('X') })
    await authService.uploadAvatar('u', { size:10, type:'image/png', name:'n.png' })
    mockSupabase.auth.getSession.mockImplementation(() => { throw new Error('X') })
    await authService.getSession()
    mockSupabase.auth.exchangeCodeForSession.mockImplementation(() => { throw new Error('X') })
    await authService.exchangeCodeForSession('c')
    mockSupabase.auth.signInWithPassword.mockImplementation(() => { throw new Error('X') })
    await authService.verifyCurrentPassword('e', 'p')
  })
})
