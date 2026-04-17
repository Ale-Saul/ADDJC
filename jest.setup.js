// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock de Supabase para evitar errores de mapeo en tests
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    auth: {
      signUp: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}))

// También mockear la versión admin si existe
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}))

