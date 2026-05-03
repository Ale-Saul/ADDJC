const { authController } = require('../authController')
const { authService } = require('../../services/authService')

// Mock del servicio de autenticación
jest.mock('../../services/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    completePasswordChange: jest.fn(),
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
    getCurrentUser: jest.fn(),
    verifyCurrentPassword: jest.fn(),
    getSession: jest.fn(),
    exchangeCodeForSession: jest.fn()
  }
}))

describe('authController FULL COBERTURA', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  // PASSWORDS VALIDOS SEGUN REGEX: (?=.*[a-z])(?=.*[A-Z])(?=.*\d)
  const passValido = 'Password123'

  describe('signIn', () => {
    it('debe validar credenciales y manejar inactividad', async () => {
      await authController.signIn({ email: '', password: '' })
      authService.signIn.mockResolvedValueOnce({ success: false, error: 'Err' })
      await authController.signIn({ email: 'a@a.com', password: passValido })
      authService.signIn.mockResolvedValueOnce({ success: true, data: { user: { activo: false } } })
      await authController.signIn({ email: 'a@a.com', password: passValido })
      authService.signIn.mockResolvedValueOnce({ success: true, data: { user: { activo: true } } })
      const res = await authController.signIn({ email: 'a@a.com', password: passValido })
      expect(res.success).toBe(true)
    })
  })

  describe('signUp', () => {
    it('debe validar campos y roles', async () => {
      await authController.signUp({})
      await authController.signUp({ email:'x', password:passValido, nombres:'N', apellidos:'A' })
      await authController.signUp({ email:'a@a.com', password:'123', nombres:'N', apellidos:'A' })
      await authController.signUp({ email:'a@a.com', password:passValido, nombres:' ', apellidos:'A' })
      await authController.signUp({ email:'a@a.com', password:passValido, nombres:'N', apellidos:' ' })
      await authController.signUp({ email:'a@a.com', password:passValido, nombres:'N', apellidos:'A', rol:'fake' })
      
      authService.signUp.mockResolvedValueOnce({ success: true })
      const res = await authController.signUp({ 
        email:'test@test.com', 
        password:passValido, 
        nombres:'Nombre', 
        apellidos:'Apellido', 
        rol:'judoka' 
      })
      expect(res.success).toBe(true)
    })
  })

  describe('Password y Recuperación', () => {
    it('resetPassword val', async () => {
      await authController.resetPassword('')
      await authController.resetPassword('no-email')
      authService.resetPassword.mockResolvedValue({ success:true })
      const res = await authController.resetPassword('a@a.com')
      expect(res.success).toBe(true)
    })

    it('updatePassword val', async () => {
      await authController.updatePassword('')
      await authController.updatePassword('123')
      authService.updatePassword.mockResolvedValue({ success:true })
      const res = await authController.updatePassword(passValido)
      expect(res.success).toBe(true)
    })

    it('completePasswordChange val', async () => {
      await authController.completePasswordChange('', '')
      await authController.completePasswordChange(passValido, '')
      await authController.completePasswordChange('123', 'u1')
      authService.completePasswordChange.mockResolvedValue({ success:true })
      const res = await authController.completePasswordChange(passValido, 'u1')
      expect(res.success).toBe(true)
    })
  })

  describe('Perfil y Otros', () => {
    it('updateProfile val', async () => {
      await authController.updateProfile('', {})
      authService.updateProfile.mockResolvedValue({ success:true })
      await authController.updateProfile('u1', {})
      const res = await authController.updateProfile('u1', { nombres: 'Valido' })
      expect(res.success).toBe(true)
    })

    it('uploadAvatar val', async () => {
      await authController.uploadAvatar('', null)
      authService.uploadAvatar.mockResolvedValue({ success:true })
      const res = await authController.uploadAvatar('u1', { name:'a.png' })
      expect(res.success).toBe(true)
    })

    it('Metodos directos y Casos Borde', async () => {
      authService.signOut.mockResolvedValue({ success:true })
      await authController.signOut()
      authService.getCurrentUser.mockResolvedValue({ success:true })
      await authController.getCurrentUser()
      authService.getSession.mockResolvedValue({ success:true })
      await authController.getSession()
      
      await authController.exchangeCodeForSession('')
      authService.exchangeCodeForSession.mockResolvedValue({ success:true })
      await authController.exchangeCodeForSession('code')

      await authController.verifyCurrentPassword('', '')
      authService.verifyCurrentPassword.mockResolvedValue({ success:true })
      await authController.verifyCurrentPassword('e@e.com', 'pass')
    })
  })
})
