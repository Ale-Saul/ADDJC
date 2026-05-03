import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PerfilPage from '../PerfilPage';
import { useAuth } from '@/contexts/AuthContext';
import { authController } from '@/controllers/authController';
import { usePerfilForm } from '@/hooks/usePerfilForm';
import { usePasswordForm } from '@/hooks/usePasswordForm';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/controllers/authController', () => ({
  authController: {
    uploadAvatar: jest.fn()
  }
}));

jest.mock('@/hooks/usePerfilForm', () => ({
  usePerfilForm: jest.fn()
}));

jest.mock('@/hooks/usePasswordForm', () => ({
  usePasswordForm: jest.fn()
}));

jest.mock('@/components/common/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="protected">{children}</div>
}));

jest.mock('@/components/perfil/PerfilInfoForm', () => ({
  __esModule: true,
  default: ({ onAvatarChange, avatarSuccess, avatarError }: any) => (
    <div>
      <input data-testid="avatar-input" type="file" onChange={(e) => onAvatarChange(e)} />
      {avatarSuccess && <span data-testid="success">{avatarSuccess}</span>}
      {avatarError && <span data-testid="error">{avatarError}</span>}
    </div>
  )
}));

jest.mock('@/components/perfil/PerfilPasswordForm', () => ({
  __esModule: true,
  default: () => <div data-testid="password-form">Password Form</div>
}));

describe('PerfilPage Coverage - Phase 4', () => {
  const mockRefreshUser = jest.fn();
  const mockUser = { id: 'u1', email: 'test@test.com', avatar_url: 'old.png', rol: 'judoka' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, refreshUser: mockRefreshUser });
    (usePerfilForm as jest.Mock).mockReturnValue({});
    (usePasswordForm as jest.Mock).mockReturnValue({});
    
    global.Image = class {
      onload: () => void = () => {};
      set src(url: string) { setTimeout(() => this.onload(), 0); }
    } as any;
  });

  it('debe mostrar el cargando si no hay usuario', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    render(<PerfilPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('debe manejar la subida de avatar exitosa', async () => {
    (authController.uploadAvatar as jest.Mock).mockResolvedValue({ 
      success: true, 
      data: 'http://new-avatar.png' 
    });

    render(<PerfilPage />);
    
    const file = new File(['(⌐□_□)'], 'avatar.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
        expect(mockRefreshUser).toHaveBeenCalled();
    });
  });

  it('debe validar el tamaño máximo de la imagen (2MB)', async () => {
    render(<PerfilPage />);
    
    const largeFile = new File(['a'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [largeFile] } });
    });

    expect(screen.getByTestId('error')).toHaveTextContent(/2MB/i);
    expect(authController.uploadAvatar).not.toHaveBeenCalled();
  });

  it('debe manejar errores del servidor al subir avatar', async () => {
    (authController.uploadAvatar as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: 'Error de red' 
    });

    render(<PerfilPage />);
    
    const file = new File(['p'], 'p.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(/Error de red/i);
    });
  });
});
