'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import { API_BASE, authHeaders } from '@/lib/auth';

interface QRCode {
  id: number;
  label: string;
  code: string;
  destination_url: string;
  owner_email: string;
  scan_count: number;
  is_active: boolean;
}

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchQrCodes();
  }, []);

  async function fetchQrCodes() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/qr-codes`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch QR codes');
      const data = await res.json();
      setQrCodes(Array.isArray(data) ? data : data.qr_codes || []);
    } catch (err) {
      setError('Failed to load QR codes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = qrCodes.filter(
    (qr) =>
      qr.label?.toLowerCase().includes(search.toLowerCase()) ||
      qr.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
      qr.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
              <p className="text-gray-500 mt-1 text-sm">All QR codes across the platform</p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by label, owner, code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <button
                onClick={fetchQrCodes}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                Loading QR codes…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                {search ? 'No matching QR codes' : 'No QR codes found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="qr-codes-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Label</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Code</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">
                        Destination URL
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Owner</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Scans</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((qr) => (
                      <tr
                        key={qr.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">{qr.label || '—'}</td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                            {qr.code}
                          </code>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <a
                            href={qr.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-xs"
                            title={qr.destination_url}
                          >
                            {qr.destination_url}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{qr.owner_email}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {qr.scan_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              qr.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {qr.is_active ? '✓ Active' : '✕ Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <p className="text-sm text-gray-400 mt-4">
              Showing {filtered.length} of {qrCodes.length} QR codes
            </p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
