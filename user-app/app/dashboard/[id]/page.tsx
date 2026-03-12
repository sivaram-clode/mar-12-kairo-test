"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AuthGuard from "@/components/AuthGuard";
import { getQRCode, getQRScans, updateQRCode } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface QRCode {
  id: string;
  label: string;
  short_code: string;
  scan_count: number;
  destination_url: string;
  created_at?: string;
}

interface ScanData {
  date: string;
  count: number;
}

function getLast7Days(): string[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function QRDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [qr, setQr] = useState<QRCode | null>(null);
  const [scanData, setScanData] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [qrData, scansData] = await Promise.all([
        getQRCode(id),
        getQRScans(id).catch(() => ({ scans: [] })),
      ]);

      const qrCode = qrData.qr_code || qrData;
      setQr(qrCode);
      setEditUrl(qrCode.destination_url);

      // Process scans into last 7 days
      const last7Days = getLast7Days();
      const scans = scansData.scans || scansData || [];

      // Count scans per day
      const scanCounts: Record<string, number> = {};
      last7Days.forEach((day) => (scanCounts[day] = 0));

      scans.forEach((scan: { scanned_at?: string; created_at?: string }) => {
        const date = (scan.scanned_at || scan.created_at || "").split("T")[0];
        if (scanCounts[date] !== undefined) {
          scanCounts[date]++;
        }
      });

      const chartData = last7Days.map((date) => ({
        date: date.slice(5), // MM-DD format
        count: scanCounts[date],
      }));

      setScanData(chartData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!editUrl.trim()) {
      setSaveError("URL cannot be empty");
      return;
    }

    try {
      new URL(editUrl);
    } catch {
      setSaveError("Please enter a valid URL");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const data = await updateQRCode(id, editUrl);
      const updated = data.qr_code || data;
      setQr((prev) => prev ? { ...prev, destination_url: updated.destination_url || editUrl } : prev);
      setIsEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update URL");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !qr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">{error || "QR code not found"}</p>
        <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const qrImageUrl = `${API_BASE_URL}/qr/${qr.short_code}/image`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{qr.label}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* QR Code Info */}
        <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Label</p>
                <p className="text-gray-900 font-medium">{qr.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Short Code</p>
                <p className="text-gray-900 font-mono">{qr.short_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Scans</p>
                <p className="text-3xl font-bold text-blue-600">{qr.scan_count ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Destination URL</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      data-testid="edit-url-input"
                    />
                    {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUrl}
                        disabled={saving}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); setEditUrl(qr.destination_url); setSaveError(""); }}
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <a
                      href={qr.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {qr.destination_url}
                    </a>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <Image
                src={qrImageUrl}
                alt="QR Code"
                width={160}
                height={160}
                unoptimized
              />
            </div>
            <a
              href={qrImageUrl}
              download={`qr-${qr.short_code}.png`}
              className="w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Download QR PNG
            </a>
          </div>
        </div>

        {/* Scan Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scans (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scanData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Scans" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}

export default function QRDetailPage() {
  return (
    <AuthGuard>
      <QRDetailContent />
    </AuthGuard>
  );
}
