import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/dashboard',
}));

// Mock auth lib - return valid admin token
jest.mock('@/lib/auth', () => ({
  API_BASE: 'http://localhost:5000',
  getToken: jest.fn(() => 'fake.admin.token'),
  isAdmin: jest.fn(() => true),
  authHeaders: jest.fn(() => ({ Authorization: 'Bearer fake.admin.token' })),
}));

// Mock recharts (avoid SVG rendering issues in jsdom)
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

import DashboardPage from '@/app/dashboard/page';

const mockStats = {
  total_users: 42,
  total_qr_codes: 150,
  total_scans: 3200,
};

const mockDailyScans = [
  { date: '2024-01-01', scans: 10 },
  { date: '2024-01-02', scans: 25 },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/stats')) {
        return Promise.resolve({ ok: true, json: async () => mockStats });
      }
      if (url.includes('/scans/daily')) {
        return Promise.resolve({ ok: true, json: async () => mockDailyScans });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('renders dashboard heading', async () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Platform Overview/i)).toBeInTheDocument();
  });

  it('renders 3 stat cards with correct values after loading', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      const cards = screen.getAllByTestId('stat-card');
      expect(cards).toHaveLength(3);
    });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('3,200')).toBeInTheDocument();
  });

  it('renders stat card labels', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
      expect(screen.getByText(/Total QR Codes/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Scans/i)).toBeInTheDocument();
    });
  });

  it('renders the bar chart for daily scans', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('calls the stats API with auth header', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/stats'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
        })
      );
    });
  });

  it('shows error message when stats API fails', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stats')) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load platform statistics/i)).toBeInTheDocument();
    });
  });
});
