'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import { API_BASE, authHeaders } from '@/lib/auth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  total_users: number;
  total_qr_codes: number;
  total_scans: number;
}

interface DailyScan {
  date: string;
  scans: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div
      data-testid="stat-card"
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4"
    >
      <div className={`text-4xl p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyScans, setDailyScans] = useState<DailyScan[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('Failed to load platform statistics.');
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    }

    async function fetchDailyScans() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/scans/daily?days=30`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch scan data');
        const data = await res.json();
        setDailyScans(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChart(false);
      }
    }

    fetchStats();
    fetchDailyScans();
  }, []);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-gray-500 mt-1 text-sm">Real-time statistics for your QR platform</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loadingStats ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-24 animate-pulse bg-gray-100"
                  />
                ))}
              </>
            ) : (
              <>
                <StatCard
                  title="Total Users"
                  value={stats?.total_users ?? 0}
                  icon="👥"
                  color="bg-blue-50"
                />
                <StatCard
                  title="Total QR Codes"
                  value={stats?.total_qr_codes ?? 0}
                  icon="🔲"
                  color="bg-green-50"
                />
                <StatCard
                  title="Total Scans"
                  value={stats?.total_scans ?? 0}
                  icon="📊"
                  color="bg-purple-50"
                />
              </>
            )}
          </div>

          {/* Daily Scan Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Daily Scan Volume</h2>
            <p className="text-sm text-gray-500 mb-6">Last 30 days</p>

            {loadingChart ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading chart…
              </div>
            ) : dailyScans.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No scan data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyScans} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v: string) => v.slice(5)} // show MM-DD
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
