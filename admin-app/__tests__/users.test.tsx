import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/users',
}));

// Mock auth lib - return valid admin token
jest.mock('@/lib/auth', () => ({
  API_BASE: 'http://localhost:5000',
  getToken: jest.fn(() => 'fake.admin.token'),
  isAdmin: jest.fn(() => true),
  authHeaders: jest.fn(() => ({ Authorization: 'Bearer fake.admin.token' })),
}));

import UsersPage from '@/app/users/page';

const mockUsers = [
  {
    id: 1,
    email: 'alice@example.com',
    role: 'admin',
    is_active: true,
    qr_count: 5,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    email: 'bob@example.com',
    role: 'user',
    is_active: false,
    qr_count: 3,
    created_at: '2024-02-20T08:30:00Z',
  },
  {
    id: 3,
    email: 'charlie@example.com',
    role: 'user',
    is_active: true,
    qr_count: 8,
    created_at: '2024-03-01T12:00:00Z',
  },
];

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    });
  });

  it('renders the users table heading', async () => {
    render(<UsersPage />);
    expect(screen.getByRole('heading', { name: /^Users$/i })).toBeInTheDocument();
  });

  it('renders users table with correct columns', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('users-table')).toBeInTheDocument();
    });

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('QR Codes')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders all users in the table', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
    });
  });

  it('renders Activate button for inactive users and Deactivate for active users', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      // Bob is inactive → should show Activate
      const activateBtn = screen.getByTestId('toggle-user-2');
      expect(activateBtn).toHaveTextContent('Activate');

      // Alice and Charlie are active → should show Deactivate
      const deactivateAlice = screen.getByTestId('toggle-user-1');
      expect(deactivateAlice).toHaveTextContent('Deactivate');

      const deactivateCharlie = screen.getByTestId('toggle-user-3');
      expect(deactivateCharlie).toHaveTextContent('Deactivate');
    });
  });

  it('toggles user status when Activate/Deactivate is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }); // toggle

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-user-2')).toBeInTheDocument();
    });

    const activateBtn = screen.getByTestId('toggle-user-2');
    expect(activateBtn).toHaveTextContent('Activate');

    fireEvent.click(activateBtn);

    await waitFor(() => {
      // After toggle, Bob should now be active → Deactivate button
      expect(screen.getByTestId('toggle-user-2')).toHaveTextContent('Deactivate');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/2/toggle'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('shows error when users API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument();
    });
  });
});
