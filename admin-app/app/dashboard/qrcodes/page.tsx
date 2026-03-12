"use client";

import useSWR from "swr";
import { api, QRCode } from "@/lib/api";

export default function QRCodesPage() {
  const { data: qrcodes, error, isLoading } = useSWR<QRCode[]>("qrcodes", api.getQRCodes);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">QR Codes</h1>

      {isLoading && <p className="text-gray-400">Loading QR codes…</p>}
      {error && <p className="text-red-500">Failed to load QR codes.</p>}

      {qrcodes && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["ID", "Title", "User", "URL", "Scans", "Status", "Created"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {qrcodes.map((qr) => (
                <tr key={qr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{qr.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{qr.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{qr.user_email ?? qr.user_id}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 max-w-xs truncate">
                    <a href={qr.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {qr.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{qr.scan_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        qr.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {qr.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(qr.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
