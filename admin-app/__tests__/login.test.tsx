import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock auth lib
jest.mock('@/lib/auth', () => ({
  API_BASE: 'http://localhost:5000',
  setToken: jest.fn(),
  decodeToken: jest.fn(() => ({ role: 'admin', sub: '1', exp: 9999999999 })),
  getToken: jest.fn(() => null),
  isAdmin: jest.fn(() => false),
}));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /QR Platform Admin/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('login-error')).toHaveTextContent('Invalid credentials');
  });

  it('redirects to dashboard on successful admin login', async () => {
    const { setToken, decodeToken } = await import('@/lib/auth');
    (decodeToken as jest.Mock).mockReturnValueOnce({ role: 'admin', sub: '1', exp: 9999999999 });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake.jwt.token' }),
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(setToken).toHaveBeenCalledWith('fake.jwt.token');
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error when non-admin token is returned', async () => {
    const { decodeToken } = await import('@/lib/auth');
    (decodeToken as jest.Mock).mockReturnValueOnce({ role: 'user', sub: '2', exp: 9999999999 });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'user.jwt.token' }),
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent(
        'Access denied. Admin account required.'
      );
    });
  });

  it('disables the submit button while loading', async () => {
    // Simulate a slow fetch
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: false, json: async () => ({}) }), 500))
    );

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
