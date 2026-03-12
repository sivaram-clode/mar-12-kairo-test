"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getQRStats, QRStats } from "@/lib/api";

export default function StatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<QRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getQRStats(Number(id))
      .then((r) => setStats(r.data))
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 py-10 text-center">{error}</div>
    );
  }

  if (!stats) return null;

  const { qr_code, total_scans, daily_scans_last_30d, recent_scans } = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-indigo-600 hover:underline text-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Stats: {qr_code.label || qr_code.code.slice(0, 8) + "…"}
        </h1>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow p-6 flex gap-8">
        <div>
          <p className="text-sm text-gray-500">Total scans</p>
          <p className="text-4xl font-bold text-indigo-600">{total_scans}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Destination</p>
          <a
            href={qr_code.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline text-sm break-all"
          >
            {qr_code.destination_url}
          </a>
        </div>
      </div>

      {/* Daily scans */}
      {daily_scans_last_30d.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Daily scans (last 30 days)</h2>
          <div className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-8">Date</th>
                  <th className="pb-2">Scans</th>
                </tr>
              </thead>
              <tbody>
                {daily_scans_last_30d.map((row) => (
                  <tr key={row.day} className="border-b last:border-0">
                    <td className="py-2 pr-8 text-gray-700">{row.day}</td>
                    <td className="py-2 font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent scans */}
      {recent_scans.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Recent scans</h2>
          <ul className="space-y-2">
            {recent_scans.map((s) => (
              <li key={s.id} className="text-sm text-gray-600 flex gap-4">
                <span className="text-gray-400">{new Date(s.scanned_at).toLocaleString()}</span>
                {s.user_agent && <span className="truncate">{s.user_agent}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
