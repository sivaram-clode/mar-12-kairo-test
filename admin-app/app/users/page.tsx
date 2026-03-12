'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import { API_BASE, authHeaders } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  qr_count: number;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError('Failed to load users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId: number, currentStatus: boolean) {
    setToggling(userId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle user status');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      alert('Failed to update user status.');
      console.error(err);
    } finally {
      setToggling(null);
    }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-500 mt-1 text-sm">Manage all platform users</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              🔄 Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                Loading users…
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="users-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Role</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">QR Codes</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Created</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">{user.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.is_active ? '✓ Active' : '✕ Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.qr_count}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(user.created_at)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            disabled={toggling === user.id}
                            data-testid={`toggle-user-${user.id}`}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                              user.is_active
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            }`}
                          >
                            {toggling === user.id
                              ? '…'
                              : user.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
